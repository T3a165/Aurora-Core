"""Aurora Core OS — Python SDK."""
from __future__ import annotations
import json
import threading
from typing import Any, Callable, Iterable, Mapping
import requests
import websocket


class AuroraClient:
    def __init__(self, base_url: str, api_key: str, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        })

    def _req(self, method: str, path: str, **kw) -> Any:
        r = self._session.request(method, self.base_url + path, timeout=self.timeout, **kw)
        if not r.ok:
            raise RuntimeError(f"Aurora {r.status_code}: {r.text}")
        return r.json() if r.content else None

    # ---- Public API -------------------------------------------------------
    def send_event(self, event: Mapping[str, Any] | Iterable[Mapping[str, Any]]):
        return self._req("POST", "/v1/events", data=json.dumps(event))

    def get_state(self):    return self._req("GET", "/v1/state")
    def get_insights(self): return self._req("GET", "/v1/insights")
    def get_devices(self):  return self._req("GET", "/v1/devices")
    def get_modes(self):    return self._req("GET", "/v1/config/modes")

    def set_mode(self, mode: str):
        return self._req("POST", "/v1/config/mode", data=json.dumps({"mode": mode}))

    def command(self, device_id: str, command: str, args: Any = None, reason: str | None = None):
        body = {"command": command, "args": args, "reason": reason}
        return self._req("POST", f"/v1/devices/{device_id}/command", data=json.dumps(body))

    # ---- Realtime ---------------------------------------------------------
    def subscribe(self, on_message: Callable[[dict], None]) -> Callable[[], None]:
        url = self.base_url.replace("http", "ws") + f"/v1/stream?api_key={self.api_key}"
        ws = websocket.WebSocketApp(
            url,
            on_message=lambda _w, raw: on_message(json.loads(raw)),
        )
        t = threading.Thread(target=ws.run_forever, daemon=True)
        t.start()
        return ws.close
