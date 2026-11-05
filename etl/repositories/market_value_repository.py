from dataclasses import asdict
from config.database import get_database
from models.market_value import MarketValue

def ensure_market_value_indexes():
    db = get_database()
    db.market_values.create_index([("player_id", 1), ("date", 1)], unique = True)

def save_market_value(market_value: MarketValue):
    db = get_database()
    db.market_values.update_one(
        {"player_id": market_value.player_id, "date": market_value.date},
        {"$set": asdict(market_value)},
        upsert = True
    )
