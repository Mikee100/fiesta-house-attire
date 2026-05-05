import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Folder, Image as ImageIcon, Plus, Trash2, ChevronRight, Upload, Loader2, Search, CheckCircle2 } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";

const AdminAssets = () => {
  const [folders, setFolders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1); // Reset page when folder or search changes
  }, [currentFolderId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [currentFolderId, currentPage, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    const foldersData = await api.fetchFolders();
    const assetsData = await api.fetchAssets(currentFolderId || undefined, currentPage, itemsPerPage, searchQuery);
    
    setFolders(foldersData || []);
    setAssets(assetsData?.assets || []);
    setTotalPages(assetsData?.totalPages || 1);
    setLoading(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    const result = await api.createFolder(newFolderName, currentFolderId || undefined);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Folder created");
      setNewFolderName("");
      loadData();
    }
  };

  const handleBulkAdd = async () => {
    const urls = bulkUrls.split("\n").map(u => u.trim()).filter(u => u !== "");
    if (urls.length === 0) return;

    const result = await api.addAssetsBulk(urls, currentFolderId || undefined);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${urls.length} images`);
      setBulkUrls("");
      loadData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadResult = await api.uploadFile(file);
        
        if (uploadResult.url) {
          await api.createAsset(uploadResult.url, currentFolderId || undefined);
        } else {
          throw new Error(uploadResult.error || "Upload failed");
        }
      }
      toast.success("Upload complete");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const result = await api.deleteAsset(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Asset deleted");
      loadData();
    }
  };

  const handleSetFolderCover = async (url: string) => {
    if (!currentFolderId) return;
    
    const result = await api.updateFolder(currentFolderId, { cover_image_url: url });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Folder cover updated");
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
             <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
             <p className="text-muted-foreground">Bulk upload and organize your photography assets</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search images by URL..." 
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Folders & Uploads */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">New Folder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Folder Name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreateFolder}>
                  <Plus className="mr-2 h-4 w-4" /> Create
                </Button>
              </CardContent>
            </Card>

            <Card className="border-sky-200 bg-sky-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Upload from Computer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Select one or more images to upload to this folder.</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  className="w-full" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ backgroundColor: "#6EC1E4" }}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? "Uploading..." : "Select Files"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Bulk Add via URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Paste multiple image URLs (one per line)</p>
                <Textarea 
                  className="min-h-[150px] text-xs font-mono"
                  placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                />
                <Button className="w-full" variant="outline" onClick={handleBulkAdd}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Add URLs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Folder Navigation & Assets */}
          <div className="lg:col-span-3 space-y-8">
             {/* Breadcrumbs / Navigation */}
             <div className="flex items-center gap-2 p-4 bg-white rounded-lg border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentFolderId(null)}
                  className={!currentFolderId ? 'font-bold underline' : ''}
                >
                  Root
                </Button>
                {currentFolderId && (
                  <>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                    <span className="text-sm font-medium">
                      {folders.find(f => f.id === currentFolderId)?.name || 'Folder'}
                    </span>
                  </>
                )}
             </div>

             {/* Folders Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.filter(f => f.parent_id === currentFolderId).map((f) => (
                  <Button 
                    key={f.id} 
                    variant="outline" 
                    className="h-auto py-0 p-0 flex flex-col gap-0 hover:bg-slate-50 overflow-hidden"
                    onClick={() => setCurrentFolderId(f.id)}
                  >
                    <div className="w-full aspect-video bg-slate-100 flex items-center justify-center relative">
                      {f.cover_image_url ? (
                        <img src={f.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Folder className="h-8 w-8 text-sky-400 fill-sky-400/10" />
                      )}
                    </div>
                    <div className="p-3 w-full text-left border-t bg-white">
                      <span className="text-xs font-medium truncate block">{f.name}</span>
                    </div>
                  </Button>
                ))}
             </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {assets.map((asset) => (
                   <div key={asset.id} className="group relative aspect-square bg-slate-200 rounded-lg overflow-hidden border">
                      <img src={asset.url} alt="" className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                         <div className="flex gap-2">
                           <Button 
                             variant="destructive" 
                             size="icon"
                             onClick={() => handleDeleteAsset(asset.id)}
                             className="h-9 w-9"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                           {currentFolderId && (
                             <Button 
                               variant="secondary" 
                               size="icon"
                               onClick={() => handleSetFolderCover(asset.url)}
                               className="h-9 w-9"
                               title="Set as folder cover"
                             >
                               <CheckCircle2 className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                         {currentFolderId && folders.find(f => f.id === currentFolderId)?.cover_image_url === asset.url && (
                           <span className="text-[10px] text-white bg-emerald-500 px-2 py-1 rounded-full uppercase tracking-widest font-bold">Current Cover</span>
                         )}
                      </div>
                   </div>
                 ))}
                 {assets.length === 0 && !loading && (
                   <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-white/50">
                     <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-10" />
                     <p>No images in this folder yet.</p>
                   </div>
                 )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAssets;
