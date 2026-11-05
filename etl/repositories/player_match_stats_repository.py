from dataclasses import asdict
from config.database import get_database
from models.player_match_stats import PlayerMatchStats

def save_player_match_stats(player_match_stats: PlayerMatchStats):
    db = get_database()
    db.player_match_stats.update_one(
        {"player_id": player_match_stats.player_id, "match_id": player_match_stats.match_id},
        {"$set": asdict(player_match_stats)},
        upsert = True
    )

def delete_all_player_match_stats():
    db = get_database()
    return db.player_match_stats.delete_many({}).deleted_count
