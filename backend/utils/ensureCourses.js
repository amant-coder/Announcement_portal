const Course = require('../models/Course');

const defaultCourses = [
  { code: 'BCOM', name: 'Bachelor of Commerce', stream: 'Commerce' },
  { code: 'BAF', name: 'BCom Accounting & Finance', stream: 'Commerce' },
  { code: 'BBI', name: 'BCom Banking & Insurance', stream: 'Commerce' },
  { code: 'BFM', name: 'BCom Financial Markets', stream: 'Commerce' },
  { code: 'BMS', name: 'Bachelor of Management Studies', stream: 'Management' },
  { code: 'BSCIT', name: 'BSc Information Technology', stream: 'Information Technology' },
  { code: 'BMM', name: 'Bachelor of Mass Media', stream: 'Media & Mass Comm' },
  
];

/**
 * Ensures default courses exist in the MongoDB database.
 * If collection is empty, it populates the default college course tags automatically.
 */
const ensureCoursesExist = async () => {
  try {
    const existingCount = await Course.countDocuments();
    if (existingCount === 0) {
      console.log('[Auto-Seeding Courses]: Database has no course records. Populating default courses...');
      await Course.insertMany(defaultCourses);
      console.log('[Auto-Seeding Courses]: Successfully populated default courses.');
    }
  } catch (err) {
    console.error('[Ensure Courses Error]:', err.message);
  }
};

module.exports = {
  defaultCourses,
  ensureCoursesExist,
};
