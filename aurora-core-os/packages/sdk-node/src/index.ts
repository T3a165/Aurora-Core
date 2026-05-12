// Aurora Core OS — TypeScript SDK
// Works in Node 18+ and modern browsers (uses fetch + WebSocket).

export type Mode = "energy_guardian" | "health_sentinel" | "habitat_optimizer";
export type Domain = "ENERGY" | "BIOMETRIC" | "ENVIRONMENT";

export interface AuroraOptions { baseUrl: string; apiKey: string; }
export interface EventInput { domain: Domain; kind: string; value: number; payload?: any; }

export class AuroraClient {
  constructor(private opts: AuroraOptions) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${this.opts.apiKey}`,
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Aurora ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  sendEvent(ev: EventInput | EventInput[]) {
    return this.request<{ accepted: number }>("/v1/events", { method: "POST", body: JSON.stringify(ev) });
  }
  getState()    { return this.request<{ state: any }>("/v1/state"); }
  getInsights() { return this.request<{ current: any; history: any[] }>("/v1/insights"); }
  getDevices()  { return this.request<{ devices: any[] }>("/v1/devices"); }
  command(deviceId: string, command: string, args?: any, reason?: string) {
    return this.request("/v1/devices/" + deviceId + "/command", { method: "POST", body: JSON.stringify({ command, args, reason }) });
  }
  getModes()    { return this.request<{ active: Mode; available: any[] }>("/v1/config/modes"); }
  setMode(mode: Mode) { return this.request<{ mode: Mode }>("/v1/config/mode", { method: "POST", body: JSON.stringify({ mode }) }); }

  /** Subscribe to realtime events. Returns an unsubscribe function. */
  subscribe(cb: (msg: any) => void): () => void {
    const url = this.opts.baseUrl.replace(/^http/, "ws") + `/v1/stream?api_key=${this.opts.apiKey}`;
    const ws  = new (globalThis as any).WebSocket(url);
    ws.onmessage = (ev: MessageEvent) => { try { cb(JSON.parse(ev.data)); } catch {} };
    return () => ws.close();
  }
}

export default AuroraClient;
