from dataclasses import dataclass

@dataclass
class MarketValue:
    """Market value of a player on a date. One per player and day (daily history)."""
    player_id: int          # Player.external_id
    date: str               # YYYY-MM-DD
    value: int
