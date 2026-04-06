export interface ClayTable {
  id: string;
  name: string;
  rows: number;
}

export interface ClayWorkbook {
  id: string;
  name: string;
  tables: ClayTable[];
  totalRows: number;
}

export interface ClayFolder {
  id: string;
  name: string;
  totalRows: number;
  workbooks: ClayWorkbook[];
  folders: ClayFolder[];
}

export interface AuditProgress {
  type: 'progress';
  message: string;
  detail?: string;
}

export interface AuditComplete {
  type: 'complete';
  data: { folders: ClayFolder[]; workbooks: ClayWorkbook[] };
  total: number;
}

export interface AuditError {
  type: 'error';
  message: string;
}

export type AuditEvent = AuditProgress | AuditComplete | AuditError;

function clayHeaders(cookie: string) {
  return {
    origin: 'https://app.clay.com',
    referer: 'https://app.clay.com/',
    cookie: `claysession=${cookie}`,
    'user-agent': 'Mozilla/5.0',
  };
}

async function clayGet(path: string, cookie: string) {
  const res = await fetch(`https://api.clay.com${path}`, {
    headers: clayHeaders(cookie),
    next: { revalidate: 0 },
  });
  if (!res.ok) return {};
  return res.json().catch(() => ({}));
}

async function clayPost(path: string, body: object, cookie: string) {
  const res = await fetch(`https://api.clay.com${path}`, {
    method: 'POST',
    headers: { ...clayHeaders(cookie), 'content-type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });
  if (!res.ok) return {};
  return res.json().catch(() => ({}));
}

async function getResources(parentResource: { type: string; id: string } | null, wsId: string, cookie: string) {
  const res = await clayPost(`/v3/workspaces/${wsId}/resources_v2/`, {
    parentResource,
    filters: {},
    isGlobalSearch: false,
  }, cookie);
  return (res.resources || []) as Array<{ resourceType: string; id: string; name: string; parentFolderId: string | null }>;
}

async function getWorkbookTables(wbId: string, wsId: string, cookie: string) {
  const wb = await clayGet(`/v3/${wsId}/workbooks/${wbId}`, cookie);
  return (wb.orderedWorkbookTables || []) as Array<{ id: string; name: string }>;
}

async function getTableCount(tableId: string, cookie: string): Promise<number> {
  const res = await clayGet(`/v3/tables/${tableId}/count`, cookie);
  return res.tableTotalRecordsCount || 0;
}

export async function runAudit(
  cookie: string,
  wsId: string,
  onEvent: (event: AuditEvent) => void
): Promise<void> {
  async function traverseFolder(
    parentResource: { type: string; id: string } | null
  ): Promise<{ folders: ClayFolder[]; workbooks: ClayWorkbook[] }> {
    const resources = await getResources(parentResource, wsId, cookie);
    const parentId = parentResource?.id ?? null;
    const here = resources.filter(r => r.parentFolderId === parentId);
    const folders = here.filter(r => r.resourceType === 'FOLDER');
    const workbooks = here.filter(r => r.resourceType === 'WORKBOOK');

    // Fetch all workbook tables in parallel
    const wbTableLists = await Promise.all(
      workbooks.map(wb => {
        onEvent({ type: 'progress', message: `📓 Getting workbook`, detail: wb.name });
        return getWorkbookTables(wb.id, wsId, cookie);
      })
    );

    // Collect all table IDs
    const tableEntries: Array<{ wbIdx: number; tableId: string; tableName: string }> = [];
    wbTableLists.forEach((tables, i) => {
      tables.forEach(t => tableEntries.push({ wbIdx: i, tableId: t.id, tableName: t.name }));
    });

    // Fetch all row counts in parallel
    const counts = await Promise.all(
      tableEntries.map(e => {
        onEvent({ type: 'progress', message: `📊 Counting rows`, detail: e.tableName });
        return getTableCount(e.tableId, cookie);
      })
    );
    tableEntries.forEach((e, i) => { (e as any).rowCount = counts[i]; });

    const wbSummaries: ClayWorkbook[] = workbooks.map((wb, i) => {
      const tables = tableEntries
        .filter(e => e.wbIdx === i)
        .map(e => ({ id: e.tableId, name: e.tableName, rows: (e as any).rowCount as number }));
      return { id: wb.id, name: wb.name, tables, totalRows: tables.reduce((s, t) => s + t.rows, 0) };
    });

    const folderSummaries: ClayFolder[] = [];
    for (const folder of folders) {
      onEvent({ type: 'progress', message: `📁 Scanning folder`, detail: folder.name });
      const sub = await traverseFolder({ type: 'FOLDER', id: folder.id });
      const folderTotal =
        sub.workbooks.reduce((s, wb) => s + wb.totalRows, 0) +
        sub.folders.reduce((s, f) => s + f.totalRows, 0);
      folderSummaries.push({
        id: folder.id,
        name: folder.name,
        totalRows: folderTotal,
        workbooks: sub.workbooks,
        folders: sub.folders,
      });
    }

    return { folders: folderSummaries, workbooks: wbSummaries };
  }

  onEvent({ type: 'progress', message: '🚀 Starting workspace audit...', detail: '' });
  const result = await traverseFolder(null);
  const total =
    result.workbooks.reduce((s, w) => s + w.totalRows, 0) +
    result.folders.reduce((s, f) => s + f.totalRows, 0);

  onEvent({ type: 'complete', data: result, total });
}