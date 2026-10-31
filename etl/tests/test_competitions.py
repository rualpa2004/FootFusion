import pytest
from config.competitions import COMPETITIONS, is_relevant_round

LA_LIGA = next(c for c in COMPETITIONS if c["name"] == "La Liga")
LIGUE_1 = next(c for c in COMPETITIONS if c["name"] == "Ligue 1")
BUNDESLIGA = next(c for c in COMPETITIONS if c["name"] == "Bundesliga")
CHAMPIONS = next(c for c in COMPETITIONS if c["name"] == "Champions League")

@pytest.mark.parametrize("round_name", ["Regular Season - 1", "Regular Season - 38"])
def test_regular_season_rounds_are_relevant(round_name):
    # Expected: every regular season matchday of a domestic league is synced.
    assert is_relevant_round(LA_LIGA, round_name)

@pytest.mark.parametrize("competition, round_name", [
    (LIGUE_1, "Relegation round - Quarter-finals"),
    (LIGUE_1, "Semi-finals"),
    (LIGUE_1, "Final"),
    (BUNDESLIGA, "Final"),
])
def test_domestic_play_offs_are_excluded(competition, round_name):
    # Expected: relegation/promotion play-offs (with second division teams) are skipped.
    assert not is_relevant_round(competition, round_name)

@pytest.mark.parametrize("round_name", [
    "League Stage - 1", "League Stage - 8", "Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"
])
def test_champions_league_stage_and_knockouts_are_relevant(round_name):
    # Expected: the league stage and every knockout round from the round of 32 are synced.
    assert is_relevant_round(CHAMPIONS, round_name)

@pytest.mark.parametrize("round_name", [
    "1st Qualifying Round", "2nd Qualifying Round", "3rd Qualifying Round", "Play-offs"
])
def test_champions_league_qualifiers_are_excluded(round_name):
    # Expected: the summer qualifying rounds are skipped (their teams are not in the database).
    assert not is_relevant_round(CHAMPIONS, round_name)

def test_missing_round_is_not_relevant():
    # Expected: a fixture without round is skipped.
    assert not is_relevant_round(LA_LIGA, None)
