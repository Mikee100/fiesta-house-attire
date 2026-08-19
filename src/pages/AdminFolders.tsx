import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, ChevronRight, Plus, Images, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import SEO from "@/components/site/SEO";

const AdminFolders = () => {
  const [folders, setFolders] = useState<api.FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(true);

  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) ?? null : null;
  const parentFolder = currentFolder?.parent_id ? folders.find((f) => f.id === currentFolder.parent_id) ?? null : null;
  const childFolders = folders.filter((f) => f.parent_id === currentFolderId);

  const getFolderPath = (folder: api.FolderRecord): string => {
    const parts: string[] = [folder.name];
    let nextParentId = folder.parent_id;
    const visited = new Set<string>([folder.id]);
    let safety = 0;

    while (nextParentId && safety < 100) {
      if (visited.has(nextParentId)) {
        parts.unshift("[Cycle]");
        break;
      }

      visited.add(nextParentId);
      const parent = folders.find((f) => f.id === nextParentId);
      if (!parent) break;
      parts.unshift(parent.name);
      nextParentId = parent.parent_id ?? null;
      safety += 1;
    }

    return parts.join(" / ");
  };

  const allFoldersSorted = [...folders].sort((a, b) => getFolderPath(a).localeCompare(getFolderPath(b)));

  const loadFolders = async () => {
    setLoading(true);
    try {
      const foldersData = await api.fetchFolders();
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch {
      setFolders([]);
      toast.error("Could not load folders right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const result = await api.createFolder(newFolderName.trim(), currentFolderId || undefined);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Folder created");
    setNewFolderName("");
    await loadFolders();
  };

  const handleToggleFolderVisibility = async (folder: api.FolderRecord) => {
    const nextIsPublic = !(folder.is_public ?? true);
    const result = await api.updateFolder(folder.id, { is_public: nextIsPublic });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(nextIsPublic ? "Folder is now public" : "Folder is now private");
    await loadFolders();
  };

  const normalizeSlugInput = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleUpdatePublicSlug = async (folder: api.FolderRecord) => {
    const current = folder.public_slug || "";
    const nextRaw = window.prompt("Set public gallery slug (letters, numbers, hyphens)", current);
    if (nextRaw === null) return;

    const nextSlug = normalizeSlugInput(nextRaw);
    if (!nextSlug) {
      toast.error("Slug cannot be empty");
      return;
    }

    const result = await api.updateFolder(folder.id, { public_slug: nextSlug });
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Public URL updated to /gallery/${nextSlug}`);
    await loadFolders();
  };

  const handleCopyPublicGalleryLink = async (folder: api.FolderRecord) => {
    if (!folder.public_slug) {
      toast.error("This folder has no public slug yet");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/gallery/${folder.public_slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Public gallery URL copied");
  };

  return (
    <>
      <SEO title="Admin Folders" noindex nofollow />
      <AdminPage
        title="Folders"
        description="Create and organize folder structure for your media library"
        maxWidthClassName="max-w-6xl"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <AdminSection title="Create Folder" contentClassName="space-y-3">
              <p className="text-xs text-muted-foreground">This creates a folder inside the current location.</p>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button className="w-full" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Create Folder
              </Button>
            </AdminSection>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-slate-500">Location</span>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setCurrentFolderId(null)}>
                  All Folders
                </Button>
                {currentFolder && (
                  <>
                    <ChevronRight className="h-4 w-4 opacity-40" />
                    <span className="truncate font-semibold text-slate-900">{currentFolder.name}</span>
                  </>
                )}
                {currentFolder && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => setCurrentFolderId(currentFolder.parent_id ?? null)}
                  >
                    Back
                  </Button>
                )}
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {childFolders.length} subfolder{childFolders.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {childFolders.map((folder) => (
                <div key={folder.id} className="overflow-hidden rounded-lg border bg-white">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <div className="relative flex aspect-video items-center justify-center bg-slate-100">
                      {folder.cover_image_url ? (
                        <img src={folder.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Folder className="h-8 w-8 fill-sky-400/10 text-sky-400" />
                      )}
                    </div>
                    <div className="border-t p-3 text-left">
                      <span className="block truncate text-xs font-medium">{folder.name}</span>
                      <span className="mt-1 block truncate text-[10px] text-slate-500">/gallery/{folder.public_slug || "(not-set)"}</span>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${folder.is_public === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {folder.is_public === false ? "Private" : "Public"}
                      </span>
                    </div>
                  </button>
                  <div className="border-t px-3 py-2 space-y-2">
                    <Link to={`/admin/assets?folderId=${folder.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Images className="mr-2 h-4 w-4" /> Open Media
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleToggleFolderVisibility(folder)}
                    >
                      {folder.is_public === false ? "Make Public" : "Make Private"}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleUpdatePublicSlug(folder)}>
                      <LinkIcon className="mr-2 h-4 w-4" /> Edit Gallery URL
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleCopyPublicGalleryLink(folder)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Public Link
                    </Button>
                  </div>
                </div>
              ))}

              {childFolders.length === 0 && !loading && (
                <div className="col-span-full rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-500">
                  No subfolders here yet.
                </div>
              )}
            </div>

            <AdminSection
              title="All Folders Directory"
              description="Every folder in your media library, including nested folders."
              contentClassName="p-0"
            >
              <div className="max-h-[420px] overflow-y-auto">
                {allFoldersSorted.length === 0 && !loading ? (
                  <div className="p-6 text-sm text-slate-500">No folders found.</div>
                ) : (
                  allFoldersSorted.map((folder) => (
                    <div key={folder.id} className="flex items-center justify-between gap-2 border-t px-4 py-3 first:border-t-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{folder.name}</p>
                        <p className="truncate text-xs text-slate-500">{getFolderPath(folder)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="max-w-[210px] truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-700">
                          /gallery/{folder.public_slug || "(not-set)"}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${folder.is_public === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {folder.is_public === false ? "Private" : "Public"}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleUpdatePublicSlug(folder)}>
                          <LinkIcon className="mr-2 h-4 w-4" /> Edit URL
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopyPublicGalleryLink(folder)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Link
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleFolderVisibility(folder)}>
                          {folder.is_public === false ? "Make Public" : "Make Private"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentFolderId(folder.parent_id ?? null)}>
                          View Parent
                        </Button>
                        <Link to={`/admin/assets?folderId=${folder.id}`}>
                          <Button variant="outline" size="sm">
                            <Images className="mr-2 h-4 w-4" /> Open Media
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminSection>
          </div>
        </div>
      </AdminPage>
    </>
  );
};

export default AdminFolders;
