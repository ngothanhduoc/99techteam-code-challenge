import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { generateToken, AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { DEFAULT_ROLE } from '../constants/roles';

export class AuthController {
  // Register new user
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
        role: role || DEFAULT_ROLE,
      });

      // Generate token
      const token = generateToken(user.id.toString(), user.email, user.role);

      const response: ApiResponse<any> = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated. Please contact support.', 403);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate token
      const token = generateToken(user.id.toString(), user.email, user.role);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { name } = req.body;
      const updates: any = {};

      if (name) updates.name = name;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user.id).select('+password');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Update password
      user.password = newPassword;
      await user.save();

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password changed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

