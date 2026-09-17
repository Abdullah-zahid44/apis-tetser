'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Braces,
  Plus,
  Trash2,
  Lock,
  Globe,
  Info,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VariableItem } from './types';

interface VariablesWorkspaceProps {
  countrySlug: string;
  environment: string;
}

export function VariablesWorkspace({ countrySlug, environment }: VariablesWorkspaceProps) {
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // New variable form state
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [description, setDescription] = useState('');
  const [varScope, setVarScope] = useState<'all' | 'sandbox'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const fetchVariables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/variables');
      if (res.ok) {
        const data = (await res.json()) as { variables?: VariableItem[] };
        setVariables(data.variables || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVariables();
  }, [fetchVariables]);

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    try {
      const res = await fetch('/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          country: countrySlug,
          environment: varScope,
          key: key.trim(),
          value: value.trim(),
          isSecret,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        setSavedMessage('Variable saved');
        setTimeout(() => setSavedMessage(''), 1800);
        setKey('');
        setValue('');
        setIsSecret(false);
        setDescription('');
        setEditingId(null);
        await fetchVariables();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      const res = await fetch(`/api/variables?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchVariables();
      }
    } catch {
      // ignore
    }
  };

  const handleStartEdit = (item: VariableItem) => {
    setEditingId(item.id);
    setKey(item.key);
    setValue(item.value === '••••••••' ? '' : item.value);
    setIsSecret(item.isSecret);
    setDescription(item.description || '');
    setVarScope((item.environment as 'all' | 'sandbox') || 'all');
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background p-3 sm:p-4 lg:p-6 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2">
              <Braces size={18} className="text-primary" />
              <span>Variables</span>
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchVariables()}
            className="h-7 text-xs bg-card border-border hover:bg-muted text-secondary-foreground gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'spin text-primary' : ''} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Add / Edit Form */}
        <form
          onSubmit={handleSaveVariable}
          className="p-3 sm:p-4 rounded-lg bg-card border border-border space-y-3"
        >
          <div className="flex items-center justify-between">
            <strong className="text-xs font-semibold text-foreground">
              {editingId ? 'Edit variable' : 'New variable'}
            </strong>
            {savedMessage && (
              <span className="text-xs text-success flex items-center gap-1">
                <CheckCircle2 size={13} />
                {savedMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                Variable Key
              </label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="orderId"
                className="h-8 text-xs font-mono bg-card border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                Scope
              </label>
              <select
                value={varScope}
                onChange={(e) => setVarScope(e.target.value as 'all' | 'sandbox')}
                className="h-8 w-full text-xs bg-card border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Global (All Envs)</option>
                <option value="sandbox">Gateway Only</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                Value
              </label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  isSecret && editingId
                    ? 'Leave blank to preserve encrypted secret'
                    : 'ORD-12345 or 500'
                }
                className="h-8 text-xs font-mono bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                Description (Optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Merchant transaction ID for checkout test cases"
                className="h-8 text-xs bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 text-xs text-secondary-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded bg-card border-border text-primary cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Lock size={12} className="text-warning" />
                  <span>Mask / Encrypt Secret</span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setKey('');
                  setValue('');
                  setIsSecret(false);
                  setDescription('');
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs bg-primary hover:bg-primary text-primary-foreground font-semibold px-4 cursor-pointer shadow-xs"
            >
              {editingId ? 'Update Variable' : 'Save Variable'}
            </Button>
          </div>
        </form>

        {/* Variables Table */}
        <div className="rounded-lg border border-border overflow-x-auto bg-card">
          <table className="mobile-card-table w-full min-w-[720px] text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-semibold tracking-[0.05em] border-b border-border">
              <tr>
                <th className="p-3">Variable Key</th>
                <th className="p-3">Value</th>
                <th className="p-3">Scope</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {variables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-sans text-xs">
                    No custom environment variables defined yet. Create one above to start interpolating {'{{variableName}}'}.
                  </td>
                </tr>
              ) : (
                variables.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                    <td data-label="Key" className="p-3 font-semibold text-primary">
                      {'{{'}{item.key}{'}}'}
                    </td>
                    <td data-label="Value" className="p-3 text-foreground">
                      {item.isSecret ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-warning font-mono">
                            <Lock size={12} />
                            <span>{revealedIds[item.id] ? item.value : '••••••••'}</span>
                          </span>
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="text-muted-foreground hover:text-secondary-foreground p-0.5 cursor-pointer"
                            title={revealedIds[item.id] ? 'Hide Secret' : 'Reveal Secret'}
                          >
                            {revealedIds[item.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span>{item.value || '(empty)'}</span>
                      )}
                    </td>
                    <td data-label="Scope" className="p-3">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-secondary-foreground uppercase">
                        {item.environment === 'sandbox' ? 'Gateway' : item.environment}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground font-sans text-xs">{item.description || '—'}</td>
                    <td data-label="Actions" className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-muted-foreground hover:text-primary cursor-pointer rounded hover:bg-muted"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => void handleDeleteVariable(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer rounded hover:bg-muted"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
