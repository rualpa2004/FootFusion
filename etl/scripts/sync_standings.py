import json
import os
import time
from adapters.standing_adapter import adapt_standing
from clients.football_data_client import FootballDataClient
from config.competitions import COMPETITIONS
from repositories.standing_repository import find_saved_matchdays, save_standing

CACHE_DIR = os.path.join("cache", "Standings")
REQUEST_DELAY_SECONDS = 10          # Needed for the API restrictions (10 requests/minute)

client = FootballDataClient()

def _cache_path(competition, season, matchday):
    # One folder per competition, named like the rest of the cache (cache/<competition name>).
    code = competition["footballdata_code"]
    return os.path.join(CACHE_DIR, competition["name"], f"standings_{code}_{season}_{matchday}.json")

def _get_standings(competition, season, matchday = None):
    if matchday is not None:
        path = _cache_path(competition, season, matchday)
        if os.path.exists(path):
            with open(path, "r", encoding = "utf-8") as f:
                return json.load(f)

    response = client.get_standings(competition["footballdata_code"], season, matchday)
    time.sleep(REQUEST_DELAY_SECONDS)
    if matchday is not None:
        os.makedirs(os.path.dirname(path), exist_ok = True)
        with open(path, "w", encoding = "utf-8") as f:
            json.dump(response, f, ensure_ascii = False, indent = 2)
    return response

def sync_competition(competition, season):
    code = competition["footballdata_code"]
    # The response without matchday says which matchday the season has reached.
    current_matchday = _get_standings(competition, season)["season"]["currentMatchday"]
    # currentMatchday comes from outside the code (API or cache file), so it cannot set more iterations than the competition has.
    last_matchday = min(competition["matchdays"], current_matchday)
    if last_matchday != current_matchday:
        print(f"{competition['name']}: jornada {current_matchday} no válida, se limita a {last_matchday}")
    saved = find_saved_matchdays(competition["highlightly_id"], season)

    for matchday in range(1, last_matchday + 1):
        if matchday in saved:
            continue
        response = _get_standings(competition, season, matchday)
        save_standing(adapt_standing(response, competition["highlightly_id"], code, season, matchday))
    print(f"{competition['name']}: clasificaciones hasta la jornada {last_matchday}")

def _get_final_standings(competition, season):
    # A finished season answers with its final table when no matchday is given, so it is cached as "final".
    path = _cache_path(competition, season, "final")
    if os.path.exists(path):
        with open(path, "r", encoding = "utf-8") as f:
            return json.load(f)

    response = client.get_standings(competition["footballdata_code"], season)
    time.sleep(REQUEST_DELAY_SECONDS)
    os.makedirs(os.path.dirname(path), exist_ok = True)
    with open(path, "w", encoding = "utf-8") as f:
        json.dump(response, f, ensure_ascii = False, indent = 2)
    return response

def sync_previous_season(competition, season):
    """Final table of the previous season: initial market values and team strength of the first matchdays."""
    previous_season = season - 1
    response = _get_final_standings(competition, previous_season)
    last_matchday = response["season"]["currentMatchday"]
    save_standing(adapt_standing(response, competition["highlightly_id"], competition["footballdata_code"], previous_season, last_matchday))
    print(f"{competition['name']}: clasificación final de {previous_season}-{str(season)[2:]} (jornada {last_matchday})")

def is_domestic_league(competition):
    # The Champions League has no table that ranks every team of a domestic league.
    return competition["footballdata_code"] != "CL"

def run(season):
    for competition in COMPETITIONS:
        sync_competition(competition, season)
    for competition in filter(is_domestic_league, COMPETITIONS):
        sync_previous_season(competition, season)

if __name__ == "__main__":
    run(season = 2025)
