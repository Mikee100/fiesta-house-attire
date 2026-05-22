const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchPortfolios = async () => {
  try {
    const res = await fetch(`${API_URL}/portfolios`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null; // Return null to indicate a connection error
  }
};

export const fetchPortfolio = async (idOrSlug: string) => {
  try {
    const res = await fetch(`${API_URL}/portfolios/${encodeURIComponent(idOrSlug)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const createPortfolio = async (title: string) => {
  const res = await fetch(`${API_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return await res.json();
};

export const deletePortfolio = async (id: string) => {
  const res = await fetch(`${API_URL}/portfolios/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const updatePortfolio = async (id: string, data: { cover_image_url?: string; title?: string; order?: number }) => {
  const res = await fetch(`${API_URL}/portfolios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const reorderPortfolios = async (portfolioIds: string[]) => {
  const res = await fetch(`${API_URL}/portfolios/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioIds })
  });
  return await res.json();
};

export const addImageToPortfolio = async (portfolioId: string, url: string) => {
  const res = await fetch(`${API_URL}/portfolios/${portfolioId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await res.json();
};

export const addImagesToPortfolioBulk = async (portfolioId: string, urls: string[]) => {
  const res = await fetch(`${API_URL}/portfolios/${portfolioId}/images/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
  return await res.json();
};

export const deduplicatePortfolioImages = async (portfolioId: string) => {
  const res = await fetch(`${API_URL}/portfolios/${portfolioId}/deduplicate`, {
    method: 'POST'
  });
  return await res.json();
};

export const deleteImage = async (imageId: string) => {
  const res = await fetch(`${API_URL}/portfolio-images/${imageId}`, {
    method: 'DELETE'
  });
  return await res.json();
};

// --- Media Library ---

export const fetchFolders = async () => {
  const res = await fetch(`${API_URL}/folders`);
  return await res.json();
};

export const createFolder = async (name: string, parentId?: string) => {
  const res = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId })
  });
  return await res.json();
};

export const updateFolder = async (id: string, data: { cover_image_url?: string; name?: string }) => {
  const res = await fetch(`${API_URL}/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const fetchAssets = async (folderId?: string, page: number = 1, limit: number = 20, search?: string) => {
  let url = `${API_URL}/assets?page=${page}&limit=${limit}`;
  if (folderId) url += `&folder_id=${folderId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const res = await fetch(url);
  return await res.json();
};

export const addAssetsBulk = async (urls: string[], folderId?: string) => {
  const res = await fetch(`${API_URL}/assets/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, folder_id: folderId })
  });
  return await res.json();
};

export const deleteAsset = async (id: string) => {
  const res = await fetch(`${API_URL}/assets/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL.replace('/api', '')}/api/upload`, {
    method: 'POST',
    body: formData
  });
  return await res.json();
};

export const createAsset = async (url: string, folderId?: string) => {
  const res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, folder_id: folderId })
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
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: BlogCategory[];
}

export const fetchBlogCategories = async (): Promise<BlogCategory[]> => {
  const res = await fetch(`${API_URL}/blog-categories`);
  return await res.json();
};

export const createBlogCategory = async (name: string) => {
  const res = await fetch(`${API_URL}/blog-categories`, {
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
  const res = await fetch(`${API_URL}/blog-posts/all`);
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
  return await res.json();
};

export const createBlogPost = async (data: Partial<BlogPost> & { category_ids?: string[] }) => {
  const res = await fetch(`${API_URL}/blog-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost> & { category_ids?: string[] }) => {
  const res = await fetch(`${API_URL}/blog-posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const deleteBlogPost = async (id: string) => {
  const res = await fetch(`${API_URL}/blog-posts/${id}`, { method: 'DELETE' });
  return await res.json();
};

// --- Shop ---

export const fetchShopPackages = async () => {
  const res = await fetch(`${API_URL}/shop/packages`);
  return await res.json();
};

export const createShopOrder = async (payload: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: any[];
  total_amount: number;
}) => {
  const res = await fetch(`${API_URL}/shop/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};
