#!/bin/bash

echo "=========================================="
echo "    GYON - Production Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Starting Gyon production deployment..."

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/uploads
mkdir -p logs

# Set proper permissions
chmod 755 backend/data
chmod 755 backend/uploads

# Build and start services
print_status "Building and starting Docker services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Services are running!"
    
    # Setup Ollama model (optional)
    print_status "Setting up Ollama AI model (this may take a few minutes)..."
    docker-compose exec -T ollama ollama pull llama3 || print_warning "Ollama model setup failed - AI features may not work"
    
    echo ""
    print_success "🎉 Gyon deployment completed successfully!"
    echo ""
    echo "📋 Access Information:"
    echo "   🌐 Frontend: http://localhost"
    echo "   🔧 Backend API: http://localhost:3002"
    echo "   🤖 Ollama AI: http://localhost:11434"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Update: git pull && docker-compose up -d --build"
    
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi