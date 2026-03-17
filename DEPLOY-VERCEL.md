# 🚀 คู่มือ Deploy SafeScan AI ขึ้น Vercel

## 📋 ขั้นตอนการ Deploy

### วิธีที่ 1: Deploy ผ่าน Vercel Dashboard (แนะนำ)

#### 1. เตรียม Project
```bash
cd safescan-app
npm install
npm run build
```

#### 2. ไปที่ Vercel Dashboard
1. เข้า https://vercel.com
2. คลิก "Add New..." → "Project"
3. Import Git Repository หรือ Upload โฟลเดอร์

#### 3. ตั้งค่า Project
```
Framework Preset: Vite
Root Directory: safescan-app
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4. ตั้งค่า Environment Variables
ไปที่ Settings → Environment Variables แล้วเพิ่ม:

```
VITE_SUPABASE_URL=https://rukyitpjfmzhqjlfmbie.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a3lpdHBqZm16aHFqbGZtYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDUwNzIsImV4cCI6MjA4NjgyMTA3Mn0.yjA0_Glq7zCnYtjh929y672Z8uUlX6pEo3CnNZtEE-I
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
```

#### 5. Deploy
คลิก "Deploy" และรอสักครู่

---

### วิธีที่ 2: Deploy ผ่าน Vercel CLI

#### 1. ติดตั้ง Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login
```bash
vercel login
```

#### 3. Deploy
```bash
cd safescan-app
vercel
```

#### 4. ตอบคำถาม
```
? Set up and deploy "safescan-app"? [Y/n] y
? Which scope do you want to deploy to? [เลือก account ของคุณ]
? Link to existing project? [N/y] n
? What's your project's name? safescan-ai
? In which directory is your code located? ./
? Want to override the settings? [y/N] y
? Build Command: npm run build
? Output Directory: dist
? Development Command: npm run dev
```

#### 5. Deploy Production
```bash
vercel --prod
```

---

### วิธีที่ 3: Deploy ผ่าน GitHub (CI/CD)

#### 1. Push โค้ดขึ้น GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/safescan-ai.git
git push -u origin main
```

#### 2. เชื่อม Vercel กับ GitHub
1. ไปที่ https://vercel.com/new
2. เลือก "Import Git Repository"
3. เลือก repository ของคุณ
4. ตั้งค่าตามวิธีที่ 1

#### 3. Auto Deploy
ทุกครั้งที่ push โค้ดขึ้น GitHub จะ deploy อัตโนมัติ

---

## ⚙️ การตั้งค่าที่สำคัญ

### 1. vercel.json (มีอยู่แล้ว ✅)
```json
{
  "rewrites": [
    { "source": "/((?!api|_next|.*\\..*).*)", "destination": "/index.html" }
  ],
  "headers": [...]
}
```

### 2. Environment Variables
ต้องตั้งค่าใน Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`

### 3. Build Settings
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

---

## 🔧 Troubleshooting

### ปัญหา: Build Failed

#### 1. ตรวจสอบ Node Version
```bash
# ใน Vercel Dashboard → Settings → General
# ตั้ง Node.js Version เป็น 18.x
```

#### 2. ตรวจสอบ Dependencies
```bash
cd safescan-app
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. ตรวจสอบ Environment Variables
- ต้องมี `VITE_` prefix
- ต้องตั้งค่าใน Vercel Dashboard
- ไม่ใช่ในไฟล์ `.env.local`

### ปัญหา: 404 Not Found

#### แก้ไข: ตรวจสอบ vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### ปัญหา: Environment Variables ไม่ทำงาน

#### แก้ไข: Redeploy
```bash
vercel --prod --force
```

หรือใน Dashboard:
1. ไปที่ Deployments
2. คลิก "..." → "Redeploy"
3. เลือก "Use existing Build Cache" = OFF

---

## 📊 หลัง Deploy แล้ว

### 1. ตรวจสอบ URL
```
https://safescan-ai.vercel.app
หรือ
https://safescan-ai-[your-username].vercel.app
```

### 2. ตั้งค่า Custom Domain (ถ้าต้องการ)
1. ไปที่ Settings → Domains
2. เพิ่ม domain ของคุณ
3. ตั้งค่า DNS ตามคำแนะนำ

### 3. ตรวจสอบ Performance
1. ไปที่ Analytics
2. ดู Speed Insights
3. ดู Web Vitals

### 4. ตั้งค่า Supabase
อัพเดท Supabase URL Whitelist:
1. ไปที่ Supabase Dashboard
2. Settings → API
3. เพิ่ม Vercel URL ใน "Site URL"

---

## 🎯 Checklist ก่อน Deploy

- [ ] Build สำเร็จใน local (`npm run build`)
- [ ] ไม่มี TypeScript errors
- [ ] ไม่มี console errors
- [ ] Environment variables ครบ
- [ ] vercel.json ถูกต้อง
- [ ] package.json มี build script
- [ ] .gitignore มี node_modules, dist, .env

---

## 🚀 คำสั่งที่ใช้บ่อย

### Build Local
```bash
npm run build
npm run preview
```

### Deploy
```bash
vercel                    # Deploy preview
vercel --prod            # Deploy production
vercel --force           # Force rebuild
```

### Logs
```bash
vercel logs              # ดู logs
vercel logs --follow     # ดู logs แบบ real-time
```

### Domains
```bash
vercel domains ls        # ดู domains
vercel domains add       # เพิ่ม domain
```

---

## 📱 ตัวอย่าง URL หลัง Deploy

```
Production: https://safescan-ai.vercel.app
Preview: https://safescan-ai-git-main-username.vercel.app
Branch: https://safescan-ai-git-feature-username.vercel.app
```

---

## 🎉 เสร็จแล้ว!

หลัง deploy สำเร็จ คุณจะได้:
- ✅ URL สำหรับเข้าถึงแอป
- ✅ HTTPS อัตโนมัติ
- ✅ CDN ทั่วโลก
- ✅ Auto-scaling
- ✅ Analytics
- ✅ CI/CD (ถ้าใช้ GitHub)

---

**หมายเหตุ:** ถ้ามีปัญหาหรือข้อสงสัย สามารถดู Vercel Docs ได้ที่:
https://vercel.com/docs
