POSITION_GROUPS = {
    # football-data, general positions
    "goalkeeper": "GK",
    "defence": "DEF",
    "midfield": "MID",
    "offence": "FWD",
    # football-data, detailed positions
    "centre-back": "DEF",
    "left-back": "DEF",
    "right-back": "DEF",
    "defensive midfield": "MID",
    "central midfield": "MID",
    "attacking midfield": "MID",
    "left midfield": "MID",
    "right midfield": "MID",
    "centre-forward": "FWD",
    "left winger": "FWD",
    "right winger": "FWD",
    # Highlightly (box-score)
    "defender": "DEF",
    "midfielder": "MID",
    "forward": "FWD",
    "attacker": "FWD"
}

def to_position_group(position):
    """Returns GK/DEF/MID/FWD, or None when the position is missing ("null" included) or unknown."""
    if not position:
        return None
    return POSITION_GROUPS.get(position.strip().lower())
