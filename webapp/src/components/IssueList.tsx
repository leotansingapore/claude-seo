import type { Issue } from '../lib/types';

interface Props {
  issues: Issue[];
}

const dotColor = {
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-blue-400',
};

export default function IssueList({ issues }: Props) {
  if (issues.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1">
      {issues.map((issue, i) => (
        <li key={i} className="flex items-start gap-2.5 py-1.5 border-b border-gray-800 last:border-0 text-sm">
          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor[issue.severity]}`} />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}
