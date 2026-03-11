interface Props {
  label: string;
  value: string | number | null | undefined;
}

export default function DataRow({ label, value }: Props) {
  return (
    <div className="grid grid-cols-[160px_1fr] text-sm border-b border-gray-800 last:border-0">
      <dt className="py-1.5 text-gray-400">{label}</dt>
      <dd className="py-1.5 break-all">{value ?? '—'}</dd>
    </div>
  );
}
