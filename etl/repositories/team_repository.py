from dataclasses import asdict
from config.database import get_database
from models.team import Team

def save_team(team: Team):
    db = get_database()
    data = asdict(team)
    competition_ids = data.pop("competition_ids")
    db.teams.update_one(
        {"external_id": team.external_id},
        {"$set": data, "$addToSet": {"competition_ids": {"$each": competition_ids}}},
        upsert = True
    )

def find_team_by_highlightly_id(highlightly_id):
    db = get_database()
    return db.teams.find_one({"highlightly_id": highlightly_id})

def find_team_by_name(name):
    db = get_database()
    return db.teams.find_one({"name": name})

def set_team_highlightly_id(team_external_id, highlightly_id):
    db = get_database()
    return db.teams.update_one({"external_id": team_external_id}, {"$set": {"highlightly_id": highlightly_id}})

def clear_team_highlightly_ids():
    db = get_database()
    db.teams.update_many({}, {"$unset": {"highlightly_id": ""}})

def set_team_competitions(team_external_id, competition_ids):
    db = get_database()
    # competition_id is the old field with a single competition, replaced by competition_ids.
    return db.teams.update_one(
        {"external_id": team_external_id},
        {"$set": {"competition_ids": competition_ids}, "$unset": {"competition_id": ""}}
    )

def find_teams_by_competition(competition_id):
    db = get_database()
    return list(db.teams.find({"competition_ids": competition_id}))

def find_all_teams():
    db = get_database()
    return list(db.teams.find({}))