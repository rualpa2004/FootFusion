import pytest
from adapters import player_match_stats_adapter as adapter
from adapters.match_events_adapter import PlayerEventsSummary
from dtos.highlightly.fixture_player_stats_dto import FixturePlayerStatsDTO

def make_dto(player_id = 555, name = "M. Araujo", full_name = "Maximiliano Araujo", position = "Defender"):
    return FixturePlayerStatsDTO.from_api({
        "id": player_id, "name": name, "fullName": full_name, "logo": "photo.png", "position": position,
        "minutesPlayed": 90, "isSubstitute": False,
        "statistics": {"goalsScored": 1, "assists": 0, "cardsYellow": 0, "cardsRed": 0, "penaltiesMissed": 0,
                       "shotsOnTarget": 2, "passesKey": 1, "goalsSaved": 0, "dribblesSuccessful": 1,
                       "duelsWon": 5, "fouledOthers": 3, "goalsConceded": 0}
    })

@pytest.fixture
def players(monkeypatch):
    """In-memory replacement of the players repository used by the adapter."""
    state = {"by_team": {}, "all": [], "linked": [], "saved": [], "positions": []}
    monkeypatch.setattr(adapter, "find_player_by_highlightly_id",
                        lambda highlightly_id: next((p for p in state["all"] if p.get("highlightly_id") == highlightly_id), None))
    monkeypatch.setattr(adapter, "find_players_by_team", lambda team_id: state["by_team"].get(team_id, []))
    monkeypatch.setattr(adapter, "find_all_players", lambda: state["all"])
    monkeypatch.setattr(adapter, "set_player_highlightly_id", lambda external_id, highlightly_id: state["linked"].append((external_id, highlightly_id)))
    monkeypatch.setattr(adapter, "save_player", lambda player: state["saved"].append(player))
    monkeypatch.setattr(adapter, "set_player_position_group", lambda external_id, group: state["positions"].append((external_id, group)))
    return state

def test_uses_the_player_already_linked_to_the_highlightly_id(players):
    # Expected: the linked player is used and nothing is linked or created.
    players["all"] = [{"external_id": 10, "name": "Maximiliano Araújo", "highlightly_id": 555, "position_group": "DEF"}]

    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    assert stats.player_id == 10
    assert players["linked"] == [] and players["saved"] == []

def test_finds_the_player_in_the_squad_of_the_match_team(players):
    # Expected: matched by surname inside team 7 and linked to the Highlightly id for the next times.
    candidate = {"external_id": 10, "name": "Maximiliano Araújo", "position_group": "DEF"}
    players["by_team"] = {7: [candidate]}
    players["all"] = [candidate]

    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    assert stats.player_id == 10
    assert players["linked"] == [(10, 555)]

def test_finds_a_player_that_changed_team_in_all_teams(players):
    # The player is in the squad of team 3 (before a January transfer) but plays for team 7.
    # Expected: found by his unique full name in all teams, and the stats keep the team of the match (7).
    players["by_team"] = {7: []}
    players["all"] = [{"external_id": 10, "name": "Maximiliano Araújo", "team_id": 3, "position_group": "DEF"}]

    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    assert stats.player_id == 10
    assert stats.team_id == 7

def test_does_not_choose_between_namesakes(players):
    # Two players in other teams with the same full name. Expected: none is chosen and a new player is created.
    players["by_team"] = {7: []}
    players["all"] = [{"external_id": 10, "name": "Maximiliano Araujo"}, {"external_id": 11, "name": "Maximiliano Araujo"}]

    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    assert stats.player_id == -555
    assert len(players["saved"]) == 1

def test_creates_the_player_from_the_box_score_when_not_found(players):
    # Expected: new player with the negative Highlightly id, the box-score data, its position group and source.
    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    created = players["saved"][0]
    assert stats.player_id == -555
    assert (created.external_id, created.highlightly_id, created.team_id) == (-555, 555, 7)
    assert (created.full_name, created.photo, created.position_group, created.source) == ("Maximiliano Araujo", "photo.png", "DEF", "highlightly")

def test_completes_a_missing_position_with_the_box_score(players):
    # The football-data player has no position ("null"). Expected: it gets DEF from the box-score position.
    players["all"] = [{"external_id": 10, "name": "Maximiliano Araújo", "highlightly_id": 555, "position_group": None}]

    adapter.adapt_player_match_stats(make_dto(), match_id = 1, team_id = 7, events = None)

    assert players["positions"] == [(10, "DEF")]

def test_merges_box_score_statistics_and_events(players):
    # Expected: box-score values plus own goals, goals conceded on the pitch and minutes from the events.
    players["all"] = [{"external_id": 10, "name": "Maximiliano Araújo", "highlightly_id": 555, "position_group": "DEF"}]
    events = PlayerEventsSummary(minute_in = None, minute_out = "80", own_goals = 1, goals_conceded_on_pitch = 2)

    stats = adapter.adapt_player_match_stats(make_dto(), match_id = 99, team_id = 7, events = events)

    assert (stats.match_id, stats.team_id, stats.highlightly_player_id) == (99, 7, 555)
    assert (stats.goals, stats.shots_on_target, stats.duels_won, stats.fouls_committed) == (1, 2, 5, 3)
    assert (stats.own_goals, stats.goals_conceded_on_pitch, stats.minute_out) == (1, 2, "80")
