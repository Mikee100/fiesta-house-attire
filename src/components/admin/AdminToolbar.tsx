import { ReactNode } from "react";

interface AdminToolbarProps {
  left: ReactNode;
  right?: ReactNode;
}

const AdminToolbar = ({ left, right }: AdminToolbarProps) => {
  return (
    <div className="admin-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">{left}</div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
};

export default AdminToolbar;
