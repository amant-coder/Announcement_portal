import axios from 'axios';
import { getUploadSignature } from './api';

/**
 * Determines correct Cloudinary delivery type from file extension.
 * PDFs and documents must use 'raw', images use 'image', videos use 'video'.
 */
const getDeliveryType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const rawTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'];
  const videoTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  if (rawTypes.includes(ext)) return 'raw';
  if (videoTypes.includes(ext)) return 'video';
  return 'image';
};

/**
 * Fixes a Cloudinary URL so PDFs/docs use /raw/upload/ instead of /image/upload/.
 * Cloudinary returns /image/upload/ for 'auto' uploads but PDFs won't render via that endpoint.
 */
export const fixCloudinaryUrl = (url, filename) => {
  if (!url || !filename) return url;
  const deliveryType = getDeliveryType(filename);
  if (deliveryType === 'raw' && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  return url;
};

/**
 * Uploads a file directly to Cloudinary using backend-generated signed parameters.
 * @param {File} file - The file object to upload
 * @param {Function} getToken - Clerk session getToken function
 * @returns {Promise<string>} Uploaded file URL accessible to users
 */
export const uploadFileToCloudinary = async (file, getToken) => {
  if (!file) return null;

  // Step 1: Request signed upload params from backend
  const signData = await getUploadSignature(getToken);

  if (signData.mock) {
    console.warn('[Cloudinary Upload]: Using dev mock file URL fallback.');
    const deliveryType = getDeliveryType(file.name);
    return `https://res.cloudinary.com/${signData.cloudName}/${deliveryType}/upload/sample_attachment_${Date.now()}.${file.name.split('.').pop()}`;
  }

  // Step 2: Prepare FormData — only include fields that were signed
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signData.apiKey);
  formData.append('timestamp', signData.timestamp);
  formData.append('signature', signData.signature);
  formData.append('folder', signData.folder);
  // resource_type is NOT added here — it is the URL path segment (/auto/upload)

  // Step 3: POST to Cloudinary endpoint using the correct delivery type in path
  const deliveryType = getDeliveryType(file.name);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${deliveryType}/upload`;

  const response = await axios.post(uploadUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.secure_url;
};
