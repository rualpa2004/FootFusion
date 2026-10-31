from dtos.highlightly.fixture_player_stats_dto import FixturePlayerStatsDTO

BOX_SCORE_PLAYER = {
    "id": 7623987, "name": "Sivera", "fullName": "Antonio Sivera", "logo": "https://img/7623987.png",
    "position": "Goalkeeper", "minutesPlayed": 90, "isSubstitute": False,
    "statistics": {
        "goalsScored": 0, "assists": 0, "cardsYellow": 1, "cardsSecondYellow": 1, "cardsRed": 0,
        "penaltiesMissed": 0, "shotsOnTarget": 0, "passesKey": 1, "goalsSaved": 2, "dribblesSuccessful": 0,
        "duelsWon": 3, "fouledOthers": 1, "fouledByOthers": 2, "goalsConceded": 1
    }
}

def test_reads_every_statistic_used_by_footfusion():
    # Expected: each field of the box-score in its DTO field (fouledOthers = fouls committed, goalsSaved = saves).
    dto = FixturePlayerStatsDTO.from_api(BOX_SCORE_PLAYER)

    assert (dto.player_id, dto.player_name, dto.full_name, dto.position) == (7623987, "Sivera", "Antonio Sivera", "Goalkeeper")
    assert (dto.minutes_played, dto.is_substitute) == (90, False)
    assert (dto.yellow_cards, dto.red_cards) == (1, 0)
    assert (dto.saves, dto.key_passes, dto.duels_won, dto.fouls_committed, dto.goals_conceded) == (2, 1, 3, 1, 1)

def test_ignores_the_unreliable_second_yellow_field():
    # Expected: one yellow card stays one yellow card, even if cardsSecondYellow is 1.
    dto = FixturePlayerStatsDTO.from_api(BOX_SCORE_PLAYER)

    assert dto.yellow_cards == 1
    assert dto.red_cards == 0

def test_missing_statistics_default_to_zero():
    # Expected: a player without statistics (did not play) has zeros, not errors.
    dto = FixturePlayerStatsDTO.from_api({"id": 1, "name": "Bench", "minutesPlayed": None, "statistics": None})

    assert dto.minutes_played == 0
    assert (dto.goals, dto.saves, dto.duels_won, dto.penalties_missed) == (0, 0, 0, 0)
