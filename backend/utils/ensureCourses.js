const Course = require('../models/Course');

const defaultCourses = [
  { code: 'BCOM', name: 'Bachelor of Commerce', stream: 'Commerce' },
  { code: 'BAF', name: 'BCom Accounting & Finance', stream: 'Commerce' },
  { code: 'BBI', name: 'BCom Banking & Insurance', stream: 'Commerce' },
  { code: 'BFM', name: 'BCom Financial Markets', stream: 'Commerce' },
  { code: 'BMS', name: 'Bachelor of Management Studies', stream: 'Management' },
  { code: 'BSCIT', name: 'BSc Information Technology', stream: 'Information Technology' },
  { code: 'MCOM', name: 'Master of Commerce', stream: 'Post Graduation' },
  { code: 'MSCFM', name: 'MSc Financial Mathematics', stream: 'Post Graduation' },
];

/**
 * Ensures default courses exist in the MongoDB database.
 * If collection is empty, it populates the 9 standard college course tags automatically.
 */
const ensureCoursesExist = async () => {
  try {
    const validCodes = defaultCourses.map((c) => c.code);
    
    // Upsert each default course
    for (const course of defaultCourses) {
      await Course.updateOne(
        { code: course.code },
        { $set: course },
        { upsert: true }
      );
    }

    // Remove any obsolete courses (e.g. BA, BSC, BMM)
    await Course.deleteMany({ code: { $nin: validCodes } });

    console.log('[Auto-Seeding Courses]: Synchronized default course records in database.');
  } catch (err) {
    console.error('[Ensure Courses Error]:', err.message);
  }
};

module.exports = {
  defaultCourses,
  ensureCoursesExist,
};
