import { useState } from 'react'
import { Route, Switch } from 'wouter'
import { AnimatePresence } from 'framer-motion'
import { Layout } from './components/Layout'
import { BootSplash } from './components/BootSplash'
import { ToastProvider } from './lib/toast'
import { Dashboard }       from './pages/Dashboard'
import { CognitiveLayers } from './pages/CognitiveLayers'
import { AgentPanel }      from './pages/AgentPanel'
import { CircuitMonitor }  from './pages/CircuitMonitor'
import { BatteryPanel }    from './pages/BatteryPanel'
import { Simulation }      from './pages/Simulation'
import { TurnBotPanel }    from './pages/TurnBotPanel'
import { AIChat }          from './pages/AIChat'
import { Alerts }          from './pages/Alerts'
import { Legacy }          from './pages/Legacy'

export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <ToastProvider>
      <AnimatePresence>
        {!booted && <BootSplash key="boot" onDone={() => setBooted(true)} />}
      </AnimatePresence>

      {booted && (
        <Layout>
          <Switch>
            <Route path="/"           component={Dashboard}       />
            <Route path="/layers"     component={CognitiveLayers} />
            <Route path="/agents"     component={AgentPanel}      />
            <Route path="/circuits"   component={CircuitMonitor}  />
            <Route path="/battery"    component={BatteryPanel}    />
            <Route path="/simulation" component={Simulation}      />
            <Route path="/turnbot"    component={TurnBotPanel}    />
            <Route path="/chat"       component={AIChat}          />
            <Route path="/alerts"     component={Alerts}          />
            <Route path="/legacy"     component={Legacy}          />
            <Route>
              <div className="flex items-center justify-center h-full text-[var(--color-muted)] font-display">
                404 · Page not found
              </div>
            </Route>
          </Switch>
        </Layout>
      )}
    </ToastProvider>
  )
}
