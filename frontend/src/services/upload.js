import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Uploads a file to the backend, which forwards it to UploadThing.
 * @param {File} file - The file object to upload
 * @param {Function} getToken - Clerk session getToken function
 * @returns {Promise<string>} The uploaded file's public URL
 */
export const uploadFile = async (file, getToken) => {
  if (!file) return null;

  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Upload failed.');
  }

  return response.data.url;
};
