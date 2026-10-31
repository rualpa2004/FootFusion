import time
from clients.highlightly_client import HighlightlyClient
from clients.request_budget import DailyLimitReachedError, remaining_requests
from adapters.match_adapter import adapt_match
from adapters.match_events_adapter import parse_score, summarize_player_events
from adapters.player_match_stats_adapter import adapt_player_match_stats
from dtos.highlightly.fixture_dto import FixtureDTO
from dtos.highlightly.fixture_player_stats_dto import FixturePlayerStatsDTO
from repositories.player_match_stats_repository import save_player_match_stats
from repositories.match_repository import is_match_synced, mark_match_synced, save_match
from repositories.team_repository import find_team_by_highlightly_id
from config.competitions import COMPETITIONS, is_relevant_round
from collections import defaultdict
from scripts.fixtures_cache import (
    load_box_score_from_cache,
    load_events_from_cache,
    load_fixtures_from_cache,
    save_box_score_to_cache,
    save_events_to_cache
)

# Needed to respect API restrictions in case they have minute limit. Cached data needs no pause.
REQUEST_DELAY_SECONDS = 10

client = HighlightlyClient()

def is_finished(status_description):
    # The API returns "Finished", "Finished after extra time" and "Finished after penalties".
    return (status_description or "").lower().startswith("finished")

def order_rounds(fixtures):     #Function to return rounds grouped and ordered
    grouped = defaultdict(list)
    for fixture_data in fixtures:
        grouped[fixture_data.get("round")].append(fixture_data)

    ordered_round_names = sorted(
        grouped, key=lambda round_name: min(f["date"] for f in grouped[round_name])
    )
    return grouped, ordered_round_names

def _cached_or_requested(load, save, request, competition_name, fixture_id):
    data = load(competition_name, fixture_id)
    if data is None:
        data = request(fixture_id)
        save(competition_name, fixture_id, data)
        time.sleep(REQUEST_DELAY_SECONDS)
    return data

def _expected_conceded(fixture_data):
    score = parse_score(fixture_data["state"]["score"].get("current"))
    if score is None:
        return None
    home_goals, away_goals = score
    return {fixture_data["homeTeam"]["id"]: away_goals, fixture_data["awayTeam"]["id"]: home_goals}

def sync_player_stats(competition_name, fixture_data, match_id):
    fixture_id = fixture_data["id"]
    box_score = _cached_or_requested(
        load_box_score_from_cache, save_box_score_to_cache, client.get_fixture_players, competition_name, fixture_id
    )
    events = _cached_or_requested(
        load_events_from_cache, save_events_to_cache, client.get_fixture_events, competition_name, fixture_id
    )

    summaries, warnings = summarize_player_events(box_score, events, _expected_conceded(fixture_data))
    for warning in warnings:
        print(f" Aviso (partido {fixture_id}): {warning}")

    for team_entry in box_score:
        team = find_team_by_highlightly_id(team_entry["team"]["id"])
        team_id = team["external_id"] if team else None
        for player_data in team_entry.get("players", []):
            stats_dto = FixturePlayerStatsDTO.from_api(player_data)
            stats = adapt_player_match_stats(stats_dto, match_id, team_id, summaries.get(stats_dto.player_id))
            save_player_match_stats(stats)

def process_fixture(competition_name, fixture_data):
    dto = FixtureDTO.from_api(fixture_data)
    if is_match_synced(dto.id):
        return False
    match = adapt_match(dto)
    save_match(match)
    if is_finished(dto.status_description):
        sync_player_stats(competition_name, fixture_data, match.external_id)
        mark_match_synced(match.external_id)
    return True

def relevant_fixtures(season):
    """Finished fixtures of every competition that are part of FootFusion, oldest first."""
    fixtures = []
    for competition in COMPETITIONS:
        for fixture_data in load_fixtures_from_cache(competition["highlightly_id"], season):
            if is_relevant_round(competition, fixture_data.get("round")) and is_finished(fixture_data["state"]["description"]):
                fixtures.append((competition["name"], fixture_data))
    return sorted(fixtures, key = lambda item: item[1]["date"])

def run_season(season):
    fixtures = relevant_fixtures(season)
    print(f"Peticiones disponibles hoy: {remaining_requests(client.daily_limit)}")
    synced = 0
    try:
        for competition_name, fixture_data in fixtures:
            if process_fixture(competition_name, fixture_data):
                synced += 1
    except DailyLimitReachedError:
        print("Límite diario de peticiones alcanzado, continúa al día siguiente.")

    pending = sum(1 for _, fixture_data in fixtures if not is_match_synced(fixture_data["id"]))
    print(f"Partidos sincronizados en esta ejecución: {synced}. Pendientes: {pending} de {len(fixtures)}.")

def run_single_round(competition_name, season, round_name):
    competition = next(c for c in COMPETITIONS if c["name"] == competition_name)
    fixtures = load_fixtures_from_cache(competition["highlightly_id"], season)
    fixtures_by_round, _ = order_rounds(fixtures)

    round_fixtures = fixtures_by_round.get(round_name, [])
    for fixture_data in round_fixtures:
        process_fixture(competition_name, fixture_data)
    print(f"{round_name}: {len(round_fixtures)} partidos")

if __name__ == "__main__":
    run_season(2025)
