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
      required: [
        function() { return this.type !== 'TIMETABLE'; },
        'Announcement content is required'
      ],
    },
    courseCodes: {
      type: [String],
      required: [true, 'At least one course code is required'],
      validate: {
        validator: async function (codes) {
          if (!codes || codes.length === 0) return false;
          const Course = mongoose.model('Course');
          const normalized = codes.map((c) => String(c).trim().toUpperCase());
          const uniqueCodes = [...new Set(normalized)];
          const count = await Course.countDocuments({
            code: { $in: uniqueCodes },
          });
          return count === uniqueCodes.length;
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
    targetYears: {
      type: [String],
      enum: ['FY', 'SY', 'TY'],
      default: ['FY', 'SY', 'TY'],
    },
    targetCommittees: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ['NOTICE', 'COMMITTEE', 'EVENT', 'TIMETABLE', 'EMERGENCY', 'WINNERS'],
      default: 'NOTICE',
    },
    timetableEntries: {
      type: [{
        subject: { type: String, required: [true, 'Subject is required'], trim: true },
        date: { type: Date, required: [true, 'Date is required'] },
        time: { type: String, required: [true, 'Time is required'], trim: true },
        room: { type: String, trim: true, default: '' },
      }],
      default: undefined,
      validate: {
        validator: function (val) {
          if (this.type === 'TIMETABLE') {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: 'timetableEntries must be a non-empty array when type is TIMETABLE.',
      },
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
announcementSchema.index({ type: 1 });
announcementSchema.index({ targetYears: 1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
