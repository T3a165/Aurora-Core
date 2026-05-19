import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
  mode?: 'voice' | 'text';
}

// ─── Constants ───────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'Status report.',
  "Optimize tonight's energy.",
  'Any anomalies?',
  "What's my biggest load right now?",
  'Resolve the agent conflict.',
  'Should I charge now or wait?',
  'Is the CO₂ level dangerous?',
  'Run a peak-shave simulation.',
];

const GREETINGS = [
  "Good to see you, sir. One agent conflict, a CO₂ reading above threshold, and a battery discharge rate I'd rather not ignore. Shall we address all three, or would you prefer to start with the one most likely to ruin your evening?",
  "All systems operational — with notable exceptions. Three active alerts. Battery at 74% and dropping faster than forecast. I have recommendations, whenever you're ready.",
  "You're drawing 5.75 kW from the grid during peak pricing, sir. Either you'd like to discuss that, or you enjoy donating money to the utility company. Both are valid.",
  "Solar is underperforming by roughly 18% versus forecast. Could be soiling, could be shading, could be the universe expressing its opinion. I've narrowed it down.",
];

const STATUS_ITEMS = [
  { label: 'Battery', value: '74% · 6.2h', color: 'var(--color-green)', icon: '⚡' },
  { label: 'Solar', value: '3.42 kW', color: 'var(--color-cyan)', icon: '☀️' },
  { label: 'Load', value: '9.17 kW', color: 'var(--color-amber)', icon: '📊' },
  { label: 'Grid', value: '+5.75 kW', color: 'var(--color-red)', icon: '🔌' },
  { label: 'CO₂', value: '612 ppm ⚠', color: 'var(--color-amber)', icon: '💨' },
  { label: 'HRV', value: 'LOW stress', color: 'var(--color-green)', icon: '❤️' },
  { label: 'Agents', value: '4 · 1 conflict', color: 'var(--color-purple)', icon: '🤖' },
  { label: 'TurnBots', value: '2 online', color: 'var(--color-cyan)', icon: '🔧' },
];

