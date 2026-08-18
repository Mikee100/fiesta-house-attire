import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import * as api from "@/lib/api";
import { BlogPost } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Globe, FileText, Search, ArrowUp, ArrowDown } from "lucide-react";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import SEO from "@/components/site/SEO";

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reordering, setReordering] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllBlogPosts();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          const aOrder = Number.isFinite(a.sort_order as number) ? (a.sort_order as number) : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(b.sort_order as number) ? (b.sort_order as number) : Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setPosts(sorted);
      } else {
        console.error("Failed to load posts:", data);
        setPosts([]);
        toast.error("Failed to fetch blog posts");
      }
    } catch (err) {
      toast.error("Failed to fetch blog posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.deleteBlogPost(id);
      toast.success("Post deleted");
      fetchPosts();
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateBlogPost(post.id, { 
        status: newStatus,
        published_at: newStatus === 'published' && !post.published_at ? new Date().toISOString() : post.published_at
      });
      toast.success(`Post marked as ${newStatus}`);
      fetchPosts();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleMove = async (postId: string, direction: "up" | "down") => {
    const currentIndex = posts.findIndex((p) => p.id === postId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= posts.length) return;

    const nextPosts = [...posts];
    [nextPosts[currentIndex], nextPosts[targetIndex]] = [nextPosts[targetIndex], nextPosts[currentIndex]];

    setPosts(nextPosts.map((p, idx) => ({ ...p, sort_order: idx })));
    setReordering(true);
    try {
      const result = await api.reorderBlogPosts(nextPosts.map((p) => p.id));
      if (result?.error) {
        toast.error(result.error);
        fetchPosts();
        return;
      }
      toast.success("Blog post order updated");
    } catch (err) {
      toast.error("Failed to save post order");
      fetchPosts();
    } finally {
      setReordering(false);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.categories?.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <SEO title="Admin Blog" noindex nofollow />
      <AdminPage
        title="Blog Posts"
        description="Manage your articles and categories"
        maxWidthClassName="max-w-6xl"
        actions={
          <Link to="/admin/blog/new">
            <Button className="bg-[var(--sky-blue)] hover:bg-[#5AAFD1] text-white">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </Link>
        }
      >
        <AdminSection className="overflow-hidden" contentClassName="p-0" title="All Posts" description="Search, edit, publish, and delete blog content.">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <AdminToolbar
              left={
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search posts..."
                    className="pl-9 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              }
              right={
                <div className="flex items-center gap-2">
                  <AdminStatusPill label={`${filteredPosts.length} posts`} tone="neutral" />
                  {reordering && <AdminStatusPill label="Saving order..." tone="warning" />}
                </div>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[88px]">Order</TableHead>
                  <TableHead className="w-[400px]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">Loading posts...</TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">No posts found.</TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => {
                    const currentIndex = posts.findIndex((p) => p.id === post.id);
                    return (
                    <TableRow key={post.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1 text-xs font-semibold text-slate-600">
                            {currentIndex + 1}
                          </span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-slate-700"
                              onClick={() => handleMove(post.id, "up")}
                              disabled={reordering || currentIndex <= 0}
                              title="Move up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-slate-700"
                              onClick={() => handleMove(post.id, "down")}
                              disabled={reordering || currentIndex < 0 || currentIndex >= posts.length - 1}
                              title="Move down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {post.title}
                        <div className="text-xs font-normal text-slate-400 mt-1">{post.slug}</div>
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => toggleStatus(post)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            post.status === 'published' 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {post.status === 'published' ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.categories?.map(c => (
                            <span key={c.id} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/blog/${post.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[var(--sky-blue)]" title="View">
                              <Globe className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/admin/blog/${post.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[var(--magenta)]" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" 
                            onClick={() => handleDelete(post.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </AdminSection>
      </AdminPage>
    </>
  );
};

export default AdminBlog;
