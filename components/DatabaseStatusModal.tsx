'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, Terminal } from 'lucide-react';
import api from '@/client/src/api/apiClient';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [dbState, setDbState] = useState<{
    status: string;
    database?: { connected: boolean; atlasConfigured: boolean; error?: string };
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setIsChecking(true);
    try {
      const res = await api.checkHealth();
      setDbState(res as any);
    } catch {
      setDbState({
        status: 'offline',
        database: { connected: false, atlasConfigured: false, error: 'API unreachable' },
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      api
        .checkHealth()
        .then((res) => {
          if (isMounted) setDbState(res as any);
        })
        .catch(() => {
          if (isMounted) {
            setDbState({
              status: 'offline',
              database: { connected: false, atlasConfigured: false, error: 'API unreachable' },
            });
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(
      'MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connectly?retryWrites=true&w=majority"'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isConnected = dbState?.database?.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">MongoDB Atlas Database Status</h3>
              <p className="text-xs text-slate-500">
                CodeAlpha Task 2 Full Stack Database Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
              isConnected
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  {isConnected
                    ? 'Connected to Live MongoDB Atlas Cluster'
                    : 'Running in Local Embedded Store (Demo Mode)'}
                </div>
                <div className="text-xs mt-0.5 text-slate-600 leading-relaxed">
                  {isConnected
                    ? 'All user accounts, posts, comments, likes, and follows are persistently saved into your real MongoDB Atlas database via Mongoose.'
                    : 'The backend has initialized the MongoDB schema locally with complete bcrypt password hashing and JWT sessions. To persist to your external Atlas cluster, configure MONGODB_URI.'}
                </div>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={isChecking}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all border border-slate-200/80 shadow-xs shrink-0"
              title="Refresh database connection status"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick instructions for CodeAlpha Internship submission */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              How to Connect Your MongoDB Atlas Database:
            </h4>
            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <li>
                Log in to{' '}
                <a
                  href="https://cloud.mongodb.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline font-medium"
                >
                  MongoDB Atlas
                </a>{' '}
                and create a free M0 cluster.
              </li>
              <li>
                Under <strong>Security → Database Access</strong>, create a database user and password.
              </li>
              <li>
                Under <strong>Security → Network Access</strong>, add IP Address{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">0.0.0.0/0</code>{' '}
                (allows Render & Vercel serverless connections).
              </li>
              <li>
                Click <strong>Connect → Drivers (Node.js)</strong> and copy the connection string.
              </li>
              <li>
                Add the URI to your <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> file:
              </li>
            </ol>
          </div>

          {/* Env snippet copy */}
          <div className="bg-slate-900 rounded-xl p-3.5 text-slate-200 text-xs font-mono relative">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> .env
              </span>
              <button
                onClick={copyEnvSnippet}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="overflow-x-auto whitespace-pre text-emerald-400">
              MONGODB_URI=&quot;mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/connectly?retryWrites=true&amp;w=majority&quot;
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
