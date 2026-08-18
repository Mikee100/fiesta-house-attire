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

  const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value : [];

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

      const safePostsData = postsData && typeof postsData === "object" ? postsData : {};
      setPosts(asArray<BlogPost>((safePostsData as { posts?: unknown }).posts));

      const maybeTotalPages = (safePostsData as { totalPages?: unknown }).totalPages;
      const safeTotalPages = typeof maybeTotalPages === "number" && Number.isFinite(maybeTotalPages)
        ? Math.max(1, maybeTotalPages)
        : 1;
      setTotalPages(safeTotalPages);

      setCategories(asArray<BlogCategory>(catsData));
      setRecentPosts(asArray<BlogPost>(recentData));
    } catch (error) {
      console.error("Error fetching blog data", error);
      setPosts([]);
      setCategories([]);
      setRecentPosts([]);
      setTotalPages(1);
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
              
              {/* Category Filter */}
              <div className="mb-10 fade-in">
                <div className="md:hidden">
                  <div className="mb-2 flex items-center gap-1 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span>Swipe categories</span>
                    <ChevronRight className="h-3 w-3 animate-pulse" />
                  </div>
                  <div className="relative -mx-4">
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent" />
                    <div className="overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex w-max items-center gap-2 pr-4">
                        <button
                          onClick={() => handleCategoryFilter()}
                          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${!categorySlug ? 'bg-[var(--sky-blue)] text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          All Stories
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryFilter(cat.slug)}
                            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${categorySlug === cat.slug ? 'bg-[var(--magenta)] text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => handleCategoryFilter()}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${!categorySlug ? 'bg-[var(--sky-blue)] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    All Stories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryFilter(cat.slug)}
                      className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${categorySlug === cat.slug ? 'bg-[var(--magenta)] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
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
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              style={{ transitionDuration: "1500ms" }}
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

            {/* Editorial story strip */}
            <section
              className="pt-10 border-t border-slate-200/80 fade-in"
              style={{ animationDelay: "500ms" }}
              aria-label="Fiesta House story and recent posts"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <div className="lg:col-span-5">
                  <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-[var(--magenta)] via-[#D98CC7] to-[var(--sky-blue)]" />
                    <div className="p-8">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shadow-inner shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=300&h=300"
                            alt="Fiesta House"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--magenta)] font-bold mb-1">
                            Editorial Note
                          </p>
                          <h3 className="font-display text-3xl leading-tight text-[var(--text)]">
                            The Fiesta House Story
                          </h3>
                        </div>
                      </div>

                      <p className="text-slate-600 leading-relaxed text-[15px]">
                        We believe every pregnancy is a masterpiece waiting to be captured. Our blog is a curated space for inspiration, styling tips, and the stories behind our most iconic sessions in Nairobi.
                      </p>

                      <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                        Crafted for modern maternity storytelling
                      </p>
                    </div>
                  </div>
                </div>

                {recentPosts.length > 0 && (
                  <div className="lg:col-span-7">
                    <div className="flex items-end justify-between mb-5">
                      <h3 className="font-display text-3xl text-[var(--text)] leading-none">More Stories</h3>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">Latest Reads</span>
                    </div>

                    <div className="divide-y divide-slate-200/80 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/60 overflow-hidden">
                      {recentPosts.slice(0, 2).map((post) => (
                        <Link
                          key={post.id}
                          to={`/blog/${post.slug}`}
                          className="group grid grid-cols-[96px_1fr] gap-4 p-5 hover:bg-white/90 transition-colors"
                        >
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
                            {post.cover_image_url && (
                              <img
                                src={post.cover_image_url}
                                alt={post.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display text-[1.35rem] leading-[1.2] text-[var(--text)] group-hover:text-[var(--magenta)] transition-colors line-clamp-2 mb-2">
                              {post.title}
                            </h4>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                              {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Draft"}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

    </Layout>
  );
};

export default Blog;
