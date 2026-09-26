interface Props {
  status: string;
}

const styles: Record<string, string> = {
  PENDING_VERIFICATION: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  VERIFIED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-300",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        styles[status] ?? "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
