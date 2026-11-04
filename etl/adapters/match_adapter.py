import unicodedata
import re
from dtos.highlightly.fixture_dto import FixtureDTO
from models.match import Match
from repositories.team_repository import find_team_by_highlightly_id, find_all_teams, find_teams_by_competition, set_team_highlightly_id

TEAM_ALIASES = {        # Highlightly name -> football-data name, needed when the names are translated or abbreviated
    "rb salzburg": "red bull salzburg",
    "sporting cp": "sporting clube de portugal",
    "bayern munich": "bayern munchen",
    "kairat almaty": "fk kairat",
    "olympiakos piraeus": "pae olympiakos sfp",
    "inter": "internazionale milano",
    "lyon": "olympique lyonnais",
    "wolves": "wolverhampton wanderers",
    "rennes": "stade rennais 1901",
    "copenhagen": "københavn",
    "pafos": "paphos"
}

def _normalize(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = name.lower()
    name = re.sub(r"\b(cf|fc|ac|bc|sc|cd|ud|club)\b", "", name)
    name = re.sub(r"[^a-z0-9\s]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name

def _match_score(target, candidate):
    """1 when both normalized names are equal; when every word of one name is in the other, the share of common words;
    0 otherwise. Partial words do not count, so "milan" never matches "internazionale milano"."""
    if target == candidate:
        return 1.0
    target_tokens, candidate_tokens = set(target.split()), set(candidate.split())
    if target_tokens and candidate_tokens and (target_tokens <= candidate_tokens or candidate_tokens <= target_tokens):
        return len(target_tokens & candidate_tokens) / len(target_tokens | candidate_tokens)
    return 0.0

def _best_candidate(highlightly_id, name, candidates):
    normalized_target = _normalize(name)
    normalized_target = _normalize(TEAM_ALIASES.get(normalized_target, normalized_target))

    scored = []
    for candidate in candidates:
        # A team already linked to another Highlightly team is never taken (e.g. Paris FC can not take the PSG link).
        if candidate.get("highlightly_id") not in (None, highlightly_id):
            continue
        score = _match_score(normalized_target, _normalize(candidate["name"]))
        if score > 0:
            scored.append((score, candidate))

    if not scored:
        return None
    best_score = max(score for score, _ in scored)
    best = [candidate for score, candidate in scored if score == best_score]
    if len(best) > 1:
        print(f" Aviso: equipo ambiguo -> {name} ({', '.join(c['name'] for c in best)})")
        return None
    return best[0]

def _resolve_team_id(highlightly_id, name, competition_id = None):
    team = find_team_by_highlightly_id(highlightly_id)
    if team:
        return team["external_id"]

    # Only the teams of the competition of the match are candidates; all the teams if the competition has none yet.
    candidates = (find_teams_by_competition(competition_id) if competition_id is not None else []) or find_all_teams()
    candidate = _best_candidate(highlightly_id, name, candidates)
    if candidate:
        set_team_highlightly_id(candidate["external_id"], highlightly_id)
        return candidate["external_id"]

    print(f" Aviso: equipo no encontrado -> {name} (highlightly_id = {highlightly_id})")
    return None

def adapt_match(dto: FixtureDTO) -> Match:
    return Match(
        external_id = dto.id,
        date = dto.date,
        round = dto.round,
        status_description = dto.status_description,
        competition_id = dto.league_id,
        season = dto.season,
        home_team_id = _resolve_team_id(dto.home_team_id, dto.home_team_name, dto.league_id),
        away_team_id = _resolve_team_id(dto.away_team_id, dto.away_team_name, dto.league_id),
        score_current = dto.score_current
    )