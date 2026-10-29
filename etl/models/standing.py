from dataclasses import dataclass, field

@dataclass
class StandingRow:
    position: int
    team_id: int            # football-data team id, the same as Team.external_id
    team_name: str
    played: int
    won: int
    draw: int
    lost: int
    points: int
    goals_for: int
    goals_against: int
    goal_difference: int

@dataclass
class Standing:
    """Table of a competition after a matchday."""
    competition_id: int     # Highlightly id, the same as Competition.external_id
    footballdata_code: str
    season: int
    matchday: int
    table: list = field(default_factory = list)
