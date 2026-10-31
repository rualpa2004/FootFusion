from clients.base_client import make_request
from config.settings import FOOTBALLDATA_API_KEY, FOOTBALLDATA_BASE_URL

class FootballDataClient:

    def __init__(self):
        self.base_url = FOOTBALLDATA_BASE_URL
        self.headers = {"X-Auth-Token": FOOTBALLDATA_API_KEY}

    def get_teams_by_competition(self, competition_id, season = None):
        url = f"{self.base_url}/competitions/{competition_id}/teams"
        params = {"season": season} if season else None
        return make_request(url, self.headers, params)

    def get_standings(self, competition_code, season, matchday = None):
        # With matchday, the table as it was after that matchday (needed to replay the season).
        url = f"{self.base_url}/competitions/{competition_code}/standings"
        params = {"season": season}
        if matchday is not None:
            params["matchday"] = matchday
        return make_request(url, self.headers, params)

    def get_team_squad(self, team_id):
        url = f"{self.base_url}/teams/{team_id}"
        return make_request(url, self.headers)
