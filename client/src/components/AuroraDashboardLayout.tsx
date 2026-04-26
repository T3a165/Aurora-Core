import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Battery,
  BrainCircuit,
  Cpu,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeft,
  Radio,
  Settings,
  Sliders,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Layers, label: "Cognitive Layers", path: "/layers" },
  { icon: BrainCircuit, label: "AI Agents", path: "/agents" },
  { icon: Zap, label: "Circuit Monitor", path: "/circuits" },
  { icon: Battery, label: "Battery", path: "/battery" },
  { icon: Cpu, label: "Simulation", path: "/simulation" },
  { icon: Radio, label: "TurnBot Devices", path: "/turnbot" },
  { icon: MessageSquare, label: "AI Chat", path: "/chat" },
  { icon: TriangleAlert, label: "Alerts", path: "/alerts" },
];

const SIDEBAR_WIDTH_KEY = "aurora-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

export default function AuroraDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {/* Particle background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-500/20 float-particle"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                "--dur": `${Math.random() * 6 + 6}s`,
                animationDelay: `${Math.random() * 4}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8 p-10 max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center aurora-glow-purple">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 orb-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold neon-text-purple tracking-tight">Aurora Core</h1>
              <p className="text-sm text-muted-foreground mt-1">Cognitive-Energy Ecosystem</p>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="text-center space-y-2">
            <p className="text-foreground/80 text-sm">
              Access to this dashboard requires authentication.
            </p>
            <p className="text-muted-foreground text-xs">
              Seven-layer AI platform — Beta Testing
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white aurora-glow-purple transition-all"
          >
            Sign In to Aurora Core
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <AuroraLayoutContent setSidebarWidth={setSidebarWidth}>{children}</AuroraLayoutContent>
    </SidebarProvider>
  );
}

function AuroraLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const isAdmin = user?.role === "admin";

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border/30">
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 orb-pulse shrink-0" />
                  <span className="font-bold tracking-tight neon-text-purple text-sm truncate">
                    Aurora Core
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2">
              {menuItems.map((item) => {
                const isActive = location === item.path || (item.path === "/dashboard" && location === "/");
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-9 transition-all font-normal ${isActive ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "hover:bg-accent/50"}`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-purple-400" : "text-muted-foreground"}`} />
                      <span className={isActive ? "text-purple-200" : ""}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border border-purple-500/40 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-purple-900/50 text-purple-200">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-none text-foreground">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {isAdmin ? "⬡ Admin" : "⬡ User"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background">
        {/* Mobile header */}
        <div className="flex md:hidden border-b border-border/30 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg" />
            <span className="font-bold neon-text-purple text-sm">Aurora Core</span>
          </div>
        </div>
        <main className="flex-1 p-4 relative">{children}</main>
      </SidebarInset>
    </>
  );
}
