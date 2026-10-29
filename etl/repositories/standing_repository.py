from dataclasses import asdict
from config.database import get_database
from models.standing import Standing

def save_standing(standing: Standing):
    db = get_database()
    db.standings.update_one(
        {"competition_id": standing.competition_id, "season": standing.season, "matchday": standing.matchday},
        {"$set": asdict(standing)},
        upsert = True
    )

def find_saved_matchdays(competition_id, season):
    db = get_database()
    return {doc["matchday"] for doc in db.standings.find({"competition_id": competition_id, "season": season}, {"matchday": 1})}
