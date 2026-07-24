import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
export const getAnnouncements = async (course = '', search = '') => {
  const params = {};
  if (course && course !== 'ALL') params.course = course;
  if (search) params.search = search;

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
 * Fetch announcements created by the currently logged-in HOD
 */
export const getMyAnnouncements = async (getToken) => {
  const token = await getToken();
  const response = await api.get('/announcements/mine', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create a new announcement
 */
export const createAnnouncement = async (data, getToken) => {
  const token = await getToken();
  const response = await api.post('/announcements', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update an existing announcement
 */
export const updateAnnouncement = async (id, data, getToken) => {
  const token = await getToken();
  const response = await api.put(`/announcements/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id, getToken) => {
  const token = await getToken();
  const response = await api.delete(`/announcements/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Request signed upload signature from backend for direct Cloudinary upload
 */
export const getUploadSignature = async (getToken) => {
  const token = await getToken();
  const response = await api.post('/upload', {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
