#!/bin/bash

# Setup script for Business Bottleneck Analyzer
# This script automates the installation process

set -e  # Exit on error

echo "🚀 Business Bottleneck Analyzer - Setup Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version is too old (need 18+)${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Setup .env.local
if [ ! -f .env.local ]; then
    echo "🔐 Setting up environment variables..."
    echo ""
    echo "You need an OpenAI API key to use this application."
    echo "Get one at: https://platform.openai.com/api-keys"
    echo ""
    read -p "Enter your OpenAI API key (or press Enter to skip): " api_key
    
    if [ -n "$api_key" ]; then
        echo "OPENAI_API_KEY=$api_key" > .env.local
        echo -e "${GREEN}✓ .env.local created${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped. You'll need to create .env.local manually${NC}"
        echo "Create .env.local with: OPENAI_API_KEY=your-key-here"
    fi
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi
echo ""

# Verify installation
echo "🔍 Verifying installation..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules directory exists${NC}"
fi

if [ -f "src/app/page.tsx" ]; then
    echo -e "${GREEN}✓ Source files found${NC}"
fi

if [ -f ".env.local" ]; then
    if grep -q "OPENAI_API_KEY" .env.local; then
        echo -e "${GREEN}✓ Environment variables configured${NC}"
    else
        echo -e "${YELLOW}⚠ .env.local exists but no OPENAI_API_KEY found${NC}"
    fi
fi
echo ""

# Success message
echo "=============================================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your OpenAI API key is set in .env.local"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Overview"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - EXAMPLES.md - Usage examples"
echo ""
echo "Need help? Check INSTALL.md for troubleshooting"
echo "=============================================="

