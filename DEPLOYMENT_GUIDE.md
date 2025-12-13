# 🚀 Gyon Deployment Guide

Complete guide to deploy Gyon (API Mashup Generator) with all functionalities.

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Docker** & **Docker Compose** (for containerized deployment)
- **Git** (for version control)

## 🎯 Deployment Options

### Option 1: Quick Local Production Test

**Best for**: Testing production build locally

```bash
# Windows
./deploy-local.bat

# Manual steps:
cd backend
npm install
npm run build
npm start

# New terminal
cd frontend  
npm install
npm run build
npm run preview
```

**Access**: http://localhost:4173

---

### Option 2: Docker Deployment (Recommended)

**Best for**: Production deployment with all services

```bash
# 1. Clone and setup
git clone https://github.com/shamsundarsk/gyon.git
cd gyon

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Deploy with Docker
chmod +x deploy-production.sh
./deploy-production.sh

# Or manually:
docker-compose up -d --build
```

**Access**: 
- Frontend: http://localhost
- Backend: http://localhost:3002
- Ollama AI: http://localhost:11434

---

### Option 3: Cloud Deployment

#### Frontend (Vercel)

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

2. **Configure**:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

#### Backend (Railway/Heroku)

1. **Railway**:
   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3002
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

---

### Option 4: VPS/Server Deployment

**Best for**: Full control, custom domain

```bash
# 1. Server setup (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm nginx docker docker-compose

# 2. Clone repository
git clone https://github.com/shamsundarsk/gyon.git
cd gyon

# 3. Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 4. Deploy
./deploy-production.sh
```

## 🔧 Configuration

### Backend Environment (.env)

```env
# Required
PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# AI Features (Optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Security
JWT_SECRET=your-super-secret-key
SESSION_SECRET=your-session-secret
```

### Frontend Environment (.env)

```env
# Required
VITE_API_URL=https://your-backend-url.com

# Features
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_CODE_EDITOR=true
```

## 🤖 AI Setup (Optional)

Gyon includes AI-powered features using Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull AI model
ollama pull llama3

# Start Ollama service
ollama serve
```

**Docker**: AI service is included in docker-compose.yml

## 🔍 Health Checks

### Backend Health
```bash
curl http://localhost:3002/api/health
```

### Frontend Health
```bash
curl http://localhost/
```

### AI Health
```bash
curl http://localhost:11434/api/tags
```

## 📊 Monitoring

### Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ollama
```

### Service Status
```bash
docker-compose ps
```

## 🔄 Updates

### Docker Deployment
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Manual Deployment
```bash
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart gyon-backend

# Frontend  
cd frontend
npm install
npm run build
```

## 🛡️ Security Checklist

- [ ] Change default JWT/Session secrets
- [ ] Configure CORS origins properly
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3002
   netstat -tulpn | grep :80
   ```

2. **Docker issues**:
   ```bash
   # Reset Docker
   docker-compose down --volumes --remove-orphans
   docker system prune -a
   ```

3. **AI not working**:
   ```bash
   # Check Ollama
   docker-compose exec ollama ollama list
   docker-compose exec ollama ollama pull llama3
   ```

4. **Build failures**:
   ```bash
   # Clear caches
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📈 Performance Optimization

### Production Optimizations

1. **Enable Gzip** (included in nginx.conf)
2. **CDN Setup** for static assets
3. **Database optimization** (if added)
4. **Caching strategies**
5. **Load balancing** for high traffic

### Scaling

- **Horizontal**: Multiple backend instances
- **Vertical**: Increase server resources  
- **Database**: Add PostgreSQL/MongoDB
- **Cache**: Redis for session storage
- **Queue**: Bull/Agenda for background jobs

## 🎉 Success!

Your Gyon application should now be running with:

✅ **Frontend**: Modern React app with turtle/rabbit racing animations  
✅ **Backend**: Node.js API with 120+ API integrations  
✅ **AI Features**: Local Ollama integration for idea generation  
✅ **Code Editor**: Monaco-based editor with live preview  
✅ **Project Export**: ZIP download functionality  
✅ **Responsive Design**: Works on all devices  

## 📞 Support

- **GitHub Issues**: https://github.com/shamsundarsk/gyon/issues
- **Documentation**: Check README.md files
- **Logs**: Always check logs first for debugging

---

**Happy Deploying! 🚀**