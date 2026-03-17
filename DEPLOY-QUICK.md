# ⚡ Quick Deploy Guide

## 🚀 Deploy ใน 5 นาที

### Step 1: Build
```bash
npm install
npm run build
```

### Step 2: Vercel
1. ไป https://vercel.com
2. คลิก "Add New" → "Project"
3. Upload folder `safescan-app`

### Step 3: Settings
```
Framework: Vite
Build: npm run build
Output: dist
```

### Step 4: Environment Variables
```
VITE_SUPABASE_URL=https://rukyitpjfmzhqjlfmbie.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a3lpdHBqZm16aHFqbGZtYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDUwNzIsImV4cCI6MjA4NjgyMTA3Mn0.yjA0_Glq7zCnYtjh929y672Z8uUlX6pEo3CnNZtEE-I
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
```

### Step 5: Deploy
คลิก "Deploy" ✅

---

## 🎯 หรือใช้ CLI

```bash
npm install -g vercel
vercel login
cd safescan-app
vercel --prod
```

---

## ✅ Done!

URL: `https://safescan-ai.vercel.app`

---

**ดูรายละเอียดเพิ่มเติม:**
- `วิธี-Deploy.md` (ภาษาไทย)
- `DEPLOY-VERCEL.md` (ละเอียด)
