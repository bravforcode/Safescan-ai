#!/bin/bash

# SafeScan AI - Vercel Deploy Script
# ใช้สำหรับ deploy ขึ้น Vercel อัตโนมัติ

echo "🚀 SafeScan AI - Vercel Deploy Script"
echo "======================================"
echo ""

# ตรวจสอบว่าอยู่ใน safescan-app directory หรือไม่
if [ ! -f "package.json" ]; then
    echo "❌ Error: ไม่พบ package.json"
    echo "กรุณารันคำสั่งนี้ใน safescan-app directory"
    exit 1
fi

# ตรวจสอบว่าติดตั้ง Node.js แล้วหรือไม่
if ! command -v node &> /dev/null; then
    echo "❌ Error: ไม่พบ Node.js"
    echo "กรุณาติดตั้ง Node.js ก่อน: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# ตรวจสอบว่าติดตั้ง dependencies แล้วหรือไม่
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: ติดตั้ง dependencies ไม่สำเร็จ"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Build project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Build ไม่สำเร็จ"
    exit 1
fi
echo "✅ Build successful"
echo ""

# ตรวจสอบว่าติดตั้ง Vercel CLI แล้วหรือไม่
if ! command -v vercel &> /dev/null; then
    echo "⚠️  ไม่พบ Vercel CLI"
    echo "ต้องการติดตั้งหรือไม่? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
        if [ $? -ne 0 ]; then
            echo "❌ Error: ติดตั้ง Vercel CLI ไม่สำเร็จ"
            exit 1
        fi
        echo "✅ Vercel CLI installed"
    else
        echo "❌ ยกเลิกการ deploy"
        exit 1
    fi
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# ถามว่าต้องการ deploy แบบไหน
echo "เลือกประเภทการ deploy:"
echo "1) Preview (development)"
echo "2) Production"
read -p "เลือก (1 หรือ 2): " deploy_type

if [ "$deploy_type" = "2" ]; then
    echo ""
    echo "🚀 Deploying to Production..."
    vercel --prod
else
    echo ""
    echo "🚀 Deploying to Preview..."
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy สำเร็จ!"
    echo ""
    echo "🎉 แอปพลิเคชันของคุณพร้อมใช้งานแล้ว!"
    echo ""
else
    echo ""
    echo "❌ Deploy ไม่สำเร็จ"
    echo "กรุณาตรวจสอบ error messages ด้านบน"
    exit 1
fi
