from dtos.highlightly.team_dto import TeamDTO
from dtos.footballdata.team_dto import FootballDataTeamDTO
from models.team import Team

def adapt_team_from_highlightly(dto: TeamDTO, competition_id: int) -> Team:
    return Team(
        external_id = dto.id,
        name = dto.name,
        logo = dto.logo,
        type = dto.type,
        competition_ids = [competition_id]
    )

def adapt_team_from_footballdata(dto: FootballDataTeamDTO, competition_id: int) -> Team:
    return Team(
        external_id = dto.id,
        name = dto.name,
        logo = dto.logo,
        type = "club",
        competition_ids = [competition_id],
        coach_name = dto.coach_name,
        coach_nationality = dto.coach_nationality
    )