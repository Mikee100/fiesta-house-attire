import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { ChevronLeft, Plus, Trash2, Image as ImageIcon, Library, Folder } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";

const AdminPortfolio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentLibraryFolderId, setCurrentLibraryFolderId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPortfolioDetails();
  }, [id]);

  useEffect(() => {
    loadFolders();
  }, [isLibraryOpen]);

  useEffect(() => {
    loadAssets();
  }, [currentPage, isLibraryOpen, currentLibraryFolderId]);

  const fetchPortfolioDetails = async () => {
    setLoading(true);
    const portfolios = await api.fetchPortfolios();
    const found = portfolios?.find((p: any) => p.id === id);
    if (found) {
      setPortfolio(found);
    } else {
      toast.error("Portfolio not found");
      navigate("/admin");
    }
    setLoading(false);
  };

  const loadFolders = async () => {
    if (!isLibraryOpen) return;
    const foldersData = await api.fetchFolders();
    setFolders(foldersData || []);
  };

  const loadAssets = async () => {
    if (!isLibraryOpen) return;
    const assetsData = await api.fetchAssets(currentLibraryFolderId || undefined, currentPage, 12);
    setAssets(assetsData?.assets || []);
    setTotalPages(assetsData?.totalPages || 1);
  };

  const toggleAssetSelection = (url: string) => {
    setSelectedAssets(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleAddImages = async () => {
    if (selectedAssets.length === 0 || !id) return;

    const result = await api.addImagesToPortfolioBulk(id, selectedAssets);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${selectedAssets.length} images`);
      setSelectedAssets([]);
      setIsLibraryOpen(false);
      fetchPortfolioDetails();
    }
  };

  const handleAddAllFromFolder = async () => {
    if (!currentLibraryFolderId || !id) return;
    
    // Fetch ALL assets in this folder (ignore pagination for bulk add)
    const assetsData = await api.fetchAssets(currentLibraryFolderId, 1, 100);
    const urls = assetsData?.assets?.map((a: any) => a.url) || [];
    
    if (urls.length === 0) {
      toast.error("Folder is empty");
      return;
    }

    const result = await api.addImagesToPortfolioBulk(id, urls);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added all ${urls.length} images from folder`);
      setIsLibraryOpen(false);
      fetchPortfolioDetails();
    }
  };

  const handleAddImageViaUrl = async () => {
    if (!newImageUrl || !id) return;

    const result = await api.addImageToPortfolio(id, newImageUrl);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image added");
      setNewImageUrl("");
      fetchPortfolioDetails();
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const result = await api.deleteImage(imageId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image removed");
      fetchPortfolioDetails();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-8">
        <header className="flex items-center gap-4 mb-12">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{portfolio?.title}</h1>
            <p className="text-muted-foreground">Manage images in this collection</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Actions */}
          <div className="md:col-span-1 space-y-6 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Add via URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Image URL" 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <Button className="w-full" onClick={handleAddImageViaUrl} style={{ backgroundColor: "#6EC1E4" }}>
                  <Plus className="mr-2 h-4 w-4" /> Add to Portfolio
                </Button>
              </CardContent>
            </Card>

            <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-sky-200 text-sky-600 hover:bg-sky-50">
                  <Library className="mr-2 h-4 w-4" /> Choose from Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <DialogTitle className="text-2xl font-bold">Media Library</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">Select assets to add to your portfolio</p>
                    </div>
                    <div className="flex gap-3">
                      {currentLibraryFolderId && (
                        <Button variant="outline" size="sm" onClick={handleAddAllFromFolder} className="border-sky-200 text-sky-600 hover:bg-sky-50">
                          Add All from Folder
                        </Button>
                      )}
                      {selectedAssets.length > 0 && (
                        <Button onClick={handleAddImages} size="sm" className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-200">
                          Add {selectedAssets.length} Selected
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex flex-1 overflow-hidden bg-slate-50/50">
                  {/* Folders Sidebar */}
                  <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
                    <div className="p-4 border-b bg-slate-50/50">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collections</h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                      <Button 
                        variant={!currentLibraryFolderId ? "secondary" : "ghost"} 
                        className={`w-full justify-start font-medium ${!currentLibraryFolderId ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : ''}`}
                        onClick={() => setCurrentLibraryFolderId(null)}
                      >
                        <Library className="h-4 w-4 mr-3" />
                        All Assets
                      </Button>
                      <div className="my-2 border-t mx-2" />
                      {folders.map(folder => (
                        <Button 
                          key={folder.id} 
                          variant={currentLibraryFolderId === folder.id ? "secondary" : "ghost"} 
                          className={`w-full justify-start font-medium ${currentLibraryFolderId === folder.id ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : ''}`}
                          onClick={() => setCurrentLibraryFolderId(folder.id)}
                        >
                          <Folder className={`h-4 w-4 mr-3 ${currentLibraryFolderId === folder.id ? 'fill-sky-400 text-sky-500' : 'text-slate-400'}`} />
                          <span className="truncate">{folder.name}</span>
                        </Button>
                      ))}
                    </nav>
                  </aside>

                  {/* Assets Grid Area */}
                  <main className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                          <div 
                            key={asset.id} 
                            className={`group relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm ${
                              selectedAssets.includes(asset.url) 
                                ? 'border-sky-500 ring-4 ring-sky-500/10 scale-[0.98]' 
                                : 'border-transparent hover:border-sky-300 hover:shadow-md'
                            }`}
                            onClick={() => toggleAssetSelection(asset.url)}
                          >
                             <img src={asset.url} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                             
                             {/* Selection Overlay */}
                             <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
                               selectedAssets.includes(asset.url) ? 'bg-sky-500/30' : 'bg-black/20 opacity-0 group-hover:opacity-100'
                             }`}>
                                {selectedAssets.includes(asset.url) ? (
                                  <div className="bg-sky-500 text-white p-2 rounded-full shadow-lg transform scale-110">
                                    <Plus className="h-5 w-5 rotate-45" />
                                  </div>
                                ) : (
                                  <div className="bg-white/90 backdrop-blur-sm text-sky-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                    SELECT IMAGE
                                  </div>
                                )}
                             </div>
                          </div>
                        ))}
                        
                        {assets.length === 0 && !loading && (
                          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ImageIcon className="h-10 w-10 text-slate-300" />
                             </div>
                             <h3 className="text-lg font-medium text-slate-900">No assets found</h3>
                             <p className="text-slate-500 max-w-xs mt-2">
                               {currentLibraryFolderId 
                                 ? "This folder doesn't have any images yet." 
                                 : "Your media library is empty. Upload images in the Assets section."}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t bg-white flex items-center justify-between flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                       <div className="flex items-center gap-3">
                         <div className="h-8 px-3 flex items-center bg-sky-50 text-sky-700 text-xs font-bold rounded-full">
                           {selectedAssets.length} SELECTED
                         </div>
                         {selectedAssets.length > 0 && (
                           <button 
                             onClick={() => setSelectedAssets([])}
                             className="text-xs text-slate-500 hover:text-red-500 font-medium transition-colors"
                           >
                             Clear selection
                           </button>
                         )}
                       </div>
                       
                       {totalPages > 1 && (
                         <div className="flex items-center gap-3">
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="h-8 w-8 p-0 rounded-full"
                             onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                             disabled={currentPage === 1}
                           >
                             <ChevronLeft className="h-4 w-4" />
                           </Button>
                           <span className="text-xs font-medium text-slate-600 min-w-[4rem] text-center">
                             {currentPage} / {totalPages}
                           </span>
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="h-8 w-8 p-0 rounded-full"
                             onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                             disabled={currentPage === totalPages}
                           >
                             <ChevronLeft className="h-4 w-4 rotate-180" />
                           </Button>
                         </div>
                       )}
                    </div>
                  </main>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Image Grid */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio?.images?.map((img: any) => (
                <div key={img.id} className="group relative aspect-[4/5] bg-slate-200 rounded-lg overflow-hidden border">
                   <img src={img.url} alt="" className="object-cover w-full h-full" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Button 
                       variant="destructive" 
                       size="icon"
                       onClick={() => handleDeleteImage(img.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
              ))}
              {(!portfolio?.images || portfolio.images.length === 0) && (
                <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-white">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No images in this portfolio yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortfolio;
