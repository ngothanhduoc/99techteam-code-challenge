import { Request, Response, NextFunction } from 'express';
import News, { INews } from '../models/News';
import { AppError } from '../middleware/errorHandler';
import {PaginatedResponse, ApiResponse } from '../types';

export class NewsController {
  // CREATE - Create new article
  async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newsData = req.body;

      // If status is published but no publishedAt, automatically set it
      if (newsData.status === 'published' && !newsData.publishedAt) {
        newsData.publishedAt = new Date();
      }

      const news = await News.create(newsData);

      const response: ApiResponse<INews> = {
        success: true,
        data: news,
        message: 'News created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // READ - Get list of articles with pagination and filters
  async listNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      // Filter parameters
      const filters: any = {};

      if (req.query.category) {
        filters.category = req.query.category;
      }

      if (req.query.status) {
        filters.status = req.query.status;
      }

      if (req.query.author) {
        filters.author = { $regex: req.query.author, $options: 'i' };
      }

      if (req.query.tags) {
        const tags = Array.isArray(req.query.tags)
          ? req.query.tags
          : [req.query.tags];
        filters.tags = { $in: tags };
      }

      // Text search
      if (req.query.search) {
        filters.$text = { $search: req.query.search as string };
      }

      // Date range filter
      if (req.query.fromDate || req.query.toDate) {
        filters.createdAt = {};
        if (req.query.fromDate) {
          filters.createdAt.$gte = new Date(req.query.fromDate as string);
        }
        if (req.query.toDate) {
          filters.createdAt.$lte = new Date(req.query.toDate as string);
        }
      }

      // Calculate skip
      const skip = (page - 1) * limit;

      // Sort order
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const [news, totalItems] = await Promise.all([
        News.find(filters)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        News.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      const response: PaginatedResponse<INews> = {
        success: true,
        data: news as unknown as INews[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // READ - Get article details
  async getNewsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const news = await News.findById(id);

      if (!news) {
        throw new AppError('News not found', 404);
      }

      const response: ApiResponse<INews> = {
        success: true,
        data: news,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // UPDATE - Update article
  async updateNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If status changes to published but no publishedAt yet
      if (updateData.status === 'published' && !updateData.publishedAt) {
        const existingNews = await News.findById(id);
        if (existingNews && !existingNews.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const news = await News.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true, // Return document after update
          runValidators: true, // Run validators
        }
      );

      if (!news) {
        throw new AppError('News not found', 404);
      }

      const response: ApiResponse<INews> = {
        success: true,
        data: news,
        message: 'News updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // DELETE - Delete article
  async deleteNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const news = await News.findByIdAndDelete(id);

      if (!news) {
        throw new AppError('News not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'News deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Statistics by category
  async getStatsByCategory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await News.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            published: {
              $sum: {
                $cond: [{ $eq: ['$status', 'published'] }, 1, 0],
              },
            },
            draft: {
              $sum: {
                $cond: [{ $eq: ['$status', 'draft'] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsController();

