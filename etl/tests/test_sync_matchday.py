import pytest
from clients.request_budget import DailyLimitReachedError
from scripts import sync_matchday

def fixture(fixture_id, date, round_name = "Regular Season - 1", status = "Finished", score = "2 - 1"):
    return {"id": fixture_id, "date": date, "round": round_name,
            "state": {"description": status, "score": {"current": score}},
            "homeTeam": {"id": 100}, "awayTeam": {"id": 200}}

@pytest.mark.parametrize("status", ["Finished", "Finished after extra time", "Finished after penalties", "Finished AET"])
def test_finished_statuses(status):
    # Expected: every finished status of the API is accepted, whatever its case (the old list missed two of them).
    assert sync_matchday.is_finished(status)

@pytest.mark.parametrize("status", ["Abandoned", "Not started", None])
def test_unfinished_statuses(status):
    # Expected: abandoned or unplayed matches are not synced.
    assert not sync_matchday.is_finished(status)

def test_expected_conceded_from_the_final_score():
    # Expected: 2 - 1 -> the home team conceded 1 and the away team 2.
    assert sync_matchday._expected_conceded(fixture(1, "2025-08-15")) == {100: 1, 200: 2}

def test_relevant_fixtures_in_chronological_order(monkeypatch):
    # Expected: only finished fixtures of relevant rounds, from every competition, sorted by date.
    by_league = {
        2486: [fixture(1, "2025-09-17", "League Stage - 1"), fixture(2, "2025-07-08", "1st Qualifying Round")],
        119924: [fixture(3, "2025-08-15"), fixture(4, "2025-08-16", status = "Abandoned")],
    }
    monkeypatch.setattr(sync_matchday, "load_fixtures_from_cache", lambda league_id, season: by_league.get(league_id, []))

    result = sync_matchday.relevant_fixtures(2025)

    assert [(name, data["id"]) for name, data in result] == [("La Liga", 3), ("Champions League", 1)]

def test_run_season_stops_at_the_daily_limit(monkeypatch, capsys):
    # The second fixture needs a request but the daily limit is reached.
    # Expected: the first fixture is synced, the loop stops without crashing and a message is printed.
    fixtures = [("La Liga", fixture(1, "2025-08-15")), ("La Liga", fixture(2, "2025-08-16")), ("La Liga", fixture(3, "2025-08-17"))]
    processed = []
    def process(competition_name, fixture_data):
        if fixture_data["id"] == 2:
            raise DailyLimitReachedError("limit")
        processed.append(fixture_data["id"])
        return True
    monkeypatch.setattr(sync_matchday, "relevant_fixtures", lambda season: fixtures)
    monkeypatch.setattr(sync_matchday, "process_fixture", process)
    monkeypatch.setattr(sync_matchday, "is_match_synced", lambda fixture_id: fixture_id in processed)
    monkeypatch.setattr(sync_matchday, "remaining_requests", lambda limit: 1)

    sync_matchday.run_season(2025)

    assert processed == [1]
    output = capsys.readouterr().out
    assert "Límite diario" in output
    assert "Pendientes: 2 de 3" in output

def test_cached_data_does_not_make_requests_or_wait(monkeypatch):
    # Expected: with the response in the cache, no request is sent and there is no pause.
    monkeypatch.setattr(sync_matchday.time, "sleep", lambda seconds: pytest.fail("It should not wait"))
    request = lambda fixture_id: pytest.fail("It should not request")

    data = sync_matchday._cached_or_requested(lambda name, fixture_id: {"cached": True}, None, request, "La Liga", 1)

    assert data == {"cached": True}

def test_missing_data_is_requested_saved_and_followed_by_a_pause(monkeypatch):
    # Expected: request sent, response saved in the cache and a pause after the real request.
    pauses, saved = [], []
    monkeypatch.setattr(sync_matchday.time, "sleep", lambda seconds: pauses.append(seconds))

    data = sync_matchday._cached_or_requested(
        lambda name, fixture_id: None,
        lambda name, fixture_id, response: saved.append((name, fixture_id, response)),
        lambda fixture_id: ["event"],
        "La Liga", 1
    )

    assert data == ["event"]
    assert saved == [("La Liga", 1, ["event"])]
    assert pauses == [sync_matchday.REQUEST_DELAY_SECONDS]
