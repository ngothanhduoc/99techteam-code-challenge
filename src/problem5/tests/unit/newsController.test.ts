import { Request, Response, NextFunction } from 'express';
import { NewsController } from '../../src/controllers/newsController';
import News from '../../src/models/News';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock mongoose model
jest.mock('../../src/models/News');

const MockedNews = jest.mocked(News);

describe('NewsController - Unit Tests', () => {
  let newsController: NewsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    newsController = new NewsController();
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockImplementation(function (this: Response) { return this; }),
      json: jest.fn().mockImplementation(function (this: Response) { return this; }),
    } as Partial<Response>;
    mockNext = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe('createNews', () => {
    it('should create news successfully', async () => {
      const newsData = {
        title: 'Test News Title',
        content: 'This is test content for the news article',
        author: 'Test Author',
        category: 'technology',
        tags: ['test', 'news'],
        status: 'draft',
      };

      const createdNews = {
        _id: '507f1f77bcf86cd799439011',
        ...newsData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = newsData;
      MockedNews.create.mockResolvedValue(createdNews as any);

      await newsController.createNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedNews.create).toHaveBeenCalledWith(newsData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdNews,
        message: 'News created successfully',
      });
    });

    it('should auto-set publishedAt when status is published', async () => {
      const newsData = {
        title: 'Published News',
        content: 'This is published content',
        author: 'Test Author',
        category: 'technology',
        status: 'published',
      };

      mockRequest.body = newsData;
      MockedNews.create.mockResolvedValue({ ...newsData, _id: '123' } as any);

      await newsController.createNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedNews.create).toHaveBeenCalledWith(
        expect.objectContaining({
          publishedAt: expect.any(Date),
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRequest.body = { title: 'Test' };
      MockedNews.create.mockRejectedValue(error);

      await newsController.createNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getNewsById', () => {
    it('should return news by id', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      const newsData = {
        _id: newsId,
        title: 'Test News',
        content: 'Test content',
        author: 'Test Author',
        category: 'technology',
      };

      mockRequest.params = { id: newsId };
      MockedNews.findById.mockResolvedValue(newsData as any);

      await newsController.getNewsById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedNews.findById).toHaveBeenCalledWith(newsId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: newsData,
      });
    });

    it('should return 404 if news not found', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      mockRequest.params = { id: newsId };
      MockedNews.findById.mockResolvedValue(null);

      await newsController.getNewsById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'News not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('updateNews', () => {
    it('should update news successfully', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };
      const updatedNews = {
        _id: newsId,
        ...updateData,
        author: 'Test Author',
        category: 'technology',
      };

      mockRequest.params = { id: newsId };
      mockRequest.body = updateData;
      MockedNews.findByIdAndUpdate.mockResolvedValue(updatedNews as any);

      await newsController.updateNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedNews.findByIdAndUpdate).toHaveBeenCalledWith(
        newsId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedNews,
        message: 'News updated successfully',
      });
    });

    it('should return 404 if news not found', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      mockRequest.params = { id: newsId };
      mockRequest.body = { title: 'Updated' };
      MockedNews.findByIdAndUpdate.mockResolvedValue(null);

      await newsController.updateNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'News not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('deleteNews', () => {
    it('should delete news successfully', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      const deletedNews = {
        _id: newsId,
        title: 'Deleted News',
      };

      mockRequest.params = { id: newsId };
      MockedNews.findByIdAndDelete.mockResolvedValue(deletedNews as any);

      await newsController.deleteNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedNews.findByIdAndDelete).toHaveBeenCalledWith(newsId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'News deleted successfully',
      });
    });

    it('should return 404 if news not found', async () => {
      const newsId = '507f1f77bcf86cd799439011';
      mockRequest.params = { id: newsId };
      MockedNews.findByIdAndDelete.mockResolvedValue(null);

      await newsController.deleteNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'News not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('listNews', () => {
    it('should return paginated news list', async () => {
      const newsList = [
        { _id: '1', title: 'News 1', content: 'Content 1' },
        { _id: '2', title: 'News 2', content: 'Content 2' },
      ];
      const totalItems = 20;

      mockRequest.query = { page: '1', limit: '10' };

      const mockQuery: any = {
        sort: jest.fn<any>().mockReturnThis(),
        skip: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        lean: jest.fn<any>().mockResolvedValue(newsList),
      };

      MockedNews.find.mockReturnValue(mockQuery);
      MockedNews.countDocuments.mockResolvedValue(totalItems);

      await newsController.listNews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: newsList,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 2,
            totalItems: 20,
            itemsPerPage: 10,
          }),
        })
      );
    });
  });
});

