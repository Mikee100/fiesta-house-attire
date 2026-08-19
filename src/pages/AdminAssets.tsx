import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Image as ImageIcon, Trash2, Upload, Loader2, Search, CheckCircle2, Copy, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import SEO from "@/components/site/SEO";

const AdminAssets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [folders, setFolders] = useState<api.FolderRecord[]>([]);
  const [portfolios, setPortfolios] = useState<api.PortfolioRecord[]>([]);
  const [assets, setAssets] = useState<api.AssetRecord[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(searchParams.get("folderId"));
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingPreview, setDeletingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState("");
  const [targetPortfolioId, setTargetPortfolioId] = useState("");
  const [movingSelected, setMovingSelected] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const itemsPerPage = 60;

  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) ?? null : null;
  const previewAssetIndex = previewAssetId ? assets.findIndex((asset) => asset.id === previewAssetId) : -1;
  const previewAsset = previewAssetIndex >= 0 ? assets[previewAssetIndex] : null;

  useEffect(() => {
    setCurrentPage(1); // Reset page when folder or search changes
    setSelectedAssetIds([]);
  }, [currentFolderId, searchQuery]);

  useEffect(() => {
    setCurrentFolderId(searchParams.get("folderId"));
  }, [searchParams]);

  useEffect(() => {
    const loadPortfolios = async () => {
      const data = await api.fetchPortfolios();
      setPortfolios(data || []);
    };

    loadPortfolios();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [currentFolderId, currentPage, searchQuery]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const loadData = async () => {
    setLoading(true);
    const foldersData = await api.fetchFolders();
    const assetsData = await api.fetchAssets(currentFolderId || undefined, currentPage, itemsPerPage, searchQuery);
    
    setFolders(foldersData || []);
    setAssets(assetsData?.assets || []);
    setTotalPages(assetsData?.totalPages || 1);
    setLoading(false);
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
      const failedIds: string[] = [];

      for (const id of selectedAssetIds) {
        // Keep delete operations sequential to reduce API burst failures.
        const result = await api.deleteAsset(id);
        if (result?.error) {
          failedIds.push(id);
        }
      }

      const deletedCount = selectedAssetIds.length - failedIds.length;
      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} image${deletedCount === 1 ? "" : "s"}`);
      }

      if (failedIds.length > 0) {
        toast.error(`Failed to delete ${failedIds.length} image${failedIds.length === 1 ? "" : "s"}`);
      }

      setSelectedAssetIds((prev) => prev.filter((id) => failedIds.includes(id)));
      await loadData();
    } catch {
      toast.error("Failed to delete selected images");
    } finally {
      setUploading(false);
    }
  };

  const handleMoveSelectedAssets = async () => {
    if (selectedAssetIds.length === 0) return;
    if (!targetMoveFolderId) {
      toast.error("Choose a destination folder");
      return;
    }

    const destinationFolderId = targetMoveFolderId === "__none__" ? null : targetMoveFolderId;
    if (destinationFolderId === (currentFolderId || null)) {
      toast.error("Selected images are already in that location");
      return;
    }

    setMovingSelected(true);
    try {
      const result = await api.moveAssetsToFolder(selectedAssetIds, destinationFolderId);
      if (result.error) {
        toast.error(result.error);
      } else if (!result.updated) {
        toast.error("No images were moved. Refresh and try again.");
      } else {
        toast.success(`Moved ${result.updated} image${result.updated === 1 ? "" : "s"}`);
        setSelectedAssetIds([]);
        setTargetMoveFolderId("");
        await loadData();
      }
    } catch {
      toast.error("Failed to move selected images");
    } finally {
      setMovingSelected(false);
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

  const handlePreviewPrevious = () => {
    if (previewAssetIndex <= 0) return;
    setPreviewAssetId(assets[previewAssetIndex - 1].id);
  };

  const handlePreviewNext = () => {
    if (previewAssetIndex < 0 || previewAssetIndex >= assets.length - 1) return;
    setPreviewAssetId(assets[previewAssetIndex + 1].id);
  };

  const handleDeletePreviewAsset = async () => {
    if (!previewAsset || deletingPreview) return;

    setDeletingPreview(true);
    const deletedIndex = previewAssetIndex;
    const deletedId = previewAsset.id;
    const result = await api.deleteAsset(deletedId);

    if (result.error) {
      toast.error(result.error);
      setDeletingPreview(false);
      return;
    }

    toast.success("Asset deleted");
    const nextAssets = assets.filter((asset) => asset.id !== deletedId);
    setAssets(nextAssets);
    setSelectedAssetIds((prev) => prev.filter((id) => id !== deletedId));

    if (nextAssets.length === 0) {
      setPreviewAssetId(null);
    } else {
      const nextIndex = Math.min(deletedIndex, nextAssets.length - 1);
      setPreviewAssetId(nextAssets[nextIndex].id);
    }

    setDeletingPreview(false);
  };

  const handleAddSelectedToPortfolio = async () => {
    if (selectedAssetIds.length === 0) return;
    if (!targetPortfolioId) {
      toast.error("Choose a destination portfolio");
      return;
    }

    const selectedUrls = assets
      .filter((asset) => selectedAssetIds.includes(asset.id))
      .map((asset) => asset.url);

    if (selectedUrls.length === 0) {
      toast.error("Selected images are not available on this page");
      return;
    }

    setAddingToPortfolio(true);
    try {
      const result = await api.addImagesToPortfolioBulk(targetPortfolioId, selectedUrls);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Added ${selectedUrls.length} image${selectedUrls.length === 1 ? "" : "s"} to portfolio`);
        setTargetPortfolioId("");
      }
    } catch {
      toast.error("Failed to add selected images to portfolio");
    } finally {
      setAddingToPortfolio(false);
    }
  };

  const handleGoToPage = () => {
    const target = Number.parseInt(pageInput, 10);
    if (Number.isNaN(target)) return;
    const boundedPage = Math.min(Math.max(target, 1), totalPages);
    setCurrentPage(boundedPage);
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
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Upload Tools */}
          <div className="lg:col-span-1 space-y-8">
            <AdminSection title="Asset Tools" description="Upload files or add image links in the selected folder." contentClassName="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                  <TabsTrigger value="links" className="text-xs">Links</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <p className="text-xs text-muted-foreground">Select one or more images to upload to this folder.</p>
                  <Button
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ backgroundColor: "#B09345" }}
                  >
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploading ? "Uploading..." : "Select Files"}
                  </Button>
                </TabsContent>

                <TabsContent value="links" className="space-y-4">
                  <p className="text-xs text-muted-foreground">Paste one image link per line (advanced).</p>
                  <Textarea
                    className="min-h-[150px] text-xs font-mono"
                    placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                  />
                  <Button className="w-full" variant="outline" onClick={handleBulkAdd}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Add Links
                  </Button>
                </TabsContent>
              </Tabs>
            </AdminSection>
          </div>

          {/* Main Content: Media Library */}
          <div className="lg:col-span-3 space-y-8">
             <div className="overflow-hidden rounded-xl border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="font-medium text-slate-600">Folder</span>
                    <select
                      className="h-8 min-w-[220px] rounded-md border border-slate-300 bg-white px-2 text-sm"
                      value={currentFolderId ?? ""}
                      onChange={(e) => {
                        const nextFolderId = e.target.value || null;
                        setCurrentFolderId(nextFolderId);
                        const nextParams = new URLSearchParams(searchParams);
                        if (nextFolderId) {
                          nextParams.set("folderId", nextFolderId);
                        } else {
                          nextParams.delete("folderId");
                        }
                        setSearchParams(nextParams, { replace: true });
                      }}
                    >
                      <option value="">All Folders</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <Link to="/admin/folders">
                      <Button variant="outline" size="sm" className="h-8">
                        Manage Folders
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-200/70 px-2 py-1 text-xs text-slate-700">
                      {assets.length} image{assets.length === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-slate-200/70 px-2 py-1 text-xs text-slate-700">
                      {selectedAssetIds.length} selected
                    </span>
                  </div>
                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectAllOnPage} disabled={assets.length === 0}>
                  Select Page
                </Button>
                {selectedAssetIds.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleClearSelection}>
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      disabled={uploading}
                    >
                      Delete Selected
                    </Button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2">
                <select
                  className="h-8 min-w-[220px] rounded-md border border-slate-300 bg-white px-2 text-sm"
                  value={targetMoveFolderId}
                  onChange={(e) => setTargetMoveFolderId(e.target.value)}
                >
                  <option value="">Move selected to folder...</option>
                  <option value="__none__">No folder (root)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMoveSelectedAssets}
                  disabled={selectedAssetIds.length === 0 || !targetMoveFolderId || movingSelected}
                >
                  {movingSelected ? "Moving..." : "Move Selected"}
                </Button>

                <select
                  className="h-8 min-w-[220px] rounded-md border border-slate-300 bg-white px-2 text-sm"
                  value={targetPortfolioId}
                  onChange={(e) => setTargetPortfolioId(e.target.value)}
                >
                  <option value="">Add selected to portfolio...</option>
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.title}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSelectedToPortfolio}
                  disabled={selectedAssetIds.length === 0 || !targetPortfolioId || addingToPortfolio}
                >
                  {addingToPortfolio ? "Adding..." : "Add To Portfolio"}
                </Button>
              </div>

              {/* Assets Grid */}
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
                               setPreviewAssetId(asset.id);
                             }}
                             className="h-9 w-9 bg-white text-slate-700 hover:bg-slate-100 border-none"
                             title="View full image"
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
                               title="Use as folder thumbnail"
                             >
                               <CheckCircle2 className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                         {currentFolderId && folders.find(f => f.id === currentFolderId)?.cover_image_url === asset.url && (
                           <span className="text-[10px] text-white bg-emerald-500 px-2 py-1 rounded-full uppercase tracking-widest font-bold">Folder Thumbnail</span>
                         )}
                      </div>
                   </div>
                 ))}
                 {assets.length === 0 && !loading && (
                   <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-white/50">
                     <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-10" />
                     <p className="mb-4">No images found for this folder.</p>
                     <div className="flex flex-wrap items-center justify-center gap-2">
                       <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                         <Upload className="mr-2 h-4 w-4" /> Upload From Computer
                       </Button>
                       <Link to="/admin/folders">
                         <Button variant="outline">Go To Folders</Button>
                       </Link>
                     </div>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleGoToPage();
                        }
                      }}
                      className="h-8 w-20"
                    />
                    <Button variant="outline" size="sm" onClick={handleGoToPage}>
                      Go
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>

        <Dialog open={Boolean(previewAsset)} onOpenChange={(open) => !open && setPreviewAssetId(null)}>
          <DialogContent className="max-w-5xl border-none bg-black/95 p-2 [&>button]:rounded-md [&>button]:border [&>button]:border-white/60 [&>button]:bg-black/50 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-black/70">
            <DialogTitle className="sr-only">Image preview</DialogTitle>
            {previewAsset && (
              <div className="relative">
                <img
                  src={previewAsset.url}
                  alt="Asset preview"
                  className="w-full max-h-[92vh] object-contain rounded"
                />

                <div className="absolute left-2 top-2 flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                    onClick={handleDeletePreviewAsset}
                    disabled={deletingPreview}
                    title="Delete image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 bg-white/90 text-slate-800 hover:bg-white"
                  onClick={handlePreviewPrevious}
                  disabled={previewAssetIndex <= 0}
                  title="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 bg-white/90 text-slate-800 hover:bg-white"
                  onClick={handlePreviewNext}
                  disabled={previewAssetIndex < 0 || previewAssetIndex >= assets.length - 1}
                  title="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedAssetIds.length} selected images?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All selected images will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await handleDeleteSelectedAssets();
                  setShowBulkDeleteConfirm(false);
                }}
              >
                Delete Selected Images
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminPage>
    </>
  );
};

export default AdminAssets;


