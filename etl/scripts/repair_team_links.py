"""Rebuild of the data that depends on the team links (Highlightly team -> football-data team).
The old matching linked Paris FC to PSG and AC Milan to Inter, and did not find Wolves, Rennes, Copenhagen and Pafos."""
from adapters.match_adapter import _resolve_team_id, adapt_match
from config.competitions import COMPETITIONS, is_relevant_round
from dtos.highlightly.fixture_dto import FixtureDTO
from repositories.match_repository import find_all_matches, mark_match_synced, save_match, unmark_match_synced
from repositories.player_match_stats_repository import delete_all_player_match_stats
from repositories.player_repository import clear_player_highlightly_ids, delete_box_score_players
from repositories.team_repository import clear_team_highlightly_ids, find_all_teams
from scripts.fixtures_cache import load_box_score_from_cache, load_events_from_cache, load_fixtures_from_cache
from scripts.sync_matchday import save_player_stats

def relevant_fixtures(season):
    """(competition name, fixture) of every relevant fixture, played or not, oldest first."""
    fixtures = []
    for competition in COMPETITIONS:
        for fixture_data in load_fixtures_from_cache(competition["highlightly_id"], season):
            if is_relevant_round(competition, fixture_data.get("round")):
                fixtures.append((competition["name"], fixture_data))
    return sorted(fixtures, key = lambda item: item[1]["date"])

def relink_teams(fixtures):
    """Links again every team, in chronological order, as sync_matchday would have done with the new matching."""
    clear_team_highlightly_ids()
    for _, fixture_data in fixtures:
        dto = FixtureDTO.from_api(fixture_data)
        _resolve_team_id(dto.home_team_id, dto.home_team_name, dto.league_id)
        _resolve_team_id(dto.away_team_id, dto.away_team_name, dto.league_id)
    return [team["name"] for team in find_all_teams() if team.get("highlightly_id") is None]

def rebuild_matches(fixtures, saved_matches):
    """Saves again every saved match with its new teams and, for the synced ones, its player stats from the cache.
    Returns (stats rebuilt, matches left pending because their cache is missing)."""
    synced = {match["external_id"] for match in saved_matches if match.get("stats_synced")}
    saved = {match["external_id"] for match in saved_matches}
    rebuilt, pending = 0, []

    for competition_name, fixture_data in fixtures:
        fixture_id = fixture_data["id"]
        if fixture_id not in saved:
            continue
        save_match(adapt_match(FixtureDTO.from_api(fixture_data)))
        if fixture_id not in synced:
            continue
        box_score = load_box_score_from_cache(competition_name, fixture_id)
        events = load_events_from_cache(competition_name, fixture_id)
        if box_score is None or events is None:
            unmark_match_synced(fixture_id)
            pending.append(fixture_id)
            continue
        save_player_stats(fixture_data, fixture_id, box_score, events)
        mark_match_synced(fixture_id)
        rebuilt += 1
    return rebuilt, pending

def run(season):
    fixtures = relevant_fixtures(season)
    saved_matches = find_all_matches()

    not_linked = relink_teams(fixtures)
    print(f"Equipos sin vincular a Highlightly: {len(not_linked)} {not_linked}")

    print(f"Estadísticas borradas: {delete_all_player_match_stats()}")
    print(f"Jugadores del box-score borrados: {delete_box_score_players()}")
    clear_player_highlightly_ids()

    rebuilt, pending = rebuild_matches(fixtures, saved_matches)
    print(f"Partidos reconstruidos desde la caché: {rebuilt}. Pendientes para sync_matchday (sin caché): {len(pending)} {pending}")

if __name__ == "__main__":
    run(season = 2025)
