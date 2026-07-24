const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { requireApprovedHod } = require('../middleware/auth');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @route   POST /api/upload
 * @desc    Generate Cloudinary signed upload parameters
 * @access  Protected (Approved HOD)
 */
router.post('/', requireApprovedHod, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'gsc_announcements';

    // NOTE: resource_type is a URL path param (/auto/upload), NOT a signature field.
    // Only include params that are sent as FormData fields in the signature.
    const paramsToSign = {
      folder,
      timestamp,
    };

    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.json({
        success: true,
        mock: process.env.NODE_ENV === 'test' || !apiSecret,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name',
        apiKey: process.env.CLOUDINARY_API_KEY || 'mock_api_key',
        timestamp,
        signature: 'mock_signed_signature',
        folder,
        resourceType: 'auto',
      });
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({
      success: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      resourceType: 'auto',
    });
  } catch (error) {
    console.error('[POST /api/upload Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload signature.',
    });
  }
});

module.exports = router;
