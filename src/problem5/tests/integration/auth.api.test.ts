import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import { generateToken } from '../../src/middleware/auth';
import { USER_ROLES } from '../../src/constants/roles';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('Auth API - Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: USER_ROLES.VIEWER, // Default role
      });
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.token).toBeDefined();

      // Verify user is created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
    });

    it('should register user with specific role', async () => {
      const userData = {
        email: 'editor@example.com',
        password: 'password123',
        name: 'Editor User',
        role: USER_ROLES.EDITOR,
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.role).toBe(USER_ROLES.EDITOR);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '12345', // Too short
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for short name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A', // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'invalid-role',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'First User',
      };

      // Create first user
      await User.create(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        email: 'logintest@example.com',
        password: 'password123',
        name: 'Login Test User',
        role: USER_ROLES.VIEWER,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toMatchObject({
        email: loginData.email,
        name: 'Login Test User',
        role: USER_ROLES.VIEWER,
      });
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 403 for inactive user', async () => {
      // Create inactive user
      await User.create({
        email: 'inactive@example.com',
        password: 'password123',
        name: 'Inactive User',
        isActive: false,
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
        role: USER_ROLES.VIEWER,
      });
      userId = user.id.toString();
      authToken = generateToken(userId, user.email, user.role);
    });

    it('should get profile successfully with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: 'profile@example.com',
        name: 'Profile User',
        role: USER_ROLES.VIEWER,
        isActive: true,
      });
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'updateprofile@example.com',
        password: 'password123',
        name: 'Original Name',
        role: USER_ROLES.VIEWER,
      });
      userId = user.id.toString();
      authToken = generateToken(userId, user.email, user.role);
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.name).toBe(updateData.name);

      // Verify update in database
      const user = await User.findById(userId);
      expect(user?.name).toBe(updateData.name);
    });

    it('should return 401 without authentication token', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'changepassword@example.com',
        password: 'oldpassword123',
        name: 'Change Password User',
        role: USER_ROLES.VIEWER,
      });
      userId = user.id.toString();
      authToken = generateToken(userId, user.email, user.role);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepassword@example.com',
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return 401 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });

    it('should return 400 for short new password', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: '12345', // Too short
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing current password', async () => {
      const passwordData = {
        newPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing new password', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication token', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not allow login with old password after change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
        })
        .expect(200);

      // Try to login with old password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepassword@example.com',
          password: 'oldpassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // 1. Register new user
      const registerData = {
        email: 'flowtest@example.com',
        password: 'password123',
        name: 'Flow Test User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const registrationToken = registerResponse.body.data.token;

      // 2. Get profile using registration token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(registerData.email);

      // 3. Login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const loginToken = loginResponse.body.data.token;

      // 4. Update profile using login token
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({ name: 'Updated Flow Test User' })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Updated Flow Test User');

      // 5. Change password
      const changePasswordResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 6. Login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: 'newpassword456',
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });
  });

  describe('Email Case Sensitivity', () => {
    beforeEach(async () => {
      await User.create({
        email: 'CaseSensitive@Example.com',
        password: 'password123',
        name: 'Case Test User',
      });
    });

    it('should login with lowercase email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'casesensitive@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should login with mixed case email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'CaseSensitive@Example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent duplicate registration with different case', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'casesensitive@example.com',
          password: 'password123',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(response.body.message).toBe('Email already registered');
    });
  });
});

