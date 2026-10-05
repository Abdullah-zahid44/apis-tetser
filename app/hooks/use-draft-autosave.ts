'use client';

import { useEffect, useRef, useState } from 'react';
import type { Environment, HeaderRow, Method, ParamRow } from '@/components/console/types';

/** Shape of the persisted workbench draft. Matches the backend contract for GET/PUT /api/draft. */
export type WorkbenchState = {
  requestName: string;
  url: string;
  method: Method;
  paramRows: ParamRow[];
  headerRows: HeaderRow[];
  body: string;
  selectedCountry: string;
  environment: Environment;
};

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const METHODS: readonly Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTOSAVE_DEBOUNCE_MS = 1000;

function serializeState(s: WorkbenchState): string {
  return JSON.stringify({
    requestName: s.requestName,
    url: s.url,
    method: s.method,
    paramRows: s.paramRows,
    headerRows: s.headerRows,
    body: s.body,
    selectedCountry: s.selectedCountry,
    environment: s.environment,
  });
}

function sanitizeRow(r: unknown, prefix: string, idx: number): ParamRow & HeaderRow {
  const row = (r ?? {}) as Record<string, unknown>;
  return {
    id: typeof row.id === 'string' && row.id ? row.id : `${prefix}-${idx}`,
    enabled: row.enabled !== false,
    key: typeof row.key === 'string' ? row.key : '',
    value: typeof row.value === 'string' ? row.value : '',
  };
}

/** Coerce an unknown payload into a WorkbenchState; null when unusable. */
function sanitizeDraft(raw: unknown): WorkbenchState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const method: Method = METHODS.includes(s.method as Method) ? (s.method as Method) : 'POST';
  return {
    requestName: typeof s.requestName === 'string' ? s.requestName : '',
    url: typeof s.url === 'string' ? s.url : '',
    method,
    paramRows: Array.isArray(s.paramRows) ? s.paramRows.map((r, i) => sanitizeRow(r, 'draft-p', i)) : [],
    headerRows: Array.isArray(s.headerRows) ? s.headerRows.map((r, i) => sanitizeRow(r, 'draft-h', i)) : [],
    body: typeof s.body === 'string' ? s.body : '',
    selectedCountry: typeof s.selectedCountry === 'string' && s.selectedCountry ? s.selectedCountry : 'pkr',
    environment: 'sandbox',
  };
}

type UseDraftAutosaveOptions = {
  /** Only true when the session is authenticated — never fires GET/PUT otherwise. */
  enabled: boolean;
  /** Current live workbench snapshot. */
  state: WorkbenchState;
  /** Applies the restored draft to the workbench. Called at most once per page load. */
  onRestore: (state: WorkbenchState) => void;
};

export function useDraftAutosave({ enabled, state, onRestore }: UseDraftAutosaveOptions) {
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  // NO-CLOBBER GUARD: the auto-save effect below is blocked until this is true,
  // i.e. the initial GET /api/draft has fully settled (success or failure).
  // This guarantees we never PUT empty/default state over a real draft.
  const draftLoadedRef = useRef(false);
  // JSON of the last successfully PUT state — PUTs are skipped while unchanged.
  const lastSavedJsonRef = useRef<string | null>(null);
  const loadAttemptedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // 1. Initial load: restore the draft once the user is authenticated.
  useEffect(() => {
    if (!enabled || loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/draft');
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { draft?: { state?: unknown } | null };
        const sanitized = sanitizeDraft(data?.draft?.state);
        if (cancelled || !sanitized) return;
        // Seed the last-saved snapshot so the restore itself is never re-PUT.
        lastSavedJsonRef.current = serializeState(sanitized);
        onRestoreRef.current(sanitized);
      } catch {
        // Silent: keep defaults; auto-save will persist future edits.
      } finally {
        if (!cancelled) draftLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // 2. Debounced auto-save: fires 1s after the last edit, only when the state
  // actually changed since the last successful save. Blocked until the initial
  // draft load settles (draftLoadedRef) — never clobbers the server draft.
  useEffect(() => {
    if (!enabled || !draftLoadedRef.current) return;
    const json = serializeState(state);
    if (json === lastSavedJsonRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        setDraftSaveStatus('saving');
        try {
          const res = await fetch('/api/draft', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: JSON.parse(json) as WorkbenchState }),
          });
          if (!res.ok) throw new Error(`draft PUT failed: ${res.status}`);
          lastSavedJsonRef.current = json;
          setDraftSaveStatus('saved');
          setDraftSavedAt(new Date());
        } catch {
          // Silent by design: keep the last-known-good indicator; the next
          // edit re-triggers this effect and retries the save.
          setDraftSaveStatus('failed');
        }
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [enabled, state]);

  return { draftSaveStatus, draftSavedAt };
}
