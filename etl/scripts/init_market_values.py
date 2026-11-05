from datetime import date, timedelta
from config.competitions import COMPETITIONS, is_domestic_league, is_relevant_round
from config.market_value import BASE_VALUES, CHAMPIONS_ONLY_STRENGTH, MAX_STRENGTH, PROMOTED_STRENGTH, STRENGTH_RANGE
from models.market_value import MarketValue
from repositories.market_value_repository import ensure_market_value_indexes, save_market_value
from repositories.player_repository import find_all_players, set_player_market_value
from repositories.standing_repository import find_latest_standing
from repositories.team_repository import find_all_teams
from scripts.fixtures_cache import load_fixtures_from_cache

def team_strength(position, teams_count):
    """S of a team that was in the previous season table: MAX_STRENGTH for the 1st, decreasing linearly to
    MAX_STRENGTH - STRENGTH_RANGE for the last."""
    return MAX_STRENGTH - STRENGTH_RANGE * (position - 1) / (teams_count - 1)

def strengths_by_team(current_tables, previous_tables, teams):
    """current_tables / previous_tables: {domestic competition id: list of table rows}.
    Returns {team_id: S} for every team: previous position in its league, promoted, or Champions League only."""
    strengths = {}
    for competition_id, rows in current_tables.items():
        previous = {row["team_id"]: row["position"] for row in previous_tables.get(competition_id, [])}
        teams_count = len(previous_tables.get(competition_id, []))
        for row in rows:
            position = previous.get(row["team_id"])
            strengths[row["team_id"]] = team_strength(position, teams_count) if position else PROMOTED_STRENGTH
    for team in teams:
        strengths.setdefault(team["external_id"], CHAMPIONS_ONLY_STRENGTH)
    return strengths

def initial_value(position_group, strength):
    return round(BASE_VALUES[position_group] * strength)

def initial_value_date(fixtures):
    """Day before the first relevant match of the season, so the initial value is the one before any match."""
    first = min(fixture["date"][:10] for fixture in fixtures)
    return (date.fromisoformat(first) - timedelta(days = 1)).isoformat()

def _relevant_fixtures(season):
    fixtures = []
    for competition in COMPETITIONS:
        fixtures += [f for f in load_fixtures_from_cache(competition["highlightly_id"], season) if is_relevant_round(competition, f.get("round"))]
    return fixtures

def _tables(season):
    tables = {}
    for competition in filter(is_domestic_league, COMPETITIONS):
        standing = find_latest_standing(competition["highlightly_id"], season)
        if standing is None:
            raise RuntimeError(f"{competition['name']}: sin clasificación de {season}, ejecuta primero sync_standings")
        tables[competition["highlightly_id"]] = standing["table"]
    return tables

def run(season):
    strengths = strengths_by_team(_tables(season), _tables(season - 1), find_all_teams())
    value_date = initial_value_date(_relevant_fixtures(season))
    ensure_market_value_indexes()

    created, already_valued, excluded = 0, 0, []
    for player in find_all_players():
        if player.get("market_value") is not None:
            already_valued += 1     # Initial values are never recalculated
            continue
        if player.get("position_group") not in BASE_VALUES or player.get("team_id") not in strengths:
            excluded.append(f"{player['name']} (posición: {player.get('position_group')}, equipo: {player.get('team_id')})")
            continue
        value = initial_value(player["position_group"], strengths[player["team_id"]])
        save_market_value(MarketValue(player_id = player["external_id"], date = value_date, value = value))
        set_player_market_value(player["external_id"], value)
        created += 1

    print(f"Valores iniciales ({value_date}): {created} nuevos, {already_valued} ya tenían valor, {len(excluded)} excluidos")
    for player in excluded:
        print(f" - {player}")

if __name__ == "__main__":
    run(season = 2025)
