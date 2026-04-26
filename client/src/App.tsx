import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CognitiveLayers from "./pages/CognitiveLayers";
import AgentPanel from "./pages/AgentPanel";
import CircuitMonitor from "./pages/CircuitMonitor";
import BatteryPanel from "./pages/BatteryPanel";
import Simulation from "./pages/Simulation";
import TurnBotPanel from "./pages/TurnBotPanel";
import AIChatPage from "./pages/AIChatPage";
import AlertsPage from "./pages/AlertsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/layers" component={CognitiveLayers} />
      <Route path="/agents" component={AgentPanel} />
      <Route path="/circuits" component={CircuitMonitor} />
      <Route path="/battery" component={BatteryPanel} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/turnbot" component={TurnBotPanel} />
      <Route path="/chat" component={AIChatPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
