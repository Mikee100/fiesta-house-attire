import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import * as api from "@/lib/api";
import { BlogPost } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Globe, FileText, Search } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import SEO from "@/components/site/SEO";

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllBlogPosts();
      if (Array.isArray(data)) {
        setPosts(data);
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

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.categories?.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Admin Blog" noindex nofollow />
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Blog Posts</h1>
            <p className="text-muted-foreground">Manage your articles and categories</p>
          </div>
          <Link to="/admin/blog/new">
            <Button className="bg-[var(--sky-blue)] hover:bg-[#5AAFD1] text-white">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </Link>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search posts..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {filteredPosts.length} posts
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">Loading posts...</TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">No posts found.</TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id} className="group">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;
