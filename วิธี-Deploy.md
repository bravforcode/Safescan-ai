# 🚀 วิธี Deploy SafeScan AI ขึ้น Vercel

## 🎯 วิธีที่ง่ายที่สุด (แนะนำ)

### 1. เตรียมโปรเจค
```bash
cd safescan-app
npm install
npm run build
```

### 2. ไปที่ Vercel
1. เปิด https://vercel.com
2. สมัครสมาชิก (ฟรี)
3. คลิก "Add New..." → "Project"

### 3. Upload โปรเจค
- ลาก folder `safescan-app` ลงไป
- หรือเชื่อมต่อ GitHub

### 4. ตั้งค่า
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Root Directory: safescan-app (ถ้า upload ทั้ง repo)
```

### 5. เพิ่ม Environment Variables
ไปที่ Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://rukyitpjfmzhqjlfmbie.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a3lpdHBqZm16aHFqbGZtYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDUwNzIsImV4cCI6MjA4NjgyMTA3Mn0.yjA0_Glq7zCnYtjh929y672Z8uUlX6pEo3CnNZtEE-I
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
```

### 6. Deploy
คลิก "Deploy" แล้วรอ 2-3 นาที

---

## 🎯 วิธีใช้ Script (สำหรับ Windows)

### 1. เปิด PowerShell
```powershell
cd safescan-app
```

### 2. รัน Script
```powershell
.\deploy.ps1
```

### 3. ทำตามคำแนะนำ
- เลือก Preview หรือ Production
- รอจนเสร็จ

---

## 🎯 วิธีใช้ Vercel CLI

### 1. ติดตั้ง Vercel CLI
```bash
npm install -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy
```bash
cd safescan-app
vercel
```

### 4. Deploy Production
```bash
vercel --prod
```

---

## ✅ ตรวจสอบหลัง Deploy

### 1. เปิด URL ที่ได้
```
https://safescan-ai.vercel.app
```

### 2. ทดสอบ Features
- [ ] หน้าแรกโหลดได้
- [ ] สแกนบาร์โค้ดได้
- [ ] ดูรายละเอียดสินค้าได้
- [ ] Login/Logout ได้
- [ ] Animation ลื่นไหล

### 3. ตรวจสอบ Console
- เปิด DevTools (F12)
- ดูว่ามี error หรือไม่

---

## 🔧 แก้ปัญหา

### ปัญหา: Build Failed
```bash
# ลบ node_modules แล้วติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ปัญหา: 404 Not Found
- ตรวจสอบว่ามีไฟล์ `vercel.json` ✅
- ตรวจสอบ Output Directory = `dist` ✅

### ปัญหา: Environment Variables ไม่ทำงาน
1. ไปที่ Vercel Dashboard
2. Settings → Environment Variables
3. เพิ่มตัวแปรใหม่
4. Redeploy

---

## 📱 URL ที่จะได้

### Production
```
https://safescan-ai.vercel.app
```

### Preview (ถ้า deploy แบบ preview)
```
https://safescan-ai-git-main-username.vercel.app
```

---

## 🎉 เสร็จแล้ว!

หลัง deploy สำเร็จ คุณจะได้:
- ✅ URL สำหรับแชร์
- ✅ HTTPS ฟรี
- ✅ CDN เร็ว
- ✅ Auto-scaling
- ✅ Analytics

---

## 📚 เอกสารเพิ่มเติม

- คู่มือละเอียด: `DEPLOY-VERCEL.md`
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev

---

**หมายเหตุ:** ถ้ามีปัญหา ดูได้ที่ `DEPLOY-VERCEL.md` หรือถาม Vercel Support
