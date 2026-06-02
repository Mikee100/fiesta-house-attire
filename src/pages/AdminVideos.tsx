import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload, Video } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import * as api from "@/lib/api";
import type { VideoItem } from "@/lib/api";
import SEO from "@/components/site/SEO";

const AdminVideos = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    source_type: "url" as "url" | "upload",
    is_featured: false,
    is_active: true,
  });

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAdminVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      video_url: "",
      source_type: "url",
      is_featured: false,
      is_active: true,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const upload = await api.uploadFile(file);
      if (!upload?.url) {
        toast.error(upload?.error || "Video upload failed");
        return;
      }
      setForm((prev) => ({
        ...prev,
        video_url: upload.url,
        source_type: "upload",
      }));
      toast.success("Video uploaded. Save to publish it.");
    } catch (err) {
      toast.error("Video upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error("Title and video URL are required");
      return;
    }

    setSaving(true);
    try {
      const result = await api.createVideo({
        title: form.title.trim(),
        description: form.description.trim(),
        video_url: form.video_url.trim(),
        source_type: form.source_type,
        is_featured: form.is_featured,
        is_active: form.is_active,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Video added");
        resetForm();
        loadVideos();
      }
    } catch (err) {
      toast.error("Failed to add video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    const result = await api.deleteVideo(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Video deleted");
    loadVideos();
  };

  const handleToggleFeatured = async (video: VideoItem) => {
    const result = await api.updateVideo(video.id, { is_featured: !video.is_featured });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(!video.is_featured ? "Marked as featured" : "Removed from featured");
    loadVideos();
  };

  const handleToggleActive = async (video: VideoItem) => {
    const result = await api.updateVideo(video.id, { is_active: !video.is_active });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(!video.is_active ? "Video activated" : "Video hidden");
    loadVideos();
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) return;

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= videos.length) return;

    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    setVideos(next);
    setReordering(true);

    try {
      const result = await api.reorderVideos(next.map((v) => v.id));
      if (result?.error) {
        toast.error(result.error);
        loadVideos();
      }
    } catch (err) {
      toast.error("Failed to save order");
      loadVideos();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Admin Videos" noindex nofollow />
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Videos</h1>
          <p className="text-slate-500">Add videos via URL or upload, then manage visibility and order.</p>
        </header>

        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Elegance in Motion"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Video URL</label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value, source_type: "url" }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Short description"
              className="min-h-[90px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button type="button" variant="outline" onClick={handlePickFile} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading..." : "Upload Video File"}
            </Button>
            <label className="text-sm text-slate-500 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
              />
              Featured
            </label>
            <label className="text-sm text-slate-500 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Add Video"}
            </Button>
          </div>
        </form>

        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Saved Videos</h2>
            <span className="text-sm text-slate-500">{videos.length} items</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No videos yet.</div>
          ) : (
            <div className="space-y-3">
              {videos.map((video, idx) => (
                <div key={video.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-slate-500" />
                      <p className="font-medium truncate">{video.title}</p>
                      {video.is_featured && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-fuchsia-100 text-fuchsia-700">Featured</span>}
                      {!video.is_active && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-slate-200 text-slate-700">Hidden</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{video.description || "No description"}</p>
                    <a href={video.video_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 break-all hover:underline">
                      {video.video_url}
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(video.id, "up")}
                      disabled={idx === 0 || reordering}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(video.id, "down")}
                      disabled={idx === videos.length - 1 || reordering}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleToggleFeatured(video)}>
                      {video.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button variant="outline" onClick={() => handleToggleActive(video)}>
                      {video.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(video.id)} title="Delete video">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminVideos;
