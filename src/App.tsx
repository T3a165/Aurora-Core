import { useState } from 'react'
import { Route, Switch } from 'wouter'
import { AnimatePresence } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider, useAuth } from './lib/auth'
import { ToastProvider } from './lib/toast'
import { Layout } from './components/Layout'
import { BootSplash } from './components/BootSplash'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard }       from './pages/Dashboard'
import { CognitiveLayers } from './pages/CognitiveLayers'
import { AgentPanel }      from './pages/AgentPanel'
import { CircuitMonitor }  from './pages/CircuitMonitor'
import { BatteryPanel }    from './pages/BatteryPanel'
import { Simulation }      from './pages/Simulation'
import { TurnBotPanel }    from './pages/TurnBotPanel'
import { AIChat }          from './pages/AIChat'
import { Alerts }          from './pages/Alerts'
import { Integrations }    from './pages/Integrations'
import { Manifesto }       from './pages/Manifesto'
import { Legacy }          from './pages/Legacy'
import { Settings }        from './pages/Settings'
import { ArchangelPanel }  from './pages/ArchangelPanel'
import { PillarsPanel }    from './pages/PillarsPanel'
import SovereignEngine     from './components/SovereignEngine'
import { JarvisPanel }     from './pages/JarvisPanel'
import JarvisOrb from './components/JarvisOrb'

function AppInner() {
  const { user } = useAuth()
  const [booted, setBooted] = useState(false)

  if (!booted) return <BootSplash onDone={() => setBooted(true)} />
  if (!user)   return <AuthScreen />

  return (
    <Layout>
      <Switch>
        <Route path="/"             component={Dashboard}       />
        <Route path="/layers"       component={CognitiveLayers} />
        <Route path="/agents"       component={AgentPanel}      />
        <Route path="/circuits"     component={CircuitMonitor}  />
        <Route path="/battery"      component={BatteryPanel}    />
        <Route path="/simulation"   component={Simulation}      />
        <Route path="/turnbot"      component={TurnBotPanel}    />
        <Route path="/chat"         component={AIChat}          />
        <Route path="/alerts"       component={Alerts}          />
        <Route path="/integrations" component={Integrations}    />
        <Route path="/archangel"   component={ArchangelPanel}  />
        <Route path="/pillars"     component={PillarsPanel}    />
        <Route path="/sovereign"   component={SovereignEngine} />
        <Route path="/jarvis"      component={JarvisPanel}     />
        <Route path="/manifesto"    component={Manifesto}       />
        <Route path="/legacy"       component={Legacy}          />
        <Route path="/settings"     component={Settings}        />
        <Route>
          <div className="flex items-center justify-center h-full text-[var(--color-muted)] font-display">
            404 · Page not found
          </div>
        </Route>
      </Switch>
        <JarvisOrb /> 
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AnimatePresence>
          <AppInner />
        </AnimatePresence>
        <Analytics />
      </ToastProvider>
    </AuthProvider>
  )
}
