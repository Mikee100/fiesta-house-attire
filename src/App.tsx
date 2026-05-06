import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import PortfolioCategory from "./pages/PortfolioCategory.tsx";
import Experience from "./pages/Experience.tsx";
import Pricing from "./pages/Pricing.tsx";
import Contact from "./pages/Contact.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPostPage from "./pages/BlogPost.tsx";
import Admin from "./pages/Admin.tsx";
import AdminPortfolio from "./pages/AdminPortfolio.tsx";
import AdminAssets from "./pages/AdminAssets.tsx";
import AdminBlog from "./pages/AdminBlog.tsx";
import AdminBlogEditor from "./pages/AdminBlogEditor.tsx";
import GalleryPage from "./pages/GalleryPage.tsx";
import MaternityGowns from "./pages/MaternityGowns.tsx";
import NotFound from "./pages/NotFound.tsx";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<PortfolioCategory />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/portfolio/:id" element={<AdminPortfolio />} />
          <Route path="/admin/assets" element={<AdminAssets />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/blog/new" element={<AdminBlogEditor />} />
          <Route path="/admin/blog/:id/edit" element={<AdminBlogEditor />} />
          <Route path="/gallery/:folderId" element={<GalleryPage />} />
          <Route path="/maternity-gowns" element={<MaternityGowns />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
