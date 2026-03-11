import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Issue } from '../lib/types';

interface Props {
  title: string;
  issues: Issue[];
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function Section({ title, issues, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {title}
          {errors > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">
              {errors} error{errors > 1 ? 's' : ''}
            </span>
          )}
          {warnings > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
              {warnings} warning{warnings > 1 ? 's' : ''}
            </span>
          )}
          {errors === 0 && warnings === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">
              Pass
            </span>
          )}
        </h3>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
