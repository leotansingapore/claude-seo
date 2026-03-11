import type { Job } from '../lib/types';
import ScoreBadge from './ScoreBadge';

interface Props {
  jobs: Job[];
  onSelect: (job: Job) => void;
}

export default function HistoryView({ jobs, onSelect }: Props) {
  if (jobs.length === 0) {
    return <p className="text-gray-500 text-sm">No analyses yet. Run your first one!</p>;
  }

  return (
    <div className="space-y-2">
      {jobs.map(job => {
        const date = new Date(job.createdAt).toLocaleString();
        const statusColor =
          job.status === 'completed' ? 'bg-green-400' :
          job.status === 'running' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400';

        return (
          <button
            key={job.id}
            onClick={() => onSelect(job)}
            className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-3.5 hover:border-indigo-500 transition-colors text-left"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{job.url}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                  {job.status}
                </span>
                <span>{job.analysisType}</span>
                <span>{date}</span>
              </div>
            </div>
            {job.result && <ScoreBadge score={job.result.score} size="sm" />}
          </button>
        );
      })}
    </div>
  );
}
