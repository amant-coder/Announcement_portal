const { getAuth, clerkClient, verifyToken } = require('@clerk/express');

/**
 * Middleware to require a valid Clerk auth session and check that HOD is approved.
 * Account starts with isApproved: false in Clerk publicMetadata;
 * login/write access must be blocked server-side until super-admin approves it.
 */
const requireApprovedHod = async (req, res, next) => {
  try {
    let auth;
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-user-id']) {
      auth = { userId: req.headers['x-test-user-id'] };
    } else {
      auth = getAuth(req);
    }

    let userId = auth?.userId;
    let sessionClaims = auth?.sessionClaims;

    // Fallback: verify Bearer token explicitly if getAuth(req) returns null userId
    if (!userId && req.headers.authorization) {
      const token = String(req.headers.authorization).replace(/^Bearer\s+/i, '').trim();
      if (token && token !== 'null' && token !== 'undefined') {
        try {
          const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
          if (verified && (verified.sub || verified.userId)) {
            userId = verified.sub || verified.userId;
            sessionClaims = verified;
            auth = { userId, sessionClaims };
          }
        } catch (vErr) {
          console.warn('[Clerk Token Verification Fallback Notice]:', vErr.message);
        }
      }
    }

    // Check if authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required.',
      });
    }

    const resolvedUserId = userId;

    // Attach auth data to req so downstream route handlers can access req.auth.userId
    req.auth = auth || { userId: resolvedUserId, sessionClaims };

    // In test environment, if mock metadata is passed via header or session, use it
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-is-approved'] !== undefined) {
      const isApproved = req.headers['x-test-is-approved'] === 'true';
      if (!isApproved) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: HOD account pending approval by Super Admin.',
        });
      }
      return next();
    }

    // Check sessionClaims publicMetadata first
    let isApproved = sessionClaims?.metadata?.isApproved || sessionClaims?.publicMetadata?.isApproved;

    // If metadata is not present in token claim, fetch user object directly from Clerk API
    if (isApproved === undefined && clerkClient) {
      try {
        const user = await clerkClient.users.getUser(resolvedUserId);
        isApproved = user.publicMetadata?.isApproved === true;
      } catch (clerkErr) {
        console.error('[Clerk User Fetch Error]:', clerkErr.message);
      }
    }

    if (isApproved !== true) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: HOD account pending approval by Super Admin.',
      });
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server authentication error.',
    });
  }
};

module.exports = {
  requireApprovedHod,
};
