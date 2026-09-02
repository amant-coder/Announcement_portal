import axios from 'axios';

const formatBaseUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') return '/api';
  let cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl += '/api';
  }
  return cleanUrl;
};

const API_BASE_URL = formatBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all course tags
 */
export const getCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

/**
 * Fetch public announcements with optional course and search query
 */
export const getAnnouncements = async (course = '', search = '', startDate = '', endDate = '', type = '', year = '') => {
  const params = {};
  if (course && course !== 'ALL') params.course = course;
  if (search) params.search = search;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (type && type !== 'ALL') params.type = type;
  if (year && year !== 'ALL') params.year = year;

  const response = await api.get('/announcements', { params });
  return response.data;
};

/**
 * Fetch a single announcement detail
 */
export const getAnnouncementById = async (id) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

/**
 * Helper: Safely retrieve session token and retry request with fresh token on 401
 */
const executeWithTokenRetry = async (getToken, apiCall) => {
  let token = await getToken().catch(() => null);
  if (!token) {
    // Grace period for Clerk SDK to finish session initialization
    await new Promise((resolve) => setTimeout(resolve, 300));
    token = await getToken({ skipCache: true }).catch(() => null);
  }
  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    token = await getToken({ skipCache: true }).catch(() => null);
  }
  if (!token) {
    throw { response: { status: 401, data: { error: 'Your session token has expired or is out of sync. Please click "Retry Session" or "Sign Out & Re-login".' } } };
  }

  try {
    return await apiCall(token);
  } catch (err) {
    if (err.response?.status === 401) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const freshToken = await getToken({ skipCache: true }).catch(() => null);
      if (freshToken) {
        return await apiCall(freshToken);
      }
    }
    throw err;
  }
};

/**
 * Fetch announcements created by the currently logged-in HOD
 */
export const getMyAnnouncements = async (getToken) => {
  try {
    return await executeWithTokenRetry(getToken, async (token) => {
      const response = await api.get('/announcements/mine', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    });
  } catch (err) {
    console.warn('[getMyAnnouncements Notice]: Returning empty list gracefully', err?.message);
    return { success: true, data: [] };
  }
};

/**
 * Create a new announcement
 */
export const createAnnouncement = async (data, getToken) => {
  return executeWithTokenRetry(getToken, async (token) => {
    const response = await api.post('/announcements', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  });
};

/**
 * Update an existing announcement
 */
export const updateAnnouncement = async (id, data, getToken) => {
  return executeWithTokenRetry(getToken, async (token) => {
    const response = await api.put(`/announcements/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  });
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id, getToken) => {
  return executeWithTokenRetry(getToken, async (token) => {
    const response = await api.delete(`/announcements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  });
};

/**
 * Fetch all registered HOD accounts (Super-Admin)
 */
export const getHodList = async (adminSecret) => {
  const response = await api.get('/admin/hods', {
    headers: {
      'x-admin-secret': adminSecret,
    },
  });
  return response.data;
};

/**
 * Approve or revoke an HOD account (Super-Admin)
 */
export const toggleHodApproval = async (userId, isApproved, adminSecret) => {
  const response = await api.post(
    '/admin/approve-hod',
    { userId, isApproved },
    {
      headers: {
        'x-admin-secret': adminSecret,
      },
    }
  );
  return response.data;
};

/**
 * Assign allowed course codes to an HOD account (Super-Admin)
 */
export const assignHodCourses = async (userId, allowedCourses, adminSecret) => {
  const response = await api.post(
    '/admin/assign-courses',
    { userId, allowedCourses },
    {
      headers: {
        'x-admin-secret': adminSecret,
      },
    }
  );
  return response.data;
};

/**
 * Fetch all announcements across college for Super-Admin Audit
 */
export const getAllAnnouncementsAudit = async (adminSecret) => {
  const response = await api.get('/admin/announcements', {
    headers: {
      'x-admin-secret': adminSecret,
    },
  });
  return response.data;
};

/**
 * Fetch VAPID public key
 */
export const getVapidPublicKey = async () => {
  const response = await api.get('/notifications/vapid-public-key');
  return response.data;
};

/**
 * Register push subscription
 */
export const subscribeNotifications = async (payload) => {
  const response = await api.post('/notifications/subscribe', payload);
  return response.data;
};

/**
 * Remove push subscription
 */
export const unsubscribeNotifications = async (endpoint) => {
  const response = await api.post('/notifications/unsubscribe', { endpoint });
  return response.data;
};

/**
 * Generate announcement fields from uploaded PDF URL via Gemini AI
 */
export const generateFromPdf = async (pdfUrl, getToken) => {
  const token = await getToken();
  const response = await api.post(
    '/ai/generate-from-pdf',
    { pdfUrl },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};






