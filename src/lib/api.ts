import { authenticatedFetch } from "@/lib/adminAuth";

const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const normalizeApiBaseUrl = (rawValue: string | undefined, localHost: boolean): string => {
  const fallback = localHost ? 'http://localhost:5000' : '/backend';
  if (!rawValue) return fallback;

  let normalized = rawValue.trim();
  if (!normalized) return fallback;

  normalized = normalized.replace(/\/+$/, '');
  normalized = normalized.replace(/\/api$/i, '');

  return normalized || fallback;
};

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL, isLocalHost);

const logApiError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

export interface PortfolioImage {
  id: string;
  url: string;
}

export interface PortfolioRecord {
  id: string;
  title: string;
  slug?: string;
  images: Array<PortfolioImage | string>;
  cover_image_url?: string | null;
}

export interface FolderRecord {
  id: string;
  name: string;
  parent_id?: string | null;
  cover_image_url?: string | null;
  is_public?: boolean;
  public_slug?: string | null;
}

export interface AssetRecord {
  id: string;
  url: string;
}

export interface PaginatedAssets {
  assets: AssetRecord[];
  totalPages: number;
}

export interface PublicGalleryAssetsResponse extends PaginatedAssets {
  totalCount?: number;
  currentPage?: number;
  folder?: FolderRecord | null;
}

const normalizeGallerySlug = (value: string): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const fetchPortfolios = async (): Promise<PortfolioRecord[] | null> => {
  try {
    const res = await fetch(`${API_URL}/portfolios`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    logApiError(err);
    return null; // Return null to indicate a connection error
  }
};

export const fetchPortfolio = async (idOrSlug: string): Promise<PortfolioRecord | null> => {
  try {
    const res = await fetch(`${API_URL}/portfolios/${encodeURIComponent(idOrSlug)}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    return await res.json();
  } catch (err) {
    logApiError(err);
    return null;
  }
};

export const createPortfolio = async (title: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return await res.json();
};

export const deletePortfolio = async (id: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const updatePortfolio = async (id: string, data: { cover_image_url?: string; title?: string; order?: number }) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const reorderPortfolios = async (portfolioIds: string[]) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioIds })
  });
  return await res.json();
};

export const addImageToPortfolio = async (portfolioId: string, url: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/${portfolioId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await res.json();
};

export const addImagesToPortfolioBulk = async (portfolioId: string, urls: string[]) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/${portfolioId}/images/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
  return await res.json();
};

export const deduplicatePortfolioImages = async (portfolioId: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolios/${portfolioId}/deduplicate`, {
    method: 'POST'
  });
  return await res.json();
};

export const deleteImage = async (imageId: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolio-images/${imageId}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const removeImageFromPortfolio = async (imageId: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolio-images/${imageId}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const deleteLibraryAssetFromPortfolioImage = async (imageId: string) => {
  const res = await authenticatedFetch(`${API_URL}/portfolio-images/${imageId}/library-asset`, {
    method: 'DELETE'
  });
  return await res.json();
};

// --- Media Library ---

export const fetchFolders = async (): Promise<FolderRecord[]> => {
  const res = await authenticatedFetch(`${API_URL}/folders`, { cache: 'no-store' });
  return await res.json();
};

export const fetchPublicFolders = async (): Promise<FolderRecord[]> => {
  const res = await fetch(`${API_URL}/public/folders`, { cache: 'no-store' });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const createFolder = async (name: string, parentId?: string) => {
  const res = await authenticatedFetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId })
  });
  return await res.json();
};

export const updateFolder = async (id: string, data: { cover_image_url?: string; name?: string; is_public?: boolean; public_slug?: string | null }) => {
  const res = await authenticatedFetch(`${API_URL}/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const fetchAssets = async (folderId?: string, page: number = 1, limit: number = 20, search?: string): Promise<PaginatedAssets> => {
  let url = `${API_URL}/assets?page=${page}&limit=${limit}`;
  if (folderId) url += `&folder_id=${folderId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const res = await authenticatedFetch(url, { cache: 'no-store' });
  return await res.json();
};

export const fetchPublicAssets = async (folderId?: string, page: number = 1, limit: number = 20): Promise<PaginatedAssets> => {
  let url = `${API_URL}/public/assets?page=${page}&limit=${limit}`;
  if (folderId) url += `&folder_id=${folderId}`;

  const res = await fetch(url, { cache: 'no-store' });
  return await res.json();
};

export const fetchPublicGalleryAssetsBySlug = async (gallerySlug: string, page: number = 1, limit: number = 100): Promise<PublicGalleryAssetsResponse> => {
  const normalizedSlug = normalizeGallerySlug(gallerySlug);
  const safeSlug = encodeURIComponent(normalizedSlug);
  const url = `${API_URL}/public/gallery/${safeSlug}/assets?page=${page}&limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (res.ok) {
    return await res.json();
  }

  // Backward compatibility: if backend is still on ID-based public APIs,
  // resolve the slug from folder name/public_slug client-side and fetch by folder ID.
  try {
    const folders = await fetchPublicFolders();
    const matchedFolder = folders.find((folder) => {
      const fromPublicSlug = normalizeGallerySlug(folder.public_slug || '');
      const fromName = normalizeGallerySlug(folder.name || '');
      return fromPublicSlug === normalizedSlug || fromName === normalizedSlug;
    });

    if (!matchedFolder) {
      return { assets: [], totalPages: 1, totalCount: 0, currentPage: 1, folder: null };
    }

    const assetsData = await fetchPublicAssets(matchedFolder.id, page, limit);
    return {
      ...assetsData,
      folder: matchedFolder,
      totalCount: assetsData.assets?.length || 0,
      currentPage: page,
    };
  } catch {
    return { assets: [], totalPages: 1, totalCount: 0, currentPage: 1, folder: null };
  }
};

export const addAssetsBulk = async (urls: string[], folderId?: string) => {
  const res = await authenticatedFetch(`${API_URL}/assets/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, folder_id: folderId })
  });
  return await res.json();
};

