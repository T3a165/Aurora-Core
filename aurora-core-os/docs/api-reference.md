# API Reference (v1)

All endpoints require `Authorization: Bearer <api-key>`.

## Errors

```json
{ "error": { "code": "rate_limited", "message": "Too many requests" } }
```

| HTTP | Code              | When                                       |
|------|-------------------|--------------------------------------------|
| 401  | `missing_key`     | No `Authorization` header                  |
| 401  | `invalid_key`     | Unknown / revoked key                      |
| 422  | `invalid_payload` | Zod validation failed                      |
| 429  | `rate_limited`    | More than `RATE_LIMIT_PER_MIN` per minute  |
| 500  | `internal`        | Unhandled                                  |

## `POST /v1/events`

Body: object or array of objects.

```json
{ "domain": "ENERGY", "kind": "solar_w", "value": 1240 }
```

Response `202`:
```json
{ "accepted": 1, "results": [{ "score": 87 }] }
```

## `GET /v1/state`

```json
{ "installationId": "clx...", "state": { "energy": {...}, "bio": {...}, "env": {...}, "updatedAt": 1730000000000 } }
```

## `GET /v1/insights`

```json
{
  "current": { "score": 87, "breakdown": {...}, "signals": [...], "actions": [...] },
  "history": [ { "score": 86, "ts": "..." }, ... ]
}
```

## `GET /v1/devices` · `POST /v1/devices/:id/command`

```bash
curl -X POST .../v1/devices/dev_123/command \
  -d '{"command":"dim","args":{"level":30},"reason":"manual"}'
```

## `GET /v1/config/modes` · `POST /v1/config/mode`

```bash
curl -X POST .../v1/config/mode -d '{"mode":"energy_guardian"}'
```

## Realtime — `WS /v1/stream?api_key=<key>`

Server → client messages:

```json
{ "type": "hello",  "installationId": "clx..." }
{ "type": "state",  "state":  { ... } }
{ "type": "score",  "score": 84, "breakdown": {...}, "signals": [...] }
{ "type": "action", "action": { "id":"...", "command":"...", "args":{...} } }
{ "type": "mode",   "mode":   "energy_guardian" }
```
