# Safescan AI — Product Safety Scanner

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![HealthTech](https://img.shields.io/badge/Domain-HealthTech-10b981?style=for-the-badge)

> **Scan a barcode → know if it's safe for you.** Real-time allergen and product safety alerts for consumers.

### Demo

> 🎬 **Demo coming soon** — screen capture will be added at `docs/demo.gif`

### Architecture

```mermaid
graph LR
  A[QR/Barcode Scan] --> B[React App]
  B --> C[Supabase Edge Functions]
  C --> D[(Product Safety DB)]
  C --> E[Allergen Match Engine]
  E --> F[Real-time Alerts]
```

### Results

| Metric | Value |
|---|---|
| **Scan → Alert** | Real-time |
| **Domain** | Consumer health safety |
| **Stack** | React + Supabase |


---

**Phirawit Jitnarong — Strategic Full-Stack & AI Engineer**

xme176@gmail.com · 092-551-0427 · [LinkedIn](https://www.linkedin.com/in/%E0%B8%9E%E0%B8%B5%E0%B8%A3%E0%B8%A7%E0%B8%B4%E0%B8%8A%E0%B8%8D%E0%B9%8C-%E0%B8%88%E0%B8%B4%E0%B8%95%E0%B8%93%E0%B8%A3%E0%B8%87%E0%B8%84%E0%B9%8C-0000393a4) · [Fastwork](https://fastwork.co/user/bravforcode?source=search)

> Hiring for this stack? Let's talk — production hardened, 300k+ users shipped.