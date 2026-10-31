from models.standing import Standing, StandingRow

def adapt_standing(response: dict, competition_id: int, footballdata_code: str, season: int, matchday: int) -> Standing:
    """football-data /standings response -> Standing. Only the overall table ("TOTAL") is kept."""
    total = next((table for table in response.get("standings", []) if table.get("type") == "TOTAL"), None)
    rows = [
        StandingRow(
            position = row["position"],
            team_id = row["team"]["id"],
            team_name = row["team"]["name"],
            played = row["playedGames"],
            won = row["won"],
            draw = row["draw"],
            lost = row["lost"],
            points = row["points"],
            goals_for = row["goalsFor"],
            goals_against = row["goalsAgainst"],
            goal_difference = row["goalDifference"]
        )
        for row in (total or {}).get("table", [])
    ]
    return Standing(
        competition_id = competition_id,
        footballdata_code = footballdata_code,
        season = season,
        matchday = matchday,
        table = rows
    )
