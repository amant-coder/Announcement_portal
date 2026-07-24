const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const { body, validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const { requireApprovedHod } = require('../middleware/auth');

// Options for XSS sanitization
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'code', 'pre'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

/**
 * Helper: Validate courseCodes against Course collection in DB
 */
const validateCourseCodesExist = async (courseCodes) => {
  if (!Array.isArray(courseCodes) || courseCodes.length === 0) {
    return { valid: false, message: 'courseCodes must be a non-empty array.' };
  }
  const formattedCodes = courseCodes.map((c) => String(c).trim().toUpperCase());
  const existingCourses = await Course.find({ code: { $in: formattedCodes } });
  if (existingCourses.length !== formattedCodes.length) {
    return { valid: false, message: 'One or more specified course codes do not exist.' };
  }
  return { valid: true, codes: formattedCodes };
};

/**
 * @route   GET /api/announcements
 * @desc    Fetch public announcements (supports ?course= and ?search=)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { course, search } = req.query;
    const now = new Date();

    // Query filter: exclude expired announcements
    const query = {
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };

    // Filter by course tag if provided
    if (course && typeof course === 'string' && course.trim() !== '') {
      query.courseCodes = course.trim().toUpperCase();
    }

    // Search by keyword in title or content if provided
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [{ title: searchRegex }, { content: searchRegex }],
        },
      ];
    }

    // Sort: pinned first (-1), then newest created (-1)
    const announcements = await Announcement.find(query).sort({ isPinned: -1, createdAt: -1 });

    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('[GET /api/announcements Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching announcements.',
    });
  }
});

/**
 * @route   GET /api/announcements/mine
 * @desc    Fetch all announcements posted by the currently logged-in HOD
 * @access  Protected (Approved HOD)
 */
router.get('/mine', requireApprovedHod, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const announcements = await Announcement.find({ postedBy: userId }).sort({ isPinned: -1, createdAt: -1 });

    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('[GET /api/announcements/mine Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching your announcements.',
    });
  }
});

/**
 * @route   GET /api/announcements/:id
 * @desc    Fetch a single announcement by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found.',
      });
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, error: 'Invalid Announcement ID format.' });
    }
    console.error('[GET /api/announcements/:id Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching announcement.',
    });
  }
});

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement
 * @access  Protected (Approved HOD)
 */
router.post(
  '/',
  requireApprovedHod,
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('content').trim().notEmpty().withMessage('Content is required.'),
    body('courseCodes').isArray({ min: 1 }).withMessage('At least one course code is required.'),
  ],
  async (req, res) => {
    // Validate request input BEFORE touching database
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }

    try {
      const { title, content, courseCodes, isPinned, attachmentUrl, expiresAt } = req.body;

      // Validate courseCodes against Course collection
      const courseValidation = await validateCourseCodesExist(courseCodes);
      if (!courseValidation.valid) {
        return res.status(400).json({
          success: false,
          error: courseValidation.message,
        });
      }

      // Sanitize content against stored XSS
      const cleanContent = sanitizeHtml(content, sanitizeOptions);

      const newAnnouncement = new Announcement({
        title,
        content: cleanContent,
        courseCodes: courseValidation.codes,
        postedBy: req.auth.userId,
        isPinned: Boolean(isPinned),
        attachmentUrl: attachmentUrl || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      await newAnnouncement.save();

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully.',
        data: newAnnouncement,
      });
    } catch (error) {
      console.error('[POST /api/announcements Error]:', error.message);
      res.status(500).json({
        success: false,
        error: 'Server error while creating announcement: ' + error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/announcements/:id
 * @desc    Update an existing announcement (Ownership check: postedBy === req.auth.userId)
 * @access  Protected (Approved HOD)
 */
router.put(
  '/:id',
  requireApprovedHod,
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty.'),
    body('courseCodes').optional().isArray({ min: 1 }).withMessage('courseCodes must be a non-empty array.'),
  ],
  async (req, res) => {
    // Validate request input BEFORE touching database
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }

    try {
      const announcement = await Announcement.findById(req.params.id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: 'Announcement not found.',
        });
      }

      // Strict server-side ownership check: postedBy === current logged in user ID
      if (announcement.postedBy !== req.auth.userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only edit announcements that you created.',
        });
      }

      const { title, content, courseCodes, isPinned, attachmentUrl, expiresAt } = req.body;

      if (courseCodes) {
        const courseValidation = await validateCourseCodesExist(courseCodes);
        if (!courseValidation.valid) {
          return res.status(400).json({
            success: false,
            error: courseValidation.message,
          });
        }
        announcement.courseCodes = courseValidation.codes;
      }

      if (title !== undefined) announcement.title = title;
      if (content !== undefined) announcement.content = sanitizeHtml(content, sanitizeOptions);
      if (isPinned !== undefined) announcement.isPinned = Boolean(isPinned);
      if (attachmentUrl !== undefined) announcement.attachmentUrl = attachmentUrl || null;
      if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;

      await announcement.save();

      res.json({
        success: true,
        message: 'Announcement updated successfully.',
        data: announcement,
      });
    } catch (error) {
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, error: 'Invalid Announcement ID format.' });
      }
      console.error('[PUT /api/announcements/:id Error]:', error.message);
      res.status(500).json({
        success: false,
        error: 'Server error while updating announcement.',
      });
    }
  }
);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete an announcement (Ownership check: postedBy === req.auth.userId)
 * @access  Protected (Approved HOD)
 */
router.delete('/:id', requireApprovedHod, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found.',
      });
    }

    // Strict server-side ownership check: postedBy === current logged in user ID
    if (announcement.postedBy !== req.auth.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only delete announcements that you created.',
      });
    }

    await announcement.deleteOne();

    res.json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, error: 'Invalid Announcement ID format.' });
    }
    console.error('[DELETE /api/announcements/:id Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting announcement.',
    });
  }
});

module.exports = router;
