import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Globe, Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import { BlogCategory, BlogPost } from "@/lib/api";
import { toast } from "sonner";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import SEO from "@/components/site/SEO";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminBlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    category_ids: [] as string[],
    status: "draft" as "draft" | "published"
  });

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'script', 'sub', 'super',
    'direction', 'color', 'background',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

  useEffect(() => {
    api.fetchBlogCategories().then(data => setCategories(data || []));
    
    if (isEditing) {
      // Need to fetch all to find by ID (since API gets by slug for public)
      api.fetchAllBlogPosts().then(posts => {
        const post = posts.find(p => p.id === id);
        if (post) {
          setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || "",
            content: post.content || "",
            cover_image_url: post.cover_image_url || "",
            category_ids: post.categories?.map(c => c.id) || [],
            status: post.status
          });
        } else {
          toast.error("Post not found");
          navigate("/admin/blog");
        }
        setLoading(false);
      });
    }
  }, [id, isEditing, navigate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-generate slug if we're not editing an existing post
      slug: !isEditing && !prev.slug ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
    }));
  };

  const handleCategoryToggle = (catId: string) => {
    setFormData(prev => {
      const current = prev.category_ids;
      return {
        ...prev,
        category_ids: current.includes(catId) 
          ? current.filter(id => id !== catId)
          : [...current, catId]
      };
    });
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    const payload = { ...formData, status };

    try {
      if (isEditing) {
        await api.updateBlogPost(id, payload);
        toast.success(`Post ${status === 'published' ? 'published' : 'saved as draft'}`);
      } else {
        await api.createBlogPost(payload);
        toast.success(`Post created and ${status === 'published' ? 'published' : 'saved as draft'}`);
        navigate("/admin/blog");
      }
      if (status !== formData.status) {
        setFormData(prev => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Admin Blog Editor" noindex nofollow />
        <AdminPage title="Blog Editor" description="Loading post editor..." maxWidthClassName="max-w-6xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--sky-blue)]" />
          </div>
        </AdminPage>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin Blog Editor" noindex nofollow />
      <AdminPage
        title={isEditing ? "Edit Post" : "New Post"}
        description="Write and publish blog content with metadata and categories."
        maxWidthClassName="max-w-6xl"
        actions={
          <>
            <Link to="/admin/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Posts
              </Button>
            </Link>
            <AdminStatusPill label={formData.status.toUpperCase()} tone={formData.status === "published" ? "success" : "warning"} />
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" /> Save Draft
            </Button>
            <Button
              className="bg-[var(--sky-blue)] hover:bg-[#5AAFD1] text-white"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <Globe className="h-4 w-4 mr-2" /> Publish
            </Button>
          </>
        }
      >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <AdminSection title="Editor" description="Compose title, excerpt, and rich text content." contentClassName="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={handleTitleChange} 
                  className="text-xl py-6 font-medium bg-slate-50"
                  placeholder="Enter post title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 bg-slate-100 px-3 py-2 rounded-md border border-slate-200 text-sm">/blog/</span>
                  <Input 
                    id="slug" 
                    value={formData.slug} 
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} 
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt (Short description)</Label>
                <Textarea 
                  id="excerpt" 
                  value={formData.excerpt} 
                  onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} 
                  rows={3}
                  className="resize-none"
                  placeholder="A brief summary of the post..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="flex justify-between items-end">
                  <span className="text-base font-semibold">Content</span>
                  <span className="text-xs text-muted-foreground font-normal">Rich text editor - formatting preserved on paste</span>
                </Label>
                <div className="quill-editor-container">
                  <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    modules={modules}
                    formats={formats}
                    placeholder="Write your amazing post here..."
                  />
                </div>
              </div>
            </AdminSection>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
            <AdminSection title="Post Settings" description="Set cover image and categories." contentClassName="space-y-6">
              
              <div className="space-y-3">
                <Label className="text-base font-semibold">Cover Image URL</Label>
                <Input 
                  value={formData.cover_image_url} 
                  onChange={e => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))} 
                  placeholder="https://..."
                />
                {formData.cover_image_url ? (
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 mt-2">
                    <img src={formData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 mt-2 flex items-center justify-center text-slate-400 text-sm">
                    No image provided
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">Paste a direct image URL. You can get URLs from the Media Library.</p>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-3">
                <Label className="text-base font-semibold">Categories</Label>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded-md">
                      <input 
                        type="checkbox" 
                        checked={formData.category_ids.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded border-slate-300 text-[var(--sky-blue)] focus:ring-[var(--sky-blue)]"
                      />
                      <span className="text-sm text-slate-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

          </AdminSection>
        </div>

      </div>
      </AdminPage>
    </>
  );
};

export default AdminBlogEditor;
