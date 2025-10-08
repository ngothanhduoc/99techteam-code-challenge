import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/controllers/authController';
import User from '../../src/models/User';
import { generateToken, AuthRequest } from '../../src/middleware/auth';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { USER_ROLES } from '../../src/constants/roles';

// Mock mongoose model and auth module
jest.mock('../../src/models/User');
jest.mock('../../src/middleware/auth', () => ({
  generateToken: jest.fn(),
  AuthRequest: {} as any,
}));

const MockedUser = jest.mocked(User);
const mockedGenerateToken = jest.mocked(generateToken);

describe('AuthController - Unit Tests', () => {
  let authController: AuthController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
      params: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockImplementation(function (this: Response) { return this; }),
      json: jest.fn().mockImplementation(function (this: Response) { return this; }),
    } as Partial<Response>;
    mockNext = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: USER_ROLES.VIEWER,
      };

      const createdUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        email: userData.email,
        name: userData.name,
        role: userData.role,
      };

      mockRequest.body = userData;
      MockedUser.findOne.mockResolvedValue(null);
      MockedUser.create.mockResolvedValue(createdUser as any);
      mockedGenerateToken.mockReturnValue('fake-jwt-token');

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(MockedUser.create).toHaveBeenCalledWith(userData);
      expect(mockedGenerateToken).toHaveBeenCalledWith(
        createdUser.id.toString(),
        createdUser.email,
        createdUser.role
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: createdUser._id,
            email: createdUser.email,
            name: createdUser.name,
            role: createdUser.role,
          },
          token: 'fake-jwt-token',
        },
      });
    });

    it('should return 409 if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockRequest.body = userData;
      MockedUser.findOne.mockResolvedValue({ email: userData.email } as any);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered',
          statusCode: 409,
        })
      );
    });

    it('should use default role if role is not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const createdUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        email: userData.email,
        name: userData.name,
        role: USER_ROLES.VIEWER,
      };

      mockRequest.body = userData;
      MockedUser.findOne.mockResolvedValue(null);
      MockedUser.create.mockResolvedValue(createdUser as any);
      mockedGenerateToken.mockReturnValue('fake-jwt-token');

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MockedUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: USER_ROLES.VIEWER,
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRequest.body = { email: 'test@example.com' };
      MockedUser.findOne.mockRejectedValue(error);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        name: 'Test User',
        role: USER_ROLES.VIEWER,
        isActive: true,
        comparePassword: jest.fn<any>().mockResolvedValue(true),
      };

      mockRequest.body = loginData;
      MockedUser.findOne.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(user),
      } as any);
      mockedGenerateToken.mockReturnValue('fake-jwt-token');

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token: 'fake-jwt-token',
        },
      });
    });

    it('should return 401 for invalid email', async () => {
      mockRequest.body = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      MockedUser.findOne.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(null),
      } as any);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
          statusCode: 401,
        })
      );
    });

    it('should return 401 for invalid password', async () => {
      const user = {
        email: 'test@example.com',
        isActive: true,
        comparePassword: jest.fn<any>().mockResolvedValue(false),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      MockedUser.findOne.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(user),
      } as any);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
          statusCode: 401,
        })
      );
    });

    it('should return 403 for inactive user', async () => {
      const user = {
        email: 'test@example.com',
        isActive: false,
        comparePassword: jest.fn<any>(),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      MockedUser.findOne.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(user),
      } as any);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account is deactivated. Please contact support.',
          statusCode: 403,
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: USER_ROLES.VIEWER,
        isActive: true,
        createdAt: new Date(),
      };

      mockRequest.user = {
        id: userId,
        email: user.email,
        role: user.role,
      };

      MockedUser.findById.mockResolvedValue(user as any);

      await authController.getProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(MockedUser.findById).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.getProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };

      MockedUser.findById.mockResolvedValue(null);

      await authController.getProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Name',
      };

      const updatedUser = {
        _id: userId,
        email: 'test@example.com',
        name: updateData.name,
        role: USER_ROLES.VIEWER,
      };

      mockRequest.user = {
        id: userId,
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };
      mockRequest.body = updateData;

      MockedUser.findByIdAndUpdate.mockResolvedValue(updatedUser as any);

      await authController.updateProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { name: updateData.name },
        { new: true, runValidators: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { name: 'New Name' };

      await authController.updateProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };
      mockRequest.body = { name: 'New Name' };

      MockedUser.findByIdAndUpdate.mockResolvedValue(null);

      await authController.updateProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const user = {
        _id: userId,
        email: 'test@example.com',
        password: 'hashedOldPassword',
        comparePassword: jest.fn<any>().mockResolvedValue(true),
        save: jest.fn<any>().mockResolvedValue(true),
      };

      mockRequest.user = {
        id: userId,
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };
      mockRequest.body = passwordData;

      MockedUser.findById.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(user),
      } as any);

      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(user.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(user.password).toBe(passwordData.newPassword);
      expect(user.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should return 401 if current password is incorrect', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = {
        _id: userId,
        comparePassword: jest.fn<any>().mockResolvedValue(false),
      };

      mockRequest.user = {
        id: userId,
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };
      mockRequest.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      MockedUser.findById.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(user),
      } as any);

      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password is incorrect',
          statusCode: 401,
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: USER_ROLES.VIEWER,
      };
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      MockedUser.findById.mockReturnValue({
        select: jest.fn<any>().mockResolvedValue(null),
      } as any);

      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
    });
  });
});

