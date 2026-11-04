from models.team import Team
from repositories import team_repository

class FakeCollection:
    def __init__(self):
        self.updates = []

    def update_one(self, query, update, upsert = False):
        self.updates.append((query, update, upsert))

class FakeDatabase:
    def __init__(self):
        self.teams = FakeCollection()

def test_save_team_adds_the_competition_without_removing_the_others(monkeypatch):
    # Expected: competition_ids is updated with $addToSet (keeps the Champions League when La Liga is loaded)
    # and is not in $set, which would replace the whole list.
    db = FakeDatabase()
    monkeypatch.setattr(team_repository, "get_database", lambda: db)

    team_repository.save_team(Team(external_id = 81, name = "FC Barcelona", logo = "", type = "club", competition_ids = [119924]))

    query, update, upsert = db.teams.updates[0]
    assert query == {"external_id": 81} and upsert
    assert update["$addToSet"] == {"competition_ids": {"$each": [119924]}}
    assert "competition_ids" not in update["$set"]
