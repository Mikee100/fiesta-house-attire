import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { MOCK_PORTFOLIOS } from "@/lib/mockData";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon, LayoutDashboard, Library, Sparkles, FolderPlus, Search, ArrowUp, ArrowDown } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";

const Admin = () => {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReordering, setIsReordering] = useState(false);

  // Use brand colors for consistent luxury feel
  const brandSky = "#6EC1E4";
  const brandMagenta = "#B84FA0";

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const data = await api.fetchPortfolios();

      if (data === null) {
        setUseMock(true);
        setPortfolios(MOCK_PORTFOLIOS);
      } else {
        setPortfolios(data);
        setUseMock(false);
      }
    } catch (err) {
      setUseMock(true);
      setPortfolios(MOCK_PORTFOLIOS);
    }
    setLoading(false);
  };

  const handleAddPortfolio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPortfolioTitle) return;
    
    if (useMock) {
      toast.error("Backend connection required for live updates");
      return;
    }

    const result = await api.createPortfolio(newPortfolioTitle);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Portfolio created");
      setNewPortfolioTitle("");
      fetchPortfolios();
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (useMock) {
       toast.error("Cannot delete mock data");
       return;
    }

    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    const result = await api.deletePortfolio(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Deleted");
      fetchPortfolios();
    }
  };

  const handleMovePortfolio = async (id: string, direction: "up" | "down") => {
    if (useMock) {
      toast.error("Backend connection required for ordering");
      return;
    }

    const visible = filteredPortfolios;
    const visibleIndex = visible.findIndex((p) => p.id === id);
    if (visibleIndex === -1) return;

    const targetVisibleIndex = direction === "up" ? visibleIndex - 1 : visibleIndex + 1;
    if (targetVisibleIndex < 0 || targetVisibleIndex >= visible.length) return;

    const targetId = visible[targetVisibleIndex].id;
    const sourceIndex = portfolios.findIndex((p) => p.id === id);
    const targetIndex = portfolios.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextPortfolios = [...portfolios];
    [nextPortfolios[sourceIndex], nextPortfolios[targetIndex]] = [
      nextPortfolios[targetIndex],
      nextPortfolios[sourceIndex],
    ];

    setPortfolios(nextPortfolios);
    setIsReordering(true);

    try {
      const result = await api.reorderPortfolios(nextPortfolios.map((p) => p.id));
      if (result?.error) {
        toast.error(result.error);
        fetchPortfolios();
      }
    } catch (err) {
      toast.error("Failed to save portfolio order");
      fetchPortfolios();
    } finally {
      setIsReordering(false);
    }
  };

  const filteredPortfolios = portfolios.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFD]">
      <AdminNavbar />
      
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Actions */}
          <aside className="w-full lg:w-80 space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-serif italic text-slate-900 tracking-tight">Studio</h1>
              <p className="text-slate-500 text-sm">Manage your professional collections</p>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#6EC1E4] to-[#B84FA0]" />
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddPortfolio} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">New Portfolio</label>
                    <Input 
                      placeholder="e.g. Maternity Elegance" 
                      value={newPortfolioTitle}
                      onChange={(e) => setNewPortfolioTitle(e.target.value)}
                      className="bg-slate-50 border-slate-100 focus:bg-white transition-all"
                    />
                  </div>
                  <Button 
                    className="w-full shadow-md shadow-sky-100 hover:shadow-lg transition-all" 
                    type="submit"
                    style={{ backgroundColor: brandSky }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Portfolio
                  </Button>
                </form>

                <div className="pt-4 border-t border-slate-50">
                  <Link to="/admin/assets">
                    <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-all">
                      <Library className="mr-2 h-4 w-4" /> Media Library
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-100 relative overflow-hidden group">
               <div className="relative z-10">
                 <Sparkles className="h-8 w-8 mb-4 opacity-80" />
                 <h3 className="font-bold text-lg leading-tight mb-2">Portfolio Management</h3>
                 <p className="text-sky-100 text-xs">Organize your masterpieces and showcase your best work to clients.</p>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                 <ImageIcon size={120} />
               </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search portfolios..." 
                  className="pl-10 bg-white border-none shadow-sm h-11 rounded-xl focus-visible:ring-sky-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {useMock && (
                <div className="px-4 py-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Development Mode: Local Data
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredPortfolios.map((p, idx) => (
                <Card key={p.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden bg-white flex flex-col">
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    {p.cover_image_url || (p.images && p.images.length > 0) ? (
                      <img 
                        src={p.cover_image_url || (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url)} 
                        alt={p.title} 
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <ImageIcon className="h-16 w-16 mb-2 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No images</span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                       <Link to={`/admin/portfolio/${p.id}`}>
                         <Button variant="secondary" className="bg-white/90 hover:bg-white text-slate-900 border-none rounded-full px-6">
                           Manage
                         </Button>
                       </Link>
                       <Button 
                         variant="destructive" 
                         size="icon" 
                         onClick={() => handleDeletePortfolio(p.id)}
                         className="rounded-full bg-red-500/80 hover:bg-red-600 border-none"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>

                    <div className="absolute top-4 left-4">
                      <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 shadow-sm border border-white/20">
                        #{idx + 1} • {p.images?.length || 0} ITEMS
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                        disabled={idx === 0 || isReordering || loading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMovePortfolio(p.id, "up");
                        }}
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                        disabled={idx === filteredPortfolios.length - 1 || isReordering || loading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMovePortfolio(p.id, "down");
                        }}
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-serif text-slate-800">
                      {p.title}
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Photography Collection</p>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-0 mt-auto">
                    <Link to={`/admin/portfolio/${p.id}`} className="block">
                      <Button variant="ghost" className="w-full justify-between group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors border border-slate-50">
                        View Details
                        <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}

              {filteredPortfolios.length === 0 && !loading && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <LayoutDashboard className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-serif text-slate-900">No portfolios found</h3>
                  <p className="text-slate-500 max-w-xs mt-2">
                    Start by creating your first photography collection using the quick action sidebar.
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Use the up/down arrows on each card to reorder collections. Client portfolio pages follow this same order.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
