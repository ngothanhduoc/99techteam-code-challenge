# 🧪 API Testing Guide with Swagger

## 📋 Table of Contents
- [Start the server](#start-the-server)
- [Access Swagger UI](#access-swagger-ui)
- [Basic test flow](#basic-test-flow)
- [Test Authentication](#test-authentication)
- [Test News CRUD](#test-news-crud)
- [Test with cURL](#test-with-curl)

---

## 🚀 Start the server

### Option 1: Run locally (without Docker)

```bash
# Install dependencies
yarn install

# Create .env file (if not exists)
cp .env.example .env

# Run MongoDB (make sure MongoDB is running)
# MongoDB must run at: mongodb://localhost:27017

# Run development server
yarn dev
```

### Option 2: Run with Docker

```bash
# Run docker-compose
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📚 Access Swagger UI

After the server is running, access:

**Swagger Documentation**: http://localhost:3000/api-docs

![Swagger UI](https://i.imgur.com/swagger-example.png)

---

## 🔄 Basic test flow

### Step 1: Health Check
Check if the server is running:

```
GET /health
```

✅ Expected result: Status 200

---

### Step 2: Register an account

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "admin@test.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}
```

✅ You will receive a `token` in the response. **SAVE THIS TOKEN!**

---

### Step 3: Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

✅ Copy the `token` from the response

---

### Step 4: Authorize (Important!)

1. Click the **"Authorize"** button in the top right of Swagger UI
2. Enter the token in the format: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**

Example:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MDU...
```

---

### Step 5: Test authenticated endpoints

Now you can test endpoints with 🔒 (locked icon):

- `GET /api/auth/profile` - View profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/news` - Create article
- `PUT /api/news/{id}` - Update article
- `DELETE /api/news/{id}` - Delete article

---

## 🔐 Test Authentication Endpoints

### 1. Register new user

```
POST /api/auth/register
```

**Test Cases:**

✅ **Success - Admin role:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User",
  "role": "admin"
}
```

✅ **Success - Editor role:**
```json
{
  "email": "editor@example.com",
  "password": "password123",
  "name": "Editor User",
  "role": "editor"
}
```

✅ **Success - Viewer role (default):**
```json
{
  "email": "viewer@example.com",
  "password": "password123",
  "name": "Viewer User"
}
```

❌ **Fail - Email already exists:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Duplicate User"
}
```
*Result: 409 Conflict*

❌ **Fail - Password too short:**
```json
{
  "email": "test@example.com",
  "password": "123",
  "name": "Test User"
}
```
*Result: 400 Bad Request*

---

### 2. Login

```
POST /api/auth/login
```

✅ **Success:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

❌ **Fail - Wrong password:**
```json
{
  "email": "admin@example.com",
  "password": "wrongpassword"
}
```
*Result: 401 Unauthorized*

---

### 3. View profile

```
GET /api/auth/profile
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

✅ Result: User information

---

### 4. Update profile

```
PUT /api/auth/profile
```

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

---

### 5. Change password

```
POST /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

## 📰 Test News CRUD Endpoints

### 1. Create new article (Admin/Editor only)

```
POST /api/news
```

**Request Body:**
```json
{
  "title": "Breaking News: New Technology Breakthrough",
  "content": "This is a detailed article about the latest technology innovation that will change the world...",
  "author": "John Doe",
  "category": "technology",
  "tags": ["innovation", "tech", "AI"],
  "status": "published"
}
```

**Available categories:**
- `technology`
- `business`
- `sports`
- `entertainment`
- `health`
- `science`
- `other`

**Available statuses:**
- `draft` - Draft
- `published` - Published
- `archived` - Archived

---

### 2. Get article list (Public)

```
GET /api/news
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| page | integer | Page number | `1` |
| limit | integer | Items per page | `10` |
| sortBy | string | Sort by field | `createdAt` |
| sortOrder | string | Order (asc/desc) | `desc` |
| category | string | Filter by category | `technology` |
| status | string | Filter by status | `published` |
| author | string | Search by author name | `John` |
| tags | array | Filter by tags | `tech,AI` |
| search | string | Full-text search | `technology` |
| fromDate | date | From date | `2025-01-01` |
| toDate | date | To date | `2025-12-31` |

**Examples:**

✅ Get page 1, 10 items:
```
GET /api/news?page=1&limit=10
```

✅ Filter by technology category:
```
GET /api/news?category=technology
```

✅ Search for "AI":
```
GET /api/news?search=AI
```

✅ Combine multiple filters:
```
GET /api/news?category=technology&status=published&page=1&limit=5&sortBy=publishedAt&sortOrder=desc
```

---

### 3. View article details (Public)

```
GET /api/news/{id}
```

**Path Parameter:**
- `id`: MongoDB ObjectId of the article

**Example:**
```
GET /api/news/507f1f77bcf86cd799439011
```

---

### 4. Update article (Admin/Editor only)

```
PUT /api/news/{id}
```

**Request Body (all fields are optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "category": "business",
  "status": "published"
}
```

---

### 5. Delete article (Admin only)

```
DELETE /api/news/{id}
```

**⚠️ Only admins can delete!**

---

### 6. Statistics by category (Public)

```
GET /api/news/stats/category
```

✅ Result:
```json
{
  "success": true,
  "data": [
    {
      "_id": "technology",
      "count": 25,
      "published": 20,
      "draft": 5
    },
    {
      "_id": "business",
      "count": 15,
      "published": 12,
      "draft": 3
    }
  ]
}
```

---

## 🧪 Test Scenarios (Complete test scenarios)

### Scenario 1: Complete CRUD for Admin

1. **Register admin**
   ```
   POST /api/auth/register
   Body: { email, password, name, role: "admin" }
   ```

2. **Authorize with received token**

3. **Create article**
   ```
   POST /api/news
   Body: { title, content, author, category, status: "draft" }
   Save the article ID
   ```

4. **View article list**
   ```
   GET /api/news?status=draft
   ```

5. **Update article to published**
   ```
   PUT /api/news/{id}
   Body: { status: "published" }
   ```

6. **View article details**
   ```
   GET /api/news/{id}
   ```

7. **Delete article**
   ```
   DELETE /api/news/{id}
   ```

---

### Scenario 2: Test permissions

1. **Register viewer**
   ```
   POST /api/auth/register
   Body: { email: "viewer@test.com", password: "123456", name: "Viewer", role: "viewer" }
   ```

2. **Authorize with viewer token**

3. **Try to create article** ❌
   ```
   POST /api/news
   Result: 403 Forbidden
   ```

4. **View article list** ✅
   ```
   GET /api/news
   Result: 200 OK
   ```

---

## 🔧 Test with cURL (Alternative)

If you want to test via command line:

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "admin"
  }'
```

### Login & Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create News (with token)
```bash
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test News",
    "content": "This is test content...",
    "author": "Test Author",
    "category": "technology",
    "status": "published"
  }'
```

### Get News List
```bash
curl http://localhost:3000/api/news?page=1&limit=10
```

---

## 📝 Tips & Best Practices

1. **Always test Health check first** to ensure the server is running
2. **Save the token** after login to test protected endpoints
3. **Create multiple users with different roles** to test permissions
4. **Test edge cases**: invalid data, missing fields, wrong format
5. **Use "Try it out"** in Swagger UI to test directly
6. **Check Response status codes** to understand results

---

## 🎯 Complete Test Checklist

### Authentication
- [ ] Register admin successfully
- [ ] Register editor successfully
- [ ] Register viewer successfully
- [ ] Register with duplicate email (fail)
- [ ] Register with short password (fail)
- [ ] Login successfully
- [ ] Login with wrong password (fail)
- [ ] View profile with token
- [ ] View profile without token (fail)
- [ ] Update profile
- [ ] Change password

### News CRUD
- [ ] Create article as admin
- [ ] Create article as editor
- [ ] Create article as viewer (fail)
- [ ] View article list (public)
- [ ] Filter by category
- [ ] Filter by status
- [ ] Full-text search
- [ ] Pagination (page, limit)
- [ ] Sorting (sortBy, sortOrder)
- [ ] View article details
- [ ] Update article as admin
- [ ] Update article as editor
- [ ] Update article as viewer (fail)
- [ ] Delete article as admin
- [ ] Delete article as editor (fail)
- [ ] Statistics by category

---

## 🆘 Troubleshooting

### "Unauthorized" Error
- Check if you clicked **Authorize**
- Check if token has correct format `Bearer TOKEN`
- Token may have expired, login again to get a new token

### "Forbidden" Error
- Check if user role has sufficient permissions
- Admin: all permissions
- Editor: create, edit articles
- Viewer: view only

### "MongoDB connection" Error
- Check if MongoDB is running
- Check connection string in `.env`

### Swagger UI not displaying
- Check if server is running on port 3000
- Access: http://localhost:3000/api-docs

---

**Happy testing! 🎉**
