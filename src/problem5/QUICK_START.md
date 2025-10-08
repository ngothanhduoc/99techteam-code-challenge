# ⚡ Quick Start Guide

Quick guide to run and test the system in 5 minutes!

---

## 🚀 Option 1: Docker (Fastest - Recommended)

### Step 1: Start Services

```bash
cd src/problem5
docker-compose up -d
```

### Step 2: Check Health

```bash
curl http://localhost:3000/health
```

### Step 3: Access API Docs

Open browser: **http://localhost:3000/api-docs**

### Step 4: Test API

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Save the `token` from the response!

**Create News:**
```bash
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Breaking News: Docker Works!",
    "content": "This is a test news article created via API",
    "author": "Admin User",
    "category": "technology",
    "status": "published"
  }'
```

**Get News List:**
```bash
curl http://localhost:3000/api/news
```

### Step 5: View Database

Open browser: **http://localhost:8081** (admin/admin)

### Stop Services

```bash
docker-compose down
```

---

## 🔧 Option 2: Local Development

### Step 1: Install Dependencies

```bash
cd src/problem5
npm install
```

### Step 2: Setup MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/news_db
JWT_SECRET=your-secret-key-here
```

### Step 4: Start Server

```bash
npm run dev
```

Server running at: **http://localhost:3000**

### Step 5: Test like Option 1 (Steps 3-4)

---

## 🧪 Option 3: Run Tests

### Run All Tests

```bash
cd src/problem5
npm install
npm test
```

### View Coverage

```bash
open coverage/lcov-report/index.html
```

---

## 📚 Quick API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile (protected) |

### News Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/news` | Create news | Yes (admin/editor) |
| GET | `/api/news` | List news | No |
| GET | `/api/news/:id` | Get by ID | No |
| PUT | `/api/news/:id` | Update | Yes (admin/editor) |
| DELETE | `/api/news/:id` | Delete | Yes (admin only) |
| GET | `/api/news/stats/category` | Statistics | No |

---

## 🎯 Test Scenarios

### Scenario 1: Complete Flow

```bash
# 1. Register Admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","name":"Admin","role":"admin"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | jq -r '.data.token')

# 3. Create News
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test News Article","content":"This is a test content","author":"Admin","category":"technology","status":"published"}'

# 4. Get News List
curl http://localhost:3000/api/news | jq

# 5. Get Statistics
curl http://localhost:3000/api/news/stats/category | jq
```

### Scenario 2: Test Pagination

```bash
# Page 1, 5 items
curl "http://localhost:3000/api/news?page=1&limit=5"

# Page 2
curl "http://localhost:3000/api/news?page=2&limit=5"
```

### Scenario 3: Test Filters

```bash
# Filter by category
curl "http://localhost:3000/api/news?category=technology"

# Filter by status
curl "http://localhost:3000/api/news?status=published"

# Search
curl "http://localhost:3000/api/news?search=technology"

# Multiple filters
curl "http://localhost:3000/api/news?category=technology&status=published&sortBy=createdAt&sortOrder=desc"
```

### Scenario 4: Test Authorization

```bash
# Try to create without token (should fail)
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Content","author":"User","category":"technology"}'

# Register as viewer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@test.com","password":"viewer123","name":"Viewer","role":"viewer"}'

# Login as viewer
VIEWER_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@test.com","password":"viewer123"}' \
  | jq -r '.data.token')

# Try to create as viewer (should fail with 403)
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"title":"Test","content":"Content","author":"Viewer","category":"technology"}'
```

---

## 🔍 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Change port in docker-compose.yml or stop conflicting service
lsof -i :3000
kill -9 <PID>
```

**Container not starting:**
```bash
# View logs
docker-compose logs api

# Rebuild
docker-compose up --build
```

### MongoDB Issues

**Connection refused:**
```bash
# Check if MongoDB is running
docker-compose ps
# OR for local
brew services list | grep mongodb
```

### Test Issues

**Tests failing:**
```bash
# Clear cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 What to Check

### ✅ Checklist

After starting the server, verify:

- [ ] Health endpoint works: `curl http://localhost:3000/health`
- [ ] API docs accessible: http://localhost:3000/api-docs
- [ ] Can register user
- [ ] Can login and get token
- [ ] Can create news with token (admin/editor)
- [ ] Cannot create without token
- [ ] Can list news without auth
- [ ] Pagination works
- [ ] Filters work
- [ ] Statistics work
- [ ] Tests pass: `npm test`
- [ ] Coverage >80%

---

## 🎓 Next Steps

### For Evaluation
1. ✅ Review code structure
2. ✅ Check test coverage
3. ✅ Test API endpoints
4. ✅ Review documentation

### For Development
1. Read `README.md` for complete documentation
2. Read `TESTING.md` for testing guide
3. Read `DEPLOYMENT.md` for deployment options
4. Check `CHANGELOG.md` for features list

### For Production
1. Review security checklist in `DEPLOYMENT.md`
2. Configure production environment variables
3. Set up monitoring and logging
4. Configure SSL/HTTPS
5. Set up automated backups

---

## 🌐 Important URLs

When running:

- **API Server**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Mongo Express**: http://localhost:8081 (admin/admin)

---

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Check `TROUBLESHOOTING` section in `DEPLOYMENT.md`
- Review `TESTING.md` for test issues
- Check logs: `docker-compose logs -f` or `logs/` directory

---

## 🎉 Success!

If all the above steps work, you have successfully set up a **production-ready News API** with:

- ✅ Authentication & Authorization (JWT + RBAC)
- ✅ Comprehensive Testing (>80% coverage)
- ✅ Swagger Documentation
- ✅ Docker Deployment
- ✅ Structured Logging
- ✅ Database Optimization
- ✅ Security Features

**Time to complete**: ~5 minutes ⚡

**Next**: Explore API with Swagger UI or test with curl/Postman!

---

Made with ❤️ - Ready to impress! 🚀