export const deleteAsset = async (id: string) => {
  const res = await authenticatedFetch(`${API_URL}/assets/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authenticatedFetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  return await res.json();
};

export const createAsset = async (url: string, folderId?: string) => {
  const res = await authenticatedFetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, folder_id: folderId })
  });
  return await res.json();
};

export const moveAssetsToFolder = async (assetIds: string[], folderId: string | null) => {
  const res = await authenticatedFetch(`${API_URL}/assets/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetIds, folder_id: folderId })
  });
  return await res.json();
};

// --- Blog ---

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author: string;
  status: 'draft' | 'published';
  sort_order?: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: BlogCategory[];
}

export const fetchBlogCategories = async (): Promise<BlogCategory[]> => {
  const res = await fetch(`${API_URL}/blog-categories`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const createBlogCategory = async (name: string) => {
  const res = await authenticatedFetch(`${API_URL}/blog-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return await res.json();
};

export const fetchBlogPosts = async (page = 1, category?: string): Promise<{
  posts: BlogPost[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  let url = `${API_URL}/blog-posts?page=${page}&limit=9`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  const res = await fetch(url);
  return await res.json();
};

export const fetchAllBlogPosts = async (): Promise<BlogPost[]> => {
  const res = await authenticatedFetch(`${API_URL}/blog-posts/all`);
  return await res.json();
};

export const fetchBlogPost = async (slug: string): Promise<BlogPost | null> => {
  try {
    const res = await fetch(`${API_URL}/blog-posts/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchRecentBlogPosts = async () => {
  const res = await fetch(`${API_URL}/blog-posts-recent`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchRelatedBlogPosts = async (slug: string, limit = 4): Promise<BlogPost[]> => {
  try {
    const res = await fetch(`${API_URL}/blog-posts/${encodeURIComponent(slug)}/related?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const createBlogPost = async (data: Partial<BlogPost> & { category_ids?: string[] }) => {
  const res = await authenticatedFetch(`${API_URL}/blog-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost> & { category_ids?: string[] }) => {
  const res = await authenticatedFetch(`${API_URL}/blog-posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const deleteBlogPost = async (id: string) => {
  const res = await authenticatedFetch(`${API_URL}/blog-posts/${id}`, { method: 'DELETE' });
  return await res.json();
};

export const reorderBlogPosts = async (postIds: string[]) => {
  const res = await authenticatedFetch(`${API_URL}/blog-posts/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postIds })
  });
  return await res.json();
};

// --- Shop ---

export interface ShopPackage {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: string;
  images_count?: string;
  outfits_count?: string;
  features?: string[];
  popular?: boolean;
  color?: string;
}

export interface ShopOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateShopOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: ShopOrderItem[];
  total_amount: number;
}

export interface ContactEnquiryPayload {
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  package_interest: string;
  message?: string;
}

export type ShopPackagesSource = 'live' | 'cache' | 'static' | 'empty';

export interface ShopPackagesResult {
  data: ShopPackage[];
  source: ShopPackagesSource;
}

const SHOP_PACKAGES_CACHE_KEY = 'fiesta_shop_packages_cache_v1';

const DEFAULT_SHOP_PACKAGES: ShopPackage[] = [
  {
    id: 'default-standard',
    name: 'Standard Package',
    price: 10000,
    description: 'A streamlined premium session for timeless, elegant portraits of your maternity journey.',
    duration: '1 hr 30 min',
    images_count: '6 edited soft copy images',
    outfits_count: '2 gowns & styling',
    features: ['Professional makeup', 'Full gown access', 'Studio session'],
    popular: false,
    color: '#6EC1E4'
  },
  {
    id: 'default-economy',
    name: 'Economy Package',
    price: 15000,
    description: 'Our most balanced package, offering more time and a wider variety of looks.',
    duration: '2 hrs',
    images_count: '12 edited soft copy images',
    outfits_count: '3 gowns & styling',
    features: ['Professional makeup', 'Full gown access', 'Studio session'],
    popular: false,
    color: '#B84FA0'
  },
  {
    id: 'default-executive',
    name: 'Executive Package',
    price: 20000,
    description: 'Level up with more outfits and a stunning A3 mount for your wall.',
    duration: '2 hrs 30 min',
    images_count: '15 edited soft copy images',
    outfits_count: '4 gowns & styling',
    features: ['Professional makeup', 'Full gown access', '1 A3 mount included', 'Studio session'],
    popular: false,
    color: '#6EC1E4'
  }
];

const isValidShopPackageArray = (value: unknown): value is ShopPackage[] => {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const pkg = item as Partial<ShopPackage>;
    return typeof pkg.id === 'string' && typeof pkg.name === 'string';
  });
};

const readCachedShopPackages = (): ShopPackage[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(SHOP_PACKAGES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return isValidShopPackageArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCachedShopPackages = (packages: ShopPackage[]): void => {
  if (!isBrowser || !Array.isArray(packages) || packages.length === 0) return;
  try {
    window.localStorage.setItem(SHOP_PACKAGES_CACHE_KEY, JSON.stringify(packages));
  } catch {
    // Ignore cache write errors (quota/private mode).
  }
};

export const fetchShopPackagesWithFallback = async (): Promise<ShopPackagesResult> => {
  try {
    const res = await fetch(`${API_URL}/shop/packages`);
    if (!res.ok) {
      throw new Error(`Failed to fetch shop packages: ${res.status}`);
    }

    const data = await res.json();
    const safeData = isValidShopPackageArray(data) ? data : [];
    writeCachedShopPackages(safeData);
    return { data: safeData, source: 'live' };
  } catch (err) {
    logApiError('fetchShopPackagesWithFallback failed, attempting fallback', err);

    const cached = readCachedShopPackages();
    if (cached.length > 0) {
      return { data: cached, source: 'cache' };
    }

    if (DEFAULT_SHOP_PACKAGES.length > 0) {
      return { data: DEFAULT_SHOP_PACKAGES, source: 'static' };
    }

    return { data: [], source: 'empty' };
  }
};

export const fetchShopPackages = async (): Promise<ShopPackage[]> => {
  const result = await fetchShopPackagesWithFallback();
  return result.data;
};

export const fetchAdminShopPackages = async (): Promise<ShopPackage[]> => {
  const res = await authenticatedFetch(`${API_URL}/admin/shop/packages`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const updateAdminShopPackage = async (
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    price?: number;
    duration?: string | null;
    images_count?: string | null;
    outfits_count?: string | null;
    features?: string[];
  }
) => {
  const res = await authenticatedFetch(`${API_URL}/admin/shop/packages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export const createShopOrder = async (payload: CreateShopOrderPayload) => {
  const res = await fetch(`${API_URL}/shop/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export const submitContactEnquiry = async (payload: ContactEnquiryPayload) => {
  const res = await fetch(`${API_URL}/contact-enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export interface AnalyticsTopClickItem {
  event_name: string;
  label: string;
  count: number;
}

export interface AnalyticsPageViewItem {
  day: string;
  views: number;
}

export interface AnalyticsDeviceBreakdownItem {
  device_type: string;
  count: number;
}

export interface AnalyticsEventMix {
  total: number;
  page_views: number;
  click_events: number;
}

export interface AnalyticsClickTrendItem {
  day: string;
  clicks: number;
}

export interface AnalyticsVisitsTimeseriesItem {
  granularity: 'day' | 'week' | 'month' | 'year';
  bucket: string;
  bucket_start: string;
  visits: number;
}

export interface AnalyticsTopEventTypeItem {
  event_name: string;
  count: number;
}

export interface AnalyticsKpiSnapshot {
  total_events: number;
  page_views: number;
  click_events: number;
}

export interface AnalyticsKpiCompare {
  current: AnalyticsKpiSnapshot;
  previous: AnalyticsKpiSnapshot;
}

export interface AnalyticsCtaPerformanceItem {
  event_name: string;
  label: string;
  clicks: number;
  unique_sessions: number;
  previous_clicks: number;
  total_clicks: number;
}

export interface AnalyticsBusinessKpis {
  unique_visitors: number;
  whatsapp_leads: number;
  portfolio_engagement: number;
  booking_intent: number;
  returning_visitors: number;
  conversion_rate: number;
}

export interface AnalyticsFunnel {
  visitors: number;
  portfolio_interest: number;
  pricing_interest: number;
  whatsapp: number;
  booking: number;
  checkout: number;
}

export interface AnalyticsTopPageItem {
  page: string;
  views: number;
  unique_visitors: number;
}

export interface AnalyticsWhatsappByPageItem {
  page: string;
  whatsapp_clicks: number;
  unique_sessions: number;
}

export interface AnalyticsEventRow {
  id: string;
  event_name: string;
  label: string | null;
  page_url: string | null;
  session_id: string | null;
  referrer: string | null;
  device_type: string | null;
  created_at: string;
}

export interface AnalyticsRecentResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: AnalyticsEventRow[];
}

const buildAnalyticsRangeQuery = (from: string, to: string): string => {
  const search = new URLSearchParams({ from, to });
  return search.toString();
};

export const fetchAnalyticsTopClicks = async (from: string, to: string, limit = 12): Promise<AnalyticsTopClickItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/top-clicks?${range}&limit=${limit}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsPageViews = async (from: string, to: string): Promise<AnalyticsPageViewItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/page-views?${range}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsDeviceBreakdown = async (from: string, to: string): Promise<AnalyticsDeviceBreakdownItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/device-breakdown?${range}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsEventMix = async (from: string, to: string): Promise<AnalyticsEventMix> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/event-mix?${range}`);
  const data = await res.json();
  return {
    total: Number(data?.total || 0),
    page_views: Number(data?.page_views || 0),
    click_events: Number(data?.click_events || 0),
  };
};

export const fetchAnalyticsClickTrend = async (from: string, to: string): Promise<AnalyticsClickTrendItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/click-trend?${range}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsVisitsTimeseries = async (
  from: string,
  to: string,
  granularity: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<AnalyticsVisitsTimeseriesItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/visits-timeseries?${range}&granularity=${granularity}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsTopEventTypes = async (from: string, to: string, limit = 8): Promise<AnalyticsTopEventTypeItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/top-event-types?${range}&limit=${limit}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsBusinessKpis = async (from: string, to: string): Promise<AnalyticsBusinessKpis> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/business-kpis?${range}`);
  const data = await res.json();
  return {
    unique_visitors: Number(data?.unique_visitors || 0),
    whatsapp_leads: Number(data?.whatsapp_leads || 0),
    portfolio_engagement: Number(data?.portfolio_engagement || 0),
    booking_intent: Number(data?.booking_intent || 0),
    returning_visitors: Number(data?.returning_visitors || 0),
    conversion_rate: Number(data?.conversion_rate || 0),
  };
};

export const fetchAnalyticsFunnel = async (from: string, to: string): Promise<AnalyticsFunnel> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/funnel?${range}`);
  const data = await res.json();
  return {
    visitors: Number(data?.visitors || 0),
    portfolio_interest: Number(data?.portfolio_interest || 0),
    pricing_interest: Number(data?.pricing_interest || 0),
    whatsapp: Number(data?.whatsapp || 0),
    booking: Number(data?.booking || 0),
    checkout: Number(data?.checkout || 0),
  };
};

export const fetchAnalyticsTopPages = async (from: string, to: string, limit = 10): Promise<AnalyticsTopPageItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/top-pages?${range}&limit=${limit}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsWhatsappByPage = async (
  from: string,
  to: string,
  limit = 10
): Promise<AnalyticsWhatsappByPageItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/whatsapp-by-page?${range}&limit=${limit}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsKpiCompare = async (from: string, to: string): Promise<AnalyticsKpiCompare> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/kpi-compare?${range}`);
  const data = await res.json();

  return {
    current: {
      total_events: Number(data?.current?.total_events || 0),
      page_views: Number(data?.current?.page_views || 0),
      click_events: Number(data?.current?.click_events || 0),
    },
    previous: {
      total_events: Number(data?.previous?.total_events || 0),
      page_views: Number(data?.previous?.page_views || 0),
      click_events: Number(data?.previous?.click_events || 0),
    },
  };
};

export const fetchAnalyticsCtaPerformance = async (
  from: string,
  to: string,
  limit = 20
): Promise<AnalyticsCtaPerformanceItem[]> => {
  const range = buildAnalyticsRangeQuery(from, to);
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/cta-performance?${range}&limit=${limit}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAnalyticsRecentEvents = async (
  from: string,
  to: string,
  page = 1,
  pageSize = 25,
  eventType: "all" | "page_view" | "clicks" = "all"
): Promise<AnalyticsRecentResponse> => {
  const search = new URLSearchParams({
    from,
    to,
    page: String(page),
    pageSize: String(pageSize),
    eventType,
  });
  const res = await authenticatedFetch(`${API_URL}/admin/analytics/recent?${search.toString()}`);
  const data = await res.json();
  return {
    page: Number(data?.page || page),
    pageSize: Number(data?.pageSize || pageSize),
    total: Number(data?.total || 0),
    totalPages: Number(data?.totalPages || 1),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

// --- Videos ---

export interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  source_type: 'url' | 'upload' | string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VIDEOS_CACHE_TTL_MS = 5 * 60 * 1000;
let videosCache: { data: VideoItem[]; fetchedAt: number } | null = null;

export const fetchVideos = async (options?: { force?: boolean }): Promise<VideoItem[]> => {
  const force = Boolean(options?.force);
  if (!force && videosCache && Date.now() - videosCache.fetchedAt < VIDEOS_CACHE_TTL_MS) {
    return videosCache.data;
  }

  const res = await fetch(`${API_URL}/videos`);
  const data = await res.json();
  const safeData = Array.isArray(data) ? data : [];
  videosCache = { data: safeData, fetchedAt: Date.now() };
  return safeData;
};

export const prefetchVideos = async (): Promise<void> => {
  try {
    await fetchVideos();
  } catch {
    // Keep prefetch failures silent; page fetch still handles runtime errors.
  }
};

export const fetchAdminVideos = async (): Promise<VideoItem[]> => {
  const res = await authenticatedFetch(`${API_URL}/admin/videos`);
  return await res.json();
};

export const createVideo = async (payload: {
  title: string;
  description?: string;
  video_url: string;
  source_type?: 'url' | 'upload' | string;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}) => {
  const res = await authenticatedFetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export const updateVideo = async (id: string, payload: Partial<VideoItem>) => {
  const res = await authenticatedFetch(`${API_URL}/videos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export const deleteVideo = async (id: string) => {
  const res = await authenticatedFetch(`${API_URL}/videos/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const reorderVideos = async (videoIds: string[]) => {
  const res = await authenticatedFetch(`${API_URL}/videos/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds })
  });
  return await res.json();
};
