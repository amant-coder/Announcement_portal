const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
    },
    courseCodes: {
      type: [String],
      required: [true, 'At least one course code is required'],
      validate: {
        validator: async function (codes) {
          if (!codes || codes.length === 0) return false;
          const Course = mongoose.model('Course');
          const count = await Course.countDocuments({
            code: { $in: codes.map((c) => c.toUpperCase()) },
          });
          return count === codes.length;
        },
        message: 'One or more provided courseCodes are invalid or do not exist in the Course collection.',
      },
    },
    postedBy: {
      type: String,
      required: [true, 'postedBy (Clerk user ID) is required'],
      trim: true,
    },
    postedByName: {
      type: String,
      default: 'HOD',
      trim: true,
    },
    postedByEmail: {
      type: String,
      default: '',
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    attachmentUrl: {
      type: String,
      default: null,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'PUBLISHED',
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance on searches and expiration filtering
announcementSchema.index({ isPinned: -1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ courseCodes: 1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
