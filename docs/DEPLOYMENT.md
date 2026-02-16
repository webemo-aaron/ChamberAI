# ChamberOfCommerceAI Self-Hosted Deployment Guide

**Version**: 1.0  
**Last Updated**: February 2026  
**Target Audience**: System administrators and self-hosting enthusiasts

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Requirements](#system-requirements)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Backing Up Data](#backing-up-data)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)
9. [Security Best Practices](#security-best-practices)
10. [Performance Tuning](#performance-tuning)

---

## Quick Start

**TL;DR** - Get ChamberOfCommerceAI running in 5 minutes using Docker:

```bash
# 1. Clone the repository
git clone https://github.com/mahoosuc-solutions/ChamberOfCommerceAI.git
cd ChamberOfCommerceAI

# 2. Start with docker-compose (includes Firebase emulator)
docker-compose up -d

# 3. Open in browser
# Console: http://localhost:5173
# API Health: http://localhost:4001/health
# Firebase UI: http://localhost:4000

# 4. Stop when done
docker-compose down
```

**That's it!** The application will be running with all dependencies.

### Sanity Check (No Changes)

If you just want to validate configuration without starting containers:

```bash
# Validate compose file and environment interpolation
docker-compose config

# Show effective env values (from .env if present)
grep -E "^(API_|WORKER_|GCP_|FIREBASE_|GCS_|CORS_|WORKER_ENDPOINT)" .env
```

### Docker Smoke Test

```bash
# Build local images
docker build -t chamberofcommerceai-api:local -f services/api-firebase/Dockerfile services/api-firebase
docker build -t chamberofcommerceai-worker:local -f services/worker-firebase/Dockerfile services/worker-firebase

# Start the stack
docker-compose up -d

# Health checks
curl -s http://localhost:4001/health
curl -s http://localhost:4002/health

# Tear down
docker-compose down
```

---

## System Requirements

### Hardware

**Minimum**:
- CPU: 1 core (2GHz)
- RAM: 2GB
- Storage: 5GB (OS + application)
- Network: 100Mbps

**Recommended**:
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 20GB+ (allows growth)
- Network: 1Gbps+

**For 100+ users**:
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+
- Database: Dedicated (PostgreSQL/Cloud SQL)

### Software

**Option A: Docker (Easiest)**
- Docker 20.10+ ([Install](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install](https://docs.docker.com/compose/install/))

**Option B: Node.js (Development)**
- Node.js 20+ ([Download](https://nodejs.org/))
- npm 10+
- Optional: PostgreSQL 14+ for production

**Option C: Kubernetes (Advanced)**
- Kubernetes 1.24+
- kubectl configured
- Persistent volume support

---

## Installation Methods

### Method 1: Docker Compose (Recommended for Most Users)

Fastest, easiest, includes all dependencies.

#### 1.1 Prerequisites

```bash
# Check Docker is installed
docker --version
# Docker version 20.10+ ✓

# Check Docker Compose is installed
docker-compose --version
# Docker Compose version 2.0+ ✓
```

#### 1.2 Clone & Start

```bash
# Clone repository
git clone https://github.com/mahoosuc-solutions/ChamberOfCommerceAI.git
cd ChamberOfCommerceAI

# Start all services (includes Firebase emulator)
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
docker-compose ps
# STATUS should show "healthy" for all services

# View logs
docker-compose logs -f
```

#### 1.3 Verify Installation

```bash
# Check API health
curl http://localhost:4001/health

# Check Firebase emulator
curl http://localhost:4000

# Open in browser
# Console: http://localhost:5173
# API: http://localhost:4001
# Firebase UI: http://localhost:4000
```

#### 1.4 Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears data)
docker-compose down -v
```

### Method 2: Docker (Custom Configuration)

For production deployments or custom configurations.

#### 2.1 Build Docker Images

```bash
# Build API service
docker build -t chamberofcommerceai-api:v1 services/api-firebase/

# Build Worker service
docker build -t chamberofcommerceai-worker:v1 services/worker-firebase/

# Build Console (if separate)
docker build -t chamberofcommerceai-console:v1 apps/secretary-console/
```

#### 2.2 Run with Docker Network

```bash
# Create network for services
docker network create chamberofcommerceai-prod

# Run Firebase Emulator (or connect to real Firebase)
docker run -d \
  --name firebase-emulator \
  --network chamberofcommerceai-prod \
  -p 8080:8080 \
  -p 9099:9099 \
  -p 4000:4000 \
  -v firebase-data:/root/.config/firebase \
  -e FIRESTORE_EMULATOR_HOST=0.0.0.0:8080 \
  -e FIREBASE_AUTH_EMULATOR_HOST=0.0.0.0:9099 \
  firebase/firebase-tools:latest

# Run API service
docker run -d \
  --name chamberofcommerceai-api \
  --network chamberofcommerceai-prod \
  -p 4001:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e FIREBASE_USE_EMULATOR=true \
  -e FIRESTORE_EMULATOR_HOST=firebase-emulator:8080 \
  -e CORS_ORIGIN=http://localhost:5173 \
  chamberofcommerceai-api:v1

# Run Worker service
docker run -d \
  --name chamberofcommerceai-worker \
  --network chamberofcommerceai-prod \
  -p 4002:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e FIREBASE_USE_EMULATOR=true \
  -e FIRESTORE_EMULATOR_HOST=firebase-emulator:8080 \
  chamberofcommerceai-worker:v1
```

#### 2.3 Verify Services

```bash
# Check running containers
docker ps

# View logs
docker logs chamberofcommerceai-api
docker logs chamberofcommerceai-worker
docker logs firebase-emulator

# Health check
curl http://localhost:4001/health
```

### Method 3: Node.js Direct (Development Only)

For development, contributing, or understanding the codebase.

#### 3.1 Prerequisites

```bash
# Install Node.js 20+
node --version  # v20.x.x or higher

# Install npm dependencies
npm install
```

#### 3.2 Start Services

```bash
# Terminal 1: Start Firebase Emulator
npm run dev:firebase

# Terminal 2: Start API service
npm run dev:api

# Terminal 3: Start Console UI
npm run dev:console

# Verify in browser
# Console: http://localhost:5173
# API Health: http://localhost:4001/health
```

#### 3.3 Run Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Full test suite
npm test
```

---

## Configuration

### Environment Variables

This repo uses service-specific environment files. Start with these templates:

- `services/api-firebase/.env.example` -> `services/api-firebase/.env`
- `services/worker-firebase/.env.example` -> `services/worker-firebase/.env`

```bash
# API service
cp services/api-firebase/.env.example services/api-firebase/.env

# Worker service
cp services/worker-firebase/.env.example services/worker-firebase/.env
```

For Docker Compose, you can optionally create a root `.env` to override defaults:

```bash
cp .env.example .env
```

#### Common Configuration Variables (API + Worker)

```env
# Core Settings
PORT=8080
WORKER_PORT=4001
GCP_PROJECT_ID=your-project-id

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json

# Emulator (optional for local dev)
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# CORS (allow your domain)
CORS_ORIGIN=http://localhost:5173

# Storage
GCS_BUCKET_NAME=chamberofcommerceai-local-audio

# Worker service
WORKER_ENDPOINT=http://localhost:4002/tasks/process
```

### Configuration Files

#### docker-compose.yml

Override with custom configuration:

```yaml
version: '3.8'

services:
  api:
    image: chamberofcommerceai-api:local
    ports:
      - "4001:8080"
    environment:
      - PORT=8080
      - NODE_ENV=production
      - CORS_ORIGIN=https://yourdomain.com
      # Add more as needed
    volumes:
      - ./data:/app/data  # Persist data
      - ./config:/app/config
```

#### Storage Configuration

**Local Storage** (default, for single-server):

```env
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/data/uploads
```

**Google Cloud Storage** (recommended for production):

```env
STORAGE_TYPE=gcs
GCS_BUCKET_NAME=your-bucket-name
GCP_PROJECT_ID=your-project-id
```

**AWS S3**:

```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

### Feature Flags

Control which features are enabled:

```env
# Apps UI
FEATURE_PUBLIC_SUMMARY=true
FEATURE_MEMBER_SPOTLIGHT=false
FEATURE_ANALYTICS_DASHBOARD=false
FEATURE_REFERRAL_BOARD=false
FEATURE_EVENT_COLLABORATION=false

# Advanced features (require API)
FEATURE_ADVANCED_AI=false
FEATURE_CRM_INTEGRATION=false
```

View full feature list in `apps/secretary-console/modules.js`.

---

## Running the Application

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f api

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down
```

### Docker (Manual)

```bash
# Start a container
docker run -d \
  --name chamberofcommerceai-api \
  --network chamberofcommerceai-prod \
  -p 4001:8080 \
  --env-file services/api-firebase/.env \
  -v ./data:/app/data \
  chamberofcommerceai-api:v1

# View logs
docker logs -f chamberofcommerceai-api

# Stop container
docker stop chamberofcommerceai-api
```

### Node.js Direct

```bash
# Start API
npm run dev:api

# Start in production
NODE_ENV=production npm start
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Console UI | http://localhost:5173 | User interface |
| API | http://localhost:4001 | Backend API |
| API Health | http://localhost:4001/health | Status check |
| Firebase UI | http://localhost:4000 | Database browser |
| Worker | http://localhost:4002 | Task processing |

---

## Backing Up Data

### Firebase Emulator Data

```bash
# Backup Firebase data directory
cp -r ~/.config/firebase ./firebase-backup-$(date +%Y%m%d)

# Restore from backup
cp -r ./firebase-backup-20260213/* ~/.config/firebase/
```

### Docker Volumes

```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm \
  -v chamberofcommerceai_firebase-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/firebase-backup.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v chamberofcommerceai_firebase-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/firebase-backup.tar.gz -C /data
```

### Full Application Backup

```bash
#!/bin/bash
# backup.sh - Full backup script

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/backup_$BACKUP_DATE"

mkdir -p $BACKUP_DIR

# Backup data directory
cp -r ./data "$BACKUP_DIR/data"

# Backup Firebase emulator
cp -r ~/.config/firebase "$BACKUP_DIR/firebase"

# Backup environment
cp services/api-firebase/.env "$BACKUP_DIR/api.env.backup"
cp services/worker-firebase/.env "$BACKUP_DIR/worker.env.backup"

# Create archive
tar -czf "backups/backup_$BACKUP_DATE.tar.gz" -C "." "$BACKUP_DIR"

echo "✓ Backup created: backups/backup_$BACKUP_DATE.tar.gz"
```

---

## Troubleshooting

### Services Won't Start

**Error**: `docker: command not found`

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Error**: `Cannot connect to Docker daemon`

```bash
# Start Docker service
sudo systemctl start docker

# Or on macOS
open --application Docker
```

**Error**: `Port 4001 is already in use`

```bash
# Find process using port
lsof -i :4001

# Kill process
kill -9 <PID>

# Or use different port
docker-compose --project-name chamberofcommerceai-alt up -d
```

### API Health Check Fails

```bash
# Check container logs
docker logs chamberofcommerceai-api

# Common issues:
# 1. Database not ready - wait 30 seconds
docker-compose ps  # Check "healthy" status

# 2. Port not exposed - check docker-compose.yml
docker-compose ps

# 3. Environment variables missing
docker exec chamberofcommerceai-api env | grep FIRESTORE

# 4. Network issues - check network exists
docker network ls
```

### Data Not Persisting

```bash
# Check if volumes are being used
docker-compose config | grep -A5 "volumes:"

# Verify volume exists
docker volume ls

# Check volume content
docker run --rm -v chamberofcommerceai_firebase-data:/data alpine ls -la /data
```

### Performance Issues

**Slow API responses**:

```bash
# Check container resource usage
docker stats chamberofcommerceai-api

# View error logs
docker logs chamberofcommerceai-api | tail -50

# Check database size
du -sh data/firebase
```

**High CPU Usage**:

- Increase memory: `docker run -m 2g ...`
- Reduce worker processes
- Enable caching

---

## Maintenance

### Regular Tasks

#### Daily

- Monitor logs for errors
- Check disk space: `df -h`
- Monitor performance: `docker stats`

#### Weekly

- Backup data
- Review application logs
- Check for updates

#### Monthly

- Test backup/restore procedure
- Review security logs
- Update dependencies

### Logs

#### View Logs

```bash
# Last 100 lines
docker-compose logs --tail=100

# Real-time logs
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Since specific time
docker-compose logs --since 2026-02-13T10:00:00
```

#### Log Storage

```bash
# Save logs to file
docker-compose logs > logs/application-$(date +%Y%m%d).log

# Compress old logs
tar -czf logs/backup-$(date +%Y%m).tar.gz logs/

# Keep last 3 months
find logs -name "*.log" -mtime +90 -delete
```

### Updates

#### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild Docker images
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d

# Verify
docker-compose ps
```

#### Update Dependencies

```bash
# Check for updates
npm outdated

# Update production dependencies
npm update

# Update all (including dev)
npm update --save --save-dev

# Test updates
npm test

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Monitoring

#### Health Checks

```bash
#!/bin/bash
# health-check.sh

echo "Checking ChamberOfCommerceAI services..."

# Check API
API_HEALTH=$(curl -s http://localhost:4001/health | grep -o '"status":"ok"')
if [ -z "$API_HEALTH" ]; then
  echo "✗ API is down"
else
  echo "✓ API is healthy"
fi

# Check Docker containers
RUNNING=$(docker-compose ps --services --filter "status=running" | wc -l)
EXPECTED=3  # api, worker, firebase

if [ $RUNNING -eq $EXPECTED ]; then
  echo "✓ All services running ($RUNNING/$EXPECTED)"
else
  echo "✗ Some services down ($RUNNING/$EXPECTED)"
fi

# Check disk space
AVAILABLE=$(df /app | awk 'NR==2 {print $4}')
if [ $AVAILABLE -lt 1000000 ]; then  # < 1GB
  echo "✗ Low disk space: ${AVAILABLE}KB"
else
  echo "✓ Disk space OK: ${AVAILABLE}KB"
fi
```

#### Metrics

```bash
# CPU and memory usage
docker stats

# Disk usage
du -sh data/
du -sh ~/.config/firebase/

# Network usage
docker stats --no-stream --format "{{.Container}}\t{{.NetIO}}"
```

---

## Security Best Practices

### Network Security

#### Firewall

```bash
# Allow only necessary ports
sudo ufw allow 5173  # Console UI
sudo ufw allow 4001  # API (internal)
sudo ufw allow 22    # SSH

# Block everything else
sudo ufw default deny incoming
sudo ufw enable
```

#### Reverse Proxy (nginx)

```nginx
# /etc/nginx/sites-available/chamberofcommerceai

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

    # Console
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Data Security

#### Environment Variables

```bash
# Never commit secrets to git
echo "services/api-firebase/.env" >> .gitignore
echo "services/worker-firebase/.env" >> .gitignore
echo "*.key" >> .gitignore

# Use secure storage for passwords
chmod 600 services/api-firebase/.env
chmod 600 services/worker-firebase/.env
```

#### Database Security

```bash
# Set strong Firebase emulator password (if not using emulator)
export FIREBASE_PASSWORD=$(openssl rand -base64 32)

# Restrict access to localhost
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

#### File Permissions

```bash
# Run as non-root user
docker run --user 1001:1001 chamberofcommerceai-api:v1

# Restrict data directory
chmod 700 data/
chmod 700 ~/.config/firebase
```

### Updates & Patches

```bash
# Enable automatic security updates (Ubuntu/Debian)
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Performance Tuning

### Docker Optimization

```bash
# Limit memory usage
docker run -m 2g -e NODE_ENV=production chamberofcommerceai-api:v1

# Use production build
docker run -e NODE_ENV=production chamberofcommerceai-api:v1

# Enable buildkit for faster builds
export DOCKER_BUILDKIT=1
docker build -t chamberofcommerceai-api:v1 .
```

### Node.js Optimization

```env
# services/api-firebase/.env
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048

# For high concurrency
UV_THREADPOOL_SIZE=4
```

### Database Optimization

#### Firebase Emulator

For production, use real Firebase:

```env
# Use real Firebase (not emulator)
FIREBASE_USE_EMULATOR=false
FIREBASE_PROJECT_ID=your-real-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

#### Caching

```javascript
// Example cache configuration
const CACHE_TTL = {
  meetings: 300,      // 5 minutes
  settings: 3600,     // 1 hour
  featureFlags: 3600  // 1 hour
};
```

### Scaling

#### Horizontal Scaling (Multiple Servers)

```bash
# Server 1: Database
docker run -d --name firebase -p 8080:8080 firebase-tools

# Server 2: API Instance 1
docker run -d --name api-1 -e FIRESTORE_EMULATOR_HOST=server1:8080 chamberofcommerceai-api:v1

# Server 3: API Instance 2
docker run -d --name api-2 -e FIRESTORE_EMULATOR_HOST=server1:8080 chamberofcommerceai-api:v1

# Load balancer (nginx)
# Routes traffic between api-1 and api-2
```

#### Vertical Scaling (Single Server Optimization)

```bash
# Increase available resources
docker run --cpus 4 --memory 8g chamberofcommerceai-api:v1
```

---

## Additional Resources

### Documentation
- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Contributing Guide](../CONTRIBUTING.md)

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Getting Help

1. **Check the logs**:
   ```bash
   docker-compose logs -f
   ```

2. **Search existing issues**:
   - [GitHub Issues](https://github.com/mahoosuc-solutions/ChamberOfCommerceAI/issues)

3. **Ask the community**:
   - Start a new GitHub Discussion
   - Join our Discord/Slack

4. **Report security issues**:
   - See [SECURITY.md](../SECURITY.md)

---

## Checklist: Production Deployment

- [ ] Hardware meets recommended specs
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `services/api-firebase/.env` and `services/worker-firebase/.env` configured with production values
- [ ] Firewall configured to allow necessary ports
- [ ] Reverse proxy (nginx/Apache) configured
- [ ] SSL certificates installed
- [ ] Backup script created and tested
- [ ] Monitoring configured (health checks, logs)
- [ ] Security hardening completed
- [ ] Performance baseline established
- [ ] Tested start/stop/restart procedures
- [ ] Tested backup and restore process
- [ ] Documentation reviewed by team

---

**Version History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial release |

---

**License**: [MIT](../LICENSE)

Questions? [Open an issue](https://github.com/mahoosuc-solutions/ChamberOfCommerceAI/issues) or check [CONTRIBUTING.md](../CONTRIBUTING.md)
