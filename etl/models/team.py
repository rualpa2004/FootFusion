from dataclasses import dataclass, field

@dataclass
class Team:
    external_id: int
    name: str
    logo: str
    type: str
    competition_ids: list = field(default_factory = list)     # Highlightly ids; a team can play its league and the Champions League
    highlightly_id: int = None
    coach_name: str = None
    coach_nationality: str = None