from dataclasses import dataclass

# Turns the events of a match (/events) into per-player data that the box-score does not give:
# when each player came on and went off, own goals and the goals conceded while each player was on the pitch.
#
# Event format:
# - "time" is a text: "9", "45+2", "90+1", "105+3", "120+1". Events are not always in chronological order.
# - Substitution: "playerId" is the player going OFF and "assistingPlayerId" the player coming ON.
# - "Goal" and "Penalty" are goals of the event's team ("Penalty" = scored penalty).
# - "Own Goal": the player's own team concedes it.

SCORING_TYPES = {"Goal", "Penalty"}
OWN_GOAL_TYPE = "Own Goal"
CANCELLED_GOAL_TYPE = "VAR Goal Cancelled"
SUBSTITUTION_TYPE = "Substitution"

@dataclass
class PlayerEventsSummary:
    minute_in: str = None               # None for starters
    minute_out: str = None              # None if he played until the end
    own_goals: int = 0
    goals_conceded_on_pitch: int = 0

def parse_minute(time):
    """Comparable minute: "45+2" -> 45.002, so first-half stoppage time stays before minute 46."""
    if time is None:
        return None
    base, _, extra = str(time).partition("+")
    return int(base) + (int(extra) / 1000 if extra else 0)

def parse_score(score):
    """"2 - 1" -> (2, 1). None if the score is missing or has another format."""
    try:
        home, away = (int(part) for part in score.split("-"))
        return home, away
    except (AttributeError, ValueError):
        return None

def _is_red_card(event_type):
    return "red card" in (event_type or "").lower()

def _goals_against(box_score, events, team_of_player, warnings):
    """List of (minute, conceding_team_id) of the goals of the match, without the ones cancelled by VAR."""
    team_ids = [entry["team"]["id"] for entry in box_score]
    goals = []
    for event in events:
        event_type = event.get("type")
        if event_type in SCORING_TYPES:
            scoring_team = team_of_player.get(event.get("playerId"), event["team"]["id"])
            conceding = [team_id for team_id in team_ids if team_id != scoring_team]
            if conceding:
                goals.append({"minute": parse_minute(event["time"]), "team": conceding[0], "player": event.get("playerId")})
        elif event_type == OWN_GOAL_TYPE:
            conceding = team_of_player.get(event.get("playerId"))
            if conceding is None:
                warnings.append(f"Own goal of an unknown player ({event.get('player')}) ignored")
            else:
                goals.append({"minute": parse_minute(event["time"]), "team": conceding, "player": event.get("playerId")})
        elif event_type == CANCELLED_GOAL_TYPE:
            cancelled = [goal for goal in goals if goal["player"] == event.get("playerId")]
            if cancelled:
                goals.remove(cancelled[-1])
            else:
                warnings.append(f"Cancelled goal of {event.get('player')} without a matching goal")
    return goals

def _match_official_score(goals, expected_conceded, warnings):
    """Keeps the goals consistent with the final score (e.g. ignores penalty shoot-out kicks if they appear)."""
    if not expected_conceded:
        return goals
    result = []
    for team_id, expected in expected_conceded.items():
        team_goals = [goal for goal in goals if goal["team"] == team_id]
        if len(team_goals) != expected:
            warnings.append(f"Team {team_id}: {len(team_goals)} goals against in the events, {expected} in the score")
        result.extend(team_goals[:expected])
    return result

def summarize_player_events(box_score, events, expected_conceded = None):
    """
    Returns ({highlightly_player_id: PlayerEventsSummary}, warnings).
    expected_conceded: optional {highlightly_team_id: goals conceded according to the final score}.
    A goal counts for the players on the pitch: the player coming on at the goal's minute does not concede it
    and the player going off does (the order inside the same minute is unknown).
    """
    warnings = []
    events = sorted(events or [], key = lambda event: parse_minute(event.get("time")) or 0)
    team_of_player = {player["id"]: entry["team"]["id"] for entry in box_score for player in entry.get("players", [])}

    came_on, went_off = {}, {}
    own_goals = {}
    for event in events:
        event_type = event.get("type")
        if event_type == SUBSTITUTION_TYPE:
            went_off.setdefault(event.get("playerId"), event["time"])
            came_on.setdefault(event.get("assistingPlayerId"), event["time"])
        elif _is_red_card(event_type):
            went_off.setdefault(event.get("playerId"), event["time"])
        elif event_type == OWN_GOAL_TYPE:
            own_goals[event.get("playerId")] = own_goals.get(event.get("playerId"), 0) + 1

    goals = _match_official_score(_goals_against(box_score, events, team_of_player, warnings), expected_conceded, warnings)
    match_end = max((player.get("minutesPlayed") or 0 for entry in box_score for player in entry["players"]), default = 90)

    summaries = {}
    for entry in box_score:
        team_id = entry["team"]["id"]
        for player in entry.get("players", []):
            player_id = player["id"]
            summary = PlayerEventsSummary(own_goals = own_goals.get(player_id, 0))
            summaries[player_id] = summary
            minutes = player.get("minutesPlayed") or 0
            if minutes <= 0:
                continue

            summary.minute_out = went_off.get(player_id)
            if player.get("isSubstitute"):
                summary.minute_in = came_on.get(player_id)
                if summary.minute_in is None:
                    warnings.append(f"Substitute {player.get('name')} without substitution event: minute estimated")

            start = parse_minute(summary.minute_in) if summary.minute_in else (match_end - minutes if player.get("isSubstitute") else 0)
            end = parse_minute(summary.minute_out) if summary.minute_out else float("inf")
            summary.goals_conceded_on_pitch = sum(
                1 for goal in goals if goal["team"] == team_id and start < goal["minute"] <= end
            )

    return summaries, warnings
