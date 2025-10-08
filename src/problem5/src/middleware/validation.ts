import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';

// Middleware to check validation results
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

// Validation rules for creating news
export const createNewsValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      return true;
    }),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  body('publishedAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for publishedAt')
    .custom((value, { req }) => {
      if (req.body.status === 'published' && !value) {
        throw new Error('publishedAt is required when status is published');
      }
      return true;
    }),
];

// Validation rules for updating news
export const updateNewsValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('Invalid news ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      return true;
    }),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  body('publishedAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for publishedAt'),
];

// Validation rules for pagination and filters
export const listNewsValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'updatedAt', 'publishedAt', 'author'])
    .withMessage('Invalid sortBy field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('category')
    .optional()
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'other'])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  query('author')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Author must be at least 2 characters'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid fromDate format'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid toDate format'),
];

// Validation rule for ID parameter
export const idParamValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('Invalid news ID format'),
];

