import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { BlogPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Calendar, User, Facebook, Twitter, Instagram, MessageCircle, Copy, Clock3 } from "lucide-react";
import { Footer } from "react-day-picker";
import Navbar from "@/components/site/Navbar";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  const hasRenderableContent = (html?: string | null) => {
    if (!html) return false;
    const textOnly = html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();
    return textOnly.length > 0;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) fetchData(slug);
  }, [slug]);

  useEffect(() => {
    if (loading || !post) {
      setReadingProgress(0);
      return;
    }

    const updateProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollableHeight = doc.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setReadingProgress(0);
        return;
      }

      const nextProgress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
      setReadingProgress(nextProgress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [loading, post]);

  const readTimeMinutes = useMemo(() => {
    const rawHtml = `${post?.excerpt || ""} ${post?.content || ""}`;
    const plainText = rawHtml
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = plainText ? plainText.split(" ").length : 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [post?.excerpt, post?.content]);

  const fetchData = async (postSlug: string) => {
    setLoading(true);
    try {
      const [postData, recentData] = await Promise.all([
        api.fetchBlogPost(postSlug),
        api.fetchRecentBlogPosts()
      ]);
      setPost(postData);
      setRecentPosts(recentData || []);

      if (postData?.categories?.length) {
        const primaryCategorySlug = postData.categories[0]?.slug;
        if (primaryCategorySlug) {
          const relatedFeed = await api.fetchBlogPosts(1, primaryCategorySlug);
          const related = Array.isArray(relatedFeed?.posts)
            ? relatedFeed.posts.filter((item) => item.id !== postData.id).slice(0, 4)
            : [];
          setRelatedPosts(related);
        } else {
          setRelatedPosts([]);
        }
      } else {
        setRelatedPosts([]);
      }
    } catch (error) {
      console.error("Error fetching blog post", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--sky-blue)]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col justify-center items-center pt-24 pb-24 text-center">
          <h1 className="text-4xl font-display mb-4 text-[var(--text)]">Post Not Found</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            The article you are looking for does not exist or has been removed.
          </p>
          <Link to="/blog">
            <Button className="rounded-full bg-[var(--sky-blue)] hover:bg-[#5AAFD1] text-white">
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const showBodyContent = hasRenderableContent(post.content);
  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://fiestahouseattire.com/blog/${post.slug}`;
  const shareUrl = encodeURIComponent(currentUrl);
  const shareTitle = encodeURIComponent(post.title);

  const shareItems = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      icon: Facebook,
      className: "text-[#1877F2] hover:bg-[#1877F2]/10"
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      icon: Twitter,
      className: "text-black hover:bg-black/10"
    },
    {
      label: "Instagram",
      href: `https://www.instagram.com/fiestahouseattire/`,
      icon: Instagram,
      className: "text-[#E4405F] hover:bg-[#E4405F]/10"
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${currentUrl}`)}`,
      icon: MessageCircle,
      className: "text-[#25D366] hover:bg-[#25D366]/10"
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      // Fallback for environments where clipboard API is unavailable.
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return (
    <Layout
      title={post.title}
      description={post.excerpt || `Read ${post.title} on Fiesta House Attire's blog.`}
      ogImage={post.cover_image_url}
    >
      <div className="fixed left-0 top-0 z-[70] h-0.5 w-full pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[var(--sky-blue)] to-[var(--magenta)] transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="flex-grow pt-24 pb-24">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6">

          <Link to="/blog" className="inline-flex items-center text-slate-500 hover:text-[var(--sky-blue)] transition-colors mb-8 text-sm font-medium uppercase tracking-wider fade-in">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to all articles
          </Link>

          {/* Post Header */}
          <div className="text-center mb-12 fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-center flex-wrap gap-2 mb-6">
              {post.categories?.map(cat => (
                <Link key={cat.id} to={`/blog?category=${cat.slug}`}>
                  <span className="bg-[var(--magenta-tint)] text-[var(--magenta)] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display leading-tight text-[var(--text)] mb-6 max-w-4xl mx-auto">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" /> {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : 'Draft'}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {readTimeMinutes} min read
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="w-full aspect-[21/9] md:aspect-[2.5/1] bg-slate-100 rounded-3xl overflow-hidden mb-16 shadow-sm fade-in" style={{ animationDelay: '200ms' }}>
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">

            {/* Content Area */}
            <article className="lg:col-span-3 fade-in" style={{ animationDelay: '300ms' }}>

              {post.excerpt && (
                <p className="text-xl md:text-2xl text-slate-600 font-display italic mb-10 leading-relaxed border-l-4 border-[var(--sky-blue)] pl-6">
                  {post.excerpt}
                </p>
              )}

              {showBodyContent ? (
                <div
                  className="prose prose-lg prose-slate max-w-none 
                             prose-headings:font-display prose-headings:font-normal prose-headings:text-[var(--text)]
                             prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                             prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                             prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                             prose-a:text-[var(--sky-blue)] prose-a:no-underline hover:prose-a:text-[var(--magenta)]
                             prose-img:rounded-2xl prose-img:shadow-sm prose-img:my-10"
                  dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 md:p-8 text-center">
                  <h2 className="text-2xl font-display text-[var(--text)] mb-3">This article is being updated</h2>
                  <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto mb-5">
                    The full story text for this post has not been added yet. Please check back soon, or explore other stories below.
                  </p>
                  <Link to="/blog">
                    <Button variant="outline" className="rounded-full border-slate-300 hover:border-[var(--sky-blue)] hover:text-[var(--sky-blue)]">
                      Browse More Articles
                    </Button>
                  </Link>
                </div>
              )}

           
            </article>

            {/* Sidebar */}
            <aside className="space-y-12 fade-in" style={{ animationDelay: '400ms' }}>
              {recentPosts.filter(rp => rp.id !== post.id).length > 0 && (
                <div className="sticky top-32">
                  <h3 className="font-display text-2xl font-medium mb-6 flex items-center after:content-[''] after:h-px after:bg-slate-200 after:flex-grow after:ml-4">
                    Keep Reading
                  </h3>
                  <div className="space-y-8">
                    {recentPosts.filter(rp => rp.id !== post.id).slice(0, 4).map(rp => (
                      <Link key={rp.id} to={`/blog/${rp.slug}`} className="block group">
                        {rp.cover_image_url && (
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <img src={rp.cover_image_url} alt={rp.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        )}
                        <h4 className="font-medium text-base leading-tight text-[var(--text)] group-hover:text-[var(--sky-blue)] transition-colors line-clamp-3 mb-2">
                          {rp.title}
                        </h4>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                          {rp.published_at ? format(new Date(rp.published_at), 'MMM d, yyyy') : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-14 flex flex-col items-center gap-2 fade-in" style={{ animationDelay: '460ms' }}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Share This Article</h3>
            <div className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 shadow-sm">
              {shareItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    title={item.label}
                    aria-label={item.label}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors ${item.className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy link"
                aria-label="Copy link"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--sky-blue)]"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-slate-200 fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="font-display text-3xl font-medium mb-8 text-center">Related Posts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPosts.filter(rp => rp.id !== post.id).slice(0, 4).map(rp => (
                  <Link key={rp.id} to={`/blog/${rp.slug}`} className="block group">
                    {rp.cover_image_url && (
                      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-100">
                        <img src={rp.cover_image_url} alt={rp.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                    <h4 className="font-medium text-base leading-tight text-[var(--text)] group-hover:text-[var(--sky-blue)] transition-colors line-clamp-3 mb-2">
                      {rp.title}
                    </h4>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      {rp.published_at ? format(new Date(rp.published_at), 'MMM d, yyyy') : ''}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

    </Layout>
  );
};

export default BlogPostPage;
