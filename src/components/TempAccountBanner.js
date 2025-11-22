'use client';

import { Key, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function TempAccountBanner({ onSetPassword }) {
  const [expanded, setExpanded] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  return (
    <div className="border border-yellow-300 bg-yellow-50 rounded-md p-4 mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-100 rounded-full"><Key className="h-5 w-5 text-yellow-700" /></div>
        <div className="flex-1">
          <div className="font-medium text-sm text-yellow-900">Temporary Account Created</div>
          <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
            Your booking profile was created with a placeholder password. For security, set a permanent password and verify your details.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs px-2 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-medium"
            >{expanded ? 'Hide details' : 'Why this?'}
            </button>
            <button
              onClick={() => { setShowUpgradeForm(true); setError(''); }}
              className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" /> Set Password
            </button>
          </div>
          {expanded && (
            <div className="mt-3 text-[11px] text-yellow-800 space-y-1">
              <p>We allow quick guest → account upgrades by creating a secure temporary account during booking. Until you set a password, sign-ins require the email link flow (or a future OTP).</p>
              <p>Setting a password helps: (1) secure future bookings, (2) manage cancellations, (3) view history across devices.</p>
            </div>
          )}
          {showUpgradeForm && (
            <div className="mt-4 bg-white border border-yellow-200 rounded p-3 space-y-2">
              <div className="text-xs font-medium text-yellow-900">Upgrade Account</div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {error && <div className="text-xs text-red-600">{error}</div>}
              {success && <div className="text-xs text-green-600">Upgraded successfully.</div>}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={async () => {
                    setError(''); setSuccess(false);
                    if (!form.email || !form.password) { setError('Email & password required'); return; }
                    const res = await fetch('/api/auth/upgrade', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) { setError(data.error || 'Upgrade failed'); return; }
                    setSuccess(true);
                    setTimeout(() => { setShowUpgradeForm(false); onSetPassword?.(); }, 1200);
                  }}
                  className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
                >Upgrade</button>
                <button
                  onClick={() => { setShowUpgradeForm(false); }}
                  className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
