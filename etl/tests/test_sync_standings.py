import pytest
from config.competitions import COMPETITIONS
from scripts import sync_standings

LA_LIGA = next(c for c in COMPETITIONS if c["name"] == "La Liga")

FINAL_RESPONSE = {
    "season": {"currentMatchday": 38},
    "standings": [{"type": "TOTAL", "table": [
        {"position": 1, "team": {"id": 81, "name": "FC Barcelona"}, "playedGames": 38, "won": 28, "draw": 4,
         "lost": 6, "points": 88, "goalsFor": 102, "goalsAgainst": 39, "goalDifference": 63}
    ]}]
}

def prepare(monkeypatch, tmp_path):
    requests, saved = [], []
    monkeypatch.setattr(sync_standings, "CACHE_DIR", str(tmp_path))
    monkeypatch.setattr(sync_standings, "REQUEST_DELAY_SECONDS", 0)
    monkeypatch.setattr(sync_standings.client, "get_standings",
                        lambda code, season, matchday = None: requests.append((code, season, matchday)) or FINAL_RESPONSE)
    monkeypatch.setattr(sync_standings, "save_standing", saved.append)
    return requests, saved

def test_previous_season_is_saved_as_its_last_matchday(monkeypatch, tmp_path):
    # Expected: the 2024 final table of La Liga is requested once and saved as season 2024, matchday 38.
    requests, saved = prepare(monkeypatch, tmp_path)

    sync_standings.sync_previous_season(LA_LIGA, 2025)

    assert requests == [("PD", 2024, None)]
    assert (saved[0].season, saved[0].matchday, saved[0].competition_id) == (2024, 38, LA_LIGA["highlightly_id"])
    assert saved[0].table[0].team_name == "FC Barcelona"

def test_previous_season_uses_the_cache_the_second_time(monkeypatch, tmp_path):
    # Expected: running it again saves the table again but makes no new request.
    requests, saved = prepare(monkeypatch, tmp_path)

    sync_standings.sync_previous_season(LA_LIGA, 2025)
    sync_standings.sync_previous_season(LA_LIGA, 2025)

    assert len(requests) == 1
    assert len(saved) == 2

def prepare_current_matchday(monkeypatch, tmp_path, current_matchday):
    requests, saved = prepare(monkeypatch, tmp_path)
    response = {**FINAL_RESPONSE, "season": {"currentMatchday": current_matchday}}
    monkeypatch.setattr(sync_standings.client, "get_standings",
                        lambda code, season, matchday = None: requests.append((code, season, matchday)) or response)
    monkeypatch.setattr(sync_standings, "find_saved_matchdays", lambda competition_id, season: set())
    return requests, saved

def test_current_matchday_above_the_competition_matchdays_is_limited(monkeypatch, tmp_path):
    # Expected: a current matchday of 100000 only requests matchdays 1 to 38 of La Liga.
    requests, saved = prepare_current_matchday(monkeypatch, tmp_path, 100000)

    sync_standings.sync_competition(LA_LIGA, 2025)

    assert [matchday for _, _, matchday in requests[1:]] == list(range(1, 39))
    assert len(saved) == 38

def test_current_matchday_that_is_not_a_number_stops_the_competition(monkeypatch, tmp_path):
    # Expected: a current matchday sent as text raises an error before any matchday is requested.
    requests, saved = prepare_current_matchday(monkeypatch, tmp_path, "38")

    with pytest.raises(TypeError):
        sync_standings.sync_competition(LA_LIGA, 2025)

    assert requests == [("PD", 2025, None)]
    assert saved == []

def test_only_domestic_leagues_have_previous_season():
    # Expected: the five domestic leagues, not the Champions League.
    domestic = [c["footballdata_code"] for c in COMPETITIONS if sync_standings.is_domestic_league(c)]

    assert sorted(domestic) == ["BL1", "FL1", "PD", "PL", "SA"]
