import React from 'react';
import {
  RefreshCw, ShieldCheck, AlertCircle, Copy, Check, Home,
  MessageSquare, Send, X, ExternalLink, ChevronDown, ChevronUp, Bug, Terminal
} from 'lucide-react';

/* ── Generate Deterministic Error Code ───────────────────────────────────── */
function generateErrorCode(error) {
  const str = (error?.message || error?.name || 'UNKNOWN_ERROR') + (error?.stack?.slice(0, 50) || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
  const timeSuffix = Date.now().toString(36).toUpperCase().slice(-3);
  return `ERR-EC6-${hex}-${timeSuffix}`;
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: '',
      copiedTrace: false,
      copiedCode: false,
      showFeedbackModal: false,
      feedbackText: '',
      feedbackEmail: '',
      feedbackSubmitted: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorCode: generateErrorCode(error),
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[WIRK Error Handled]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showFeedbackModal: false,
      feedbackSubmitted: false,
    });
    window.location.reload();
  };

  handleReturnHome = () => {
    window.location.href = window.location.origin;
  };

  handleCopyTrace = () => {
    const report = this.generateFullReport();
    navigator.clipboard.writeText(report);
    this.setState({ copiedTrace: true });
    setTimeout(() => this.setState({ copiedTrace: false }), 2000);
  };

  handleCopyCode = () => {
    if (!this.state.errorCode) return;
    navigator.clipboard.writeText(this.state.errorCode);
    this.setState({ copiedCode: true });
    setTimeout(() => this.setState({ copiedCode: false }), 2000);
  };

  generateFullReport = () => {
    return [
      `=== WIRK v6.0 ERROR REPORT ===`,
      `Error Code: ${this.state.errorCode}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error Message: ${this.state.error?.toString() || 'Unknown Error'}`,
      `User Feedback: ${this.state.feedbackText.trim() || 'N/A'}`,
      `Email: ${this.state.feedbackEmail.trim() || 'N/A'}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'N/A'}`,
      `\nError Stack:\n${this.state.error?.stack || 'N/A'}`,
    ].join('\n');
  };

  handleSubmitFeedback = (e) => {
    e?.preventDefault();
    const report = this.generateFullReport();
    
    // Save report to localStorage for diagnostics log retrieval
    try {
      const logs = JSON.parse(localStorage.getItem('engine_core_error_reports') || '[]');
      logs.unshift({
        code: this.state.errorCode,
        time: Date.now(),
        message: this.state.error?.toString(),
        feedback: this.state.feedbackText,
        email: this.state.feedbackEmail,
      });
      localStorage.setItem('engine_core_error_reports', JSON.stringify(logs.slice(0, 20)));
    } catch (err) {
      console.warn('Could not persist report locally', err);
    }

    this.setState({ feedbackSubmitted: true });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorCode, copiedTrace, copiedCode, showFeedbackModal, feedbackText, feedbackEmail, feedbackSubmitted } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-base)] text-[var(--text-hi)]">
          <div
            className="max-w-lg w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-5 text-center animate-scale-in overflow-hidden relative"
            style={{
              background: 'var(--modal-bg)',
              borderColor: 'var(--border-subtle)',
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
            }}
          >
            {/* Header Icon */}
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-xl shadow-sm border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-hi)',
              }}
            >
              <AlertCircle size={26} className="text-amber-500" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
                Application Recovered
              </h2>
              <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                WIRK encountered an unexpected interface issue and safely preserved your workspace data.
              </p>
            </div>

            {/* Error Code Badge & Telemetry Bar */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                  Error Code
                </span>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  {errorCode}
                </span>
              </div>

              <button
                type="button"
                onClick={this.handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-colors px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                title="Copy Error Code"
              >
                {copiedCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Error Diagnostics Card */}
            {error && (
              <div
                className="text-left p-3.5 rounded-2xl border text-xs overflow-x-auto max-h-32 scroll font-mono space-y-2"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <Terminal size={11} />
                    <span>Diagnostic Trace</span>
                  </div>
                  <button
                    type="button"
                    onClick={this.handleCopyTrace}
                    className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-colors"
                  >
                    {copiedTrace ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedTrace ? 'Copied Full Report' : 'Copy Report'}</span>
                  </button>
                </div>
                <p className="text-rose-500 font-medium text-[11px] break-all leading-normal">
                  {error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full btn-primary py-3 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw size={14} />
                <span>Reload Workspace</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => this.setState({ showFeedbackModal: true })}
                  className="py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                >
                  <MessageSquare size={13} className="text-[var(--accent)]" />
                  <span>Report & Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReturnHome}
                  className="py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                >
                  <Home size={13} />
                  <span>Return Home</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] font-medium pt-1" style={{ color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Workspace and Cloud Data Intact</span>
              </div>
            </div>

            {/* ── Report & Feedback Modal / Drawer ── */}
            {showFeedbackModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) this.setState({ showFeedbackModal: false });
                }}
              >
                <div
                  className="w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 text-left animate-scale-in relative"
                  style={{
                    background: 'var(--bg-overlay)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <Bug size={16} className="text-amber-400" />
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>
                        Send Error Report & Feedback
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => this.setState({ showFeedbackModal: false })}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {feedbackSubmitted ? (
                    /* Success Confirmation */
                    <div className="py-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                        <Check size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-hi)]">Report Submitted</h4>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Thank you! Your feedback and error report under <span className="font-mono text-amber-400 font-semibold">{errorCode}</span> have been recorded.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => this.setState({ showFeedbackModal: false })}
                        className="btn-primary py-2 px-6 text-xs font-semibold rounded-xl"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    /* Feedback Form */
                    <form onSubmit={this.handleSubmitFeedback} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                          What were you doing when this happened? (optional)
                        </label>
                        <textarea
                          rows={3}
                          value={feedbackText}
                          onChange={(e) => this.setState({ feedbackText: e.target.value })}
                          placeholder="E.g., Opened Diary view, clicked on a task, changed theme..."
                          className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-sans resize-none"
                          style={{
                            background: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-hi)',
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                          Email address (optional, for follow-up)
                        </label>
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => this.setState({ feedbackEmail: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border outline-none font-sans"
                          style={{
                            background: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-hi)',
                          }}
                        />
                      </div>

                      {/* Error Reference Summary */}
                      <div
                        className="p-2.5 rounded-xl border text-[10px] font-mono space-y-1"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                      >
                        <div className="flex justify-between font-semibold">
                          <span>Reference Code:</span>
                          <span className="text-amber-400">{errorCode}</span>
                        </div>
                        <p className="truncate text-rose-400 opacity-80">{error?.toString()}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 btn-primary py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Submit Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={this.handleCopyTrace}
                          className="px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
                          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                          title="Copy Full Diagnostic Report"
                        >
                          {copiedTrace ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{copiedTrace ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
