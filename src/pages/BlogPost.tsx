import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import * as api from "@/lib/api";
import { BlogPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Calendar, User } from "lucide-react";
import { Helmet } from "react-helmet";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) fetchData(slug);
  }, [slug]);

  const fetchData = async (postSlug: string) => {
    setLoading(true);
    try {
      const [postData, recentData] = await Promise.all([
        api.fetchBlogPost(postSlug),
        api.fetchRecentBlogPosts()
      ]);
      setPost(postData);
      setRecentPosts(recentData || []);
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
        <div className="flex-grow flex flex-col justify-center items-center pt-32 pb-24 text-center">
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

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Helmet>
        <title>{post.title} | Fiesta House Attire</title>
        <meta name="description" content={post.excerpt || `Read ${post.title} on Fiesta House Attire's blog.`} />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-32 pb-24">
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

           
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block space-y-12 fade-in" style={{ animationDelay: '400ms' }}>
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
                            <img src={rp.cover_image_url} alt={rp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
