interface AdminStatusPillProps {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const toneClassMap: Record<NonNullable<AdminStatusPillProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200"
};

const AdminStatusPill = ({ label, tone = "neutral" }: AdminStatusPillProps) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${toneClassMap[tone]}`}>
      {label}
    </span>
  );
};

export default AdminStatusPill;
