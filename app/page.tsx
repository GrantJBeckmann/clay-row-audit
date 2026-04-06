'use client';
import { useState, useRef } from 'react';
import { buildHtml } from '@/lib/template';

type Phase = 'form' | 'loading' | 'results';

function extractWorkspaceId(url: string): string | null {
  const m = url.match(/workspaces\/(\d+)/);
  return m ? m[1] : null;
}

// Demo data rendered as background preview
const DEMO_BG = buildHtml({
  folders: [
    {
      id: 'f_demo1', name: 'Active Clients', totalRows: 1840000,
      folders: [
        {
          id: 'f_demo2', name: 'eBoost', totalRows: 920000,
          folders: [],
          workbooks: [
            { id: 'wb_demo1', name: 'Lead Gen — Q1 2025', totalRows: 410000, tables: [{ id: 't1', name: 'Contacts Master', rows: 250000 }, { id: 't2', name: 'Company List', rows: 160000 }] },
            { id: 'wb_demo2', name: 'Outbound Campaigns', totalRows: 510000, tables: [{ id: 't3', name: 'Email Sequences', rows: 310000 }, { id: 't4', name: 'LinkedIn Targets', rows: 200000 }] },
          ],
        },
        {
          id: 'f_demo3', name: 'Olympiano', totalRows: 920000,
          folders: [],
          workbooks: [
            { id: 'wb_demo3', name: 'Prospecting Pipeline', totalRows: 580000, tables: [{ id: 't5', name: 'ICP Companies', rows: 350000 }, { id: 't6', name: 'Decision Makers', rows: 230000 }] },
            { id: 'wb_demo4', name: 'Enrichment Runs', totalRows: 340000, tables: [{ id: 't7', name: 'Enriched Contacts', rows: 200000 }, { id: 't8', name: 'Verified Emails', rows: 140000 }] },
          ],
        },
      ],
      workbooks: [],
    },
    {
      id: 'f_demo4', name: 'Internal', totalRows: 640000,
      folders: [],
      workbooks: [
        { id: 'wb_demo5', name: 'GTM Research', totalRows: 380000, tables: [{ id: 't9', name: 'Target Accounts', rows: 220000 }, { id: 't10', name: 'Personas', rows: 160000 }] },
        { id: 'wb_demo6', name: 'Market Mapping', totalRows: 260000, tables: [{ id: 't11', name: 'Competitors', rows: 90000 }, { id: 't12', name: 'Category Leaders', rows: 170000 }] },
      ],
    },
    {
      id: 'f_demo5', name: 'Templates', totalRows: 290000,
      folders: [],
      workbooks: [
        { id: 'wb_demo7', name: 'Cold Outbound Starter', totalRows: 150000, tables: [{ id: 't13', name: 'Sample Contacts', rows: 150000 }] },
        { id: 'wb_demo8', name: 'Account Research Template', totalRows: 140000, tables: [{ id: 't14', name: 'Accounts Base', rows: 140000 }] },
      ],
    },
  ],
  workbooks: [
    { id: 'wb_demo9', name: 'Scratch — Misc Exports', totalRows: 85000, tables: [{ id: 't15', name: 'Dump Jan', rows: 45000 }, { id: 't16', name: 'Dump Feb', rows: 40000 }] },
  ],
}, 2855000, 'demo');

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
    setProgress(5);
    setCurrentMsg('Connecting…');
    setCurrentDetail('');

    // Yield to React so the loading UI renders before fetch starts
    await new Promise(r => setTimeout(r, 50));

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

  const showBg = phase === 'form' || phase === 'loading';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background: demo preview (form/loading) or real results */}
      <iframe
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: showBg ? 'none' : 'auto' }}
        srcDoc={showBg ? DEMO_BG : resultHtml}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title={showBg ? 'Preview' : 'Audit Results'}
      />

      {/* Results header bar */}
      {phase === 'results' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, background: '#fff', zIndex: 10 }}>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}
            onClick={() => setPhase('form')}
          >
            ← New Audit
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Clay Row Limit Workspace Audit</span>
        </div>
      )}

      {/* Dim + blur overlay for form and loading phases */}
      {showBg && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

          {phase === 'form' && (
            <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 14, padding: '32px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Clay Row Limit Workspace Audit</h1>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>
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

              <label style={labelStyle}>Cookie String</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Paste full cookie string from Network tab Request Headers"
                value={cookie}
                onChange={e => setCookie(e.target.value)}
              />

              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', marginTop: 16, marginBottom: 24, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                <strong style={{ color: '#374151' }}>How to get your cookie string:</strong><br />
                1. Open Clay, press <strong>F12</strong> → <strong>Network</strong> tab<br />
                2. Refresh the page, click any <strong>api.clay.com</strong> request<br />
                3. Under <strong>Request Headers</strong>, find <strong>cookie</strong><br />
                4. Right-click it → <strong>Copy value</strong> and paste the full string here
              </div>

              <button
                style={{ width: '100%', padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onClick={startAudit}
              >
                Run Audit
              </button>
            </div>
          )}

          {phase === 'loading' && (
            <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 14, padding: '32px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid #e5e7eb', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Auditing Workspace…</h1>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, marginLeft: 32 }}>{callCount} API calls made</p>

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

              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, height: 200, overflowY: 'auto', padding: '8px 0', marginBottom: 20, display: 'flex', flexDirection: 'column-reverse' }}>
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
          )}

        </div>
      )}
    </div>
  );
}