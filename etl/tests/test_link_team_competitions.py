from scripts.link_team_competitions import team_competitions
from tests.competition_ids import CHAMPIONS_LEAGUE, LA_LIGA

def table(*team_ids):
    return {"table": [{"team_id": team_id, "position": position} for position, team_id in enumerate(team_ids, start = 1)]}

def test_team_in_its_league_and_the_champions_league_has_both():
    # Expected: Barcelona (81) plays La Liga and the Champions League; Getafe (82) only La Liga; Benfica (1903) only the CL.
    competitions = team_competitions({LA_LIGA: table(81, 82), CHAMPIONS_LEAGUE: table(81, 1903)})

    assert competitions == {81: sorted([LA_LIGA, CHAMPIONS_LEAGUE]), 82: [LA_LIGA], 1903: [CHAMPIONS_LEAGUE]}

def test_no_standings_gives_no_competitions():
    # Expected: without tables no team gets a competition.
    assert team_competitions({}) == {}
