import { ReactNode } from "react";

interface AdminSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const AdminSection = ({
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "p-5"
}: AdminSectionProps) => {
  return (
    <section className={`admin-card rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
      {(title || description || actions) && (
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
};

export default AdminSection;
