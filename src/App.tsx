import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const Index = lazy(() => import("./pages/Index.tsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.tsx"));
const PortfolioCategory = lazy(() => import("./pages/PortfolioCategory.tsx"));
const Experience = lazy(() => import("./pages/Experience.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPostPage = lazy(() => import("./pages/BlogPost.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminPortfolio = lazy(() => import("./pages/AdminPortfolio.tsx"));
const AdminAssets = lazy(() => import("./pages/AdminAssets.tsx"));
const AdminBlog = lazy(() => import("./pages/AdminBlog.tsx"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor.tsx"));
const AdminVideos = lazy(() => import("./pages/AdminVideos.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const GalleryPage = lazy(() => import("./pages/GalleryPage.tsx"));
const MaternityGowns = lazy(() => import("./pages/MaternityGowns.tsx"));
const Videos = lazy(() => import("./pages/Videos.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Shop = lazy(() => import("./pages/Shop.tsx"));
const Cart = lazy(() => import("./pages/Cart.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      color: "var(--dark)",
      backgroundColor: "var(--bg)",
    }}
  >
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/:id" element={<PortfolioCategory />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
              <Route path="/admin/portfolio/:id" element={<ProtectedAdminRoute><AdminPortfolio /></ProtectedAdminRoute>} />
              <Route path="/admin/assets" element={<ProtectedAdminRoute><AdminAssets /></ProtectedAdminRoute>} />
              <Route path="/admin/videos" element={<ProtectedAdminRoute><AdminVideos /></ProtectedAdminRoute>} />
              <Route path="/admin/blog" element={<ProtectedAdminRoute><AdminBlog /></ProtectedAdminRoute>} />
              <Route path="/admin/blog/new" element={<ProtectedAdminRoute><AdminBlogEditor /></ProtectedAdminRoute>} />
              <Route path="/admin/blog/:id/edit" element={<ProtectedAdminRoute><AdminBlogEditor /></ProtectedAdminRoute>} />
              <Route path="/gallery/:folderId" element={<GalleryPage />} />
              <Route path="/maternity-gowns" element={<MaternityGowns />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
