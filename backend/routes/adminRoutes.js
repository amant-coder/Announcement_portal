const express = require('express');
const router = express.Router();
const { clerkClient } = require('@clerk/express');
const { authRateLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/admin/approve-hod
 * @desc    Manual super-admin route to approve or reject an HOD Clerk account
 * @access  Protected by ADMIN_SECRET header
 */
router.post('/approve-hod', authRateLimiter, async (req, res) => {
  try {
    const adminSecretHeader = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET || 'super_secret_admin_approval_key_123';

    if (!adminSecretHeader || adminSecretHeader !== expectedSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid Admin Secret key.',
      });
    }

    const { userId, isApproved = true } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'userId is required.',
      });
    }

    if (!clerkClient) {
      return res.status(500).json({
        success: false,
        error: 'Clerk client not initialized.',
      });
    }

    // Update Clerk user public metadata
    const user = await clerkClient.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};

    const updatedUser = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingMetadata,
        isApproved: Boolean(isApproved),
      },
    });

    res.json({
      success: true,
      message: `HOD User ${userId} status updated to isApproved: ${Boolean(isApproved)}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses?.[0]?.emailAddress,
        publicMetadata: updatedUser.publicMetadata,
      },
    });
  } catch (error) {
    console.error('[POST /api/admin/approve-hod Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error approving HOD account: ' + error.message,
    });
  }
});

module.exports = router;
