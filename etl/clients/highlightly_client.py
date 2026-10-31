from config.settings import HIGHLIGHTLY_API_KEY, HIGHLIGHTLY_BASE_URL, HIGHLIGHTLY_DAILY_LIMIT
from clients.base_client import make_request
from clients.request_budget import register_request

class HighlightlyClient:

    def __init__(self, daily_limit = HIGHLIGHTLY_DAILY_LIMIT):
        self.base_url = HIGHLIGHTLY_BASE_URL
        self.headers = {"x-rapidapi-key": HIGHLIGHTLY_API_KEY}
        self.daily_limit = daily_limit

    def _get(self, url, params = None):
        # Every request is counted before being sent: a failed request also uses the daily quota.
        # Raises DailyLimitReachedError when the daily limit is reached.
        register_request(self.daily_limit)
        return make_request(url, self.headers, params)

    ## FUNCTIONS TO CREATE THE URL AND PARAMS FOR THE REQUESTS

    def get_all_leagues(self, season = None, country_name = None, limit = 100, offset = 0):
        url = f"{self.base_url}/leagues"
        params = {"limit": limit, "offset": offset}
        if season:
            params["season"] = season
        if country_name:
            params["country_name"] = country_name
        return self._get(url, params)

    def get_league_by_id(self, league_id):
        url = f"{self.base_url}/leagues/{league_id}"
        return self._get(url)

    def get_teams_by_league(self, league_id, season):
        url = f"{self.base_url}/standings"
        params = {"leagueId": league_id, "season": season}
        return self._get(url, params)

    def get_fixtures(self, league_id, season, round_name = None, limit = 100, offset = 0):
        url = f"{self.base_url}/matches"
        params = {"leagueId": league_id, "season": season, "limit": limit, "offset": offset}
        response = self._get(url, params)

        if round_name and isinstance(response, dict) and "data" in response:
            response["data"] = [
                match for match in response["data"]
                if match.get("round") == round_name
            ]
        return response

    def get_fixture_players(self, fixture_id):
        url = f"{self.base_url}/box-score/{fixture_id}"
        return self._get(url)

    def get_fixture_events(self, fixture_id):
        url = f"{self.base_url}/events/{fixture_id}"
        return self._get(url)

    def get_fixture_statistics(self, fixture_id):
        url = f"{self.base_url}/statistics/{fixture_id}"
        return self._get(url)

    def get_fixture_lineups(self, fixture_id):
        url = f"{self.base_url}/lineups/{fixture_id}"
        return self._get(url)

    def get_match_by_id(self, fixture_id):
        url = f"{self.base_url}/matches/{fixture_id}"
        return self._get(url)

    def get_player_by_id(self, player_id):
        url = f"{self.base_url}/players/{player_id}"
        return self._get(url)

    def get_player_statistics(self, player_id):
        url = f"{self.base_url}/players/{player_id}/statistics"
        return self._get(url)
