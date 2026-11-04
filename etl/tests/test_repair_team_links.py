from scripts import repair_team_links as script
from tests.competition_ids import CHAMPIONS_LEAGUE, LA_LIGA

def fixture(fixture_id, date, round_name = "Regular Season - 1", status = "Finished"):
    return {"id": fixture_id, "date": date, "round": round_name,
            "league": {"id": LA_LIGA, "season": 2025},
            "state": {"description": status, "score": {"current": "1 - 0"}},
            "homeTeam": {"id": 100, "name": "Barcelona"}, "awayTeam": {"id": 200, "name": "Getafe"}}

def test_relevant_fixtures_include_unplayed_ones_in_chronological_order(monkeypatch):
    # Expected: every fixture of a relevant round, played or not, sorted by date; qualifying rounds are left out.
    by_league = {
        CHAMPIONS_LEAGUE: [fixture(1, "2025-09-17", "League Stage - 1"), fixture(2, "2025-07-08", "1st Qualifying Round")],
        LA_LIGA: [fixture(3, "2025-08-15"), fixture(4, "2026-05-24", status = "Not started")],
    }
    monkeypatch.setattr(script, "load_fixtures_from_cache", lambda league_id, season: by_league.get(league_id, []))

    result = script.relevant_fixtures(2025)

    assert [(name, data["id"]) for name, data in result] == [("La Liga", 3), ("Champions League", 1), ("La Liga", 4)]

def test_relink_teams_clears_the_old_links_before_linking_both_teams(monkeypatch):
    # Expected: the old links are cleared first, then home and away teams of every fixture are linked in order,
    # and the teams still without link are returned.
    calls = []
    monkeypatch.setattr(script, "clear_team_highlightly_ids", lambda: calls.append("clear"))
    monkeypatch.setattr(script, "_resolve_team_id", lambda highlightly_id, name, competition_id: calls.append((highlightly_id, competition_id)))
    monkeypatch.setattr(script, "find_all_teams", lambda: [{"name": "FC Barcelona", "highlightly_id": 100}, {"name": "Paris FC"}])

    not_linked = script.relink_teams([("La Liga", fixture(3, "2025-08-15"))])

    assert calls == ["clear", (100, LA_LIGA), (200, LA_LIGA)]
    assert not_linked == ["Paris FC"]

def test_rebuild_matches_only_uses_the_cache(monkeypatch):
    # Match 1 is synced and cached; 2 is synced without cache; 3 is saved but not finished; 4 was never saved.
    # Expected: 1 gets its stats again; 2 is left pending for sync_matchday; 3 only gets its teams updated; 4 is ignored.
    fixtures = [("La Liga", fixture(i, f"2025-08-1{i}")) for i in (1, 2, 3, 4)]
    saved_matches = [{"external_id": 1, "stats_synced": True}, {"external_id": 2, "stats_synced": True}, {"external_id": 3}]
    saved, stats, marked, unmarked = [], [], [], []
    monkeypatch.setattr(script, "save_match", lambda match: saved.append(match.id))     # adapt_match is replaced: match is the DTO
    monkeypatch.setattr(script, "adapt_match", lambda dto: dto)
    monkeypatch.setattr(script, "load_box_score_from_cache", lambda name, fixture_id: ["box"] if fixture_id == 1 else None)
    monkeypatch.setattr(script, "load_events_from_cache", lambda name, fixture_id: ["events"] if fixture_id == 1 else None)
    monkeypatch.setattr(script, "save_player_stats", lambda fixture_data, match_id, box_score, events: stats.append(match_id))
    monkeypatch.setattr(script, "mark_match_synced", marked.append)
    monkeypatch.setattr(script, "unmark_match_synced", unmarked.append)

    rebuilt, pending = script.rebuild_matches(fixtures, saved_matches)

    assert saved == [1, 2, 3]
    assert stats == [1] and marked == [1]
    assert unmarked == [2] and pending == [2]
    assert rebuilt == 1

def test_run_deletes_the_old_data_after_linking_the_teams(monkeypatch):
    # Expected: teams are linked first (if the fixtures cache is missing nothing is deleted), then the old stats,
    # box-score players and player links are deleted, and finally the matches are rebuilt.
    calls = []
    monkeypatch.setattr(script, "relevant_fixtures", lambda season: calls.append("fixtures") or [])
    monkeypatch.setattr(script, "find_all_matches", lambda: [])
    monkeypatch.setattr(script, "relink_teams", lambda fixtures: calls.append("teams") or [])
    monkeypatch.setattr(script, "delete_all_player_match_stats", lambda: calls.append("stats") or 0)
    monkeypatch.setattr(script, "delete_box_score_players", lambda: calls.append("players") or 0)
    monkeypatch.setattr(script, "clear_player_highlightly_ids", lambda: calls.append("player links"))
    monkeypatch.setattr(script, "rebuild_matches", lambda fixtures, matches: calls.append("matches") or (0, []))

    script.run(2025)

    assert calls == ["fixtures", "teams", "stats", "players", "player links", "matches"]
