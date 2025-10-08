import swaggerJsdoc from 'swagger-jsdoc';
import { ALL_ROLES, DEFAULT_ROLE } from '../constants/roles';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'News API Documentation',
      version: '1.0.0',
      description: 'A professional CRUD API for news management with authentication, pagination, and filtering',
      contact: {
        name: 'API Support',
        email: 'support@newsapi.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.newsapi.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        News: {
          type: 'object',
          required: ['title', 'content', 'author', 'category'],
          properties: {
            _id: {
              type: 'string',
              description: 'News ID',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              minLength: 5,
              maxLength: 200,
              description: 'News title',
              example: 'Breaking: New Technology Breakthrough',
            },
            content: {
              type: 'string',
              minLength: 10,
              description: 'News content',
              example: 'This is the detailed content of the news article...',
            },
            author: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Author name',
              example: 'John Doe',
            },
            category: {
              type: 'string',
              enum: ['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'other'],
              description: 'News category',
              example: 'technology',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              maxItems: 10,
              description: 'News tags',
              example: ['innovation', 'tech', 'breakthrough'],
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              default: 'draft',
              description: 'Publication status',
              example: 'published',
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Publication date',
              example: '2025-10-07T10:00:00.000Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
          },
        },
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'User name',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ALL_ROLES,
              default: DEFAULT_ROLE,
              description: 'User role',
              example: 'editor',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Account status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            totalItems: {
              type: 'integer',
              example: 50,
            },
            itemsPerPage: {
              type: 'integer',
              example: 10,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'News',
        description: 'News management endpoints',
      },
      {
        name: 'Health',
        description: 'Server health check',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

