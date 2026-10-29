import json
import os
from datetime import datetime, timezone

# Counts the requests made to Highlightly each day, so the ETL never goes over the free daily limit.
# The count is stored in a file (not in memory) so it survives between script executions on the same day.
# Days are counted in UTC.

BUDGET_FILE = os.path.join("cache", "request_budget.json")

class DailyLimitReachedError(Exception):
    """Raised when making one more request would exceed the daily limit."""

def _today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _read(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding = "utf-8") as f:
        return json.load(f)

def requests_made_today(path = BUDGET_FILE):
    data = _read(path)
    return data.get("count", 0) if data.get("date") == _today() else 0

def register_request(daily_limit, path = BUDGET_FILE):
    """Counts one request. Raises DailyLimitReachedError (without counting it) if the limit is already reached."""
    made = requests_made_today(path)
    if made >= daily_limit:
        raise DailyLimitReachedError(f"Daily limit of {daily_limit} Highlightly requests reached")

    os.makedirs(os.path.dirname(path), exist_ok = True)
    with open(path, "w", encoding = "utf-8") as f:
        json.dump({"date": _today(), "count": made + 1}, f)
    return made + 1

def remaining_requests(daily_limit, path = BUDGET_FILE):
    return max(0, daily_limit - requests_made_today(path))
