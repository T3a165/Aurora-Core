import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Cpu, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  "What is the current system status?",
  "Explain the Peak Shave scenario",
  "How can I optimize energy usage tonight?",
  "What are the TurnBot device capabilities?",
  "Summarize recent agent activity",
  "Generate an energy optimization report",
];

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<{ role: "user" | "assistant"; content: string; ts: number }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: history } = trpc.chat.history.useQuery();
  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setIsTyping(false);
      setLocalMessages(prev => [...prev, { role: "assistant", content: data.response, ts: Date.now() }]);
    },
    onError: () => {
      setIsTyping(false);
      toast.error("Failed to get response");
    },
  });

  // Sync DB history to local on first load
  useEffect(() => {
    if (history && history.length > 0 && localMessages.length === 0) {
      setLocalMessages(history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        ts: new Date(m.createdAt).getTime(),
      })));
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    setLocalMessages(prev => [...prev, { role: "user", content: msg, ts: Date.now() }]);
    setIsTyping(true);
    sendMutation.mutate({ message: msg });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <AuroraDashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-3">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">Aurora AI Chat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Natural language interface to Aurora Core</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-purple-500/30 bg-purple-500/10">
              <Cpu className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-purple-400 font-mono">AURORA CORE AI</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => { setLocalMessages([]); toast.success("Chat cleared"); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-border/40 bg-card p-4 space-y-4 min-h-0">
          {localMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 orb-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold neon-text-purple">Aurora Core AI</h3>
                <p className="text-sm text-muted-foreground mt-1">Ask me about system status, energy optimization, or predictive scenarios</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    className="text-left text-xs p-2.5 rounded-lg border border-border/30 bg-background/50 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {localMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-purple-500/20 border border-purple-500/40" : "bg-cyan-500/20 border border-cyan-500/40"}`}>
                {msg.role === "user" ? (
                  <span className="text-xs text-purple-400">U</span>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400" />
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.role === "user" ? "bg-purple-500/20 border border-purple-500/30 text-foreground" : "bg-card border border-border/40 text-foreground"}`}>
                {msg.role === "assistant" ? (
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 orb-pulse" />
              </div>
              <div className="bg-card border border-border/40 rounded-xl px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    style={{ animation: `status-blink 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 rounded-xl border border-border/40 bg-card p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aurora Core anything... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="bg-purple-600 hover:bg-purple-500 text-white self-end aurora-glow-purple"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
            <span className="text-xs text-muted-foreground">Quick:</span>
            {QUICK_PROMPTS.slice(0, 3).map(p => (
              <button
                key={p}
                onClick={() => handleQuickPrompt(p)}
                className="text-xs px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-purple-500/40 transition-all truncate max-w-32"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
