import pytest
from adapters.match_events_adapter import parse_minute, parse_score, summarize_player_events

HOME, AWAY = 100, 200

def player(player_id, minutes, substitute = False, name = None):
    return {"id": player_id, "name": name or f"Player {player_id}", "minutesPlayed": minutes, "isSubstitute": substitute}

def box_score(home_players, away_players):
    return [
        {"team": {"id": HOME, "name": "Home"}, "players": home_players},
        {"team": {"id": AWAY, "name": "Away"}, "players": away_players},
    ]

def event(event_type, time, team, player_id, coming_on = None):
    return {"type": event_type, "time": time, "team": {"id": team}, "player": f"Player {player_id}",
            "playerId": player_id, "assistingPlayerId": coming_on}

# Home: goalkeeper 1 (90'), defender 2 replaced in the 60th by 3 (30'). Away: forward 10 (90') and 11 (did not play).
STANDARD_BOX = box_score([player(1, 90), player(2, 60), player(3, 30, substitute = True)], [player(10, 90), player(11, 0, substitute = True)])

class TestParseMinute:
    @pytest.mark.parametrize("time, expected", [("9", 9), ("90", 90), ("120", 120)])
    def test_regular_minutes(self, time, expected):
        # Expected: the number itself.
        assert parse_minute(time) == expected

    def test_stoppage_time_stays_before_the_next_minute(self):
        # Expected: 45+2 is after 45 and before 46; 90+3 is before 91 (extra time).
        assert 45 < parse_minute("45+2") < 46
        assert 90 < parse_minute("90+3") < 91
        assert parse_minute("105+3") < parse_minute("106")

    def test_missing_time(self):
        # Expected: None.
        assert parse_minute(None) is None

class TestParseScore:
    def test_valid_score(self):
        # Expected: (home goals, away goals).
        assert parse_score("5 - 0") == (5, 0)

    @pytest.mark.parametrize("score", [None, "", "abc"])
    def test_invalid_score(self, score):
        # Expected: None.
        assert parse_score(score) is None

