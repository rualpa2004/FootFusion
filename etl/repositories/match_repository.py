from dataclasses import asdict
from config.database import get_database
from models.match import Match

def save_match(match: Match):
    db = get_database()
    db.matches.update_one(
        {"external_id": match.external_id},
        {"$set": asdict(match)},
        upsert = True
    )

def is_match_synced(external_id):
    """True when the player stats of the match were already saved, so later executions can skip it."""
    db = get_database()
    return db.matches.count_documents({"external_id": external_id, "stats_synced": True}, limit = 1) > 0

def mark_match_synced(external_id):
    db = get_database()
    db.matches.update_one({"external_id": external_id}, {"$set": {"stats_synced": True}})