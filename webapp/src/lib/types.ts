export interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface OverviewResult {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1: string[];
  wordCount: number;
  issues: Issue[];
}

export interface TechnicalResult {
  https: boolean;
  canonical: string | null;
  metaRobots: string | null;
  hreflangCount: number;
  issues: Issue[];
}

export interface ContentResult {
  wordCount: number;
  headings: { h1: number; h2: number; h3: number };
  links: { internal: number; external: number };
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  issues: Issue[];
}

export interface SchemaResult {
  count: number;
  types: string[];
  schemas: unknown[];
  issues: Issue[];
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
}

export interface ImagesResult {
  total: number;
  missingAlt: number;
  missingDimensions: number;
  images: ImageInfo[];
  issues: Issue[];
}

export interface AnalysisResult {
  overview: OverviewResult;
  technical?: TechnicalResult;
  content?: ContentResult;
  schema?: SchemaResult;
  images?: ImagesResult;
  score: number;
}

export type AnalysisType = 'full' | 'technical' | 'content' | 'schema' | 'images';

export interface Job {
  id: string;
  url: string;
  analysisType: AnalysisType;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  result: AnalysisResult | null;
  error: string | null;
}
