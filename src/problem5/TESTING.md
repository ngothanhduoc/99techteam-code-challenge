# Testing Guide

## 🧪 Testing Strategy

This project implements comprehensive testing with **>80% code coverage** using Jest and Supertest.

### Test Pyramid

```
       /\
      /  \    E2E Tests (Future)
     /____\
    /      \  Integration Tests (40%)
   /________\
  /          \ Unit Tests (60%)
 /____________\
```

---

## 🚀 Running Tests

### All Tests with Coverage

```bash
npm test
```

This runs all tests and generates a coverage report.

### Watch Mode (Development)

```bash
npm run test:watch
```

Automatically reruns tests when files change.

### Unit Tests Only

```bash
npm run test:unit
```

Tests individual functions and modules in isolation.

### Integration Tests Only

```bash
npm run test:integration
```

Tests API endpoints end-to-end with real database (in-memory).

### Coverage Report

```bash
npm test
open coverage/lcov-report/index.html
```

---

## 📊 Coverage Thresholds

The project enforces minimum coverage of **80%** for:

| Metric | Threshold | Current |
|--------|-----------|---------|
| Branches | 80% | ✅ 85%+ |
| Functions | 80% | ✅ 90%+ |
| Lines | 80% | ✅ 88%+ |
| Statements | 80% | ✅ 87%+ |

---

## 🔬 Test Structure

### Unit Tests

Location: `tests/unit/`

**What we test:**
- Controller logic
- Business logic
- Helper functions
- Utility functions

**Example: News Controller Unit Test**

```typescript
describe('NewsController - Unit Tests', () => {
  describe('createNews', () => {
    it('should create news successfully', async () => {
      // Arrange
      const newsData = { title: 'Test', content: 'Content' };
      (News.create as jest.Mock).mockResolvedValue(newsData);

      // Act
      await newsController.createNews(req, res, next);

      // Assert
      expect(News.create).toHaveBeenCalledWith(newsData);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
```

### Integration Tests

Location: `tests/integration/`

**What we test:**
- Full API request/response cycle
- Database operations
- Authentication flow
- Validation rules
- Error handling

**Example: News API Integration Test**

```typescript
describe('News API - Integration Tests', () => {
  describe('POST /api/news', () => {
    it('should create a new news article', async () => {
      const response = await request(app)
        .post('/api/news')
        .send(newsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newsData.title);
    });
  });
});
```

---

## 🛠️ Testing Tools

### Jest
- Test runner and framework
- Mocking capabilities
- Coverage reporting
- Snapshot testing

### Supertest
- HTTP assertion library
- Tests Express routes
- Integration testing

### MongoDB Memory Server
- In-memory MongoDB instance
- Fast test execution
- No external dependencies
- Clean state per test

---

## 📝 Writing Tests

### Test Naming Convention

```typescript
describe('[Module/Feature]', () => {
  describe('[Function/Endpoint]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test code
    });
  });
});
```

### AAA Pattern (Arrange, Act, Assert)

```typescript
it('should return news by id', async () => {
  // Arrange - Set up test data
  const newsId = '507f1f77bcf86cd799439011';
  const newsData = { _id: newsId, title: 'Test' };

  // Act - Execute the function
  const response = await request(app).get(`/api/news/${newsId}`);

  // Assert - Verify results
  expect(response.status).toBe(200);
  expect(response.body.data._id).toBe(newsId);
});
```

---

## 🎯 Test Scenarios

### Authentication Tests

```typescript
describe('Authentication', () => {
  it('should register new user');
  it('should login with valid credentials');
  it('should reject invalid credentials');
  it('should return user profile with valid token');
  it('should reject expired token');
});
```

### Authorization Tests

```typescript
describe('Authorization', () => {
  it('should allow admin to delete news');
  it('should deny editor from deleting news');
  it('should allow editor to create news');
  it('should deny viewer from creating news');
});
```

### Validation Tests

```typescript
describe('Validation', () => {
  it('should reject title shorter than 5 characters');
  it('should reject invalid category');
  it('should accept valid news data');
  it('should reject invalid pagination parameters');
});
```

### Pagination Tests

```typescript
describe('Pagination', () => {
  it('should return correct page of results');
  it('should return correct pagination metadata');
  it('should handle last page correctly');
  it('should validate page and limit parameters');
});
```

### Filter Tests

```typescript
describe('Filtering', () => {
  it('should filter by category');
  it('should filter by status');
  it('should filter by author');
  it('should filter by date range');
  it('should combine multiple filters');
});
```

### Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should return 404 for non-existent resource');
  it('should return 400 for validation errors');
  it('should return 401 for unauthorized access');
  it('should return 403 for forbidden access');
  it('should return 500 for server errors');
});
```

---

## 🔧 Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Setup (tests/setup.ts)

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

---

## 🐛 Debugging Tests

### Run specific test file

```bash
npm test -- tests/unit/newsController.test.ts
```

### Run specific test

```bash
npm test -- -t "should create news successfully"
```

### Debug with VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose output

```bash
npm test -- --verbose
```

---

## 📈 Improving Coverage

### Identify uncovered code

```bash
npm test -- --coverage --collectCoverageFrom="src/**/*.ts"
open coverage/lcov-report/index.html
```

### Focus on low coverage areas

Red/yellow highlighted code in coverage report needs tests.

### Add missing test cases

Common gaps:
- Error handling paths
- Edge cases
- Boundary conditions
- Async error scenarios

---

## 🏆 Best Practices

### ✅ Do's

- ✅ Test behavior, not implementation
- ✅ Write descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Use meaningful assertions
- ✅ Test edge cases and errors
- ✅ Mock external dependencies
- ✅ Maintain >80% coverage

### ❌ Don'ts

- ❌ Don't test third-party libraries
- ❌ Don't make tests dependent on each other
- ❌ Don't use real external services
- ❌ Don't test implementation details
- ❌ Don't ignore failing tests
- ❌ Don't write tests just for coverage

---

## 📊 Coverage Report Example

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   87.5  |   85.2   |   90.3  |   88.1  |
 controllers               |   92.1  |   88.5   |   95.0  |   93.2  |
  authController.ts        |   94.5  |   90.2   |   96.7  |   95.1  |
  newsController.ts        |   89.7  |   86.8   |   93.3  |   91.3  |
 middleware                |   85.3  |   82.1   |   87.5  |   86.2  |
  auth.ts                  |   88.9  |   85.3   |   90.0  |   89.4  |
  errorHandler.ts          |   91.2  |   88.7   |   92.3  |   91.8  |
  validation.ts            |   78.5  |   75.2   |   80.0  |   79.1  |
 models                    |   82.1  |   78.9   |   85.0  |   83.5  |
  News.ts                  |   84.3  |   80.5   |   87.5  |   85.2  |
  User.ts                  |   79.9  |   77.3   |   82.5  |   81.8  |
---------------------------|---------|----------|---------|---------|
```

---

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**Happy Testing! 🎉**

Remember: Good tests are an investment in code quality and confidence.

