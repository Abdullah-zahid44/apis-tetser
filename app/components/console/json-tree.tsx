'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { copyText, looksLikeUrl, sanitizeUrl, urlLink } from './response-panel';

/** Cap on rendered nodes — keeps huge payloads from freezing the panel. */
const MAX_NODES = 2000;
/** Containers at this depth or deeper start collapsed. Root itself is depth 0. */
const DEFAULT_EXPAND_DEPTH = 2;
const ROOT_PATH = 'data';

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === 'object';
}

/** Build a JSON path segment: `parent.child`, `parent[0]`, or `parent["weird key"]`. */
function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

/**
 * Collect paths of every non-empty container. `minDepth` selects which ones
 * (default-collapse uses depth >= 2; collapse-all uses depth >= 0).
 */
function collectContainerPaths(
  value: unknown,
  path: string,
  depth: number,
  out: Set<string>,
  minDepth: number,
): void {
  if (!isContainer(value)) return;
  const size = Array.isArray(value) ? value.length : Object.keys(value).length;
  if (size === 0) return;
  if (depth >= minDepth) out.add(path);
  const children: Array<[string | number, unknown]> = Array.isArray(value)
    ? value.map((v, i) => [i, v] as [number, unknown])
    : Object.entries(value);
  for (const [k, v] of children) {
    collectContainerPaths(v, childPath(path, k), depth + 1, out, minDepth);
  }
}

interface JsonTreeProps {
  /** Already-parsed JSON value to render. */
  data: unknown;
}

export function JsonTree({ data }: JsonTreeProps) {
  // Collapsed container paths. Default: first 2 levels expanded, deeper collapsed.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    collectContainerPaths(data, ROOT_PATH, 0, initial, DEFAULT_EXPAND_DEPTH);
    return initial;
  });
  // Path currently showing the transient "Copied" label.
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const copyTimer = useRef<number | null>(null);
  // Mutable node counter, reset on every render before the recursive pass.
  const nodeCount = useRef(0);
  nodeCount.current = 0;

  const copyPath = async (path: string) => {
    if (await copyText(path)) {
      setCopiedPath(path);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedPath(null), 1200);
    }
  };

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const all = new Set<string>();
    collectContainerPaths(data, ROOT_PATH, 0, all, 0);
    setCollapsed(all);
  };

  const renderLeaf = (value: unknown, path: string): React.ReactNode => {
    const onCopy = () => void copyPath(path);
    const clickToCopy =
      'cursor-pointer rounded px-0.5 -ml-0.5 hover:bg-accent/60 transition-colors duration-150';

    if (value === null) {
      return (
        <span
          onClick={onCopy}
          title={`Copy path ${path}`}
          className={`text-muted-foreground/60 ${clickToCopy}`}
        >
          null
        </span>
      );
    }
    switch (typeof value) {
      case 'string': {
        // Payment/checkout URL behavior, same detection + styling as the raw view.
        const clean = sanitizeUrl(value);
        if (looksLikeUrl(clean)) {
          return (
            <span onClick={(e) => e.stopPropagation()}>
              {urlLink(clean, JSON.stringify(value), `tree-url-${path}`)}
            </span>
          );
        }
        return (
          <span
            onClick={onCopy}
            title={`Copy path ${path}`}
            className={`text-success break-all ${clickToCopy}`}
          >
            {JSON.stringify(value)}
          </span>
        );
      }
      case 'number':
      case 'bigint':
        return (
          <span
            onClick={onCopy}
            title={`Copy path ${path}`}
            className={`text-primary tabular-nums ${clickToCopy}`}
          >
            {String(value)}
          </span>
        );
      case 'boolean':
        return (
          <span onClick={onCopy} title={`Copy path ${path}`} className={`text-info ${clickToCopy}`}>
            {String(value)}
          </span>
        );
      default:
        return (
          <span
            onClick={onCopy}
            title={`Copy path ${path}`}
            className={`text-muted-foreground ${clickToCopy}`}
          >
            {String(value)}
          </span>
        );
    }
  };

  const renderContainer = (
    value: Record<string, unknown> | unknown[],
    path: string,
  ): React.ReactNode => {
    const isArray = Array.isArray(value);
    const entries: Array<[string | number, unknown]> = isArray
      ? value.map((v, i) => [i, v] as [number, unknown])
      : Object.entries(value);
    const count = entries.length;
    const open = isArray ? '[' : '{';
    const close = isArray ? ']' : '}';

    // Empty containers render inline with no toggle.
    if (count === 0) {
      return (
        <span className="text-muted-foreground">
          {open}
          {close}
        </span>
      );
    }

    const isCollapsed = collapsed.has(path);
    const togglePath = () => toggle(path);
    let truncated = false;

    return (
      <>
        <span className="inline-flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePath();
            }}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${path}` : `Collapse ${path}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-accent/60 -ml-1 mr-0.5"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          <span onClick={togglePath} className="cursor-pointer" title={isCollapsed ? 'Expand' : 'Collapse'}>
            <span className="text-muted-foreground">{open}</span>
            {isCollapsed && (
              <>
                <span className="text-muted-foreground/60 tabular-nums">{count}</span>
                <span className="text-muted-foreground">{close}</span>
              </>
            )}
          </span>
        </span>
        {!isCollapsed && (
          <>
            <div className="pl-4">
              {entries.map(([k, v]) => {
                if (truncated) return null;
                if (nodeCount.current >= MAX_NODES) {
                  truncated = true;
                  return (
                    <div key="__truncated" className="text-muted-foreground/60">
                      …truncated ({MAX_NODES}+ nodes)
                    </div>
                  );
                }
                const keyPath = childPath(path, k);
                return (
                  <div key={String(k)} className="leading-relaxed">
                    {typeof k === 'number' ? null : (
                      <>
                        <span
                          onClick={() => void copyPath(keyPath)}
                          title={`Copy path ${keyPath}`}
                          className="cursor-pointer rounded px-0.5 -ml-0.5 text-foreground transition-colors duration-150 hover:bg-accent/60"
                        >
                          {k}
                        </span>
                        <span className="text-muted-foreground">: </span>
                      </>
                    )}
                    {renderValue(v, keyPath)}
                    {copiedPath === keyPath && (
                      <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-success">
                        Copied
                      </span>
                    )}
                    <span className="text-muted-foreground">,</span>
                  </div>
                );
              })}
            </div>
            <div>
              <span className="text-muted-foreground">{close}</span>
            </div>
          </>
        )}
      </>
    );
  };

  const renderValue = (value: unknown, path: string): React.ReactNode => {
    nodeCount.current += 1;
    if (nodeCount.current > MAX_NODES) return null;
    if (isContainer(value)) return renderContainer(value, path);
    return renderLeaf(value, path);
  };

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={expandAll}
          className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-accent/60"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-accent/60"
        >
          Collapse all
        </button>
      </div>
      <div className="font-mono text-xs tabular-nums select-text leading-relaxed break-all">
        {renderValue(data, ROOT_PATH)}
      </div>
    </div>
  );
}