// ─── Arc Reactor SVG ─────────────────────────────────────────────────────────
function ArcReactor({ size = 28, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none"
      style={{ animation: pulse ? 'jv-spin 12s linear infinite' : undefined }}>
      <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="0.6" opacity="0.18" />
      <circle cx="14" cy="14" r="9" stroke="white" strokeWidth="1" opacity="0.4" />
      <circle cx="14" cy="14" r="5.5" stroke="white" strokeWidth="1.4" opacity="0.65" />
      <circle cx="14" cy="14" r="3" fill="white" opacity="0.9" />
      {[0,60,120,180,240,300].map(deg => {
        const r = (deg * Math.PI) / 180;
        return <line key={deg}
          x1={14 + 6 * Math.cos(r)} y1={14 + 6 * Math.sin(r)}
          x2={14 + 8.5 * Math.cos(r)} y2={14 + 8.5 * Math.sin(r)}
          stroke="white" strokeWidth="1.2" opacity="0.45" />;
      })}
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0,150,300].map(d => (
        <div key={d} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-cyan)',
          animation: `jv-bounce 1s ease-in-out ${d}ms infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Audio Recorder Hook ─────────────────────────────────────────────────────
function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mediaRecorderRef.current = mr;
    mr.start(100);
  };

  const stop = (): Promise<Blob> => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current;
      if (!mr) { resolve(new Blob()); return; }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        streamRef.current?.getTracks().forEach(t => t.stop());
        resolve(blob);
      };
      mr.stop();
    });
  };

  return { start, stop };
}

// ─── Voice Waveform Visualizer ────────────────────────────────────────────────
function VoiceWave() {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 20 }}>
      {[1,2,3,4,3,2,1,3,4,2].map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: 'var(--color-cyan)',
          height: h * 4,
          animation: `jv-wave 0.8s ease-in-out ${i * 80}ms infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JarvisOrb() {
  const [open, setOpen]               = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [recording, setRecording]     = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceOut, setVoiceOut]       = useState(false);
  const [showStatus, setShowStatus]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [orbPhase, setOrbPhase]       = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const { start: startRec, stop: stopRec } = useAudioRecorder();

  // Orb pulse
  useEffect(() => {
    const id = setInterval(() => setOrbPhase(p => (p + 1) % 4), 1200);
    return () => clearInterval(id);
  }, []);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setMessages([{ role: 'assistant', content: g, ts: new Date() }]);
      if (voiceOut) speakText(g);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find(v => v.name === 'Daniel')
           || voices.find(v => v.lang === 'en-GB')
           || voices.find(v => v.lang.startsWith('en'))
           || null;
    u.rate = 0.9;
    u.pitch = 0.75;
    u.volume = 0.92;
    window.speechSynthesis.speak(u);
  }

  // ── Send to /api/chat ─────────────────────────────────────────────────────
  const sendToJarvis = useCallback(async (text: string, mode: 'text' | 'voice' = 'text') => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = { role: 'user', content: text.trim(), ts: new Date(), mode };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      // chat.ts may stream or return a full message — handle both
      const contentType = res.headers.get('content-type') ?? '';

      let reply = '';
      if (contentType.includes('text/event-stream')) {
        // Streaming SSE
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
            for (const line of lines) {
              const json = line.slice(5).trim();
              if (json === '[DONE]') break;
              try {
                const parsed = JSON.parse(json);
                const delta = parsed.delta?.text ?? parsed.choices?.[0]?.delta?.content ?? '';
                reply += delta;
                // Live-update the last message
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: reply };
                  } else {
                    updated.push({ role: 'assistant', content: reply, ts: new Date() });
                  }
                  return updated;
                });
              } catch {}
            }
          }
        }
      } else {
        // Non-streaming JSON (Anthropic messages format)
        const data = await res.json();
        reply = (data.content as { type: string; text?: string }[])
          ?.find(b => b.type === 'text')?.text
          ?? data.response
          ?? data.message
          ?? "I seem to have lost my train of thought. Most unlike me, sir.";
        setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: new Date() }]);
      }

      if (voiceOut && reply) speakText(reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const display = msg.includes('401') || msg.includes('API_KEY')
        ? "API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables, sir."
        : `Intelligence layer unreachable: ${msg}`;
      setError(display);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "My connection to the intelligence layer has been interrupted, sir. " + display,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, voiceOut]);

  // ── Voice Input via Whisper ───────────────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setTranscribing(true);
      try {
        const blob = await stopRec();
        const fd = new FormData();
        fd.append('audio', blob, 'voice.webm');

        const res = await fetch('/api/Jarvis', {
          method: 'POST',
          body: fd,
        });

        if (!res.ok) throw new Error(`Transcription failed: HTTP ${res.status}`);
        const data = await res.json() as { text?: string; transcript?: string; userText?: string };
        const transcript = data.text ?? data.transcript ?? data.userText ?? '';
        if (transcript.trim()) {
          await sendToJarvis(transcript, 'voice');
        } else {
          setError("Didn't catch that, sir. Could you repeat?");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Transcription error');
      } finally {
        setTranscribing(false);
      }
    } else {
      try {
        await startRec();
        setRecording(true);
      } catch {
        setError("Microphone access denied. Check browser permissions, sir.");
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    window.speechSynthesis?.cancel();
  };

  const panelW = expanded ? 'min(580px, 95vw)' : 'min(420px, calc(100vw - 2rem))';
  const panelH = expanded ? 'min(720px, 90vh)' : 'min(560px, 80vh)';
  const orbGlow = [
    '0 0 16px oklch(0.75 0.18 196 / 0.5), 0 0 40px oklch(0.75 0.18 196 / 0.18)',
    '0 0 22px oklch(0.75 0.18 196 / 0.7), 0 0 55px oklch(0.75 0.18 196 / 0.28)',
    '0 0 28px oklch(0.75 0.18 196 / 0.9), 0 0 70px oklch(0.75 0.18 196 / 0.38)',
    '0 0 22px oklch(0.75 0.18 196 / 0.7), 0 0 55px oklch(0.75 0.18 196 / 0.28)',
  ][orbPhase];

  return (
    <>
      <style>{`
        @keyframes jv-spin    { to { transform: rotate(360deg); } }
        @keyframes jv-bounce  { 0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1.2);opacity:1} }
        @keyframes jv-wave    { from{transform:scaleY(0.5)}to{transform:scaleY(1.5)} }
        @keyframes jv-up      { from{opacity:0;transform:translateY(16px)scale(.97)}to{opacity:1;transform:none} }
        @keyframes jv-notif   { from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none} }
        @keyframes jv-rec-ring { 0%,100%{box-shadow:0 0 0 0 oklch(0.55 0.22 27 / 0.6)} 50%{box-shadow:0 0 0 8px oklch(0.55 0.22 27 / 0)} }
        .jv-user-bubble  { background:oklch(0.82 0.16 196 / 0.09); border:1px solid oklch(0.82 0.16 196 / 0.22); border-radius:12px 12px 3px 12px; }
        .jv-ai-bubble    { background:oklch(0.17 0.03 196 / 0.85); border:1px solid oklch(0.82 0.16 196 / 0.11); border-radius:3px 12px 12px 12px; }
        .jv-quick:hover  { background:oklch(0.82 0.16 196 / 0.1)!important; border-color:oklch(0.82 0.16 196 / 0.45)!important; color:var(--color-cyan)!important; }
        .jv-ctrl:hover   { background:oklch(0.82 0.16 196 / 0.1)!important; color:var(--color-text)!important; }
        .jv-input:focus  { border-color:oklch(0.82 0.16 196 / 0.45)!important; outline:none; }
        .jv-send-btn:hover:not(:disabled) { filter: brightness(1.15); }
      `}</style>

      {/* ── Notification bubble ── */}
      {!open && !notifDismissed && (
        <div onClick={() => setOpen(true)} style={{
          position:'fixed', bottom:'5.8rem', right:'1.25rem', zIndex:49,
          maxWidth:265, background:'oklch(0.11 0.025 196 / 0.96)',
          border:'1px solid oklch(0.82 0.16 196 / 0.28)', borderRadius:10,
          padding:'9px 12px', backdropFilter:'blur(18px)',
          boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'jv-notif 0.35s ease',
          cursor:'pointer',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:'monospace', fontSize:9, color:'var(--color-cyan)', letterSpacing:'0.14em', marginBottom:3, textTransform:'uppercase' }}>
                J.A.R.V.I.S. · AURORA CORE
              </div>
              <div style={{ fontSize:11, color:'var(--color-text)', lineHeight:1.45 }}>
                3 alerts active. Agent conflict at 18:00 unresolved. Battery discharge elevated.
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setNotifDismissed(true); }}
              style={{ background:'none', border:'none', color:'var(--color-muted)', cursor:'pointer', fontSize:16, lineHeight:1, marginTop:1 }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Orb button ── */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:50,
          width:52, height:52, borderRadius:'50%',
          border:`1.5px solid oklch(0.82 0.16 196 / ${open ? '0.6' : '0.35'})`,
          background:'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.32 0.22 196))',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: orbGlow,
          transition:'box-shadow 0.8s ease, transform 0.1s',
          outline:'none',
        }}>
        <ArcReactor size={28} pulse={open} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position:'fixed', bottom:'5.2rem', right:'1.5rem', zIndex:50,
          width:panelW, height:panelH,
          display:'flex', flexDirection:'column',
          borderRadius:16, overflow:'hidden',
          background:'oklch(0.095 0.022 196 / 0.97)',
          border:'1px solid oklch(0.82 0.16 196 / 0.18)',
          backdropFilter:'blur(28px) saturate(1.4)',
          boxShadow:'0 0 80px oklch(0.75 0.18 196 / 0.1), 0 32px 80px rgba(0,0,0,0.65)',
          animation:'jv-up 0.22s ease',
          transition:'width 0.25s ease, height 0.25s ease',
        }}>

          {/* Header */}
          <div style={{
            padding:'11px 14px', flexShrink:0,
            borderBottom:'1px solid oklch(0.82 0.16 196 / 0.13)',
            background:'oklch(0.12 0.028 196 / 0.7)',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <div style={{
              width:32, height:32, borderRadius:8, flexShrink:0,
              background:'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.32 0.22 196))',
              border:'1px solid oklch(0.82 0.16 196 / 0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ArcReactor size={20} pulse />
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--color-cyan)', letterSpacing:'0.16em', textTransform:'uppercase', lineHeight:1.2 }}>
                J.A.R.V.I.S.
              </div>
              <div style={{ fontFamily:'monospace', fontSize:8.5, color:'var(--color-muted)', letterSpacing:'0.1em' }}>
                JUST A RATHER VERY INTELLIGENT SYSTEM · AURORA CORE
              </div>
            </div>

            {/* Controls */}
            {[
              { title:'System status', icon:'⚡', active:showStatus, onClick:()=>setShowStatus(s=>!s) },
              { title:voiceOut?'Mute JARVIS':'Enable voice output', icon:voiceOut?'🔊':'🔇', active:voiceOut, onClick:()=>{ setVoiceOut(v=>!v); if(voiceOut) window.speechSynthesis?.cancel(); } },
              { title:expanded?'Compact':'Expand', icon:expanded?'⊟':'⊞', active:false, onClick:()=>setExpanded(e=>!e) },
              { title:'Clear conversation', icon:'↺', active:false, onClick:clearChat },
              { title:'Close', icon:'×', active:false, onClick:()=>setOpen(false) },
            ].map(c => (
              <button key={c.title} className="jv-ctrl" onClick={c.onClick} title={c.title}
                style={{
                  width:28, height:28, borderRadius:6,
                  background: c.active ? 'oklch(0.82 0.16 196 / 0.13)' : 'transparent',
                  border:`1px solid ${c.active ? 'oklch(0.82 0.16 196 / 0.38)' : 'oklch(0.82 0.16 196 / 0.13)'}`,
                  color: c.active ? 'var(--color-cyan)' : 'var(--color-muted)',
                  cursor:'pointer', fontSize:c.icon==='×'?16:12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.15s', flexShrink:0,
                }}>
                {c.icon}
              </button>
            ))}
          </div>

          {/* Status Bar */}
          {showStatus && (
            <div style={{
              padding:'7px 12px', flexShrink:0,
              borderBottom:'1px solid oklch(0.82 0.16 196 / 0.1)',
              background:'oklch(0.11 0.025 196 / 0.6)',
              display:'flex', flexWrap:'wrap', gap:5,
            }}>
              {STATUS_ITEMS.map(s => (
                <div key={s.label} style={{
                  display:'flex', alignItems:'center', gap:4,
                  background:'oklch(0.14 0.028 196 / 0.7)',
                  border:'1px solid oklch(0.82 0.16 196 / 0.1)',
                  borderRadius:5, padding:'3px 7px',
                }}>
                  <span style={{ fontSize:9 }}>{s.icon}</span>
                  <span style={{ fontFamily:'monospace', fontSize:8.5, color:'var(--color-muted)' }}>{s.label}:</span>
                  <span style={{ fontFamily:'monospace', fontSize:8.5, color:s.color, fontWeight:700 }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex:1, overflowY:'auto', padding:'14px 14px 6px',
            display:'flex', flexDirection:'column', gap:11,
          }}>
            {messages.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, opacity:0.5 }}>
                <ArcReactor size={44} pulse />
                <div style={{ fontFamily:'monospace', fontSize:9, color:'var(--color-muted)', letterSpacing:'0.12em' }}>AWAITING INPUT</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', gap:8, alignItems:'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width:26, height:26, borderRadius:7, flexShrink:0, marginTop:1,
                    background:'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.32 0.22 196))',
                    border:'1px solid oklch(0.82 0.16 196 / 0.28)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <ArcReactor size={15} />
                  </div>
                )}
                <div className={msg.role==='user'?'jv-user-bubble':'jv-ai-bubble'}
                  style={{
                    maxWidth:'79%', padding:'9px 13px',
                    fontSize:12.5, lineHeight:1.58,
                    color: msg.role==='user' ? 'var(--color-text)' : 'oklch(0.9 0.04 196)',
                    fontFamily: msg.role==='assistant' ? "'Courier New', monospace" : 'inherit',
                  }}>
                  {msg.mode === 'voice' && msg.role === 'user' && (
                    <span style={{ fontSize:9, color:'var(--color-cyan)', fontFamily:'monospace', marginRight:5, opacity:0.7 }}>🎙</span>
                  )}
                  {msg.content}
                  <div style={{ fontSize:8, color:'var(--color-muted)', marginTop:5, opacity:0.55 }}>
                    {msg.ts.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width:26, height:26, borderRadius:7, flexShrink:0, marginTop:1,
                    background:'oklch(0.82 0.16 196 / 0.1)',
                    border:'1px solid oklch(0.82 0.16 196 / 0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'monospace', fontSize:9, color:'var(--color-cyan)',
                  }}>
                    GM
                  </div>
                )}
              </div>
            ))}

            {/* Loading / transcribing */}
            {(loading || transcribing) && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <div style={{
                  width:26, height:26, borderRadius:7, flexShrink:0,
                  background:'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.32 0.22 196))',
                  border:'1px solid oklch(0.82 0.16 196 / 0.28)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <ArcReactor size={15} />
                </div>
                <div className="jv-ai-bubble">
                  {transcribing
                    ? <div style={{ padding:'9px 13px', fontFamily:'monospace', fontSize:10, color:'var(--color-muted)' }}>Transcribing audio...</div>
                    : <TypingDots />
                  }
                </div>
              </div>
            )}

            {error && (
              <div style={{
                fontSize:10, color:'var(--color-red)', fontFamily:'monospace',
                padding:'6px 10px', borderRadius:6,
                background:'oklch(0.55 0.22 27 / 0.07)',
                border:'1px solid oklch(0.55 0.22 27 / 0.22)',
              }}>
                ⚠ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding:'4px 12px 8px', display:'flex', flexWrap:'wrap', gap:5, flexShrink:0 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="jv-quick" onClick={() => sendToJarvis(p)}
                  style={{
                    fontSize:9.5, padding:'4px 9px', fontFamily:'monospace',
                    background:'transparent',
                    border:'1px solid oklch(0.82 0.16 196 / 0.18)',
                    borderRadius:20, color:'var(--color-muted)',
                    cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.02em',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding:'10px 12px', flexShrink:0,
            borderTop:'1px solid oklch(0.82 0.16 196 / 0.12)',
            background:'oklch(0.11 0.024 196 / 0.75)',
            display:'flex', gap:7, alignItems:'center',
          }}>
            {/* Mic button — Whisper */}
            <button onClick={toggleRecording} disabled={loading || transcribing}
              title={recording ? 'Stop recording' : 'Voice input (Whisper)'}
              style={{
                width:34, height:34, borderRadius:8, flexShrink:0,
                background: recording ? 'oklch(0.55 0.22 27 / 0.18)' : 'transparent',
                border:`1px solid ${recording ? 'oklch(0.55 0.22 27 / 0.55)' : 'oklch(0.82 0.16 196 / 0.18)'}`,
                color: recording ? 'var(--color-red)' : 'var(--color-muted)',
                cursor:'pointer', fontSize:15,
                display:'flex', alignItems:'center', justifyContent:'center',
                animation: recording ? 'jv-rec-ring 1.2s ease-in-out infinite' : undefined,
                opacity: (loading || transcribing) ? 0.4 : 1,
                transition:'all 0.15s',
              }}>
              {recording ? '⏹' : '🎙️'}
            </button>

            {/* Voice wave or input */}
            {recording ? (
              <div style={{
                flex:1, height:34, borderRadius:8,
                background:'oklch(0.55 0.22 27 / 0.08)',
                border:'1px solid oklch(0.55 0.22 27 / 0.25)',
                display:'flex', alignItems:'center', paddingLeft:12, gap:8,
              }}>
                <VoiceWave />
                <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--color-red)' }}>Recording...</span>
              </div>
            ) : (
              <input ref={inputRef}
                className="jv-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendToJarvis(input); } }}
                placeholder={transcribing ? 'Transcribing...' : 'Speak, sir...'}
                disabled={loading || transcribing}
                style={{
                  flex:1, height:34,
                  background:'oklch(0.14 0.028 196 / 0.55)',
                  border:'1px solid oklch(0.82 0.16 196 / 0.18)',
                  borderRadius:8, padding:'0 12px',
                  color:'var(--color-text)', fontSize:12,
                  fontFamily:"'Courier New', monospace",
                  transition:'border-color 0.15s',
                }}
              />
            )}

            {/* Send */}
            <button className="jv-send-btn"
              onClick={() => sendToJarvis(input)}
              disabled={!input.trim() || loading || recording}
              style={{
                width:34, height:34, borderRadius:8, flexShrink:0,
                background: (input.trim() && !loading && !recording)
                  ? 'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.32 0.22 196))'
                  : 'transparent',
                border:`1px solid ${(input.trim() && !loading && !recording) ? 'oklch(0.82 0.16 196 / 0.42)' : 'oklch(0.82 0.16 196 / 0.13)'}`,
                color:'white',
                cursor:(input.trim() && !loading && !recording)?'pointer':'default',
                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
                opacity:(input.trim() && !loading && !recording)?1:0.3,
                transition:'all 0.15s',
              }}>
              ↑
            </button>
          </div>

        </div>
      )}
    </>
  );
}
