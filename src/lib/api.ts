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
