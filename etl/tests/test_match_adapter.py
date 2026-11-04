import pytest
from adapters import match_adapter as adapter
from tests.competition_ids import CHAMPIONS_LEAGUE, LIGUE_1, PREMIER_LEAGUE, SERIE_A

OTHER_COMPETITION = 1      # Whatever competition not in the 6 of FootFusion

PSG = {"external_id": 524, "name": "Paris Saint-Germain FC", "competition_ids": [LIGUE_1, CHAMPIONS_LEAGUE]}
PARIS_FC = {"external_id": 1045, "name": "Paris FC", "competition_ids": [LIGUE_1]}
INTER = {"external_id": 108, "name": "FC Internazionale Milano", "competition_ids": [SERIE_A, CHAMPIONS_LEAGUE]}
MILAN = {"external_id": 98, "name": "AC Milan", "competition_ids": [SERIE_A]}
WOLVES = {"external_id": 76, "name": "Wolverhampton Wanderers FC", "competition_ids": [PREMIER_LEAGUE]}
COPENHAGEN = {"external_id": 1876, "name": "FC København", "competition_ids": [CHAMPIONS_LEAGUE]}

@pytest.fixture
def teams(monkeypatch):
    """In-memory replacement of the teams repository used by the adapter."""
    state = {"all": [], "linked": []}

    def find_by_highlightly_id(highlightly_id):
        return next((t for t in state["all"] if t.get("highlightly_id") == highlightly_id), None)

    def link(external_id, highlightly_id):
        state["linked"].append((external_id, highlightly_id))
        next(t for t in state["all"] if t["external_id"] == external_id)["highlightly_id"] = highlightly_id

    monkeypatch.setattr(adapter, "find_team_by_highlightly_id", find_by_highlightly_id)
    monkeypatch.setattr(adapter, "find_teams_by_competition",
                        lambda competition_id: [t for t in state["all"] if competition_id in t.get("competition_ids", [])])
    monkeypatch.setattr(adapter, "find_all_teams", lambda: state["all"])
    monkeypatch.setattr(adapter, "set_team_highlightly_id", link)
    return state

def test_team_already_linked_is_returned_without_searching(teams):
    # Expected: the team that already has the Highlightly id is returned and nothing new is linked.
    teams["all"] = [{**PSG, "highlightly_id": 1}]

    assert adapter._resolve_team_id(1, "Paris Saint Germain", LIGUE_1) == 524
    assert teams["linked"] == []

def test_paris_fc_is_not_taken_as_psg(teams):
    # "paris" is contained in "paris saint germain", but the exact name wins.
    # Expected: Paris FC is linked to Paris FC although PSG comes first in the list.
    teams["all"] = [dict(PSG), dict(PARIS_FC)]

    assert adapter._resolve_team_id(2, "Paris FC", LIGUE_1) == 1045
    assert teams["linked"] == [(1045, 2)]

def test_psg_is_linked_to_psg(teams):
    # Expected: "Paris Saint Germain" (Highlightly) is PSG and not Paris FC.
    teams["all"] = [dict(PARIS_FC), dict(PSG)]

    assert adapter._resolve_team_id(1, "Paris Saint Germain", LIGUE_1) == 524

def test_milan_is_not_matched_inside_internazionale_milano(teams):
    # "milan" is part of the word "milano"; partial words do not count. Expected: AC Milan is linked to AC Milan.
    teams["all"] = [dict(INTER), dict(MILAN)]

    assert adapter._resolve_team_id(3, "AC Milan", SERIE_A) == 98

def test_inter_uses_its_alias(teams):
    # Expected: "Inter" is found through the alias "internazionale milano".
    teams["all"] = [dict(MILAN), dict(INTER)]

    assert adapter._resolve_team_id(4, "Inter", SERIE_A) == 108

@pytest.mark.parametrize("name, team", [("Wolves", WOLVES), ("FC Copenhagen", COPENHAGEN)])
def test_translated_names_use_their_alias(teams, name, team):
    # Expected: "Wolves" and "FC Copenhagen" (Highlightly) are found with the alias of their football-data name.
    teams["all"] = [dict(team)]

    assert adapter._resolve_team_id(5, name, team["competition_ids"][0]) == team["external_id"]

def test_team_linked_to_another_highlightly_team_is_never_taken(teams):
    # PSG already has another Highlightly id. Expected: "Paris" is not linked to PSG, so no team is found.
    teams["all"] = [{**PSG, "highlightly_id": 1}]

    assert adapter._resolve_team_id(2, "Paris", LIGUE_1) is None
    assert teams["linked"] == []

def test_only_teams_of_the_match_competition_are_candidates(teams):
    # Inter is not in the Premier League. Expected: "Inter" in a Premier League match finds no team.
    teams["all"] = [dict(INTER), dict(WOLVES)]

    assert adapter._resolve_team_id(4, "Inter", PREMIER_LEAGUE) is None

def test_all_teams_are_candidates_when_the_competition_has_none(teams):
    # Before the competitions are linked no team has the competition. Expected: the search uses all the teams.
    teams["all"] = [{**WOLVES, "competition_ids": []}]

    assert adapter._resolve_team_id(5, "Wolves", PREMIER_LEAGUE) == 76

def test_two_equally_good_teams_are_not_chosen(teams):
    # "Sporting" is in both names with the same share of words. Expected: no team is chosen.
    teams["all"] = [{"external_id": 1, "name": "Sporting Gijón", "competition_ids": [OTHER_COMPETITION]},
                    {"external_id": 2, "name": "Sporting Braga", "competition_ids": [OTHER_COMPETITION]}]

    assert adapter._resolve_team_id(6, "Sporting", OTHER_COMPETITION) is None
