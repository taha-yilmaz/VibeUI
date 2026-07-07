const API_BASE = '/api';

export interface CreateJobResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  pagesDiscovered: number;
  pagesProcessed: number;
  createdAt: string;
}

export interface ScrapedPage {
  id: string;
  url: string;
  title: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  screenshotDesktopUrl: string | null;
}

export interface PageDetails extends ScrapedPage {
  cleanHtml: string | null;
  screenshotMobileUrl: string | null;
}

const getHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  createJob: async (url: string, name?: string, maxDepth: number = 1, authSessionId?: string): Promise<CreateJobResponse> => {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, name, maxDepth, authSessionId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateJob: async (id: string, name: string): Promise<{ success: boolean; job: any }> => {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateWorkspace: async (name: string): Promise<{ success: boolean; workspace: any }> => {
    const res = await fetch(`${API_BASE}/workspaces/current`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getJobs: async (): Promise<{ jobs: { id: string; name?: string; targetUrl: string; status: string; createdAt: string }[] }> => {
    const res = await fetch(`${API_BASE}/jobs`, {
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getJobPages: async (jobId: string): Promise<{ pages: ScrapedPage[] }> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pages`, {
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getPageDetails: async (pageId: string): Promise<PageDetails> => {
    const res = await fetch(`${API_BASE}/pages/${pageId}`, {
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getPageMarkdownUrl: (pageId: string) => {
    const token = localStorage.getItem('token');
    return `${API_BASE}/pages/${pageId}?format=markdown${token ? `&token=${token}` : ''}`;
  },

  getSessions: async (): Promise<{ sessions: { id: string; name: string; createdAt: string }[] }> => {
    const res = await fetch(`${API_BASE}/sessions`, {
      headers: getHeaders(false)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  captureSession: async (url: string): Promise<{ success: boolean; captureId: string; message: string }> => {
    const res = await fetch(`${API_BASE}/sessions/capture`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  saveSession: async (captureId: string, name: string): Promise<{ success: boolean; sessionId: string; message: string }> => {
    const res = await fetch(`${API_BASE}/sessions/capture/${captureId}/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Auth Endpoints
  authLogin: async (email: string, password: string): Promise<{ success: boolean; token: string; workspaceName: string; message: string }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  authRegister: async (name: string, email: string, password: string, workspaceName: string): Promise<{ success: boolean; token: string; workspaceName: string; message: string }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, workspaceName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  authGuest: async (): Promise<{ success: boolean; token: string; workspaceName: string }> => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Guest login failed');
    return data;
  }
};
