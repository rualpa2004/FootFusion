from collections import defaultdict
from config.competitions import COMPETITIONS
from repositories.standing_repository import find_latest_standing
from repositories.team_repository import find_all_teams, set_team_competitions

def team_competitions(standings_by_competition):
    """{competition_id: standing} -> {team_id: sorted competition ids}. Every team of a competition is in its table,
    so the tables say which competitions each team plays without any API request."""
    competitions = defaultdict(set)
    for competition_id, standing in standings_by_competition.items():
        for row in standing["table"]:
            competitions[row["team_id"]].add(competition_id)
    return {team_id: sorted(competition_ids) for team_id, competition_ids in competitions.items()}

def run(season):
    standings = {}
    for competition in COMPETITIONS:
        standing = find_latest_standing(competition["highlightly_id"], season)
        if standing is None:
            print(f"{competition['name']}: sin clasificación de {season}, ejecuta primero sync_standings")
            continue
        standings[competition["highlightly_id"]] = standing

    competitions_by_team = team_competitions(standings)
    teams = {team["external_id"]: team for team in find_all_teams()}
    for team_id, competition_ids in competitions_by_team.items():
        if team_id not in teams:
            print(f" Aviso: equipo de la clasificación que no está en teams -> {team_id}")
            continue
        set_team_competitions(team_id, competition_ids)

    without_competition = [team["name"] for team_id, team in teams.items() if team_id not in competitions_by_team]
    for competition in COMPETITIONS:
        total = sum(competition["highlightly_id"] in ids for ids in competitions_by_team.values())
        print(f"{competition['name']}: {total} equipos")
    print(f"Equipos sin competición: {len(without_competition)} {without_competition}")

if __name__ == "__main__":
    run(season = 2025)
