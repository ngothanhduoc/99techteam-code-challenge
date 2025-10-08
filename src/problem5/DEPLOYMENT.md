# Deployment Guide

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker Engine 20.x or higher
- Docker Compose 2.x or higher

#### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd problem5
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your production values
```

3. **Build and start services**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f api

# Test health endpoint
curl http://localhost:3000/health
```

5. **Access services**
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- MongoDB UI: http://localhost:8081 (admin/admin)

#### Production Configuration

For production, update `docker-compose.yml`:

```yaml
services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  
  api:
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}  # Use strong secret
      MONGODB_URI: ${MONGODB_URI}
    # Remove Mongo Express in production
```

---

### Option 2: Manual Deployment

#### Prerequisites
- Node.js 20.x or higher
- MongoDB 7.x or higher
- PM2 (for process management)

#### Steps

1. **Install dependencies**
```bash
npm ci --production
```

2. **Build TypeScript**
```bash
npm run build
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
```

4. **Install PM2**
```bash
npm install -g pm2
```

5. **Start application**
```bash
pm2 start dist/index.js --name news-api
```

6. **Configure PM2 startup**
```bash
pm2 startup
pm2 save
```

#### PM2 Commands

```bash
# View logs
pm2 logs news-api

# Monitor
pm2 monit

# Restart
pm2 restart news-api

# Stop
pm2 stop news-api

# Delete
pm2 delete news-api
```

---

### Option 3: Cloud Deployment

#### Heroku

1. **Create Heroku app**
```bash
heroku create your-news-api
```

2. **Add MongoDB addon**
```bash
heroku addons:create mongolab:sandbox
```

3. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

4. **Deploy**
```bash
git push heroku main
```

#### AWS EC2

1. **Launch EC2 instance** (Ubuntu 22.04 LTS)

2. **Install dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

3. **Clone and setup application**
```bash
git clone <repository-url>
cd problem5
npm ci --production
npm run build
```

4. **Configure Nginx reverse proxy**
```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/news-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/news-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

6. **Start application with PM2**
```bash
npm install -g pm2
pm2 start dist/index.js --name news-api
pm2 startup
pm2 save
```

#### DigitalOcean App Platform

1. **Create `app.yaml`**
```yaml
name: news-api
services:
- name: api
  github:
    repo: your-username/your-repo
    branch: main
    deploy_on_push: true
  build_command: npm run build
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: "production"
  - key: MONGODB_URI
    value: ${mongodb.DATABASE_URL}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
databases:
- name: mongodb
  engine: MONGODB
  production: true
```

2. **Deploy**
```bash
doctl apps create --spec app.yaml
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] **Environment Variables**
  - [ ] Change `JWT_SECRET` to strong random string (min 32 chars)
  - [ ] Use production MongoDB URI with authentication
  - [ ] Set `NODE_ENV=production`

- [ ] **Database Security**
  - [ ] Enable MongoDB authentication
  - [ ] Create database user with limited permissions
  - [ ] Enable SSL/TLS for MongoDB connections
  - [ ] Set up firewall rules (only allow app server)

- [ ] **Application Security**
  - [ ] Configure proper CORS origins
  - [ ] Review and adjust rate limits
  - [ ] Enable HTTPS/SSL
  - [ ] Set secure HTTP headers (already done with Helmet)
  - [ ] Validate all user inputs (already done)

- [ ] **Monitoring & Logging**
  - [ ] Set up application monitoring (New Relic, DataDog)
  - [ ] Configure log aggregation (Elasticsearch, CloudWatch)
  - [ ] Set up error tracking (Sentry, Rollbar)
  - [ ] Create health check monitors

- [ ] **Backup & Recovery**
  - [ ] Set up automated database backups
  - [ ] Test backup restoration process
  - [ ] Document recovery procedures

- [ ] **Performance**
  - [ ] Enable gzip compression (if using Nginx)
  - [ ] Configure database connection pooling
  - [ ] Set up CDN for static assets (if any)
  - [ ] Monitor and optimize slow queries

---

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-07T10:00:00.000Z",
  "uptime": 123.456
}
```

### Docker Health Checks

Built-in health checks monitor:
- API server responsiveness
- MongoDB connection
- Container resource usage

View health status:
```bash
docker-compose ps
```

### Log Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- `logs/http.log` - HTTP requests
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

---

## 🔄 CI/CD Pipeline Example

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

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
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/problem5
            git pull
            npm ci --production
            npm run build
            pm2 restart news-api
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Database connection timeout
```
Solution: Check MongoDB is running and accessible
- Verify MONGODB_URI in .env
- Check firewall rules
- Test connection: mongosh <MONGODB_URI>
```

**Issue**: Port already in use
```
Solution: Change PORT in .env or stop conflicting process
- Find process: lsof -i :3000
- Kill process: kill -9 <PID>
```

**Issue**: Out of memory
```
Solution: Increase container memory or add swap
- Docker: Update docker-compose.yml resources
- Linux: sudo fallocate -l 2G /swapfile
```

---

## 📈 Scaling

### Horizontal Scaling

1. **Use load balancer** (Nginx, HAProxy, AWS ALB)
2. **Run multiple instances** behind load balancer
3. **Share MongoDB connection** across instances
4. **Use Redis** for session storage (if needed)

Example with Docker Swarm:
```bash
docker swarm init
docker stack deploy -c docker-compose.yml news-api-stack
docker service scale news-api-stack_api=3
```

### Vertical Scaling

1. **Increase container resources**
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

2. **Optimize MongoDB**
- Add indexes (already done)
- Enable query profiling
- Use read replicas for read-heavy workloads

---

## 🔐 Secrets Management

### Using Docker Secrets

```bash
# Create secrets
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-mongo-password" | docker secret create mongo_password -

# Use in docker-compose.yml
services:
  api:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### Using AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret --name prod/news-api/jwt --secret-string "your-secret"

# Retrieve in application
import { SecretsManager } from 'aws-sdk';
const secret = await secretsManager.getSecretValue({ SecretId: 'prod/news-api/jwt' });
```

---

**For additional help, refer to the main README.md or create an issue in the repository.**

