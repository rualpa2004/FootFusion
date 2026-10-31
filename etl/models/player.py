from dataclasses import dataclass

@dataclass
class Player:
    external_id: int
    name: str
    full_name: str
    photo: str
    birth_date: str
    birth_place: str
    nationality: str
    foot: str
    height: str
    position: str
    team_id: int
    highlightly_id: int = None
    position_group: str = None          # GK, DEF, MID or FWD (position_adapter)
    source: str = "football-data"       # "highlightly" for players only found in the box-scores