import json
import os

CACHE_DIR = "cache"
FIXTURES_DIR = "Competitions"

def load_fixtures_from_cache(league_id, season):
    path = f"{CACHE_DIR}/{FIXTURES_DIR}/fixtures_{league_id}_{season}.json"
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"No hay caché para league_id = {league_id}. Ejecuta primero cache_fixtures.py"
        )
    with open(path, "r", encoding = "utf-8") as f:
        return json.load(f)

def _load(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding = "utf-8") as f:
        return json.load(f)

def _save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok = True)
    with open(path, "w", encoding = "utf-8") as f:
        json.dump(data, f, ensure_ascii = False, indent = 2)

def load_box_score_from_cache(competition_name, fixture_id):
    return _load(f"{CACHE_DIR}/{competition_name}/box_score_{fixture_id}.json")

def save_box_score_to_cache(competition_name, fixture_id, box_score):
    _save(f"{CACHE_DIR}/{competition_name}/box_score_{fixture_id}.json", box_score)

def load_events_from_cache(competition_name, fixture_id):
    return _load(f"{CACHE_DIR}/{competition_name}/events_{fixture_id}.json")

def save_events_to_cache(competition_name, fixture_id, events):
    _save(f"{CACHE_DIR}/{competition_name}/events_{fixture_id}.json", events)
