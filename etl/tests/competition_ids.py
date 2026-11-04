"""Highlightly ids of the FootFusion competitions, read from config/competitions.py to use them in tests"""
from config.competitions import COMPETITIONS

def competition_id(name):
    return next(c["highlightly_id"] for c in COMPETITIONS if c["name"] == name)

CHAMPIONS_LEAGUE = competition_id("Champions League")
LA_LIGA = competition_id("La Liga")
SERIE_A = competition_id("Serie A")
LIGUE_1 = competition_id("Ligue 1")
PREMIER_LEAGUE = competition_id("Premier League")
