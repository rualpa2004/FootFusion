from dataclasses import asdict
from config.database import get_database
from models.player import Player

def save_player(player: Player):
    db = get_database()
    db.players.update_one(
        {"external_id": player.external_id},
        {"$set": asdict(player)},
        upsert = True
    )

def find_player_by_highlightly_id(highlightly_id):
    db = get_database()
    return db.players.find_one({"highlightly_id": highlightly_id})

def find_player_by_name(name):
    db = get_database()
    return db.players.find_one({"name": name})

def find_players_by_team(team_id):
    db = get_database()
    return list(db.players.find({"team_id": team_id}))

def set_player_highlightly_id(external_id, highlightly_id):
    db = get_database()
    db.players.update_one({"external_id": external_id}, {"$set": {"highlightly_id": highlightly_id}})

def set_player_position_group(external_id, position_group):
    db = get_database()
    db.players.update_one({"external_id": external_id}, {"$set": {"position_group": position_group}})

def find_all_players():
    db = get_database()
    return list(db.players.find({}))

def set_player_market_value(external_id, market_value):
    db = get_database()
    db.players.update_one({"external_id": external_id}, {"$set": {"market_value": market_value}})

def delete_box_score_players():
    """Deletes the players created from a box-score (source "highlightly"); the football-data squads are kept."""
    db = get_database()
    return db.players.delete_many({"source": "highlightly"}).deleted_count

def clear_player_highlightly_ids():
    db = get_database()
    db.players.update_many({}, {"$unset": {"highlightly_id": ""}})