class TestSummarizePlayerEvents:
    def test_goal_conceded_only_by_the_players_on_the_pitch(self):
        # Away goal in the 30th (defender 2 on the pitch) and in the 75th (substitute 3 on the pitch).
        # Expected: goalkeeper 1 concedes 2, defender 2 concedes 1 (30th), substitute 3 concedes 1 (75th).
        events = [
            event("Substitution", "60", HOME, 2, coming_on = 3),
            event("Goal", "30", AWAY, 10),
            event("Goal", "75", AWAY, 10),
        ]

        summaries, warnings = summarize_player_events(STANDARD_BOX, events)

        assert summaries[1].goals_conceded_on_pitch == 2
        assert summaries[2].goals_conceded_on_pitch == 1
        assert summaries[3].goals_conceded_on_pitch == 1
        assert summaries[10].goals_conceded_on_pitch == 0
        assert warnings == []

    def test_minutes_in_and_out_from_the_substitution(self):
        # Expected: the player going off has minute_out "60"; the one coming on has minute_in "60"; starters None.
        events = [event("Substitution", "60", HOME, 2, coming_on = 3)]

        summaries, _ = summarize_player_events(STANDARD_BOX, events)

        assert (summaries[2].minute_in, summaries[2].minute_out) == (None, "60")
        assert (summaries[3].minute_in, summaries[3].minute_out) == ("60", None)
        assert (summaries[1].minute_in, summaries[1].minute_out) == (None, None)

    def test_goal_in_the_minute_of_a_substitution_counts_for_the_player_going_off(self):
        # Expected: goal in the 60th -> defender 2 (going off) concedes it, substitute 3 (coming on) does not.
        events = [event("Substitution", "60", HOME, 2, coming_on = 3), event("Goal", "60", AWAY, 10)]

        summaries, _ = summarize_player_events(STANDARD_BOX, events)

        assert summaries[2].goals_conceded_on_pitch == 1
        assert summaries[3].goals_conceded_on_pitch == 0

    def test_scored_penalty_is_a_goal_conceded(self):
        # Expected: a "Penalty" event (scored penalty) counts as a goal against the other team.
        summaries, _ = summarize_player_events(STANDARD_BOX, [event("Penalty", "50", AWAY, 10)])

        assert summaries[1].goals_conceded_on_pitch == 1

    def test_own_goal_is_conceded_by_the_scorer_team_and_counted_for_the_scorer(self):
        # Defender 2 (home) scores an own goal in the 20th.
        # Expected: own_goals = 1 for player 2 and the home players on the pitch concede it; the away team does not.
        summaries, _ = summarize_player_events(STANDARD_BOX, [event("Own Goal", "20", HOME, 2)])

        assert summaries[2].own_goals == 1
        assert summaries[1].goals_conceded_on_pitch == 1
        assert summaries[2].goals_conceded_on_pitch == 1
        assert summaries[10].goals_conceded_on_pitch == 0

    def test_red_card_ends_the_time_on_the_pitch(self):
        # Defender 2 sent off in the 40th, away goal in the 50th.
        # Expected: minute_out "40" and he does not concede the goal; the goalkeeper does.
        box = box_score([player(1, 90), player(2, 40)], [player(10, 90)])
        events = [event("Red Card", "40", HOME, 2), event("Goal", "50", AWAY, 10)]

        summaries, _ = summarize_player_events(box, events)

        assert summaries[2].minute_out == "40"
        assert summaries[2].goals_conceded_on_pitch == 0
        assert summaries[1].goals_conceded_on_pitch == 1

    def test_events_out_of_order_and_stoppage_time(self):
        # Sub in 90+1 listed before a goal in the 90th (as the API does).
        # Expected: the 90th goal is conceded by defender 2, who goes off in 90+1, and not by substitute 3.
        box = box_score([player(1, 90), player(2, 90), player(3, 1, substitute = True)], [player(10, 90)])
        events = [event("Substitution", "90+1", HOME, 2, coming_on = 3), event("Goal", "90", AWAY, 10)]

        summaries, _ = summarize_player_events(box, events)

        assert summaries[2].goals_conceded_on_pitch == 1
        assert summaries[3].goals_conceded_on_pitch == 0

    def test_var_cancelled_goal_is_not_conceded(self):
        # Expected: a goal followed by "VAR Goal Cancelled" of the same player does not count.
        events = [event("Goal", "30", AWAY, 10), event("VAR Goal Cancelled", "31", AWAY, 10)]

        summaries, _ = summarize_player_events(STANDARD_BOX, events)

        assert summaries[1].goals_conceded_on_pitch == 0

    def test_players_who_did_not_play(self):
        # Expected: player 11 (0 minutes) has no minutes in/out and concedes nothing.
        summaries, _ = summarize_player_events(STANDARD_BOX, [event("Goal", "30", HOME, 2)])

        assert summaries[11].goals_conceded_on_pitch == 0
        assert summaries[11].minute_in is None

    def test_extra_goals_beyond_the_final_score_are_ignored(self):
        # The final score says the home team conceded 1, but the events have 2 goals (e.g. a penalty shoot-out kick).
        # Expected: only the first goal counts and a warning is returned.
        events = [event("Goal", "30", AWAY, 10), event("Penalty", "120+5", AWAY, 10)]

        summaries, warnings = summarize_player_events(STANDARD_BOX, events, expected_conceded = {HOME: 1, AWAY: 0})

        assert summaries[1].goals_conceded_on_pitch == 1
        assert "Team 100: 2 goals against in the events, 1 in the score" in warnings

    def test_substitute_without_substitution_event_is_estimated(self):
        # Substitute 3 played 30 minutes but there is no event. Away goals in the 50th and 80th.
        # Expected: he is estimated to come on in the 60th (90 - 30), so he concedes only the 80th goal, with a warning.
        box = box_score([player(1, 90), player(3, 30, substitute = True)], [player(10, 90)])
        events = [event("Goal", "50", AWAY, 10), event("Goal", "80", AWAY, 10)]

        summaries, warnings = summarize_player_events(box, events)

        assert summaries[3].goals_conceded_on_pitch == 1
        assert any("estimated" in warning for warning in warnings)
