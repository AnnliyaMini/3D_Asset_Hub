import type { Asset, Facets, LibraryStats, PlatformReport, User, AssetMetadata } from '../types/types.js';

const BASE = "http://localhost:5000/api";

const TOKEN_KEY = 'asset-hub-token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // not dealing with the error 
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await res.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server returned non-JSON response (${res.status}) for ${init.method || "GET"} ${path}`
    );
  }

  if (!res.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${res.status})`
    );
  }

  return data as T;
}



/** resolve the public URL of a stored asset file. */
export const fileUrl = (storedName: string) =>
  `http://localhost:5000/uploads/${storedName}`;

/** create a new account. */
export const register = (email: string, name: string, password: string) =>
  request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });

/** sign in with email and password. */
export const login = (email: string, password: string) =>
  request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

/** resolve the current session from the stored token. */
export const me = () => request<{ user: User }>('/auth/me');

/** upload a raw model file and receive its stored reference. */
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  return request<{
    message: string;
    fileName: string;
    storedName: string;
  }>("/upload", {
    method: "POST",
    body: form,
  });
}

/** search and filter the asset library. */
export function listAssets(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return request<Asset[]>(`/assets?${qs.toString()}`);
}

/** fetch a single asset with its full history. */
export const getAsset = (id: string) => request<Asset>(`/assets/${id}`);

/** fetch the distinct tags, collections and formats in use. */
export const getFacets = () => request<Facets>('/assets/facets');

/** fetch library-wide counters. */
export const getStats = () => request<LibraryStats>('/assets/stats');

/** fetch the multi-platform readiness report for a version. */
export const getReadiness = (id: string, version?: number) =>
  request<{ version: number; reports: PlatformReport[] }>(
    `/assets/${id}/readiness${version ? `?version=${version}` : ''}`);

/** publish a brand new asset. */
export const createAsset = (payload: {
  name: string; description?: string; tags?: string[]; collectionName?: string;
  fileName: string; storedName: string; thumbnail?: string; metadata: AssetMetadata; notes?: string;
}) => request<Asset>('/assets', { method: 'POST', body: JSON.stringify(payload) });

/** append a new revision to an existing asset. */
export const addVersion = (id: string, payload: {
  fileName: string; storedName: string; thumbnail?: string; metadata: AssetMetadata; notes?: string;
}) => request<Asset>(`/assets/${id}/versions`, { method: 'POST', body: JSON.stringify(payload) });

/** update editable asset fields. */
export const updateAsset = (id: string, patch: Partial<Pick<Asset, 'name' | 'description' | 'tags' | 'collectionName'>>) =>
  request<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

/** delete an asset permanently. */
export const deleteAsset = (id: string) =>
  request<{ ok: boolean }>(`/assets/${id}`, { method: 'DELETE' });

/** post a comment with an optional rating. */
export const addComment = (id: string, body: string, rating?: number) =>
  request<Asset>(`/assets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, rating }),
  });
