export function buildHtml(data: object, total: number, wsId: string): string {
  const totalStr = total.toLocaleString();
  const dateStr = new Date().toLocaleDateString();
  const baseUrl = `https://app.clay.com/workspaces/${wsId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Clay Row Limit Workspace Audit</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background: #fff; color: #111827; font-size: 13px; }
.controls { height: 44px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; padding: 0 20px; gap: 10px; background: #fff; }
.controls label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.controls select { border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer; background: #fff; }
.controls select:focus { outline: none; border-color: #6366f1; }
.ctrl-btn { border: 1px solid #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; background: #fff; }
.ctrl-btn:hover { background: #f9fafb; }
.vsep { width: 1px; height: 18px; background: #e5e7eb; flex-shrink: 0; }
.search-wrap { position: relative; margin-left: auto; }
.search-wrap input { border: 1px solid #e5e7eb; color: #111; padding: 4px 8px 4px 28px; border-radius: 6px; font-size: 12px; width: 220px; }
.search-wrap input:focus { outline: none; border-color: #6366f1; }
.search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); opacity: 0.4; pointer-events: none; }
.total-pill { font-size: 11px; color: #6b7280; background: #f3f4f6; border-radius: 20px; padding: 3px 10px; white-space: nowrap; flex-shrink: 0; }
.layout { display: flex; min-height: calc(100vh - 44px); }
.sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid #e5e7eb; padding: 12px 0; overflow-y: auto; }
.sidebar-item { display: flex; align-items: center; gap: 6px; padding: 5px 14px; font-size: 12px; color: #6b7280; cursor: pointer; text-decoration: none; }
.sidebar-item:hover { background: #f9fafb; color: #111; }
.sidebar-section { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px 4px; }
.content { flex: 1; min-width: 0; padding: 16px 24px; }
.stats-row { display: flex; gap: 10px; margin-bottom: 16px; }
.stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
.stat-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
.stat-val { font-size: 18px; font-weight: 700; color: #111; }
.stat-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
.table-header { display: flex; align-items: center; padding: 0 12px 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 4px; }
.col-name { flex: 1; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 40px; }
.col-tables { width: 70px; text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; }
.col-rows { width: 100px; text-align: right; font-size: 11px; color: #9ca3af; text-transform: uppercase; }
.folder-block { margin-bottom: 2px; }
.folder-row { display: flex; align-items: center; padding: 7px 12px; border-radius: 7px; cursor: pointer; user-select: none; transition: background 0.1s; gap: 6px; }
.folder-row:hover { background: #f9fafb; }
.folder-emoji { font-size: 14px; flex-shrink: 0; }
.folder-label { flex: 1; font-size: 13px; font-weight: 500; color: #111; }
.folder-link { color: inherit; text-decoration: none; flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
.folder-link:hover .folder-label { color: #1d4ed8; text-decoration: underline; }
.folder-wbcount { width: 70px; text-align: center; font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.folder-rowcount { width: 100px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; flex-shrink: 0; }
.chevron { color: #d1d5db; font-size: 9px; transition: transform 0.15s; flex-shrink: 0; width: 14px; }
.chevron.open { transform: rotate(90deg); }
.folder-children { display: none; padding-left: 20px; margin-bottom: 2px; }
.folder-children.open { display: block; }
.workbook-block { margin-bottom: 1px; }
.workbook-row { display: flex; align-items: center; padding: 6px 12px; border-radius: 6px; cursor: pointer; user-select: none; transition: background 0.1s; gap: 6px; }
.workbook-row:hover { background: #f9fafb; }
.wb-icon { width: 18px; height: 18px; background: #e0e7ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.workbook-link { flex: 1; color: #374151; text-decoration: none; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.workbook-link:hover { color: #1d4ed8; text-decoration: underline; }
.workbook-tcount { width: 70px; text-align: center; font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.workbook-rowcount { width: 100px; text-align: right; font-size: 12px; font-weight: 500; color: #1d4ed8; flex-shrink: 0; }
.workbook-children { display: none; }
.workbook-children.open { display: block; }
.table-list { margin: 2px 0 4px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-left: 10px; }
.trow { display: flex; align-items: center; padding: 5px 12px; border-bottom: 1px solid #f3f4f6; gap: 6px; }
.trow:last-child { border-bottom: none; }
.trow:hover { background: #f9fafb; }
.trow-name { flex: 1; font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-decoration: none; }
.trow-name:hover { color: #1d4ed8; text-decoration: underline; }
.trow-bar { width: 80px; margin: 0 8px; flex-shrink: 0; }
.bar { height: 3px; background: #f3f4f6; border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 2px; }
.trow-count { font-size: 11px; font-weight: 600; color: #059669; min-width: 70px; text-align: right; flex-shrink: 0; }
.empty-msg { font-size: 11px; color: #d1d5db; padding: 8px 12px; font-style: italic; }
.hidden { display: none !important; }
</style>
</head>
<body>
<div class="controls">
  <label>Sort</label>
  <select id="folderSort" onchange="render()">
    <option value="rows-desc">Folders: Largest</option>
    <option value="rows-asc">Folders: Smallest</option>
    <option value="name-asc">Folders: A–Z</option>
    <option value="name-desc">Folders: Z–A</option>
  </select>
  <select id="workbookSort" onchange="render()">
    <option value="rows-desc">Workbooks: Largest</option>
    <option value="rows-asc">Workbooks: Smallest</option>
    <option value="name-asc">Workbooks: A–Z</option>
    <option value="name-desc">Workbooks: Z–A</option>
  </select>
  <select id="tableSort" onchange="render()">
    <option value="rows-desc">Tables: Largest</option>
    <option value="rows-asc">Tables: Smallest</option>
    <option value="name-asc">Tables: A–Z</option>
    <option value="name-desc">Tables: Z–A</option>
  </select>
  <div class="vsep"></div>
  <button class="ctrl-btn" onclick="expandAll()">Expand all</button>
  <button class="ctrl-btn" onclick="collapseAll()">Collapse all</button>
  <div class="vsep"></div>
  <div class="search-wrap">
    <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="text" id="search" placeholder="Search folders, workbooks, tables…" oninput="filterSearch(this.value)">
  </div>
  <div class="total-pill">${totalStr} rows &nbsp;·&nbsp; ${dateStr}</div>
</div>
<div class="layout">
  <div class="sidebar">
    <div class="sidebar-section">Folders</div>
    <div id="sidebarFolders"></div>
  </div>
  <div class="content">
    <div class="stats-row" id="statsRow"></div>
    <div class="table-header">
      <div class="col-name">Name</div>
      <div class="col-tables">Tables</div>
      <div style="width:90px;margin:0 8px"></div>
      <div class="col-rows">Rows</div>
    </div>
    <div id="main"></div>
  </div>
</div>
<script>
const RAW=${JSON.stringify(data)};
const BASE='${baseUrl}';
function allTableRows(n){const r=n.workbooks.flatMap(w=>w.tables.map(t=>t.rows));return r.concat(n.folders.flatMap(f=>allTableRows(f)));}
const maxRows=Math.max(...allTableRows(RAW),1);
const fmt=n=>n.toLocaleString();
function sv(id){return document.getElementById(id).value;}
function sorted(arr,sid,rk){const v=sv(sid),s=[...arr];if(v.includes('rows-desc'))s.sort((a,b)=>b[rk]-a[rk]);else if(v.includes('rows-asc'))s.sort((a,b)=>a[rk]-b[rk]);else if(v.includes('name-asc'))s.sort((a,b)=>a.name.localeCompare(b.name));else if(v.includes('name-desc'))s.sort((a,b)=>b.name.localeCompare(a.name));return s;}
let uid=0;function nid(){return 'x'+(++uid);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function pct(v){return Math.min(100,Math.round((v/maxRows)*100));}
function barHtml(v){return '<div style="width:90px;margin:0 8px"><div class="bar"><div class="bar-fill" style="width:'+pct(v)+'%"></div></div></div>';}
function renderTables(tables,wbId){const ts=sorted(tables,'tableSort','rows');if(!ts.length)return '<div class="empty-msg">No tables</div>';return '<div class="table-list">'+ts.map(t=>\`<div class="trow"><a class="trow-name" href="\${BASE}/workbooks/\${wbId}/tables/\${t.id}" target="_blank" title="\${esc(t.name)}">\${esc(t.name)}</a><div class="trow-bar"><div class="bar"><div class="bar-fill" style="width:\${pct(t.rows)}%"></div></div></div><span class="trow-count">\${fmt(t.rows)}</span></div>\`).join('')+'</div>';}
function renderWorkbook(wb){const id=nid();return \`<div class="workbook-block" data-wbname="\${esc(wb.name.toLowerCase())}"><div class="workbook-row" onclick="tog('\${id}')"><span class="chevron" id="c\${id}">▶</span><div class="wb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" width="10" height="10"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg></div><a class="workbook-link" href="\${BASE}/workbooks/\${wb.id}" target="_blank" title="\${esc(wb.name)}" onclick="event.stopPropagation()">\${esc(wb.name)}</a><span class="workbook-tcount">\${wb.tables.length}</span>\${barHtml(wb.totalRows)}<span class="workbook-rowcount">\${fmt(wb.totalRows)}</span></div><div class="workbook-children" id="\${id}">\${renderTables(wb.tables,wb.id)}</div></div>\`;}
function countWbs(f){return f.workbooks.length+f.folders.reduce((s,sf)=>s+countWbs(sf),0);}
function renderFolder(f){const id=nid(),wbs=sorted(f.workbooks,'workbookSort','totalRows'),fds=sorted(f.folders,'folderSort','totalRows'),inner=fds.map(renderFolder).join('')+wbs.map(renderWorkbook).join('');return \`<div class="folder-block" data-folderid="\${f.id}"><div class="folder-row" onclick="tog('\${id}')"><span class="chevron" id="c\${id}">▶</span><span class="folder-emoji">📁</span><a class="folder-link" href="\${BASE}/home/\${f.id}" target="_blank" onclick="event.stopPropagation()"><span class="folder-label">\${esc(f.name)}</span></a><span class="folder-wbcount">\${countWbs(f)} wb</span>\${barHtml(f.totalRows)}<span class="folder-rowcount">\${fmt(f.totalRows)}</span></div><div class="folder-children" id="\${id}">\${inner||'<div class="empty-msg">Empty</div>'}</div></div>\`;}
function tog(id){document.getElementById(id).classList.toggle('open');document.getElementById('c'+id).classList.toggle('open');}
function expandAll(){document.querySelectorAll('.folder-children,.workbook-children').forEach(e=>e.classList.add('open'));document.querySelectorAll('.chevron').forEach(e=>e.classList.add('open'));}
function collapseAll(){document.querySelectorAll('.folder-children,.workbook-children').forEach(e=>e.classList.remove('open'));document.querySelectorAll('.chevron').forEach(e=>e.classList.remove('open'));}
function nodeMatches(n,q){if(n.name&&n.name.toLowerCase().includes(q))return true;for(const w of(n.workbooks||[])){if(w.name.toLowerCase().includes(q))return true;for(const t of(w.tables||[]))if(t.name.toLowerCase().includes(q))return true;}for(const ff of(n.folders||[]))if(nodeMatches(ff,q))return true;return false;}
function renderFW(wb,q){const wm=wb.name.toLowerCase().includes(q),tables=wm?wb.tables:wb.tables.filter(t=>t.name.toLowerCase().includes(q));if(!wm&&!tables.length)return '';const id=nid();return \`<div class="workbook-block" data-wbname="\${esc(wb.name.toLowerCase())}"><div class="workbook-row" onclick="tog('\${id}')"><span class="chevron open" id="c\${id}">▶</span><div class="wb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" width="10" height="10"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg></div><a class="workbook-link" href="\${BASE}/workbooks/\${wb.id}" target="_blank" onclick="event.stopPropagation()">\${esc(wb.name)}</a><span class="workbook-tcount">\${tables.length}</span>\${barHtml(wb.totalRows)}<span class="workbook-rowcount">\${fmt(wb.totalRows)}</span></div><div class="workbook-children open" id="\${id}">\${renderTables(tables,wb.id)}</div></div>\`;}
function renderFF(f,q){if(!nodeMatches(f,q))return '';const fm=f.name.toLowerCase().includes(q),wbs=sorted(f.workbooks,'workbookSort','totalRows'),fds=sorted(f.folders,'folderSort','totalRows'),wbsH=(fm?wbs:wbs.filter(w=>w.name.toLowerCase().includes(q)||w.tables.some(t=>t.name.toLowerCase().includes(q)))).map(w=>renderFW(w,q)).join(''),fdsH=fds.map(ff=>renderFF(ff,q)).join(''),inner=fdsH+wbsH;if(!inner&&!fm)return '';const id=nid();return \`<div class="folder-block"><div class="folder-row" onclick="tog('\${id}')"><span class="chevron open" id="c\${id}">▶</span><span class="folder-emoji">📁</span><a class="folder-link" href="\${BASE}/home/\${f.id}" target="_blank" onclick="event.stopPropagation()"><span class="folder-label">\${esc(f.name)}</span></a><span class="folder-wbcount">\${countWbs(f)} wb</span>\${barHtml(f.totalRows)}<span class="folder-rowcount">\${fmt(f.totalRows)}</span></div><div class="folder-children open" id="\${id}">\${inner||'<div class="empty-msg">No matches inside</div>'}</div></div>\`;}
function filterSearch(val){const q=val.toLowerCase().trim();if(!q){render();return;}uid=0;setStats(calcStats(q),'matching results');const h=sorted(RAW.workbooks,'workbookSort','totalRows').map(w=>renderFW(w,q)).join('')+sorted(RAW.folders,'folderSort','totalRows').map(f=>renderFF(f,q)).join('');document.getElementById('main').innerHTML=h||'<div class="empty-msg" style="padding:20px;font-size:13px;color:#9ca3af">No results</div>';}
function calcStats(q){let rows=0,wbs=0,tables=0,folders=0;function wbS(wb){const wm=!q||wb.name.toLowerCase().includes(q);const ts=wm?wb.tables:wb.tables.filter(t=>t.name.toLowerCase().includes(q));if(!wm&&!ts.length)return;wbs++;tables+=ts.length;rows+=ts.reduce((s,t)=>s+t.rows,0);}function fS(f){if(q&&!nodeMatches(f,q))return;folders++;const fm=!q||f.name.toLowerCase().includes(q);(fm?f.workbooks:f.workbooks.filter(w=>w.name.toLowerCase().includes(q)||w.tables.some(t=>t.name.toLowerCase().includes(q)))).forEach(wbS);f.folders.forEach(fS);}RAW.workbooks.forEach(wbS);RAW.folders.forEach(fS);return{rows,wbs,tables,folders};}
function setStats(s,sub){document.getElementById('statsRow').innerHTML=\`<div class="stat-card"><div class="stat-label">Total Rows</div><div class="stat-val">\${fmt(s.rows)}</div><div class="stat-sub">\${sub}</div></div><div class="stat-card"><div class="stat-label">Folders</div><div class="stat-val">\${s.folders}</div><div class="stat-sub">matched</div></div><div class="stat-card"><div class="stat-label">Workbooks</div><div class="stat-val">\${fmt(s.wbs)}</div><div class="stat-sub">matched</div></div><div class="stat-card"><div class="stat-label">Tables</div><div class="stat-val">\${fmt(s.tables)}</div><div class="stat-sub">matched</div></div>\`;}
function render(){uid=0;setStats(calcStats(''),'across all workbooks');const rw=sorted(RAW.workbooks,'workbookSort','totalRows'),rf=sorted(RAW.folders,'folderSort','totalRows'),rwt=rw.reduce((s,w)=>s+w.totalRows,0);let html='';if(rw.length){const id=nid();html+=\`<div class="folder-block"><div class="folder-row" onclick="tog('\${id}')"><span class="chevron" id="c\${id}">▶</span><span class="folder-emoji">🗂️</span><span class="folder-label" style="flex:1">(No folder)</span><span class="folder-wbcount">\${rw.length} wb</span><div style="width:90px;margin:0 8px"></div><span class="folder-rowcount">\${fmt(rwt)}</span></div><div class="folder-children" id="\${id}">\${rw.map(renderWorkbook).join('')}</div></div>\`;}html+=rf.map(renderFolder).join('');document.getElementById('main').innerHTML=html;document.getElementById('sidebarFolders').innerHTML=rf.map(f=>\`<a class="sidebar-item" href="\${BASE}/home/\${f.id}" target="_blank"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${esc(f.name)}</span><span style="font-size:10px;color:#d1d5db;flex-shrink:0">\${fmt(f.totalRows)}</span></a>\`).join('');}
render();
</script>
</body>
</html>`;
}