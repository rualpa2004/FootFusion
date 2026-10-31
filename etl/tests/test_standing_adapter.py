from adapters.standing_adapter import adapt_standing

def table_row(position, team_id, name, points):
    return {"position": position, "team": {"id": team_id, "name": name}, "playedGames": 10, "won": 8, "draw": 1,
            "lost": 1, "points": points, "goalsFor": 20, "goalsAgainst": 5, "goalDifference": 15}

RESPONSE = {
    "season": {"currentMatchday": 38},
    "standings": [
        {"type": "TOTAL", "table": [table_row(1, 57, "Arsenal FC", 25), table_row(2, 65, "Manchester City FC", 22)]},
        {"type": "HOME", "table": [table_row(1, 65, "Manchester City FC", 15)]},
    ]
}

def test_keeps_only_the_overall_table():
    # Expected: the 2 rows of the TOTAL table, not the home/away ones.
    standing = adapt_standing(RESPONSE, competition_id = 33973, footballdata_code = "PL", season = 2025, matchday = 10)

    assert (standing.competition_id, standing.footballdata_code, standing.season, standing.matchday) == (33973, "PL", 2025, 10)
    assert [row.team_name for row in standing.table] == ["Arsenal FC", "Manchester City FC"]

def test_maps_every_column():
    # Expected: position, football-data team id, points and goals of the row.
    row = adapt_standing(RESPONSE, 33973, "PL", 2025, 10).table[0]

    assert (row.position, row.team_id, row.points, row.played) == (1, 57, 25, 10)
    assert (row.won, row.draw, row.lost, row.goals_for, row.goals_against, row.goal_difference) == (8, 1, 1, 20, 5, 15)

def test_empty_response():
    # Expected: an empty table instead of an error.
    assert adapt_standing({}, 33973, "PL", 2025, 1).table == []
