import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertOctagon, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useApp } from '../state/AppContext';

const DEMO_RECIPIENTS = [
  { label: 'Alappuzha District Collectorate Control Room', email: 'collectorate.alappuzha@disaster-command.gov' },
  { label: 'Kottayam Emergency Operations Centre (EOC)', email: 'eoc.kottayam@disaster-command.gov' },
  { label: 'NDRF 10th Battalion Relief Dispatch', email: 'ndrf.dispatch@disaster-command.gov' },
  { label: 'Demo Email Test Recipient', email: 'demo.responder@disaster-command.org' }
];

export default function AlertComposer() {
  const { recordSentAlert, isOffline, setOfflineQueue, alertPrefillData, setAlertPrefillData } = useApp();

  const [recipientEmail, setRecipientEmail] = useState(DEMO_RECIPIENTS[0].email);
  const [subject, setSubject] = useState('URGENT: Kuttanad Inundation Alert & Immediate Evacuation Directive');
  const [message, setMessage] = useState('Critical water level threshold reached in Kuttanad basin (Pamba & Meenachil overflow). Initiate Priority 1 hospital evacuations and open secondary relief camps immediately.');
  const [isSending, setIsSending] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  // Auto-populate from alertPrefillData when it changes
  useEffect(() => {
    if (alertPrefillData) {
      if (alertPrefillData.subject) setSubject(alertPrefillData.subject);
      if (alertPrefillData.message) setMessage(alertPrefillData.message);
      // Clear prefill after applying so it doesn't re-apply on next render
      setAlertPrefillData(null);
    }
  }, [alertPrefillData, setAlertPrefillData]);

  // Store last submission params for retry
  const [lastSubmission, setLastSubmission] = useState(null);

  const doSend = async (submissionData) => {
    const { subj, msg, email } = submissionData;
    setIsSending(true);
    setStatusResult(null);

    try {
      if (isOffline) {
        // Simulate queueing the alert locally
        const queuedAlert = {
          id: `alert-queued-${Date.now()}`,
          subject: subj,
          message: msg,
          recipientEmail: email,
          status: 'QUEUED (OFFLINE)',
          timestamp: new Date().toISOString(),
        };
        setOfflineQueue(prev => [...prev, queuedAlert]);
        recordSentAlert(queuedAlert);
        setStatusResult({
          success: true,
          message: 'System offline: Alert queued locally for sync.',
          channels: [{ channel: 'email', status: 'queued', detail: 'Will send when back online' }],
        });
        setIsSending(false);
        return;
      }

      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subj,
          message: msg,
          recipientEmail: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusResult({
          success: true,
          message: data.message || 'Alert successfully dispatched to email transporter.',
          channels: [{ channel: 'email', status: 'sent', detail: `Delivered to ${email}` }],
        });
        recordSentAlert({
          id: `alert-${Date.now()}`,
          subject: subj,
          message: msg,
          recipientEmail: email,
          status: 'DELIVERED',
          timestamp: new Date().toISOString(),
        });
        setLastSubmission(null); // Clear retry on success
      } else {
        // Server returned an error response
        setStatusResult({
          success: false,
          error: data.error || 'Failed to send alert.',
          channels: [{ channel: 'email', status: 'failed', detail: data.error || 'Server rejected the request' }],
        });
        recordSentAlert({
          id: `alert-${Date.now()}`,
          subject: subj,
          message: msg,
          recipientEmail: email,
          status: 'FAILED',
          error: data.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Network/API failure — show a clear error, NOT a fake success
      console.error('Alert sending exception:', err);
      setStatusResult({
        success: false,
        error: `Network error: ${err.message || 'Could not reach the alert server.'}`,
        channels: [{ channel: 'email', status: 'failed', detail: `Network error: ${err.message}` }],
        retryable: true,
      });
      recordSentAlert({
        id: `alert-${Date.now()}`,
        subject: subj,
        message: msg,
        recipientEmail: email,
        status: 'FAILED',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const submissionData = { subj: subject, msg: message, email: recipientEmail };
    setLastSubmission(submissionData);
    await doSend(submissionData);
  };

  const handleRetry = async () => {
    if (lastSubmission) {
      await doSend(lastSubmission);
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
            rows={5}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
            placeholder="Type directive body..."
            required
          />
        </div>

        {/* Status Feedback */}
        {statusResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold space-y-2 ${
              statusResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusResult.success ? statusResult.message : statusResult.error}</span>
            </div>

            {/* Per-channel status breakdown */}
            {statusResult.channels && statusResult.channels.length > 0 && (
              <div className="mt-2 space-y-1 pl-6">
                {statusResult.channels.map((ch, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${
                      ch.status === 'sent' ? 'bg-emerald-200 text-emerald-900' :
                      ch.status === 'queued' ? 'bg-amber-200 text-amber-900' :
                      'bg-rose-200 text-rose-900'
                    }`}>{ch.channel}</span>
                    <span className="text-slate-600">{ch.detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Retry button on failure */}
            {!statusResult.success && lastSubmission && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isSending}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Send</span>
              </button>
            )}
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
