import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Folder, Image as ImageIcon, Plus, Trash2, ChevronRight, Upload, Loader2, Search, CheckCircle2, Copy, Eye } from "lucide-react";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import SEO from "@/components/site/SEO";

const AdminAssets = () => {
  const [folders, setFolders] = useState<api.FolderRecord[]>([]);
  const [assets, setAssets] = useState<api.AssetRecord[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 100;

  useEffect(() => {
    setCurrentPage(1); // Reset page when folder or search changes
    setSelectedAssetIds([]);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload files";
      toast.error(message);
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

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleSelectAllOnPage = () => {
    setSelectedAssetIds(assets.map((asset) => asset.id));
  };

  const handleClearSelection = () => {
    setSelectedAssetIds([]);
  };

  const handleDeleteSelectedAssets = async () => {
    if (selectedAssetIds.length === 0) return;

    setUploading(true);
    try {
      for (const id of selectedAssetIds) {
        // Keep delete operations sequential to reduce API burst failures.
        await api.deleteAsset(id);
      }
      toast.success(`Deleted ${selectedAssetIds.length} images`);
      setSelectedAssetIds([]);
      await loadData();
    } catch {
      toast.error("Failed to delete selected images");
    } finally {
      setUploading(false);
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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <>
      <SEO title="Admin Assets" noindex nofollow />
      <AdminPage
        title="Media Library"
        description="Bulk upload and organize your photography assets"
        maxWidthClassName="max-w-6xl"
        actions={
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images by URL..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Folders & Uploads */}
          <div className="lg:col-span-1 space-y-8">
            <AdminSection title="New Folder" contentClassName="space-y-4">
                <Input 
                  placeholder="Folder Name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreateFolder}>
                  <Plus className="mr-2 h-4 w-4" /> Create
                </Button>
            </AdminSection>

            <AdminSection className="border-sky-200 bg-sky-50/50" title="Upload from Computer" contentClassName="space-y-4">
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
                  style={{ backgroundColor: "#B09345" }}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? "Uploading..." : "Select Files"}
                </Button>
            </AdminSection>

            <AdminSection title="Bulk Add via URL" contentClassName="space-y-4">
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
            </AdminSection>
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
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3">
                      <div className="text-xs text-muted-foreground">
                        Showing up to {itemsPerPage} images per page
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAllOnPage} disabled={assets.length === 0}>
                          Select Page
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleClearSelection} disabled={selectedAssetIds.length === 0}>
                          Clear
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelectedAssets}
                          disabled={selectedAssetIds.length === 0 || uploading}
                        >
                          Delete Selected ({selectedAssetIds.length})
                        </Button>
                      </div>
                    </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {assets.map((asset) => (
                         <div
                           key={asset.id}
                           className={`group relative aspect-square bg-slate-200 rounded-lg overflow-hidden border-2 cursor-pointer ${
                             selectedAssetIds.includes(asset.id) ? "border-sky-500" : "border-transparent"
                           }`}
                           onClick={() => toggleAssetSelection(asset.id)}
                         >
                      <img src={asset.url} alt="" className="object-cover w-full h-full" />
                            <div className="absolute left-2 top-2 z-10 rounded bg-black/45 px-2 py-1 text-[10px] font-semibold text-white">
                              {selectedAssetIds.includes(asset.id) ? "Selected" : "Select"}
                            </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                         <div className="flex gap-2">
                           <Button 
                             variant="destructive" 
                             size="icon"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteAsset(asset.id);
                                   }}
                             className="h-9 w-9"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                           <Button 
                             variant="secondary" 
                             size="icon"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleCopyUrl(asset.url);
                                   }}
                             className="h-9 w-9 bg-white text-slate-700 hover:bg-slate-100 border-none"
                             title="Copy URL"
                           >
                             <Copy className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="secondary"
                             size="icon"
                             onClick={(e) => {
                               e.stopPropagation();
                               setPreviewImageUrl(asset.url);
                             }}
                             className="h-9 w-9 bg-white text-slate-700 hover:bg-slate-100 border-none"
                             title="Preview"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           {currentFolderId && (
                             <Button 
                               variant="secondary" 
                               size="icon"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleSetFolderCover(asset.url);
                                     }}
                               className="h-9 w-9 bg-white text-slate-700 hover:bg-slate-100 border-none"
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

        <Dialog open={Boolean(previewImageUrl)} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
          <DialogContent className="max-w-5xl p-2 bg-black/95 border-none">
            <DialogTitle className="sr-only">Image preview</DialogTitle>
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="Asset preview"
                className="w-full max-h-[82vh] object-contain rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </AdminPage>
    </>
  );
};

export default AdminAssets;


