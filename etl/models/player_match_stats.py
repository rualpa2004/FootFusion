from dataclasses import dataclass

@dataclass
class PlayerMatchStats:
    player_id: int
    player_name: str
    match_id: int
    team_id: int                    # Team the player played this match for
    highlightly_player_id: int
    position: str                   # Position in this match according to the box-score (e.g. "Defender")
    minutes_played: int
    is_substitute: int
    goals: int
    assists: int
    yellow_cards: int
    red_cards: int
    own_goals: int
    penalties_missed: int
    shots_on_target: int
    key_passes: int
    saves: int
    successful_dribbles: int
    duels_won: int
    fouls_committed: int
    goals_conceded: int             # Box-score value, only filled for goalkeepers
    goals_conceded_on_pitch: int    # Goals against the player's team while he was on the pitch (from the events)
    minute_in: str                  # Minute he came on as in the API ("64", "90+1"); None for starters
    minute_out: str                 # Minute he was substituted or sent off; None if he played until the end