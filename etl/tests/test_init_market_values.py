import pytest
from scripts import init_market_values as script
from tests.competition_ids import LA_LIGA

def rows(*team_ids):
    return [{"team_id": team_id, "position": position} for position, team_id in enumerate(team_ids, start = 1)]

@pytest.mark.parametrize("position, teams_count, expected", [(1, 20, 1.8), (20, 20, 0.7), (1, 18, 1.8), (18, 18, 0.7)])
def test_strength_goes_from_first_to_last(position, teams_count, expected):
    # Expected: S is 1.8 for the 1st and 0.7 for the last, with 20 or 18 teams.
    assert script.team_strength(position, teams_count) == pytest.approx(expected)

def test_strength_decreases_linearly():
    # Expected: the 11th of 21 teams is in the middle of the range: 1.8 - 1.1 / 2 = 1.25.
    assert script.team_strength(11, 21) == pytest.approx(1.25)

def test_strengths_of_kept_promoted_and_champions_only_teams():
    current = {LA_LIGA: rows(1, 2, 3)}
    previous = {LA_LIGA: rows(1, 4, 2)}
    teams = [{"external_id": team_id} for team_id in (1, 2, 3, 9)]

    strengths = script.strengths_by_team(current, previous, teams)

    assert strengths[1] == pytest.approx(1.8)
    assert strengths[2] == pytest.approx(0.7)
    assert strengths[3] == script.PROMOTED_STRENGTH == 0.7
    assert strengths[9] == script.CHAMPIONS_ONLY_STRENGTH == 1.0    #Checking current there is no 9, so is not in a league and only belongs to Champions League

@pytest.mark.parametrize("group, strength, expected", [("GK", 1.8, 16_200_000), ("DEF", 1.0, 11_000_000),
                                                      ("MID", 0.7, 8_400_000), ("FWD", 1.0 + 1 / 3, 17_333_333)])
def test_initial_value_is_base_times_strength_in_whole_euros(group, strength, expected):
    # Expected: base of the position x S, rounded to whole euros (an int).
    value = script.initial_value(group, strength)

    assert value == expected
    assert isinstance(value, int)

def test_initial_value_date_is_the_day_before_the_first_match():
    fixtures = [{"date": "2025-08-16T19:00:00.000Z"}, {"date": "2025-08-15T17:00:00.000Z"}]     #date of the matches: 2025-08-16 and 2025/08/15

    assert script.initial_value_date(fixtures) == "2025-08-14"

def test_run_values_new_players_and_skips_the_others(monkeypatch):
    # Expected: only player 1 gets an initial value (in the history and in the player); 2 is not recalculated.
    players = [
        {"external_id": 1, "name": "A", "position_group": "FWD", "team_id": 10},                                #No initial value
        {"external_id": 2, "name": "B", "position_group": "GK", "team_id": 10, "market_value": 5_000_000},      #Has initial value
        {"external_id": 3, "name": "C", "position_group": None, "team_id": 10},                                 #No position
        {"external_id": 4, "name": "D", "position_group": "DEF", "team_id": None},                              #No team
    ]
    history, values = [], []
    monkeypatch.setattr(script, "_tables", lambda season: {LA_LIGA: rows(10, 11)})     # Team 10 is 1st both seasons
    monkeypatch.setattr(script, "_relevant_fixtures", lambda season: [{"date": "2025-08-15T17:00:00.000Z"}])
    monkeypatch.setattr(script, "find_all_teams", lambda: [{"external_id": 10}])
    monkeypatch.setattr(script, "find_all_players", lambda: players)
    monkeypatch.setattr(script, "ensure_market_value_indexes", lambda: None)
    monkeypatch.setattr(script, "save_market_value", history.append)
    monkeypatch.setattr(script, "set_player_market_value", lambda external_id, value: values.append((external_id, value)))

    script.run(2025)

    assert [(h.player_id, h.date, h.value) for h in history] == [(1, "2025-08-14", 23_400_000)]
    assert values == [(1, 23_400_000)]
