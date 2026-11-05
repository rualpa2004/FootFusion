# Initial market value = position base x team strength S
BASE_VALUES = {"GK": 9_000_000, "DEF": 11_000_000, "MID": 12_000_000, "FWD": 13_000_000}

# S goes from MAX_STRENGTH (1st of the previous season) down to MAX_STRENGTH - STRENGTH_RANGE (last).
MAX_STRENGTH = 1.8
STRENGTH_RANGE = 1.1
PROMOTED_STRENGTH = 0.7             # Teams that were not in the previous season table of their league
CHAMPIONS_ONLY_STRENGTH = 1.0       # Teams with no domestic league in FootFusion (e.g. Benfica, PSV)
