import React, { useState } from 'react';
import { Send, CheckCircle, AlertOctagon, Loader2, Mail } from 'lucide-react';
import { useApp } from '../state/AppContext';

const DEMO_RECIPIENTS = [
  { label: 'Alappuzha District Collectorate Control Room', email: 'collectorate.alappuzha@disaster-command.gov' },
  { label: 'Kottayam Emergency Operations Centre (EOC)', email: 'eoc.kottayam@disaster-command.gov' },
  { label: 'NDRF 10th Battalion Relief Dispatch', email: 'ndrf.dispatch@disaster-command.gov' },
  { label: 'Demo Email Test Recipient', email: 'demo.responder@disaster-command.org' }
];

export default function AlertComposer() {
  const { recordSentAlert, isOffline, setOfflineQueue } = useApp();

  const [recipientEmail, setRecipientEmail] = useState(DEMO_RECIPIENTS[0].email);
  const [subject, setSubject] = useState('URGENT: Kuttanad Inundation Alert & Immediate Evacuation Directive');
  const [message, setMessage] = useState('Critical water level threshold reached in Kuttanad basin (Pamba & Meenachil overflow). Initiate Priority 1 hospital evacuations and open secondary relief camps immediately.');
  const [isSending, setIsSending] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    setStatusResult(null);

    try {
      if (isOffline) {
        // Simulate queueing the alert locally
        const queuedAlert = {
          id: `alert-queued-${Date.now()}`,
          subject,
          message,
          recipientEmail,
          status: 'QUEUED (OFFLINE)',
          timestamp: new Date().toISOString(),
        };
        setOfflineQueue(prev => [...prev, queuedAlert]);
        recordSentAlert(queuedAlert);
        setStatusResult({ success: true, message: 'System offline: Alert queued locally for sync.' });
        setIsSending(false);
        return;
      }

      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          recipientEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusResult({ success: true, message: data.message || 'Alert successfully dispatched to email transporter.' });
        recordSentAlert({
          id: `alert-${Date.now()}`,
          subject,
          message,
          recipientEmail,
          status: 'DELIVERED',
          timestamp: new Date().toISOString(),
        });
      } else {
        setStatusResult({ success: false, error: data.error || 'Failed to send alert.' });
        recordSentAlert({
          id: `alert-${Date.now()}`,
          subject,
          message,
          recipientEmail,
          status: 'FAILED',
          error: data.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Alert sending exception:', err);
      setStatusResult({ success: true, message: 'Alert recorded locally (Express API unreachable).' });
      recordSentAlert({
        id: `alert-${Date.now()}`,
        subject,
        message,
        recipientEmail,
        status: 'LOCAL_RECORD',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Broadcast Emergency Alert</h2>
          <p className="text-xs text-slate-500">Dispatch transactional email alerts to regional response command centers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Official Recipient
          </label>
          <select
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 transition-colors"
          >
            {DEMO_RECIPIENTS.map((rec) => (
              <option key={rec.email} value={rec.email}>
                {rec.label} ({rec.email})
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Alert Subject Heading
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
            placeholder="Alert Subject..."
            required
          />
        </div>

        {/* Message Body */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Emergency Directive Body
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
            placeholder="Type directive body..."
            required
          />
        </div>

        {/* Status Feedback */}
        {statusResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              statusResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {statusResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusResult.success ? statusResult.message : statusResult.error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transmitting Alert...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit Emergency Alert</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
