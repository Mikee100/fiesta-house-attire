import { ReactNode } from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import "@/components/admin/admin-theme.css";

interface AdminPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
}

const AdminPage = ({
  title,
  description,
  actions,
  children,
  maxWidthClassName = "max-w-7xl"
}: AdminPageProps) => {
  return (
    <div className="admin-page min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className={`${maxWidthClassName} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8`}>
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="admin-title text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description && <p className="admin-subtitle text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </header>

        {children}
      </div>
    </div>
  );
};

export default AdminPage;
