import { Suspense } from "react";
import { aurora } from "@/lib/aurora";
import { LiveStream } from "@/components/LiveStream";
import { ModeSelector } from "@/components/ModeSelector";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const [{ state }, insights, modes] = await Promise.all([
    aurora.getState(),
    aurora.getInsights(),
    aurora.getModes(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl text-teal glow">Aurora Console</h1>
        <div className="flex items-center gap-3 text-xs text-teal/50">
          <span className="w-1.5 h-1.5 rounded-full bg-teal/60 animate-pulse inline-block" />
          {modes.active.replace(/_/g, " ")}
        </div>
      </div>

      <LiveStream
        initialState={state}
        initialScore={insights.current.score}
        initialBreakdown={insights.current.breakdown}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <ModeSelector initial={modes.active} />

        {/* Quick stats */}
        <div className="panel p-5 md:col-span-2">
          <div className="text-xs uppercase tracking-widest text-teal/70 mb-3">Recent Activity</div>
          {insights.history.length === 0 ? (
            <div className="text-teal/40 text-sm">No history yet — send some events to see trend data.</div>
          ) : (
            <div className="space-y-1">
              {insights.history.slice(0, 8).map((h: { id: string; score: number; ts: string }) => (
                <div key={h.id} className="flex items-center gap-3 text-sm border-b border-line/40 py-1">
                  <span className={`text-xs font-bold w-8 text-right ${
                    h.score >= 75 ? "text-teal" : h.score >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>{h.score}</span>
                  <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${h.score}%`,
                        backgroundColor: h.score >= 75 ? "#22f1d3" : h.score >= 50 ? "#f5d76e" : "#ff5f7e",
                      }}
                    />
                  </div>
                  <span className="text-teal/40 text-xs">{new Date(h.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl text-teal glow">Aurora Console</h1>
        <div className="text-xs text-teal/30">offline</div>
      </div>
      <div className="panel p-8 text-center space-y-3">
        <div className="text-3xl">⚡</div>
        <div className="text-teal/60">Aurora API is not reachable.</div>
        <div className="text-teal/40 text-sm max-w-sm mx-auto">
          Make sure the API is running and <code className="text-teal/60">NEXT_PUBLIC_API_URL</code> is set correctly.
        </div>
        <div className="text-xs text-teal/30 font-mono mt-2">
          pnpm dev:api
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  try {
    return (
      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-line rounded" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="panel h-64" />)}
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    );
  } catch {
    return <DashboardError />;
  }
}
