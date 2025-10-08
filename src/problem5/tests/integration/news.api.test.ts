import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';
import News from '../../src/models/News';
import User from '../../src/models/User';
import { generateToken } from '../../src/middleware/auth';
import { USER_ROLES } from '../../src/constants/roles';
import { describe, beforeEach, it, expect } from '@jest/globals';

// Helper function to create authenticated user and get token
async function createAuthenticatedUser(role: string = USER_ROLES.ADMIN) {
  const user = await User.create({
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    role,
  });

  const token = generateToken(user.id.toString(), user.email, user.role);
  return { user, token };
}

describe('News API - Integration Tests', () => {
  let authToken: string;
  let editorToken: string;

  beforeEach(async () => {
    // Create admin user and get token for protected routes
    const adminAuth = await createAuthenticatedUser(USER_ROLES.ADMIN);
    authToken = adminAuth.token;

    // Create editor user for some tests
    const editorAuth = await createAuthenticatedUser(USER_ROLES.EDITOR);
    editorToken = editorAuth.token;
  });
  describe('POST /api/news', () => {
    it('should create a new news article', async () => {
      const newsData = {
        title: 'Integration Test News',
        content: 'This is integration test content for news article',
        author: 'Integration Tester',
        category: 'technology',
        tags: ['test', 'integration'],
        status: 'draft',
      };

      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: newsData.title,
        content: newsData.content,
        author: newsData.author,
        category: newsData.category,
      });
      expect(response.body.data._id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: 'Test', // Too short (min 5 chars)
        content: 'Short', // Too short (min 10 chars)
      };

      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should auto-set publishedAt when status is published', async () => {
      const newsData = {
        title: 'Published Test News Article',
        content: 'This article is published immediately',
        author: 'Publisher',
        category: 'business',
        status: 'published',
      };

      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newsData)
        .expect(201);

      expect(response.body.data.publishedAt).toBeDefined();
    });

    it('should return 401 without authentication token', async () => {
      const newsData = {
        title: 'Test News Without Auth',
        content: 'This should fail without token',
        author: 'Test Author',
        category: 'technology',
      };

      const response = await request(app)
        .post('/api/news')
        .send(newsData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow editor to create news', async () => {
      const newsData = {
        title: 'Editor Created News',
        content: 'This news is created by editor role',
        author: 'Editor User',
        category: 'business',
        status: 'draft',
      };

      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(newsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newsData.title);
    });
  });

  describe('GET /api/news', () => {
    beforeEach(async () => {
      // Seed test data
      await News.create([
        {
          title: 'Tech News 1',
          content: 'Technology content 1',
          author: 'Tech Author',
          category: 'technology',
          status: 'published',
          publishedAt: new Date(),
        },
        {
          title: 'Business News 1',
          content: 'Business content 1',
          author: 'Business Author',
          category: 'business',
          status: 'published',
          publishedAt: new Date(),
        },
        {
          title: 'Draft News 1',
          content: 'Draft content 1',
          author: 'Draft Author',
          category: 'sports',
          status: 'draft',
        },
      ]);
    });

    it('should return paginated news list', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 3,
      });
    });

    it('should filter news by category', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ category: 'technology' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('technology');
    });

    it('should filter news by status', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ status: 'published' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((news: any) => {
        expect(news.status).toBe('published');
      });
    });

    it('should filter news by author', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ author: 'Tech' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author).toContain('Tech');
    });

    it('should sort news by createdAt desc by default', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      const dates = response.body.data.map((news: any) => 
        new Date(news.createdAt).getTime()
      );
      
      // Check if dates are in descending order
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ page: -1, limit: 200 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/news/:id', () => {
    let newsId: string;

    beforeEach(async () => {
      const news = await News.create({
        title: 'Test News for Get By ID',
        content: 'Test content for getting by ID',
        author: 'Test Author',
        category: 'technology',
        status: 'published',
      });
      newsId = news.id.toString();
    });

    it('should get news by id', async () => {
      const response = await request(app)
        .get(`/api/news/${newsId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(newsId);
      expect(response.body.data.title).toBe('Test News for Get By ID');
    });

    it('should return 404 for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/news/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('News not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/news/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/news/:id', () => {
    let newsId: string;

    beforeEach(async () => {
      const news = await News.create({
        title: 'Original Title for Update',
        content: 'Original content for update',
        author: 'Original Author',
        category: 'technology',
        status: 'draft',
      });
      newsId = news.id.toString();
    });

    it('should update news successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content for the news article',
        status: 'published',
      };

      const response = await request(app)
        .put(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent news', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/news/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title Here' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: 'abc', // Too short
        category: 'invalid-category',
      };

      const response = await request(app)
        .put(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication token', async () => {
      const updateData = {
        title: 'Updated Title Without Auth',
        content: 'This should fail without token',
      };

      const response = await request(app)
        .put(`/api/news/${newsId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow editor to update news', async () => {
      const updateData = {
        title: 'Editor Updated Title',
        content: 'Editor updated this content successfully',
        status: 'published',
      };

      const response = await request(app)
        .put(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('DELETE /api/news/:id', () => {
    let newsId: string;

    beforeEach(async () => {
      const news = await News.create({
        title: 'News to be Deleted',
        content: 'This news will be deleted',
        author: 'Delete Tester',
        category: 'other',
        status: 'draft',
      });
      newsId = news.id.toString();
    });

    it('should delete news successfully', async () => {
      const response = await request(app)
        .delete(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('News deleted successfully');

      // Verify news is actually deleted
      const deletedNews = await News.findById(newsId);
      expect(deletedNews).toBeNull();
    });

    it('should return 404 for non-existent news', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/news/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .delete(`/api/news/${newsId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for editor role (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/news/stats/category', () => {
    beforeEach(async () => {
      await News.create([
        {
          title: 'Tech News 1',
          content: 'Tech content 1',
          author: 'Author 1',
          category: 'technology',
          status: 'published',
        },
        {
          title: 'Tech News 2',
          content: 'Tech content 2',
          author: 'Author 2',
          category: 'technology',
          status: 'draft',
        },
        {
          title: 'Business News 1',
          content: 'Business content 1',
          author: 'Author 3',
          category: 'business',
          status: 'published',
        },
      ]);
    });

    it('should return statistics by category', async () => {
      const response = await request(app)
        .get('/api/news/stats/category')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      
      const techStats = response.body.data.find((stat: any) => stat._id === 'technology');
      expect(techStats).toMatchObject({
        count: 2,
        published: 1,
        draft: 1,
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
    });
  });
});

