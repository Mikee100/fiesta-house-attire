import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { BlogPost, BlogCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BlogCardSkeleton } from "@/components/ui/SkeletonCards";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const categorySlug = searchParams.get("category") || undefined;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [page, categorySlug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsData, catsData, recentData] = await Promise.all([
        api.fetchBlogPosts(page, categorySlug),
        api.fetchBlogCategories(),
        api.fetchRecentBlogPosts()
      ]);
      setPosts(postsData.posts || []);
      setTotalPages(postsData.totalPages || 1);
      setCategories(catsData || []);
      setRecentPosts(recentData || []);
    } catch (error) {
      console.error("Error fetching blog data", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams);
    }
  };

  const handleCategoryFilter = (slug?: string) => {
    const newParams = new URLSearchParams();
    if (slug) newParams.set("category", slug);
    // Reset to page 1 on category change
    setSearchParams(newParams);
  };

  return (
    <Layout
      title="Stories & Insights | Maternity Photography Blog"
      description="Expert pregnancy photoshoot tips, styling advice, and professional maternity photography guidance from Nairobi's premier luxury studio."
      keywords="maternity photography blog, pregnancy photoshoot tips, styling for maternity shoot, nairobi maternity photography guide"
    >
      <main className="flex-grow pt-24 pb-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Hero Header */}
          <div className="text-center mb-16 fade-in">
            <h1 className="text-5xl md:text-6xl text-[var(--text)] mb-4">Stories & Insights</h1>
            <div className="w-24 h-1 bg-[var(--sky-blue)] mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Expert pregnancy photoshoot tips, styling advice, and professional maternity photography guidance.
            </p>
          </div>

          <div className="flex flex-col gap-16">
            
            {/* Main Content Area */}
            <div className="w-full">
              
              {/* Category Filter (Mobile/Tablet friendly) */}
              <div className="mb-10 flex flex-wrap justify-center gap-3 fade-in">
                <button 
                  onClick={() => handleCategoryFilter()}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${!categorySlug ? 'bg-[var(--sky-blue)] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                >
                  All Stories
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${categorySlug === cat.slug ? 'bg-[var(--magenta)] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
                  {Array(6).fill(0).map((_, i) => (
                    <BlogCardSkeleton key={i} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
                  <p className="text-lg text-slate-500">No posts found for this category.</p>
                  <Button 
                    variant="link" 
                    onClick={() => handleCategoryFilter()}
                    className="mt-4 text-[var(--sky-blue)]"
                  >
                    View all posts
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
                    {posts.map((post, idx) => (
                      <article 
                        key={post.id} 
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-full fade-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <Link to={`/blog/${post.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100">
                          {post.cover_image_url ? (
                            <img 
                              src={post.cover_image_url} 
                              alt={post.title} 
                              className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                              <span className="font-display italic text-2xl">Fiesta House</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                          
                          {post.categories && post.categories.length > 0 && (
                            <div className="absolute top-5 left-5">
                              <span className="bg-white/90 backdrop-blur-sm text-[var(--magenta)] text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm">
                                {post.categories[0].name}
                              </span>
                            </div>
                          )}
                        </Link>
                        
                        <div className="p-8 flex flex-col flex-grow">
                          <div className="text-[10px] text-[var(--sky-blue)] mb-4 font-bold uppercase tracking-[0.2em]">
                            {post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : 'Draft'}
                          </div>
                          <Link to={`/blog/${post.slug}`}>
                            <h2 className="text-2xl font-display font-medium text-[var(--text)] leading-[1.2] mb-4 group-hover:text-[var(--magenta)] transition-colors duration-300">
                              {post.title}
                            </h2>
                          </Link>
                          <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed flex-grow">
                            {post.excerpt || 'Read more about this maternity journey and the stories that make each session unique...'}
                          </p>
                          <Link 
                            to={`/blog/${post.slug}`} 
                            className="text-[var(--text)] font-semibold text-xs uppercase tracking-widest hover:text-[var(--sky-blue)] transition-colors inline-flex items-center mt-auto group/link"
                          >
                            Read Full Story <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-6 pb-12 border-b border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="rounded-full w-12 h-12 p-0 border-slate-200 hover:border-[var(--sky-blue)] hover:text-[var(--sky-blue)] transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="text-sm font-bold tracking-widest uppercase text-slate-400">
                        Page <span className="text-[var(--text)]">{page}</span> of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="rounded-full w-12 h-12 p-0 border-slate-200 hover:border-[var(--sky-blue)] hover:text-[var(--sky-blue)] transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar content integrated as a footer-like section */}
            <div className="grid grid-1 lg:grid-cols-2 gap-12 pt-8 fade-in" style={{ animationDelay: '500ms' }}>
              
              {/* About Section */}
              <div className="bg-white rounded-3xl p-10 border border-slate-50 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex-shrink-0 overflow-hidden shadow-inner">
                   <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=300&h=300" alt="Fiesta House" className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-display text-3xl font-medium mb-3">The Fiesta House Story</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-md leading-relaxed">
                    We believe every pregnancy is a masterpiece waiting to be captured. Our blog is a curated space for inspiration, styling tips, and the stories behind our most iconic sessions in Nairobi.
                  </p>
                  {/* Book Your Session button removed for minimalism */}
                </div>
              </div>

              {/* Recent Stories Integrated */}
              {recentPosts.length > 0 && (
                <div className="bg-[var(--sky-blue-tint)] rounded-3xl p-10 border border-white/50">
                  <h3 className="font-display text-2xl font-medium mb-8 flex items-center">
                    More Stories
                  </h3>
                  <div className="grid grid-1 sm:grid-cols-2 gap-6">
                    {recentPosts.slice(0, 2).map(post => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="flex flex-col group bg-white/40 p-4 rounded-2xl hover:bg-white/80 transition-all duration-300">
                        <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-white">
                          {post.cover_image_url && (
                            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm leading-tight text-[var(--text)] group-hover:text-[var(--sky-blue)] transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : ''}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

    </Layout>
  );
};

export default Blog;
