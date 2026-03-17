# SafeScan AI - Vercel Deploy Script (PowerShell)
# ใช้สำหรับ deploy ขึ้น Vercel อัตโนมัติบน Windows

Write-Host "🚀 SafeScan AI - Vercel Deploy Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่าอยู่ใน safescan-app directory หรือไม่
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: ไม่พบ package.json" -ForegroundColor Red
    Write-Host "กรุณารันคำสั่งนี้ใน safescan-app directory" -ForegroundColor Yellow
    exit 1
}

# ตรวจสอบว่าติดตั้ง Node.js แล้วหรือไม่
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error: ไม่พบ Node.js" -ForegroundColor Red
    Write-Host "กรุณาติดตั้ง Node.js ก่อน: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# ตรวจสอบว่าติดตั้ง dependencies แล้วหรือไม่
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: ติดตั้ง dependencies ไม่สำเร็จ" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Build project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Build ไม่สำเร็จ" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# ตรวจสอบว่าติดตั้ง Vercel CLI แล้วหรือไม่
try {
    vercel --version | Out-Null
} catch {
    Write-Host "⚠️  ไม่พบ Vercel CLI" -ForegroundColor Yellow
    $response = Read-Host "ต้องการติดตั้งหรือไม่? (y/n)"
    if ($response -match "^[Yy]") {
        Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
        npm install -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error: ติดตั้ง Vercel CLI ไม่สำเร็จ" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
    } else {
        Write-Host "❌ ยกเลิกการ deploy" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# ถามว่าต้องการ deploy แบบไหน
Write-Host "เลือกประเภทการ deploy:" -ForegroundColor Cyan
Write-Host "1) Preview (development)" -ForegroundColor White
Write-Host "2) Production" -ForegroundColor White
$deployType = Read-Host "เลือก (1 หรือ 2)"

if ($deployType -eq "2") {
    Write-Host ""
    Write-Host "🚀 Deploying to Production..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host ""
    Write-Host "🚀 Deploying to Preview..." -ForegroundColor Cyan
    vercel
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy สำเร็จ!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 แอปพลิเคชันของคุณพร้อมใช้งานแล้ว!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deploy ไม่สำเร็จ" -ForegroundColor Red
    Write-Host "กรุณาตรวจสอบ error messages ด้านบน" -ForegroundColor Yellow
    exit 1
}
