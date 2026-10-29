import json
import pytest
from clients import request_budget
from clients.request_budget import (
    DailyLimitReachedError,
    register_request,
    remaining_requests,
    requests_made_today
)

@pytest.fixture
def budget_file(tmp_path, monkeypatch):
    # Each test uses its own counter file and a fixed day.
    monkeypatch.setattr(request_budget, "_today", lambda: "2026-10-27")
    return str(tmp_path / "request_budget.json")

def test_starts_at_zero_without_file(budget_file):
    # Expected: no requests made and the whole limit available.
    assert requests_made_today(budget_file) == 0
    assert remaining_requests(90, budget_file) == 90

def test_counts_each_request(budget_file):
    # Expected: the counter goes up by one with each request and is saved in the file.
    register_request(90, budget_file)
    register_request(90, budget_file)

    assert requests_made_today(budget_file) == 2
    with open(budget_file, encoding = "utf-8") as f:
        assert json.load(f) == {"date": "2026-10-27", "count": 2}

def test_refuses_the_request_over_the_limit(budget_file):
    # Expected: with 3 requests made and a limit of 3, the next one raises an error and is not counted.
    for _ in range(3):
        register_request(3, budget_file)

    with pytest.raises(DailyLimitReachedError):
        register_request(3, budget_file)
    assert requests_made_today(budget_file) == 3
    assert remaining_requests(3, budget_file) == 0

def test_restarts_the_count_on_a_new_day(budget_file, monkeypatch):
    # Expected: the requests of a previous day do not count today.
    register_request(90, budget_file)
    monkeypatch.setattr(request_budget, "_today", lambda: "2026-10-28")

    assert requests_made_today(budget_file) == 0
    assert register_request(90, budget_file) == 1
