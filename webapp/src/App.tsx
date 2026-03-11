import { useState, useCallback } from 'react';
import { Search, Clock, Code, Loader2 } from 'lucide-react';
import { fetchPage, analyzeUrl } from './lib/analyzer';
import { loadJobs, saveJob } from './lib/storage';
import type { Job, AnalysisType } from './lib/types';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import SchemaTemplatesView from './components/SchemaTemplatesView';

type View = 'analyze' | 'history' | 'schemas';

const NAV_ITEMS: { id: View; label: string; icon: typeof Search }[] = [
  { id: 'analyze', label: 'New Analysis', icon: Search },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'schemas', label: 'Schema Templates', icon: Code },
];

export default function App() {
  const [view, setView] = useState<View>('analyze');
  const [url, setUrl] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('full');
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = url.trim();
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setLoading(true);
    setError(null);
    setCurrentJob(null);

    const jobId = Math.random().toString(36).slice(2, 10);
    const job: Job = {
      id: jobId,
      url: targetUrl,
      analysisType,
      status: 'running',
      createdAt: new Date().toISOString(),
      result: null,
      error: null,
    };
    saveJob(job);

    try {
      const { html, finalUrl } = await fetchPage(targetUrl);
      const result = analyzeUrl(targetUrl, html, finalUrl, analysisType);

      job.status = 'completed';
      job.result = result;
      saveJob(job);
      setCurrentJob(job);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      job.status = 'failed';
      job.error = msg;
      saveJob(job);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [url, analysisType]);

  const selectHistoryJob = (job: Job) => {
    setCurrentJob(job);
    setUrl(job.url);
    setView('analyze');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed inset-y-0 left-0 z-10 max-md:relative max-md:w-full max-md:flex-row max-md:h-auto max-md:border-b max-md:border-r-0">
        <div className="px-5 pt-6 pb-4 border-b border-gray-800 max-md:border-b-0 max-md:border-r max-md:py-3">
          <h1 className="text-lg font-bold tracking-tight">Claude SEO</h1>
          <span className="text-[11px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">v1.3.2</span>
        </div>
        <ul className="flex-1 p-2 space-y-0.5 max-md:flex max-md:items-center max-md:space-y-0 max-md:gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setView(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  view === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500 max-md:hidden">
          Team Dashboard
        </div>
      </nav>

      {/* Main */}
      <main className="ml-56 flex-1 p-8 max-w-[1000px] max-md:ml-0 max-md:p-5">
        {/* Analyze */}
        {view === 'analyze' && (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Run SEO Analysis</h2>
              <p className="text-sm text-gray-400 mt-1">Enter a URL to analyze. Results are saved locally for your team.</p>
            </div>

            <form onSubmit={runAnalysis} className="flex gap-2.5 mb-6 max-md:flex-col">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              <select
                value={analysisType}
                onChange={e => setAnalysisType(e.target.value as AnalysisType)}
                className="px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="full">Full Analysis</option>
                <option value="technical">Technical Only</option>
                <option value="content">Content Only</option>
                <option value="schema">Schema Only</option>
                <option value="images">Images Only</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Analyze'
                )}
              </button>
            </form>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-sm text-red-400">
                {error}
              </div>
            )}

            {currentJob?.result && (
              <ResultsView result={currentJob.result} url={currentJob.url} jobId={currentJob.id} />
            )}
          </div>
        )}

        {/* History */}
        {view === 'history' && (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Analysis History</h2>
              <p className="text-sm text-gray-400 mt-1">Recent analyses saved in your browser.</p>
            </div>
            <HistoryView jobs={loadJobs()} onSelect={selectHistoryJob} />
          </div>
        )}

        {/* Schemas */}
        {view === 'schemas' && (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Schema.org Templates</h2>
              <p className="text-sm text-gray-400 mt-1">Copy-paste JSON-LD templates for your pages.</p>
            </div>
            <SchemaTemplatesView />
          </div>
        )}
      </main>
    </div>
  );
}
