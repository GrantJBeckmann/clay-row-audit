'use client';
import { useState, useRef } from 'react';
import { buildHtml } from '@/lib/template';

type Phase = 'form' | 'loading' | 'results';

function extractWorkspaceId(url: string): string | null {
  const m = url.match(/workspaces\/(\d+)/);
  return m ? m[1] : null;
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, color: '#111827', outline: 'none', background: '#fff',
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>('form');
  const [wsUrl, setWsUrl] = useState('');
  const [cookie, setCookie] = useState('');
  const [error, setError] = useState('');
  const [currentMsg, setCurrentMsg] = useState('');
  const [currentDetail, setCurrentDetail] = useState('');
  const [callCount, setCallCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [resultHtml, setResultHtml] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function startAudit() {
    const wsId = extractWorkspaceId(wsUrl);
    if (!wsId) {
      setError('Could not parse workspace ID from URL. Make sure it looks like https://app.clay.com/workspaces/12345/...');
      return;
    }
    if (!cookie.trim()) { setError('Session cookie is required.'); return; }
    setError('');
    setPhase('loading');
    setCallCount(0);
    setLog([]);
    setProgress(0);
    setCurrentMsg('Connecting…');
    setCurrentDetail('');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cookie: cookie.trim(), workspaceId: wsId }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let count = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;
          let event: { type: string; message?: string; detail?: string; data?: object; total?: number };
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === 'progress') {
            count++;
            setCallCount(count);
            setCurrentMsg(event.message ?? '');
            setCurrentDetail(event.detail ?? '');
            setLog(prev => [...prev.slice(-199), `${event.message ?? ''} ${event.detail ?? ''}`.trim()]);
            setProgress(prev => Math.min(95, prev + (95 - prev) * 0.03));
          } else if (event.type === 'complete') {
            setProgress(100);
            const html = buildHtml(event.data!, event.total!, wsId);
            setResultHtml(html);
            setPhase('results');
          } else if (event.type === 'error') {
            throw new Error((event as { message?: string }).message ?? 'Unknown error');
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setError(String(err));
      setPhase('form');
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setPhase('form');
  }

  return (
    <>
      {phase === 'form' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Clay Row Limit Workspace Audit</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 }}>
              Enter your workspace URL and session cookie to audit all folders, workbooks, and tables.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <label style={labelStyle}>Workspace URL</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="https://app.clay.com/workspaces/12345/home"
              value={wsUrl}
              onChange={e => setWsUrl(e.target.value)}
            />

            <label style={labelStyle}>Session Cookie</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="Your claysession cookie value"
              value={cookie}
              onChange={e => setCookie(e.target.value)}
            />

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', marginTop: 16, marginBottom: 24, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              <strong style={{ color: '#374151' }}>How to find your session cookie:</strong><br />
              1. Open Clay and press <strong>F12</strong> → Application tab<br />
              2. Under Cookies → <code style={{ background: '#e5e7eb', padding: '1px 4px', borderRadius: 3 }}>https://app.clay.com</code><br />
              3. Find <code style={{ background: '#e5e7eb', padding: '1px 4px', borderRadius: 3 }}>claysession</code> and copy its value
            </div>

            <button
              style={{ width: '100%', padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              onClick={startAudit}
            >
              Run Audit
            </button>
          </div>
        </div>
      )}

      {phase === 'loading' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Auditing Workspace…</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>{callCount} API calls made</p>

            <div style={{ background: '#f3f4f6', borderRadius: 99, height: 6, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg,#6366f1,#06b6d4)',
                borderRadius: 99,
                width: `${progress}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginBottom: 20, minHeight: 52 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{currentMsg}</div>
              {currentDetail && <div style={{ fontSize: 12, color: '#6366f1', marginTop: 3 }}>{currentDetail}</div>}
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, height: 220, overflowY: 'auto', padding: '8px 0', marginBottom: 20, display: 'flex', flexDirection: 'column-reverse' }}>
              {[...log].reverse().map((entry, i) => (
                <div key={i} style={{ padding: '3px 14px', fontSize: 11, color: i === 0 ? '#6366f1' : '#9ca3af', fontWeight: i === 0 ? 600 : 400 }}>
                  {entry}
                </div>
              ))}
            </div>

            <button
              style={{ width: '100%', padding: '9px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              onClick={cancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ height: 44, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0 }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}
              onClick={() => setPhase('form')}
            >
              ← New Audit
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Clay Row Limit Workspace Audit</span>
          </div>
          <iframe
            style={{ flex: 1, border: 'none', width: '100%' }}
            srcDoc={resultHtml}
            sandbox="allow-scripts allow-same-origin"
            title="Audit Results"
          />
        </div>
      )}
    </>
  );
}