from dtos.highlightly.player_dto import PlayerDTO
from dtos.footballdata.player_dto import FootballDataPlayerDTO
from dtos.highlightly.fixture_player_stats_dto import FixturePlayerStatsDTO
from adapters.position_adapter import to_position_group
from models.player import Player

def adapt_player_from_highlightly(dto: PlayerDTO, team_id: int) -> Player:
    return Player(
        external_id = dto.id,
        name = dto.name,
        full_name = dto.full_name,
        photo = dto.photo,
        birth_date = dto.birth_date,
        birth_place = dto.birth_place,
        nationality = dto.nationality,
        foot = dto.foot,
        height = dto.height,
        position = dto.position,
        team_id = team_id,
        position_group = to_position_group(dto.position)
    )

def adapt_player_form_footballdata(dto: FootballDataPlayerDTO, team_id: int) -> Player:
    return Player(
        external_id = dto.id,
        name = dto.name,
        full_name = dto.name,
        photo = None,
        birth_date = dto.date_of_birth,
        birth_place = None,
        nationality = dto.nationality,
        foot = None,
        height = None,
        position = dto.position,
        team_id = team_id,
        position_group = to_position_group(dto.position)
    )

def highlightly_only_player_id(highlightly_id: int) -> int:
    # Players created from a box-score have no football-data id. Highlightly and football-data ids overlap
    # (both are positive numbers), so these players use the negative Highlightly id to never collide.
    return -highlightly_id

def adapt_player_from_box_score(dto: FixturePlayerStatsDTO, team_id: int) -> Player:
    """Player that appears in a box-score but not in the football-data squads (e.g. a youth player).
    Built only with the box-score data, so no extra API request is needed."""
    return Player(
        external_id = highlightly_only_player_id(dto.player_id),
        name = dto.player_name,
        full_name = dto.full_name or dto.player_name,
        photo = dto.photo,
        birth_date = None,
        birth_place = None,
        nationality = None,
        foot = None,
        height = None,
        position = dto.position,
        team_id = team_id,
        highlightly_id = dto.player_id,
        position_group = to_position_group(dto.position),
        source = "highlightly"
    )
