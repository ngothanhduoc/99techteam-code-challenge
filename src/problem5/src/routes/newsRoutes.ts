import { Router } from 'express';
import newsController from '../controllers/newsController';
import {
  createNewsValidation,
  updateNewsValidation,
  listNewsValidation,
  idParamValidation,
  handleValidationErrors,
} from '../middleware/validation';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { USER_ROLES } from '../constants/roles';

const router = Router();

/**
 * @swagger
 * /api/news:
 *   post:
 *     tags:
 *       - News
 *     summary: Create a new news article
 *     description: Create a new news article (Admin and Editor only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - author
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: Breaking News - New Technology Breakthrough
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 example: This is the detailed content of the news article with important information...
 *               author:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               category:
 *                 type: string
 *                 enum: [technology, business, sports, entertainment, health, science, other]
 *                 example: technology
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: [innovation, tech, AI]
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *                 example: published
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-08T10:00:00.000Z
 *     responses:
 *       201:
 *         description: News created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: News created successfully
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires admin or editor role
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.EDITOR),
  createNewsValidation,
  handleValidationErrors,
  newsController.createNews.bind(newsController)
);

/**
 * @swagger
 * /api/news:
 *   get:
 *     tags:
 *       - News
 *     summary: Get list of news articles
 *     description: Get paginated list of news articles with filtering and sorting options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, updatedAt, publishedAt, title]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [technology, business, sports, entertainment, health, science, other]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author name (case-insensitive partial match)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search in title and content
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter articles created from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter articles created until this date
 *     responses:
 *       200:
 *         description: News list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  '/',
  optionalAuth,
  listNewsValidation,
  handleValidationErrors,
  newsController.listNews.bind(newsController)
);

/**
 * @swagger
 * /api/news/stats/category:
 *   get:
 *     tags:
 *       - News
 *     summary: Get statistics by category
 *     description: Get aggregated statistics of news articles grouped by category
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Category name
 *                         example: technology
 *                       count:
 *                         type: integer
 *                         description: Total number of articles in this category
 *                         example: 25
 *                       published:
 *                         type: integer
 *                         description: Number of published articles
 *                         example: 20
 *                       draft:
 *                         type: integer
 *                         description: Number of draft articles
 *                         example: 5
 */
router.get(
  '/stats/category',
  newsController.getStatsByCategory.bind(newsController)
);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     tags:
 *       - News
 *     summary: Get news article by ID
 *     description: Get detailed information of a specific news article
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: News not found
 */
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  newsController.getNewsById.bind(newsController)
);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     tags:
 *       - News
 *     summary: Update news article
 *     description: Update an existing news article (Admin and Editor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: Updated News Title
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 example: Updated content of the news article...
 *               author:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Jane Smith
 *               category:
 *                 type: string
 *                 enum: [technology, business, sports, entertainment, health, science, other]
 *                 example: business
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: [business, finance, markets]
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: published
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-08T14:30:00.000Z
 *     responses:
 *       200:
 *         description: News updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: News updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       400:
 *         description: Validation error or invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires admin or editor role
 *       404:
 *         description: News not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.EDITOR),
  updateNewsValidation,
  handleValidationErrors,
  newsController.updateNews.bind(newsController)
);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     summary: Delete news article
 *     description: Delete a news article (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: News deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: News deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires admin role
 *       404:
 *         description: News not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  idParamValidation,
  handleValidationErrors,
  newsController.deleteNews.bind(newsController)
);

export default router;

