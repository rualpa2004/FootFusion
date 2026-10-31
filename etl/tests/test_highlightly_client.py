import pytest
from clients import highlightly_client
from clients.highlightly_client import HighlightlyClient
from clients.request_budget import DailyLimitReachedError

def test_counts_the_request_before_sending_it(monkeypatch):
    # Expected: the request is registered in the daily budget and then sent to the events endpoint.
    calls = []
    monkeypatch.setattr(highlightly_client, "register_request", lambda limit: calls.append(("register", limit)))
    monkeypatch.setattr(highlightly_client, "make_request", lambda url, headers, params: calls.append(("request", url)) or [])

    HighlightlyClient(daily_limit = 90).get_fixture_events(123)

    assert calls[0] == ("register", 90)
    assert calls[1][0] == "request" and calls[1][1].endswith("/events/123")

def test_does_not_send_the_request_when_the_limit_is_reached(monkeypatch):
    # Expected: DailyLimitReachedError and no HTTP request.
    sent = []
    def limit_reached(limit):
        raise DailyLimitReachedError("limit")
    monkeypatch.setattr(highlightly_client, "register_request", limit_reached)
    monkeypatch.setattr(highlightly_client, "make_request", lambda *args: sent.append(args))

    with pytest.raises(DailyLimitReachedError):
        HighlightlyClient().get_fixture_players(123)
    assert sent == []
