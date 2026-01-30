// ============================================
// WOUAKA - Self-Hosted API Client
// ============================================
// Replaces Supabase client for VPS deployment
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
let accessToken: string | null = localStorage.getItem('wouaka_access_token');
let refreshToken: string | null = localStorage.getItem('wouaka_refresh_token');

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('wouaka_access_token', access);
  localStorage.setItem('wouaka_refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('wouaka_access_token');
  localStorage.removeItem('wouaka_refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

// API request helper
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle 401 - try to refresh token
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          return { data, error: null };
        }
      }
      clearTokens();
      window.location.href = '/auth';
      return { data: null, error: new Error('Session expired') };
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken;
      localStorage.setItem('wouaka_access_token', data.accessToken);
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

// ============================================
// AUTH API
// ============================================
export const auth = {
  async signUp(email: string, password: string, fullName?: string, role: string = 'EMPRUNTEUR') {
    const result = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
    
    if (result.data?.accessToken) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },
  
  async signIn(email: string, password: string) {
    const result = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.data?.accessToken) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },
  
  async signOut() {
    await apiRequest('/auth/signout', { method: 'POST' });
    clearTokens();
  },
  
  async getUser() {
    return apiRequest('/auth/me');
  },
  
  async resetPassword(email: string) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  async updatePassword(newPassword: string) {
    return apiRequest('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Check initial state
    if (accessToken) {
      this.getUser().then(({ data }) => {
        if (data) {
          callback('SIGNED_IN', { user: data.user });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
    } else {
      callback('SIGNED_OUT', null);
    }
    
    // Return unsubscribe function
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ============================================
// DATABASE API (replaces supabase.from())
// ============================================
export function from(table: string) {
  return {
    async select(columns: string = '*') {
      return apiRequest(`/db/${table}?select=${columns}`);
    },
    
    async insert(data: any) {
      return apiRequest(`/db/${table}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(data: any) {
      return {
        eq: async (column: string, value: any) => {
          return apiRequest(`/db/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
          });
        },
      };
    },
    
    async delete() {
      return {
        eq: async (column: string, value: any) => {
          return apiRequest(`/db/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
          });
        },
      };
    },
    
    // Chainable methods
    eq(column: string, value: any) {
      const filters = [`${column}=eq.${value}`];
      return {
        eq: (c: string, v: any) => {
          filters.push(`${c}=eq.${v}`);
          return this;
        },
        single: async () => {
          const result = await apiRequest(`/db/${table}?${filters.join('&')}&limit=1`);
          if (result.data && Array.isArray(result.data)) {
            return { data: result.data[0] || null, error: result.error };
          }
          return result;
        },
        select: async (columns: string = '*') => {
          return apiRequest(`/db/${table}?select=${columns}&${filters.join('&')}`);
        },
      };
    },
    
    order(column: string, options?: { ascending?: boolean }) {
      const dir = options?.ascending === false ? 'desc' : 'asc';
      return {
        limit: (n: number) => ({
          select: async (columns: string = '*') => {
            return apiRequest(`/db/${table}?select=${columns}&order=${column}.${dir}&limit=${n}`);
          },
        }),
        select: async (columns: string = '*') => {
          return apiRequest(`/db/${table}?select=${columns}&order=${column}.${dir}`);
        },
      };
    },
  };
}

// ============================================
// FUNCTIONS API (replaces supabase.functions.invoke())
// ============================================
export const functions = {
  async invoke<T = any>(name: string, options?: { body?: any }) {
    return apiRequest<T>(`/${name}`, {
      method: 'POST',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  },
};

// ============================================
// STORAGE API
// ============================================
export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        const base64 = await fileToBase64(file);
        return apiRequest('/storage/upload', {
          method: 'POST',
          body: JSON.stringify({
            bucket,
            file_base64: base64,
            file_name: file.name,
            mime_type: file.type,
          }),
        });
      },
      
      async download(path: string) {
        return apiRequest(`/storage/presigned?bucket=${bucket}&path=${path}`);
      },
      
      async remove(paths: string[]) {
        const results = await Promise.all(
          paths.map((path) =>
            apiRequest('/storage', {
              method: 'DELETE',
              body: JSON.stringify({ bucket, path }),
            })
          )
        );
        return { data: results, error: null };
      },
      
      async list(prefix?: string) {
        return apiRequest(`/storage/list?bucket=${bucket}${prefix ? `&prefix=${prefix}` : ''}`);
      },
      
      getPublicUrl(path: string) {
        const minioUrl = import.meta.env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9000';
        return { data: { publicUrl: `${minioUrl}/${bucket}/${path}` } };
      },
    };
  },
};

// Helper
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

// ============================================
// REALTIME (simplified - uses polling)
// ============================================
export function channel(name: string) {
  let pollInterval: number | null = null;
  
  return {
    on(
      event: string,
      filter: { event: string; schema: string; table?: string },
      callback: (payload: any) => void
    ) {
      // For now, we just return this for chaining
      // Real-time would require WebSocket implementation
      return this;
    },
    
    subscribe(callback?: (status: string) => void) {
      callback?.('SUBSCRIBED');
      return this;
    },
    
    unsubscribe() {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    },
  };
}

// ============================================
// SCORING API
// ============================================
export const scoring = {
  async calculate(data: {
    phone_number: string;
    full_name?: string;
    date_of_birth?: string;
    country?: string;
    phone_verified?: boolean;
  }) {
    return apiRequest('/scoring/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async getHistory(limit: number = 20, offset: number = 0) {
    return apiRequest(`/scoring/history?limit=${limit}&offset=${offset}`);
  },
  
  async getRequest(id: string) {
    return apiRequest(`/scoring/${id}`);
  },
};

// ============================================
// KYC API
// ============================================
export const kyc = {
  async createRequest(verificationLevel: string = 'basic') {
    return apiRequest('/kyc/requests', {
      method: 'POST',
      body: JSON.stringify({ verification_level: verificationLevel }),
    });
  },
  
  async uploadDocument(requestId: string, documentType: string, file: File) {
    const base64 = await fileToBase64(file);
    return apiRequest(`/kyc/documents/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({
        document_type: documentType,
        file_base64: base64,
        file_name: file.name,
        mime_type: file.type,
      }),
    });
  },
  
  async getRequest(requestId: string) {
    return apiRequest(`/kyc/requests/${requestId}`);
  },
  
  async listRequests() {
    return apiRequest('/kyc/requests');
  },
  
  async sendOTP(phoneNumber: string) {
    return apiRequest('/kyc/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },
  
  async verifyOTP(phoneNumber: string, otpCode: string) {
    return apiRequest('/kyc/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode }),
    });
  },
};

// ============================================
// CERTIFICATES API
// ============================================
export const certificates = {
  async getActive() {
    return apiRequest('/certificates/active');
  },
  
  async validate(shareCode: string) {
    return apiRequest(`/certificates/validate/${shareCode}`);
  },
  
  async share(certificateId: string, data: { shared_with_email?: string; shared_with_partner_id?: string }) {
    return apiRequest(`/certificates/${certificateId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async recertify(certificateId: string) {
    return apiRequest(`/certificates/${certificateId}/recertify`, {
      method: 'POST',
    });
  },
};

// ============================================
// PAYMENTS API
// ============================================
export const payments = {
  async initialize(planId: string, amount: number, currency: string = 'XOF', description?: string) {
    return apiRequest('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, amount, currency, description }),
    });
  },
  
  async checkStatus(transactionId: string) {
    return apiRequest(`/payments/status/${transactionId}`);
  },
  
  async listTransactions(limit: number = 20) {
    return apiRequest(`/payments/transactions?limit=${limit}`);
  },
  
  async getPlans() {
    return apiRequest('/payments/plans');
  },
};

// ============================================
// ADMIN API
// ============================================
export const admin = {
  async getStats() {
    return apiRequest('/admin/stats');
  },
  
  async listUsers(options?: { limit?: number; offset?: number; search?: string }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.search) params.set('search', options.search);
    return apiRequest(`/admin/users?${params}`);
  },
  
  async updateUser(id: string, data: { is_active?: boolean; role?: string }) {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async getSecurityAlerts() {
    return apiRequest('/admin/security/alerts');
  },
  
  async acknowledgeAlert(id: string) {
    return apiRequest(`/admin/security/alerts/${id}/acknowledge`, { method: 'PATCH' });
  },
  
  async getLockdownState() {
    return apiRequest('/admin/lockdown');
  },
  
  async setLockdown(data: { is_full_lockdown?: boolean; is_read_only_mode?: boolean; lockdown_reason?: string }) {
    return apiRequest('/admin/lockdown', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// EXPORT DEFAULT CLIENT
// ============================================
export const wouakaClient = {
  auth,
  from,
  functions,
  storage,
  channel,
  scoring,
  kyc,
  certificates,
  payments,
  admin,
};

export default wouakaClient;
