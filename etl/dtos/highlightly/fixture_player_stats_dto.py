from dataclasses import dataclass

@dataclass
class FixturePlayerStatsDTO:
    player_id: int
    player_name: str
    full_name: str
    photo: str
    position: str
    minutes_played: int
    is_substitute: bool
    goals: int
    assists: int
    yellow_cards: int
    red_cards: int
    penalties_missed: int
    shots_on_target: int
    key_passes: int
    saves: int
    successful_dribbles: int
    duels_won: int
    fouls_committed: int
    goals_conceded: int

    @staticmethod
    def from_api(player_data: dict) -> "FixturePlayerStatsDTO":
        stats = player_data.get("statistics") or {}
        return FixturePlayerStatsDTO(
            player_id = player_data["id"],
            player_name = player_data["name"],
            full_name = player_data.get("fullName"),
            photo = player_data.get("logo"),
            position = player_data.get("position"),
            minutes_played = player_data.get("minutesPlayed") or 0,
            is_substitute = player_data.get("isSubstitute", False),
            goals = stats.get("goalsScored", 0),
            assists = stats.get("assists", 0),
            yellow_cards = stats.get("cardsYellow", 0),
            red_cards = stats.get("cardsRed", 0),
            penalties_missed = stats.get("penaltiesMissed", 0),
            shots_on_target = stats.get("shotsOnTarget", 0),
            key_passes = stats.get("passesKey", 0),
            saves = stats.get("goalsSaved", 0),
            successful_dribbles = stats.get("dribblesSuccessful", 0),
            duels_won = stats.get("duelsWon", 0),
            fouls_committed = stats.get("fouledOthers", 0),
            goals_conceded = stats.get("goalsConceded", 0)
        )
