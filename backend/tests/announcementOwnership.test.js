const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('vitest');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/gsc_announcements_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGODB_URI);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await Course.deleteMany({});
    await Announcement.deleteMany({});
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  await Course.deleteMany({});
  await Announcement.deleteMany({});

  // Seed sample course
  await Course.create([
    { code: 'BMS', name: 'Bachelor of Management Studies', stream: 'Management' },
    { code: 'BCOM', name: 'Bachelor of Commerce', stream: 'Commerce' },
  ]);
});

describe('Announcement API Ownership & Security Tests', () => {
  const HOD_USER_A = 'user_hod_alpha_123';
  const HOD_USER_B = 'user_hod_beta_456';

  it('GET /api/courses should return seeded courses', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('POST /api/announcements should fail for invalid courseCodes', async () => {
    // Inject mock req.auth for testing
    app.use((req, res, next) => {
      req.auth = { userId: HOD_USER_A };
      next();
    });

    const res = await request(app)
      .post('/api/announcements')
      .set('x-test-is-approved', 'true')
      .send({
        title: 'Test Announcement',
        content: 'Test content body',
        courseCodes: ['INVALID_CODE'],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('do not exist');
  });

  it('PUT /api/announcements/:id should reject edit if user is NOT the owner (postedBy mismatch)', async () => {
    // Create an announcement owned by HOD_USER_A
    const announcement = await Announcement.create({
      title: 'HOD A Announcement',
      content: 'Important updates for BMS',
      courseCodes: ['BMS'],
      postedBy: HOD_USER_A,
      isPinned: false,
    });

    // Attempt to edit using HOD_USER_B auth
    // Override req.auth dynamically via test header mechanism
    app.use((req, res, next) => {
      req.auth = { userId: HOD_USER_B };
      next();
    });

    const res = await request(app)
      .put(`/api/announcements/${announcement._id}`)
      .set('x-test-is-approved', 'true')
      .send({
        title: 'HOD B Malicious Edit',
        content: 'HOD B altering content',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('You can only edit announcements that you created');

    // Verify DB content was NOT modified
    const dbItem = await Announcement.findById(announcement._id);
    expect(dbItem.title).toBe('HOD A Announcement');
  });

  it('DELETE /api/announcements/:id should reject deletion if user is NOT the owner', async () => {
    const announcement = await Announcement.create({
      title: 'HOD A Announcement to protect',
      content: 'Critical notice',
      courseCodes: ['BCOM'],
      postedBy: HOD_USER_A,
    });

    // Attempt to delete using HOD_USER_B auth
    app.use((req, res, next) => {
      req.auth = { userId: HOD_USER_B };
      next();
    });

    const res = await request(app)
      .delete(`/api/announcements/${announcement._id}`)
      .set('x-test-is-approved', 'true');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('You can only delete announcements that you created');

    // Verify DB record still exists
    const dbItem = await Announcement.findById(announcement._id);
    expect(dbItem).not.toBeNull();
  });
});
