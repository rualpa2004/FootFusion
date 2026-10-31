import re

# Rounds that are part of FootFusion: the domestic leagues only use their regular season and the Champions League league stage and knockout rounds.
_REGULAR_SEASON = r"^Regular Season - \d+$"
_CHAMPIONS_LEAGUE = r"^(League Stage - \d+|Round of 32|Round of 16|Quarter-finals|Semi-finals|Final)$"

# "matchdays" is the number of matchdays with a football-data table (league stage only in the Champions League).
COMPETITIONS = [
    {"highlightly_id": 2486, "footballdata_code": "CL", "name": "Champions League", "rounds": _CHAMPIONS_LEAGUE, "matchdays": 8},  #Champions League
    {"highlightly_id": 119924, "footballdata_code": "PD", "name": "La Liga", "rounds": _REGULAR_SEASON, "matchdays": 38},           #La Liga
    {"highlightly_id": 115669, "footballdata_code": "SA", "name": "Serie A", "rounds": _REGULAR_SEASON, "matchdays": 38},           #Serie A
    {"highlightly_id": 67162, "footballdata_code": "BL1", "name": "Bundesliga", "rounds": _REGULAR_SEASON, "matchdays": 34},        #Bundesliga
    {"highlightly_id": 52695, "footballdata_code": "FL1", "name": "Ligue 1", "rounds": _REGULAR_SEASON, "matchdays": 34},           #Ligue 1
    {"highlightly_id": 33973, "footballdata_code": "PL", "name": "Premier League", "rounds": _REGULAR_SEASON, "matchdays": 38}      #Premier League
]

def is_relevant_round(competition, round_name):
    return bool(round_name) and re.match(competition["rounds"], round_name) is not None
