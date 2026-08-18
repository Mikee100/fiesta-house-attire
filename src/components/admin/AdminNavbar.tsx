import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Library, FolderTree, ExternalLink, Camera, FileText, Clapperboard, LogOut } from "lucide-react";
import { logoutAdmin } from "@/lib/adminAuth";

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center justify-center text-white">
                <Camera size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight">Fiesta <span className="text-sky-500">Admin</span></span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link to="/admin">
                <Button 
                  variant={isActive('/admin') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard size={16} />
                  Portfolios
                </Button>
              </Link>
              <Link to="/admin/blog">
                <Button 
                  variant={isActive('/admin/blog') || location.pathname.includes('/admin/blog/') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText size={16} />
                  Blog
                </Button>
              </Link>
              <Link to="/admin/folders">
                <Button
                  variant={isActive('/admin/folders') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FolderTree size={16} />
                  Folders
                </Button>
              </Link>
              <Link to="/admin/assets">
                <Button 
                  variant={isActive('/admin/assets') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Library size={16} />
                  Media Library
                </Button>
              </Link>
              <Link to="/admin/videos">
                <Button 
                  variant={isActive('/admin/videos') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Clapperboard size={16} />
                  Videos
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/" target="_blank">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink size={14} />
                View Site
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
