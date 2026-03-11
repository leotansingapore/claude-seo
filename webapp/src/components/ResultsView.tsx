import type { AnalysisResult } from '../lib/types';
import ScoreBadge from './ScoreBadge';
import Section from './Section';
import DataRow from './DataRow';
import IssueList from './IssueList';
import { Download } from 'lucide-react';

interface Props {
  result: AnalysisResult;
  url: string;
  jobId: string;
}

export default function ResultsView({ result, url, jobId }: Props) {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seo-report-${jobId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      {/* Score card */}
      <div className="inline-flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 mb-6">
        <ScoreBadge score={result.score} />
        <div>
          <div className="text-xs text-gray-400">SEO Health Score</div>
          <div className="text-xs text-gray-500 mt-0.5 max-w-[300px] truncate">{url}</div>
        </div>
        <button
          onClick={exportJSON}
          className="ml-4 flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-700 rounded-md hover:border-indigo-500 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Overview */}
      <Section title="Overview" issues={result.overview.issues} defaultOpen>
        <dl>
          <DataRow label="Title" value={result.overview.title} />
          <DataRow label="Meta Description" value={result.overview.metaDescription?.slice(0, 160)} />
          <DataRow label="Canonical" value={result.overview.canonical} />
          <DataRow label="H1" value={result.overview.h1.join(', ') || '—'} />
          <DataRow label="Word Count" value={result.overview.wordCount} />
          <DataRow label="Final URL" value={result.overview.finalUrl} />
        </dl>
        <IssueList issues={result.overview.issues} />
      </Section>

      {/* Technical */}
      {result.technical && (
        <Section title="Technical SEO" issues={result.technical.issues}>
          <dl>
            <DataRow label="HTTPS" value={result.technical.https ? 'Yes' : 'No'} />
            <DataRow label="Canonical" value={result.technical.canonical} />
            <DataRow label="Meta Robots" value={result.technical.metaRobots} />
            <DataRow label="Hreflang Tags" value={result.technical.hreflangCount} />
          </dl>
          <IssueList issues={result.technical.issues} />
        </Section>
      )}

      {/* Content */}
      {result.content && (
        <Section title="Content Quality" issues={result.content.issues}>
          <dl>
            <DataRow label="Word Count" value={result.content.wordCount} />
            <DataRow label="H1 / H2 / H3" value={`${result.content.headings.h1} / ${result.content.headings.h2} / ${result.content.headings.h3}`} />
            <DataRow label="Internal Links" value={result.content.links.internal} />
            <DataRow label="External Links" value={result.content.links.external} />
            <DataRow label="Open Graph" value={result.content.hasOpenGraph ? 'Present' : 'Missing'} />
            <DataRow label="Twitter Card" value={result.content.hasTwitterCard ? 'Present' : 'Missing'} />
          </dl>
          <IssueList issues={result.content.issues} />
        </Section>
      )}

      {/* Schema */}
      {result.schema && (
        <Section title="Schema Markup" issues={result.schema.issues}>
          <dl>
            <DataRow label="JSON-LD Blocks" value={result.schema.count} />
            <DataRow label="Types Found" value={result.schema.types.join(', ') || 'None'} />
          </dl>
          <IssueList issues={result.schema.issues} />
          {result.schema.schemas.length > 0 && (
            <pre className="mt-3 p-3 bg-gray-950 border border-gray-800 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(result.schema.schemas, null, 2)}
            </pre>
          )}
        </Section>
      )}

      {/* Images */}
      {result.images && (
        <Section title="Images" issues={result.images.issues}>
          <dl>
            <DataRow label="Total Images" value={result.images.total} />
            <DataRow label="Missing Alt Text" value={result.images.missingAlt} />
            <DataRow label="Missing Dimensions" value={result.images.missingDimensions} />
          </dl>
          <IssueList issues={result.images.issues} />
        </Section>
      )}
    </div>
  );
}
