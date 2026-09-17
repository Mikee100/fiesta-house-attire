import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { ChevronLeft, Plus, Trash2, Image as ImageIcon, Library, Folder, Search, CheckCircle2, Eye, DatabaseZap } from "lucide-react";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import SEO from "@/components/site/SEO";

type PortfolioImage = {
  id: string;
  url: string;
};

type PortfolioItem = {
  id: string;
  title: string;
  images: PortfolioImage[];
  cover_image_url?: string | null;
};

type AssetItem = {
  id: string;
  url: string;
};

type FolderItem = {
  id: string;
  name: string;
};

type AssetsResponse = {
  assets: AssetItem[];
  totalPages: number;
};

const AdminPortfolio = () => {
  const ADMIN_IMAGE_PAGE_SIZE = 100;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioItem | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentLibraryFolderId, setCurrentLibraryFolderId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedPortfolioImageIds, setSelectedPortfolioImageIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    fetchPortfolioDetails();
  }, [id]);

  useEffect(() => {
    loadFolders();
  }, [isLibraryOpen]);

  useEffect(() => {
    loadAssets();
  }, [currentPage, isLibraryOpen, currentLibraryFolderId, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPortfolioDetails = async () => {
    setLoading(true);
    const portfolios = await api.fetchPortfolios();
    const found = Array.isArray(portfolios)
      ? (portfolios as PortfolioItem[]).find((p) => p.id === id)
      : undefined;
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
    const foldersData: unknown = await api.fetchFolders();
    setFolders(Array.isArray(foldersData) ? (foldersData as FolderItem[]) : []);
  };

  const loadAssets = async () => {
    if (!isLibraryOpen) return;
    const assetsData: unknown = await api.fetchAssets(currentLibraryFolderId || undefined, currentPage, ADMIN_IMAGE_PAGE_SIZE, debouncedSearch);
    const parsed = (assetsData && typeof assetsData === "object") ? (assetsData as Partial<AssetsResponse>) : {};
    setAssets(Array.isArray(parsed.assets) ? parsed.assets : []);
    setTotalPages(typeof parsed.totalPages === "number" ? parsed.totalPages : 1);
  };

  const toggleAssetSelection = (url: string) => {
    setSelectedAssets((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  const handleAddImages = async () => {
    if (selectedAssets.length === 0 || !id) return;

    setIsProcessing(true);
    const result = await api.addImagesToPortfolioBulk(id, selectedAssets);
    setIsProcessing(false);

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

    setIsProcessing(true);
    const assetsData: unknown = await api.fetchAssets(currentLibraryFolderId, 1, 100);
    const parsed = (assetsData && typeof assetsData === "object") ? (assetsData as Partial<AssetsResponse>) : {};
    const urls = Array.isArray(parsed.assets) ? parsed.assets.map((a) => a.url) : [];

    if (urls.length === 0) {
      toast.error("Folder is empty");
      setIsProcessing(false);
      return;
    }

    const result = await api.addImagesToPortfolioBulk(id, urls);
    setIsProcessing(false);

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

    setIsProcessing(true);
    const result = await api.addImageToPortfolio(id, newImageUrl);
    setIsProcessing(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image added");
      setNewImageUrl("");
      fetchPortfolioDetails();
    }
  };

  const handleDeduplicate = async () => {
    if (!id) return;
    setIsProcessing(true);
    const result = await api.deduplicatePortfolioImages(id);
    setIsProcessing(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.removedCount > 0 ? `Removed ${result.removedCount} duplicates` : "No duplicates found");
      fetchPortfolioDetails();
    }
  };

  const handleRemoveImageFromPortfolio = async (imageId: string) => {
    const result = await api.removeImageFromPortfolio(imageId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image removed from this portfolio");
      fetchPortfolioDetails();
    }
  };

  const togglePortfolioImageSelection = (imageId: string) => {
    setSelectedPortfolioImageIds((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  const handleSelectAllPortfolioImages = () => {
    const visibleIds =
      portfolio?.images
        ?.filter((img) => !localSearch || img.url.toLowerCase().includes(localSearch.toLowerCase()))
        .map((img) => img.id) || [];
    setSelectedPortfolioImageIds(visibleIds);
  };

  const handleClearPortfolioSelection = () => {
    setSelectedPortfolioImageIds([]);
  };

  const handleRemoveSelectedPortfolioImages = async () => {
    if (selectedPortfolioImageIds.length === 0) return;

    setIsProcessing(true);
    try {
      const failedIds: string[] = [];

      for (const imageId of selectedPortfolioImageIds) {
        // Keep operations sequential to reduce transient API failures.
        const result = await api.removeImageFromPortfolio(imageId);
        if (result?.error) {
          failedIds.push(imageId);
        }
      }

      const deletedCount = selectedPortfolioImageIds.length - failedIds.length;
      if (deletedCount > 0) {
        toast.success(`Removed ${deletedCount} image${deletedCount === 1 ? "" : "s"} from this portfolio`);
      }

      if (failedIds.length > 0) {
        toast.error(`Failed to remove ${failedIds.length} image${failedIds.length === 1 ? "" : "s"} from this portfolio`);
      }

      setSelectedPortfolioImageIds((prev) => prev.filter((id) => failedIds.includes(id)));
      await fetchPortfolioDetails();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteLibraryAssetFromPortfolioImage = async (imageId: string) => {
    const confirmed = window.confirm(
      "Delete this image from the media library globally? This will remove it from all portfolios and clear it as a cover image where used."
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const result = await api.deleteLibraryAssetFromPortfolioImage(imageId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Image deleted from library globally");
        setSelectedPortfolioImageIds([]);
        await fetchPortfolioDetails();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelectedFromLibrary = async () => {
    if (selectedPortfolioImageIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedPortfolioImageIds.length} selected image${selectedPortfolioImageIds.length === 1 ? "" : "s"} from the media library globally? This removes them from all portfolios too.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const failedIds: string[] = [];

      for (const imageId of selectedPortfolioImageIds) {
        const result = await api.deleteLibraryAssetFromPortfolioImage(imageId);
        if (result?.error) {
          failedIds.push(imageId);
        }
      }

      const deletedCount = selectedPortfolioImageIds.length - failedIds.length;
      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} image${deletedCount === 1 ? "" : "s"} from library globally`);
      }

      if (failedIds.length > 0) {
        toast.error(`Failed to delete ${failedIds.length} image${failedIds.length === 1 ? "" : "s"} from library`);
      }

      setSelectedPortfolioImageIds((prev) => prev.filter((id) => failedIds.includes(id)));
      await fetchPortfolioDetails();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Admin Portfolio" noindex nofollow />
        <AdminPage title="Loading Portfolio" description="Preparing portfolio details..." maxWidthClassName="max-w-6xl">
          <div className="py-16 text-center text-slate-500">Loading...</div>
        </AdminPage>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin Portfolio" noindex nofollow />
      <AdminPage
        title={portfolio?.title || "Portfolio"}
        description="Manage images in this collection"
        maxWidthClassName="max-w-6xl"
        actions={
          <>
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" /> Back to Portfolios
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeduplicate}
              disabled={isProcessing}
              className="border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              {isProcessing ? "Processing..." : "Clean Duplicates"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-6 h-fit">
            <AdminSection title="Search Library" contentClassName="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all images..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isLibraryOpen) setIsLibraryOpen(true);
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Type to search and add from your entire media library</p>
            </AdminSection>

            <AdminSection title="Add via URL" contentClassName="space-y-4">
              <Input placeholder="Image URL" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
              <Button
                className="w-full"
                onClick={handleAddImageViaUrl}
                disabled={isProcessing || !newImageUrl}
                style={{ backgroundColor: "#B09345" }}
              >
                <Plus className="mr-2 h-4 w-4" /> {isProcessing ? "Adding..." : "Add to Portfolio"}
              </Button>
            </AdminSection>

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
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search images..."
                          className="pl-10 h-9 w-[300px] bg-slate-50 border-none ring-1 ring-slate-200"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="inline-flex items-center text-xs text-muted-foreground">Up to {ADMIN_IMAGE_PAGE_SIZE} per page</span>
                      {currentLibraryFolderId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddAllFromFolder}
                          disabled={isProcessing}
                          className="border-sky-200 text-sky-600 hover:bg-sky-50"
                        >
                          {isProcessing ? "Adding..." : "Add All from Folder"}
                        </Button>
                      )}
                      {selectedAssets.length > 0 && (
                        <Button
                          onClick={handleAddImages}
                          size="sm"
                          disabled={isProcessing}
                          className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-200"
                        >
                          {isProcessing ? "Adding..." : `Add ${selectedAssets.length} Selected`}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden bg-slate-50/50">
                  <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
                    <div className="p-4 border-b bg-slate-50/50">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collections</h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                      <Button
                        variant={!currentLibraryFolderId ? "secondary" : "ghost"}
                        className={`w-full justify-start font-medium ${!currentLibraryFolderId ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : ""}`}
                        onClick={() => setCurrentLibraryFolderId(null)}
                      >
                        <Library className="h-4 w-4 mr-3" />
                        All Assets
                      </Button>
                      <div className="my-2 border-t mx-2" />
                      {folders.map((folder) => (
                        <Button
                          key={folder.id}
                          variant={currentLibraryFolderId === folder.id ? "secondary" : "ghost"}
                          className={`w-full justify-start font-medium ${currentLibraryFolderId === folder.id ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : ""}`}
                          onClick={() => setCurrentLibraryFolderId(folder.id)}
                        >
                          <Folder className={`h-4 w-4 mr-3 ${currentLibraryFolderId === folder.id ? "fill-sky-400 text-sky-500" : "text-slate-400"}`} />
                          <span className="truncate">{folder.name}</span>
                        </Button>
                      ))}
                    </nav>
                  </aside>

                  <main className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                          <div
                            key={asset.id}
                            className={`group relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm ${
                              selectedAssets.includes(asset.url)
                                ? "border-sky-500 ring-4 ring-sky-500/10 scale-[0.98]"
                                : "border-transparent hover:border-sky-300 hover:shadow-md"
                            }`}
                            onClick={() => toggleAssetSelection(asset.url)}
                          >
                            <img src={asset.url} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />

                            <div
                              className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
                                selectedAssets.includes(asset.url) ? "bg-sky-500/30" : "bg-black/20 opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              {selectedAssets.includes(asset.url) ? (
                                <div className="flex gap-2">
                                  <div className="bg-sky-500 text-white p-2 rounded-full shadow-lg transform scale-110">
                                    <Plus className="h-5 w-5 rotate-45" />
                                  </div>
                                  <button
                                    type="button"
                                    className="bg-white/90 text-slate-700 p-2 rounded-full shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImageUrl(asset.url);
                                    }}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <div className="bg-white/90 backdrop-blur-sm text-sky-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                    SELECT IMAGE
                                  </div>
                                  <button
                                    type="button"
                                    className="bg-white/90 text-slate-700 p-1.5 rounded-full shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImageUrl(asset.url);
                                    }}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPage((prev) => Math.max(1, prev - 1));
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                            }}
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

          <div className="md:col-span-3 space-y-6">
            <AdminSection
              title={`Portfolio Images (${portfolio?.images?.length || 0})`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter images..."
                      className="pl-9 h-9"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAllPortfolioImages}>
                    Select Visible
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearPortfolioSelection} disabled={selectedPortfolioImageIds.length === 0}>
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelectedPortfolioImages}
                    disabled={selectedPortfolioImageIds.length === 0 || isProcessing}
                  >
                    Remove Selected ({selectedPortfolioImageIds.length})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelectedFromLibrary}
                    disabled={selectedPortfolioImageIds.length === 0 || isProcessing}
                    className="bg-red-700 hover:bg-red-800"
                  >
                    Delete Selected from Library
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio?.images
                  ?.filter((img) => !localSearch || img.url.toLowerCase().includes(localSearch.toLowerCase()))
                  .map((img) => (
                    <div
                      key={img.id}
                      className={`group relative aspect-[4/5] bg-slate-200 rounded-lg overflow-hidden border-2 cursor-pointer ${
                        selectedPortfolioImageIds.includes(img.id) ? "border-sky-500" : "border-transparent"
                      }`}
                      onClick={() => togglePortfolioImageSelection(img.id)}
                    >
                      <img src={img.url} alt="" className="object-cover w-full h-full" />
                      <div className="absolute left-2 top-2 z-10 rounded bg-black/45 px-2 py-1 text-[10px] font-semibold text-white">
                        {selectedPortfolioImageIds.includes(img.id) ? "Selected" : "Select"}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImageFromPortfolio(img.id);
                            }}
                            className="h-10 w-10 bg-white/95 text-red-600 hover:bg-white border border-red-200 shadow-md"
                            title="Remove from this portfolio"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLibraryAssetFromPortfolioImage(img.id);
                            }}
                            className="h-9 w-9 bg-red-700 hover:bg-red-800"
                            title="Delete from library globally"
                          >
                            <DatabaseZap className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageUrl(img.url);
                            }}
                            className="h-9 w-9 bg-white text-slate-700 hover:bg-slate-100 border-none"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!id) return;
                              const res = await api.updatePortfolio(id, { cover_image_url: img.url });
                              if (res.error) {
                                toast.error(res.error);
                              } else {
                                toast.success("Set as portfolio cover");
                                fetchPortfolioDetails();
                              }
                            }}
                            className={`h-9 w-9 border-none ${portfolio?.cover_image_url === img.url ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                            title="Set as portfolio cover"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {portfolio?.cover_image_url === img.url && (
                          <span className="text-[10px] text-white bg-emerald-500 px-2 py-1 rounded-full uppercase tracking-widest font-bold">
                            Cover Image
                          </span>
                        )}
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
            </AdminSection>
          </div>
        </div>

        <Dialog open={Boolean(previewImageUrl)} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
          <DialogContent className="max-w-5xl p-2 bg-black/95 border-none">
            <DialogTitle className="sr-only">Image preview</DialogTitle>
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="Portfolio image preview"
                className="w-full max-h-[82vh] object-contain rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </AdminPage>
    </>
  );
};

export default AdminPortfolio;


