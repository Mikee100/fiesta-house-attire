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
import { Plus, Trash2, Image as ImageIcon, LayoutDashboard, LogOut } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";

const Admin = () => {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

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
        // This means the API call failed entirely
        setUseMock(true);
        setPortfolios(MOCK_PORTFOLIOS);
      } else {
        // Data is an array (even if empty)
        setPortfolios(data);
        setUseMock(false);
      }
    } catch (err) {
      setUseMock(true);
      setPortfolios(MOCK_PORTFOLIOS);
    }
    setLoading(false);
  };

  const handleAddPortfolio = async () => {
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

    const result = await api.deletePortfolio(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Deleted");
      fetchPortfolios();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your photography collections</p>
          </div>
        </header>

        {useMock ? (
          <div className="bg-amber-50 border border-amber-200 p-4 mb-8 rounded-lg text-amber-800 text-sm">
            <strong>Development Mode:</strong> Backend connection not established. Showing local mock data.
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 p-4 mb-8 rounded-lg text-emerald-800 text-sm">
            <strong>Live Mode:</strong> Connected to your Supabase database.
          </div>
        )}

        <Tabs defaultValue="portfolios" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="portfolios" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Portfolios
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Global Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolios">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Add New Portfolio Card */}
              <Card className="border-dashed border-2 flex flex-col justify-center items-center p-8 bg-transparent">
                <CardHeader className="text-center">
                  <CardTitle className="text-sm font-medium">Create New Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="w-full space-y-4">
                  <Input 
                    placeholder="e.g. Family Baby Bump" 
                    value={newPortfolioTitle}
                    onChange={(e) => setNewPortfolioTitle(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleAddPortfolio} style={{ backgroundColor: brandSky }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </CardContent>
              </Card>

              {/* Media Library Quick Access */}
              <Card className="border-sky-200 bg-sky-50/30 flex flex-col justify-center items-center p-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-sm font-medium">Media Library</CardTitle>
                </CardHeader>
                <CardContent className="w-full space-y-4">
                  <p className="text-xs text-center text-muted-foreground">Bulk upload and organize images in folders.</p>
                  <Link to="/admin/assets" className="w-full">
                    <Button variant="outline" className="w-full border-sky-300 text-sky-700 hover:bg-sky-100">
                      Open Library
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Portfolio Cards */}
              {portfolios.map((p) => (
                <Card key={p.id} className="overflow-hidden group relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeletePortfolio(p.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="aspect-video bg-slate-200 relative overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      <img src={typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url} alt="" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {p.title}
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.images?.length || 0} images
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/admin/portfolio/${p.id}`}>
                      <Button variant="outline" className="w-full">Manage Images</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
             <Card>
               <CardHeader>
                 <CardTitle>System Settings</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">Global asset management and studio settings coming soon.</p>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
