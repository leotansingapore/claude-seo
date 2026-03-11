interface Props {
  score: number;
  size?: 'sm' | 'lg';
}

export default function ScoreBadge({ score, size = 'lg' }: Props) {
  const color =
    score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const textSize = size === 'lg' ? 'text-5xl' : 'text-2xl';

  return <span className={`${textSize} font-bold tabular-nums ${color}`}>{score}</span>;
}
