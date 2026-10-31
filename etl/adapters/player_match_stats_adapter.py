import unicodedata
import re
from difflib import SequenceMatcher
from dtos.highlightly.fixture_player_stats_dto import FixturePlayerStatsDTO
from adapters.match_events_adapter import PlayerEventsSummary
from adapters.player_adapter import adapt_player_from_box_score
from adapters.position_adapter import to_position_group
from models.player_match_stats import PlayerMatchStats
from repositories.player_repository import (
    find_all_players,
    find_player_by_highlightly_id,
    find_players_by_team,
    save_player,
    set_player_highlightly_id,
    set_player_position_group
)

def _normalize(name):       # To normalize the name of the players
    name = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^a-zA-Z\s-]", "", name)
    return re.sub(r"\s+", " ", name.lower().strip())

def _extract_surname(normalized_name):      # To extract the surname of the players
    tokens = normalized_name.split(" ")
    if len(tokens) > 1 and len(tokens[0]) <= 2:
        tokens = tokens[1:]
    return " ".join(tokens)

def _link(candidate, highlightly_id):
    set_player_highlightly_id(candidate["external_id"], highlightly_id)
    return candidate

def _find_in_team(dto, team_id):
    candidates = find_players_by_team(team_id)
    normalized_target = _normalize(dto.player_name)
    surname_target = _extract_surname(normalized_target)

    for candidate in candidates:
        normalized_candidate = _normalize(candidate["name"])
        if normalized_candidate == normalized_target or surname_target in normalized_candidate:
            return candidate

    # This is to match players as a ultimate resource
    best_candidate, best_score = None, 0
    for candidate in candidates:
        score = SequenceMatcher(None, normalized_target, _normalize(candidate["name"])).ratio()
        if score > best_score:
            best_score, best_candidate = score, candidate
    return best_candidate if best_candidate and best_score >= 0.6 else None

def _find_in_all_teams(dto):
    # Players that changed team during the season (e.g. January signings) are not in the squad of the team
    # they play for. Only an exact full-name match that is unique is accepted, to avoid confusing namesakes.
    targets = {_normalize(dto.full_name), _normalize(dto.player_name)} - {""}
    matches = [player for player in find_all_players() if _normalize(player["name"]) in targets]
    return matches[0] if len(matches) == 1 else None

def _resolve_player(dto: FixturePlayerStatsDTO, team_id: int):
    """Finds the FootFusion player of a box-score entry. Order: Highlightly id already linked -> squad of the team
    of the match -> every team -> new player created with the box-score data (no extra API requests)."""
    player = find_player_by_highlightly_id(dto.player_id)
    if player:
        return player

    candidate = (_find_in_team(dto, team_id) if team_id is not None else None) or _find_in_all_teams(dto)
    if candidate:
        return _link(candidate, dto.player_id)

    new_player = adapt_player_from_box_score(dto, team_id)
    save_player(new_player)
    print(f" Jugador creado desde el box-score -> {dto.player_name} (highlightly_id = {dto.player_id})")
    return {"external_id": new_player.external_id, "position_group": new_player.position_group}

def _complete_position(player, dto):
    # Players without position in football-data take the one of the box-score.
    if not player.get("position_group"):
        position_group = to_position_group(dto.position)
        if position_group:
            set_player_position_group(player["external_id"], position_group)

def adapt_player_match_stats(dto: FixturePlayerStatsDTO, match_id: int, team_id: int, events: PlayerEventsSummary) -> PlayerMatchStats:
    player = _resolve_player(dto, team_id)
    _complete_position(player, dto)
    events = events or PlayerEventsSummary()

    return PlayerMatchStats(
        player_id = player["external_id"],
        player_name = dto.player_name,
        match_id = match_id,
        team_id = team_id,
        highlightly_player_id = dto.player_id,
        position = dto.position,
        minutes_played = dto.minutes_played,
        is_substitute = dto.is_substitute,
        goals = dto.goals,
        assists = dto.assists,
        yellow_cards = dto.yellow_cards,
        red_cards = dto.red_cards,
        own_goals = events.own_goals,
        penalties_missed = dto.penalties_missed,
        shots_on_target = dto.shots_on_target,
        key_passes = dto.key_passes,
        saves = dto.saves,
        successful_dribbles = dto.successful_dribbles,
        duels_won = dto.duels_won,
        fouls_committed = dto.fouls_committed,
        goals_conceded = dto.goals_conceded,
        goals_conceded_on_pitch = events.goals_conceded_on_pitch,
        minute_in = events.minute_in,
        minute_out = events.minute_out
    )
