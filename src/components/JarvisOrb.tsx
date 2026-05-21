import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
  mode?: 'voice' | 'text';
}

const QUICK_PROMPTS = [
  'Status report.',
  "Optimize tonight's energy.",
  'Any anomalies?',
  "What's draining the most power?",
  'Should I charge now or wait?',
  'Is the CO₂ level dangerous?',
];

const GREETINGS = [
  "Good to see you, sir. Three active alerts, one agent conflict at 18:00, and a battery discharge rate I'd rather not ignore. Shall we address all three, or start with the one most likely to ruin your evening?",
  "All systems operational — with notable exceptions. Battery at 74% and dropping faster than forecast. I have recommendations whenever you're ready.",
  "You're drawing 5.75 kilowatts from the grid during peak pricing, sir. Either you'd like to discuss that, or you enjoy donating money to the utility company.",
  "Solar underperforming by roughly 18% versus forecast. CO₂ at 612 parts per million — above my preferred threshold. I have thoughts on both.",
];

// ── Arc Reactor ──────────────────────────────────────────────────────────────
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
    <div style={{ display:'flex', gap:4, padding:'10px 14px', alignItems:'center' }}>
      {[0,150,300].map(d => (
        <div key={d} style={{
          width:6, height:6, borderRadius:'50%',
          background:'var(--color-cyan)',
          animation:`jv-bounce 1s ease-in-out ${d}ms infinite`,
        }} />
      ))}
    </div>
  );
}

