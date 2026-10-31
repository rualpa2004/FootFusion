import pytest
from adapters.position_adapter import to_position_group

@pytest.mark.parametrize("position, expected", [
    ("Goalkeeper", "GK"),
    ("Defence", "DEF"),
    ("Midfield", "MID"),
    ("Offence", "FWD"),
])
def test_general_football_data_positions(position, expected):
    # Expected: each general football-data position becomes its group.
    assert to_position_group(position) == expected

@pytest.mark.parametrize("position, expected", [
    ("Centre-Back", "DEF"),
    ("Left-Back", "DEF"),
    ("Right-Back", "DEF"),
    ("Defensive Midfield", "MID"),
    ("Central Midfield", "MID"),
    ("Attacking Midfield", "MID"),
    ("Left Midfield", "MID"),
    ("Right Midfield", "MID"),
    ("Centre-Forward", "FWD"),
    ("Left Winger", "FWD"),
    ("Right Winger", "FWD"),
])
def test_detailed_football_data_positions(position, expected):
    # Expected: laterals are defenders, midfielders of any kind are MID, and wingers are forwards.
    assert to_position_group(position) == expected

@pytest.mark.parametrize("position, expected", [
    ("Goalkeeper", "GK"),
    ("Defender", "DEF"),
    ("Midfielder", "MID"),
    ("Forward", "FWD"),
])
def test_highlightly_box_score_positions(position, expected):
    # Expected: the box-score positions map to the same groups.
    assert to_position_group(position) == expected

def test_ignores_case_and_spaces():
    # Expected: "  centre-back " is still a defender.
    assert to_position_group("  centre-back ") == "DEF"

@pytest.mark.parametrize("position", [None, "", "null", "Coach"])
def test_missing_or_unknown_position(position):
    # Expected: None, so the position can be completed later with the box-score.
    assert to_position_group(position) is None
