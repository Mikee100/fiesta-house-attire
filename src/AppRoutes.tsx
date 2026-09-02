/**
 * AppRoutes — extracted route tree used by both App.tsx (client) and entry-server.tsx (SSG).
 * Keeping routes in one place avoids duplication between browser and server renders.
 */
import { Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import LuxuryRouteLoader from "./components/site/LuxuryRouteLoader";
import Index from "./pages/Index.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import PortfolioCategory from "./pages/PortfolioCategory.tsx";
import Experience from "./pages/Experience.tsx";
import Pricing from "./pages/Pricing.tsx";
import Contact from "./pages/Contact.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import About from "./pages/About.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPostPage from "./pages/BlogPost.tsx";
import GalleryPage from "./pages/GalleryPage.tsx";
import MaternityGowns from "./pages/MaternityGowns.tsx";
import Videos from "./pages/Videos.tsx";
import NotFound from "./pages/NotFound.tsx";
import Shop from "./pages/Shop.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import MaternityPhotoshootNairobi from "./pages/MaternityPhotoshootNairobi.tsx";
import PlanningGuide from "./pages/PlanningGuide.tsx";
import TimingGuide from "./pages/TimingGuide.tsx";
import WhatToWearGuide from "./pages/WhatToWearGuide.tsx";
import IdeasAndStylesGuide from "./pages/IdeasAndStylesGuide.tsx";
import FamilyMaternityGuide from "./pages/FamilyMaternityGuide.tsx";
import FAQHub from "./pages/FAQHub.tsx";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminPortfolio = lazy(() => import("./pages/AdminPortfolio.tsx"));
const AdminFolders = lazy(() => import("./pages/AdminFolders.tsx"));
const AdminAssets = lazy(() => import("./pages/AdminAssets.tsx"));
const AdminBlog = lazy(() => import("./pages/AdminBlog.tsx"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor.tsx"));
const AdminVideos = lazy(() => import("./pages/AdminVideos.tsx"));
const AdminPricing = lazy(() => import("./pages/AdminPricing.tsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.tsx"));
const AdminAnalyticsDeepDive = lazy(() => import("./pages/AdminAnalyticsDeepDive.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));

const RouteFallback = () => <LuxuryRouteLoader />;

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:id" element={<PortfolioCategory />} />
      <Route path="/experience" element={<Experience />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
      <Route path="/admin/portfolio/:id" element={<ProtectedAdminRoute><AdminPortfolio /></ProtectedAdminRoute>} />
      <Route path="/admin/folders" element={<ProtectedAdminRoute><AdminFolders /></ProtectedAdminRoute>} />
      <Route path="/admin/assets" element={<ProtectedAdminRoute><AdminAssets /></ProtectedAdminRoute>} />
      <Route path="/admin/videos" element={<ProtectedAdminRoute><AdminVideos /></ProtectedAdminRoute>} />
      <Route path="/admin/pricing" element={<ProtectedAdminRoute><AdminPricing /></ProtectedAdminRoute>} />
      <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>} />
      <Route path="/admin/analytics/deep-dive" element={<ProtectedAdminRoute><AdminAnalyticsDeepDive /></ProtectedAdminRoute>} />
      <Route path="/admin/blog" element={<ProtectedAdminRoute><AdminBlog /></ProtectedAdminRoute>} />
      <Route path="/admin/blog/new" element={<ProtectedAdminRoute><AdminBlogEditor /></ProtectedAdminRoute>} />
      <Route path="/admin/blog/:id/edit" element={<ProtectedAdminRoute><AdminBlogEditor /></ProtectedAdminRoute>} />
      <Route path="/gallery/:gallerySlug" element={<GalleryPage />} />
      <Route path="/maternity-gowns" element={<MaternityGowns />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/maternity-photoshoot" element={<MaternityPhotoshootNairobi />} />
      <Route path="/maternity-photoshoot-nairobi" element={<MaternityPhotoshootNairobi />} />
      <Route path="/planning-guide" element={<PlanningGuide />} />
      <Route path="/when-to-do-maternity-photos" element={<TimingGuide />} />
      <Route path="/what-to-wear-maternity-photoshoot" element={<WhatToWearGuide />} />
      <Route path="/maternity-photoshoot-ideas" element={<IdeasAndStylesGuide />} />
      <Route path="/family-maternity-photoshoot" element={<FamilyMaternityGuide />} />
      <Route path="/faq" element={<FAQHub />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
