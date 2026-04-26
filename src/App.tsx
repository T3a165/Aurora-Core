import { Route, Switch } from 'wouter'
import { Layout } from './components/Layout'
import { Dashboard }       from './pages/Dashboard'
import { CognitiveLayers } from './pages/CognitiveLayers'
import { AgentPanel }      from './pages/AgentPanel'
import { CircuitMonitor }  from './pages/CircuitMonitor'
import { BatteryPanel }    from './pages/BatteryPanel'
import { Simulation }      from './pages/Simulation'
import { TurnBotPanel }    from './pages/TurnBotPanel'
import { AIChat }          from './pages/AIChat'
import { Alerts }          from './pages/Alerts'

export default function App() {
  return (
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
        <Route>
          <div className="flex items-center justify-center h-full text-[var(--color-muted)] font-display">
            404 · Page not found
          </div>
        </Route>
      </Switch>
    </Layout>
  )
}
