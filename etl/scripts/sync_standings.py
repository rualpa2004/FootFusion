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

def _cache_path(code, season, matchday):
    return os.path.join(CACHE_DIR, f"standings_{code}_{season}_{matchday}.json")

def _get_standings(code, season, matchday = None):
    if matchday is not None and os.path.exists(_cache_path(code, season, matchday)):
        with open(_cache_path(code, season, matchday), "r", encoding = "utf-8") as f:
            return json.load(f)

    response = client.get_standings(code, season, matchday)
    time.sleep(REQUEST_DELAY_SECONDS)
    if matchday is not None:
        os.makedirs(CACHE_DIR, exist_ok = True)
        with open(_cache_path(code, season, matchday), "w", encoding = "utf-8") as f:
            json.dump(response, f, ensure_ascii = False, indent = 2)
    return response

def sync_competition(competition, season):
    code = competition["footballdata_code"]
    # The response without matchday says which matchday the season has reached.
    last_matchday = _get_standings(code, season)["season"]["currentMatchday"]
    saved = find_saved_matchdays(competition["highlightly_id"], season)

    for matchday in range(1, last_matchday + 1):
        if matchday in saved:
            continue
        response = _get_standings(code, season, matchday)
        save_standing(adapt_standing(response, competition["highlightly_id"], code, season, matchday))
    print(f"{competition['name']}: clasificaciones hasta la jornada {last_matchday}")

def run(season):
    for competition in COMPETITIONS:
        sync_competition(competition, season)

if __name__ == "__main__":
    run(season = 2025)