function VoiceWave() {
  return (
    <div style={{ display:'flex', gap:3, alignItems:'center', height:20 }}>
      {[1,3,5,4,3,5,2,4,3,2].map((h, i) => (
        <div key={i} style={{
          width:3, borderRadius:2,
          background:'var(--color-red)',
          height: h * 3,
          animation:`jv-wave 0.7s ease-in-out ${i*70}ms infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ── Audio recorder ───────────────────────────────────────────────────────────
function useRecorder() {
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const start = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.current = s;
    const rec = new MediaRecorder(s);
    chunks.current = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.current = rec;
    rec.start(100);
  };

  const stop = (): Promise<Blob> => new Promise(resolve => {
    const rec = mr.current;
    if (!rec) { resolve(new Blob()); return; }
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      stream.current?.getTracks().forEach(t => t.stop());
      resolve(blob);
    };
    rec.stop();
  });

  return { start, stop };
}

// ── Play base64 audio ─────────────────────────────────────────────────────────
function playBase64Audio(base64: string) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(console.error);
  } catch (e) {
    console.error('Audio playback error:', e);
  }
}

// ── Browser TTS fallback ──────────────────────────────────────────────────────
function speakBrowser(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find(v => v.name === 'Daniel')
         || voices.find(v => v.lang === 'en-GB')
         || voices.find(v => v.lang.startsWith('en'))
         || null;
  u.rate = 0.88; u.pitch = 0.72; u.volume = 0.95;
  window.speechSynthesis.speak(u);
}

const STATUS_ITEMS = [
  { label:'Battery', value:'74% · 6.2h', color:'var(--color-green)', icon:'⚡' },
  { label:'Solar',   value:'3.42 kW',    color:'var(--color-cyan)',  icon:'☀️' },
  { label:'Load',    value:'9.17 kW',    color:'var(--color-amber)', icon:'📊' },
  { label:'Grid',    value:'+5.75 kW',   color:'var(--color-red)',   icon:'🔌' },
  { label:'CO₂',     value:'612 ppm ⚠',  color:'var(--color-amber)', icon:'💨' },
  { label:'Agents',  value:'4 · conflict',color:'var(--color-purple)',icon:'🤖' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function JarvisOrb() {
  const [open, setOpen]           = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'tts'|'browser'|'off'>('browser');
  const [showStatus, setShowStatus] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [notifDone, setNotifDone] = useState(false);
  const [phase, setPhase]         = useState(0);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { start: startRec, stop: stopRec } = useRecorder();

  // Orb breathing
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p+1)%4), 1100);
    return () => clearInterval(id);
  }, []);

  // Preload voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  // Greeting
  useEffect(() => {
    if (open && messages.length === 0) {
      const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setMessages([{ role:'assistant', content:g, ts:new Date() }]);
      if (voiceMode === 'browser') speakBrowser(g);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  // ── Text → JARVIS (streaming SSE from chat.ts) ──────────────────────────
  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    const userMsg: Message = { role:'user', content:text.trim(), ts:new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role:m.role, content:m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?:string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const ct = res.headers.get('content-type') ?? '';
      let reply = '';

      if (ct.includes('event-stream') || ct.includes('text/plain')) {
        // SSE streaming — chat.ts sends: data: {"token":"..."}\n\n
        const reader = res.body?.getReader();
        const dec = new TextDecoder();
        // Insert empty assistant bubble
        setMessages(prev => [...prev, { role:'assistant', content:'', ts:new Date() }]);
        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream:true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const d = line.slice(5).trim();
              if (d === '[DONE]') break;
              try {
                const p = JSON.parse(d);
                // chat.ts sends { token: "..." }
                const tok: string = p.token ?? p.delta?.text ?? p.choices?.[0]?.delta?.content ?? '';
                if (tok) {
                  reply += tok;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length-1] = { role:'assistant', content:reply, ts:new Date() };
                    return updated;
                  });
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }
      } else {
        // Non-streaming JSON
        const data = await res.json();
        reply = (data.content as {type:string;text?:string}[])?.find(b => b.type==='text')?.text
              ?? data.response ?? data.message
              ?? "My apologies, sir. Something went sideways on the intelligence layer.";
        setMessages(prev => [...prev, { role:'assistant', content:reply, ts:new Date() }]);
      }

      if (reply && voiceMode === 'browser') speakBrowser(reply);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      setError(msg.includes('API_KEY') || msg.includes('503')
        ? "ANTHROPIC_API_KEY not set in Vercel environment variables."
        : `Connection lost: ${msg}`);
      setMessages(prev => [...prev, {
        role:'assistant',
        content:"The intelligence layer is unreachable, sir. Check your API keys in Vercel.",
        ts:new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, voiceMode]);

  // ── Voice → Whisper → real TTS ──────────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setProcessing(true);
      try {
        const blob = await stopRec();
        // Send raw bytes — Jarvis.js reads them as a stream
        const res = await fetch('/api/Jarvis', {
          method:'POST',
          headers:{ 'Content-Type':'audio/webm' },
          body: blob,
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({})) as { error?:string };
          throw new Error(e.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { transcript?:string; text?:string; audio?:string|null; error?:string };
        if (data.error) throw new Error(data.error);

        const transcript = data.transcript ?? '';
        const reply      = data.text ?? '';

        if (transcript) {
          setMessages(prev => [...prev,
            { role:'user',      content:transcript, ts:new Date(), mode:'voice' },
            { role:'assistant', content:reply,      ts:new Date(), mode:'voice' },
          ]);
        }

        // Play real TTS audio from OpenAI if available, else browser fallback
        if (data.audio) {
          playBase64Audio(data.audio);
        } else if (reply && voiceMode !== 'off') {
          speakBrowser(reply);
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown';
        setError(msg.includes('OPENAI_API_KEY') || msg.includes('503')
          ? "OPENAI_API_KEY not set in Vercel environment variables. Voice input requires OpenAI."
          : `Voice processing failed: ${msg}`);
      } finally {
        setProcessing(false);
      }
    } else {
      try {
        await startRec();
        setRecording(true);
      } catch {
        setError("Microphone access denied. Allow microphone in browser settings.");
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    window.speechSynthesis?.cancel();
  };

  const glow = [
    '0 0 14px oklch(0.75 0.18 196/0.45),0 0 35px oklch(0.75 0.18 196/0.15)',
    '0 0 20px oklch(0.75 0.18 196/0.62),0 0 50px oklch(0.75 0.18 196/0.22)',
    '0 0 26px oklch(0.75 0.18 196/0.82),0 0 65px oklch(0.75 0.18 196/0.32)',
    '0 0 20px oklch(0.75 0.18 196/0.62),0 0 50px oklch(0.75 0.18 196/0.22)',
  ][phase];

  const W = expanded ? 'min(580px,95vw)' : 'min(420px,calc(100vw - 2rem))';
  const H = expanded ? 'min(720px,90vh)' : 'min(560px,80vh)';

  const voiceIcon = voiceMode === 'tts' ? '🔊' : voiceMode === 'browser' ? '🔉' : '🔇';
  const voiceTitle = voiceMode === 'tts' ? 'OpenAI TTS active' : voiceMode === 'browser' ? 'Browser voice active' : 'Voice off';

  return (
    <>
      <style>{`
        @keyframes jv-spin  { to{transform:rotate(360deg)} }
        @keyframes jv-bounce{ 0%,80%,100%{transform:scale(0.55);opacity:.35}40%{transform:scale(1.2);opacity:1} }
        @keyframes jv-wave  { from{transform:scaleY(0.4)}to{transform:scaleY(1.6)} }
        @keyframes jv-up    { from{opacity:0;transform:translateY(18px)scale(.96)}to{opacity:1;transform:none} }
        @keyframes jv-notif { from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none} }
        @keyframes jv-rec   { 0%,100%{box-shadow:0 0 0 0 oklch(0.55 0.22 27/0.7)}50%{box-shadow:0 0 0 9px oklch(0.55 0.22 27/0)} }
        .jv-usr{ background:oklch(0.82 0.16 196/0.08);border:1px solid oklch(0.82 0.16 196/0.2);border-radius:12px 12px 3px 12px; }
        .jv-ai { background:oklch(0.16 0.03 196/0.88);border:1px solid oklch(0.82 0.16 196/0.1);border-radius:3px 12px 12px 12px; }
        .jv-q:hover{ background:oklch(0.82 0.16 196/0.1)!important;border-color:oklch(0.82 0.16 196/0.42)!important;color:var(--color-cyan)!important; }
        .jv-c:hover{ background:oklch(0.82 0.16 196/0.09)!important;color:var(--color-text)!important; }
        .jv-inp:focus{ border-color:oklch(0.82 0.16 196/0.45)!important;outline:none; }
        .jv-orb:active{ transform:scale(0.91)!important; }
      `}</style>

      {/* Notification */}
      {!open && !notifDone && (
        <div onClick={() => setOpen(true)} style={{
          position:'fixed',bottom:'5.8rem',right:'1.25rem',zIndex:49,
          maxWidth:270,background:'oklch(0.1 0.024 196/0.97)',
          border:'1px solid oklch(0.82 0.16 196/0.26)',borderRadius:10,
          padding:'9px 12px',backdropFilter:'blur(20px)',
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'jv-notif 0.3s ease',cursor:'pointer',
        }}>
          <div style={{ display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:'monospace',fontSize:9,color:'var(--color-cyan)',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase' }}>
                J.A.R.V.I.S. · AURORA CORE
              </div>
              <div style={{ fontSize:11,color:'var(--color-text)',lineHeight:1.45 }}>
                3 alerts active. Agent conflict at 18:00 unresolved.
              </div>
            </div>
            <button onClick={e=>{ e.stopPropagation(); setNotifDone(true); }}
              style={{ background:'none',border:'none',color:'var(--color-muted)',cursor:'pointer',fontSize:17,lineHeight:1 }}>×</button>
          </div>
        </div>
      )}

      {/* Orb */}
      <button className="jv-orb" onClick={() => setOpen(o=>!o)} style={{
        position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:50,
        width:52,height:52,borderRadius:'50%',
        border:`1.5px solid oklch(0.82 0.16 196/${open?'0.6':'0.32'})`,
        background:'radial-gradient(circle at 38% 32%, oklch(0.72 0.18 196), oklch(0.3 0.22 196))',
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:glow,transition:'box-shadow 0.9s ease,transform 0.1s',outline:'none',
      }}>
        <ArcReactor size={28} pulse={open} />
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:'fixed',bottom:'5.2rem',right:'1.5rem',zIndex:50,
          width:W,height:H,display:'flex',flexDirection:'column',
          borderRadius:16,overflow:'hidden',
          background:'oklch(0.09 0.022 196/0.97)',
          border:'1px solid oklch(0.82 0.16 196/0.17)',
          backdropFilter:'blur(28px) saturate(1.5)',
          boxShadow:'0 0 80px oklch(0.75 0.18 196/0.09),0 32px 80px rgba(0,0,0,0.7)',
          animation:'jv-up 0.2s ease',
          transition:'width 0.22s ease,height 0.22s ease',
        }}>

          {/* Header */}
          <div style={{
            padding:'11px 14px',flexShrink:0,
            borderBottom:'1px solid oklch(0.82 0.16 196/0.12)',
            background:'oklch(0.12 0.027 196/0.7)',
            display:'flex',alignItems:'center',gap:10,
          }}>
            <div style={{
              width:32,height:32,borderRadius:8,flexShrink:0,
              background:'radial-gradient(circle at 38% 32%,oklch(0.72 0.18 196),oklch(0.3 0.22 196))',
              border:'1px solid oklch(0.82 0.16 196/0.28)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}><ArcReactor size={20} pulse /></div>

            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:'monospace',fontSize:11,fontWeight:700,color:'var(--color-cyan)',letterSpacing:'0.16em',textTransform:'uppercase',lineHeight:1.2 }}>
                J.A.R.V.I.S.
              </div>
              <div style={{ fontFamily:'monospace',fontSize:8.5,color:'var(--color-muted)',letterSpacing:'0.09em' }}>
                AURORA CORE · AI INTELLIGENCE LAYER
              </div>
            </div>

            {[
              { t:'System status',  i:'⚡', a:showStatus, fn:()=>setShowStatus(s=>!s) },
              { t:voiceTitle,       i:voiceIcon, a:voiceMode!=='off',
                fn:()=>setVoiceMode(v=>v==='tts'?'browser':v==='browser'?'off':'tts') },
              { t:expanded?'Compact':'Expand', i:expanded?'⊟':'⊞', a:false, fn:()=>setExpanded(e=>!e) },
              { t:'Clear',          i:'↺',  a:false, fn:clearChat },
              { t:'Close',          i:'×',  a:false, fn:()=>setOpen(false) },
            ].map(c=>(
              <button key={c.t} className="jv-c" onClick={c.fn} title={c.t} style={{
                width:28,height:28,borderRadius:6,flexShrink:0,
                background:c.a?'oklch(0.82 0.16 196/0.12)':'transparent',
                border:`1px solid ${c.a?'oklch(0.82 0.16 196/0.36)':'oklch(0.82 0.16 196/0.12)'}`,
                color:c.a?'var(--color-cyan)':'var(--color-muted)',
                cursor:'pointer',fontSize:c.i==='×'?16:12,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all 0.15s',
              }}>{c.i}</button>
            ))}
          </div>

          {/* Status bar */}
          {showStatus && (
            <div style={{
              padding:'7px 12px',flexShrink:0,
              borderBottom:'1px solid oklch(0.82 0.16 196/0.09)',
              background:'oklch(0.11 0.024 196/0.6)',
              display:'flex',flexWrap:'wrap',gap:5,
            }}>
              {STATUS_ITEMS.map(s=>(
                <div key={s.label} style={{
                  display:'flex',alignItems:'center',gap:4,
                  background:'oklch(0.14 0.028 196/0.7)',
                  border:'1px solid oklch(0.82 0.16 196/0.09)',
                  borderRadius:5,padding:'3px 7px',
                }}>
                  <span style={{ fontSize:9 }}>{s.icon}</span>
                  <span style={{ fontFamily:'monospace',fontSize:8.5,color:'var(--color-muted)' }}>{s.label}:</span>
                  <span style={{ fontFamily:'monospace',fontSize:8.5,color:s.color,fontWeight:700 }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1,overflowY:'auto',padding:'14px 14px 6px',display:'flex',flexDirection:'column',gap:11 }}>
            {messages.length===0 && (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:14,opacity:0.45 }}>
                <ArcReactor size={44} pulse />
                <div style={{ fontFamily:'monospace',fontSize:9,color:'var(--color-muted)',letterSpacing:'0.12em' }}>AWAITING INPUT</div>
              </div>
            )}

            {messages.map((msg,i)=>(
              <div key={i} style={{ display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',gap:8,alignItems:'flex-start' }}>
                {msg.role==='assistant' && (
                  <div style={{
                    width:26,height:26,borderRadius:7,flexShrink:0,marginTop:1,
                    background:'radial-gradient(circle at 38% 32%,oklch(0.72 0.18 196),oklch(0.3 0.22 196))',
                    border:'1px solid oklch(0.82 0.16 196/0.26)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}><ArcReactor size={15} /></div>
                )}
                <div className={msg.role==='user'?'jv-usr':'jv-ai'} style={{
                  maxWidth:'78%',padding:'9px 13px',
                  fontSize:12.5,lineHeight:1.58,
                  color:msg.role==='user'?'var(--color-text)':'oklch(0.9 0.04 196)',
                  fontFamily:msg.role==='assistant'?"'Courier New',monospace":'inherit',
                }}>
                  {msg.mode==='voice' && msg.role==='user' && (
                    <span style={{ fontSize:9,color:'var(--color-cyan)',fontFamily:'monospace',marginRight:5,opacity:0.7 }}>🎙</span>
                  )}
                  {msg.content}
                  <div style={{ fontSize:8,color:'var(--color-muted)',marginTop:5,opacity:0.5 }}>
                    {msg.ts.toLocaleTimeString([],{ hour:'2-digit',minute:'2-digit' })}
                  </div>
                </div>
                {msg.role==='user' && (
                  <div style={{
                    width:26,height:26,borderRadius:7,flexShrink:0,marginTop:1,
                    background:'oklch(0.82 0.16 196/0.08)',
                    border:'1px solid oklch(0.82 0.16 196/0.18)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'monospace',fontSize:9,color:'var(--color-cyan)',fontWeight:700,
                  }}>GM</div>
                )}
              </div>
            ))}

            {(loading||processing) && (
              <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}>
                <div style={{
                  width:26,height:26,borderRadius:7,flexShrink:0,
                  background:'radial-gradient(circle at 38% 32%,oklch(0.72 0.18 196),oklch(0.3 0.22 196))',
                  border:'1px solid oklch(0.82 0.16 196/0.26)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}><ArcReactor size={15} /></div>
                <div className="jv-ai">
                  {processing
                    ? <div style={{ padding:'9px 13px',fontFamily:'monospace',fontSize:10,color:'var(--color-muted)' }}>
                        Processing audio...
                      </div>
                    : <TypingDots />
                  }
                </div>
              </div>
            )}

            {error && (
              <div style={{
                fontSize:10,color:'var(--color-red)',fontFamily:'monospace',
                padding:'6px 10px',borderRadius:6,
                background:'oklch(0.55 0.22 27/0.06)',
                border:'1px solid oklch(0.55 0.22 27/0.2)',
              }}>⚠ {error}</div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {messages.length<=1 && !loading && (
            <div style={{ padding:'4px 12px 8px',display:'flex',flexWrap:'wrap',gap:5,flexShrink:0 }}>
              {QUICK_PROMPTS.map(p=>(
                <button key={p} className="jv-q" onClick={()=>sendText(p)} style={{
                  fontSize:9.5,padding:'4px 9px',fontFamily:'monospace',
                  background:'transparent',
                  border:'1px solid oklch(0.82 0.16 196/0.17)',
                  borderRadius:20,color:'var(--color-muted)',
                  cursor:'pointer',transition:'all 0.15s',letterSpacing:'0.02em',
                }}>{p}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding:'10px 12px',flexShrink:0,
            borderTop:'1px solid oklch(0.82 0.16 196/0.11)',
            background:'oklch(0.1 0.023 196/0.8)',
            display:'flex',gap:7,alignItems:'center',
          }}>
            {/* Mic */}
            <button onClick={toggleRecording} disabled={loading||processing} title={recording?'Stop':'Voice input (Whisper)'} style={{
              width:34,height:34,borderRadius:8,flexShrink:0,
              background:recording?'oklch(0.55 0.22 27/0.16)':'transparent',
              border:`1px solid ${recording?'oklch(0.55 0.22 27/0.55)':'oklch(0.82 0.16 196/0.17)'}`,
              color:recording?'var(--color-red)':'var(--color-muted)',
              cursor:'pointer',fontSize:15,
              display:'flex',alignItems:'center',justifyContent:'center',
              animation:recording?'jv-rec 1.1s ease-in-out infinite':undefined,
              opacity:(loading||processing)?0.35:1,
              transition:'all 0.15s',
            }}>
              {recording ? '⏹' : '🎙️'}
            </button>

            {recording ? (
              <div style={{
                flex:1,height:34,borderRadius:8,
                background:'oklch(0.55 0.22 27/0.07)',
                border:'1px solid oklch(0.55 0.22 27/0.22)',
                display:'flex',alignItems:'center',paddingLeft:12,gap:8,
              }}>
                <VoiceWave />
                <span style={{ fontFamily:'monospace',fontSize:10,color:'var(--color-red)' }}>Recording… tap ⏹ to send</span>
              </div>
            ) : (
              <input ref={inputRef} className="jv-inp"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendText(input); } }}
                placeholder={processing?'Processing…':'Speak, sir…'}
                disabled={loading||processing||recording}
                style={{
                  flex:1,height:34,
                  background:'oklch(0.14 0.027 196/0.5)',
                  border:'1px solid oklch(0.82 0.16 196/0.17)',
                  borderRadius:8,padding:'0 12px',
                  color:'var(--color-text)',fontSize:12,
                  fontFamily:"'Courier New',monospace",
                  transition:'border-color 0.15s',
                }}
              />
            )}

            {/* Send */}
            <button onClick={()=>sendText(input)}
              disabled={!input.trim()||loading||recording} style={{
              width:34,height:34,borderRadius:8,flexShrink:0,
              background:(input.trim()&&!loading&&!recording)
                ?'radial-gradient(circle at 38% 32%,oklch(0.72 0.18 196),oklch(0.3 0.22 196))'
                :'transparent',
              border:`1px solid ${(input.trim()&&!loading&&!recording)?'oklch(0.82 0.16 196/0.4)':'oklch(0.82 0.16 196/0.12)'}`,
              color:'white',
              cursor:(input.trim()&&!loading&&!recording)?'pointer':'default',
              fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',
              opacity:(input.trim()&&!loading&&!recording)?1:0.28,
              transition:'all 0.15s',
            }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}
