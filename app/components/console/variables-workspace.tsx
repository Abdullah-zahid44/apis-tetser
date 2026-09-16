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
import { Badge } from '@/components/ui/badge';
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
  const [varScope, setVarScope] = useState<'all' | 'sandbox' | 'production'>('all');
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
    setVarScope((item.environment as 'all' | 'sandbox' | 'production') || 'all');
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080b11] p-3 sm:p-4 lg:p-6 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2336]">
          <div>
            <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <Braces size={18} className="text-sky-400" />
              <span>Environment Variables Workspace</span>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[9.5px] font-mono border-slate-700 text-slate-400"
              >
                AES-256-GCM Vault
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define scoped variables and interpolate them with{' '}
              <code className="text-sky-300 font-mono">{'{{variableName}}'}</code> across URL paths, parameters, headers, and payloads.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchVariables()}
            className="h-7 text-xs bg-[#111724] border-[#1f2a3e] hover:bg-[#182236] text-slate-300 gap-1.5 cursor-pointer font-mono"
          >
            <RefreshCw size={12} className={loading ? 'spin text-sky-400' : ''} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Add / Edit Form */}
        <form
          onSubmit={handleSaveVariable}
          className="p-3 sm:p-4 rounded-lg bg-[#0d121c] border border-[#1a2336] space-y-3"
        >
          <div className="flex items-center justify-between">
            <strong className="text-xs font-semibold text-slate-200">
              {editingId ? 'Edit Environment Variable' : 'Create New Environment Variable'}
            </strong>
            {savedMessage && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 size={13} />
                {savedMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Variable Key
              </label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="orderId"
                className="h-8 text-xs font-mono bg-[#111724] border-[#1f2a3e] text-slate-100 placeholder:text-slate-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
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
                className="h-8 text-xs font-mono bg-[#111724] border-[#1f2a3e] text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Scope
              </label>
              <select
                value={varScope}
                onChange={(e) => setVarScope(e.target.value as 'all' | 'sandbox' | 'production')}
                className="w-full h-8 px-2.5 rounded-md text-xs font-mono bg-[#111724] border border-[#1f2a3e] text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Global (All Envs)</option>
                <option value="sandbox">Sandbox Only</option>
                <option value="production">Production Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div className="md:col-span-3">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Description (Optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Merchant transaction ID for checkout test cases"
                className="h-8 text-xs bg-[#111724] border-[#1f2a3e] text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded bg-[#111724] border-[#1f2a3e] text-sky-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Lock size={12} className="text-amber-400" />
                  <span>Mask / Encrypt Secret</span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a2336]">
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
                className="h-7 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 cursor-pointer shadow-xs"
            >
              {editingId ? 'Update Variable' : 'Save Variable'}
            </Button>
          </div>
        </form>

        {/* Variables Table */}
        <div className="rounded-lg border border-[#1a2336] overflow-x-auto bg-[#0d121c]">
          <table className="w-full min-w-[720px] text-xs text-left">
            <thead className="bg-[#101624] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1a2336]">
              <tr>
                <th className="p-3">Variable Key</th>
                <th className="p-3">Value</th>
                <th className="p-3">Scope</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336] font-mono">
              {variables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans text-xs">
                    No custom environment variables defined yet. Create one above to start interpolating {'{{variableName}}'}.
                  </td>
                </tr>
              ) : (
                variables.map((item) => (
                  <tr key={item.id} className="hover:bg-[#101726]/60">
                    <td className="p-3 font-semibold text-sky-400">
                      {'{{'}{item.key}{'}}'}
                    </td>
                    <td className="p-3 text-slate-200">
                      {item.isSecret ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-amber-400 font-mono">
                            <Lock size={12} />
                            <span>{revealedIds[item.id] ? item.value : '••••••••'}</span>
                          </span>
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                            title={revealedIds[item.id] ? 'Hide Secret' : 'Reveal Secret'}
                          >
                            {revealedIds[item.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span>{item.value || '(empty)'}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#162032] text-slate-300 uppercase">
                        {item.environment}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-sans text-xs">{item.description || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 cursor-pointer rounded hover:bg-[#162032]"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => void handleDeleteVariable(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer rounded hover:bg-[#162032]"
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
