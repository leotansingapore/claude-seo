import type { Job } from './types';

const STORAGE_KEY = 'claude-seo-jobs';
const MAX_JOBS = 50;

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Job[];
  } catch {
    return [];
  }
}

export function saveJob(job: Job): void {
  const jobs = loadJobs();
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.unshift(job);
  }
  // Keep only recent jobs
  const trimmed = jobs.slice(0, MAX_JOBS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getJob(id: string): Job | undefined {
  return loadJobs().find(j => j.id === id);
}
