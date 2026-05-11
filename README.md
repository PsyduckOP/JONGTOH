# JONGTOH - ระบบจองโต๊ะร้านอาหารอัจฉริยะ (Real-time Table Reservation)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/backend-NestJS-red.svg)
![React](https://img.shields.io/badge/frontend-React-blue.svg)
![Docker](https://img.shields.io/badge/infra-Docker-blue.svg)

**JONGTOH** คือระบบจองโต๊ะที่ออกแบบมาเพื่อรองรับการใช้งานพร้อมกันจำนวนมาก (High Concurrency) โดยใช้สถาปัตยกรรมที่ทันสมัย รับประกันความถูกต้องของข้อมูล และมีหน้าตาสวยงามระดับ Premium

---

## ✨ ฟีเจอร์หลัก (Key Features)

- 🚀 **Real-time Synchronization**: อัปเดตสถานะโต๊ะแบบวินาทีต่อวินาทีผ่าน WebSockets (Socket.io)
- 🔒 **Distributed Locking**: ป้องกันการจองซ้ำซ้อน (Double Booking) ด้วย Redis Lock และ Database Pessimistic Locking
- 🏗️ **Queue Processing**: ประมวลผลการจองผ่าน RabbitMQ เพื่อความเสถียรของระบบในช่วงที่มีทราฟฟิกสูง
- 📱 **Optimistic UI**: มอบประสบการณ์ที่ลื่นไหลให้ลูกค้าด้วยการตอบสนองทันทีที่กดจอง
- 🛡️ **Admin Dashboard**: หน้าจอจัดการสำหรับร้านค้า (เคลียร์โต๊ะ, ดูสถิติ) ที่ใช้งานง่ายและทันสมัย
- 📖 **API Documentation**: เอกสารประกอบ API แบบครบถ้วนด้วย Swagger UI

---

## 🛠 สถาปัตยกรรมทางเทคนิค (Tech Stack)

### **Frontend**
- **Framework**: React.js + Vite
- **Styling**: Tailwind CSS v4 (Premium Dark Mode)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Real-time**: Socket.io Client

### **Backend**
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Caching & Lock**: Redis
- **Message Broker**: RabbitMQ
- **Documentation**: Swagger/OpenAPI

---

## 🚀 วิธีการติดตั้งและรันระบบ (Getting Started)

### 1. ความต้องการเบื้องต้น
- [Node.js](https://nodejs.org/) (v18 หรือสูงกว่า)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (สำหรับรันฐานข้อมูลและคิว)

### 2. ติดตั้ง Dependencies
```bash
# ติดตั้งที่โฟลเดอร์หลัก
npm install

# ติดตั้งที่โฟลเดอร์ apps
cd apps/backend && npm install
cd ../frontend && npm install
cd ../..
```

### 3. รันโครงสร้างพื้นฐาน (Infrastructure)
เปิดโปรแกรม Docker Desktop แล้วรันคำสั่ง:
```bash
docker-compose up -d
```

### 4. รันระบบ (Development Mode)
คุณสามารถรันทุกอย่างพร้อมกันด้วยคำสั่งเดียวจากโฟลเดอร์หลัก:
```bash
npm run dev
```

---

## 🔗 ช่องทางการเข้าใช้งาน

- 🏠 **หน้าสำหรับลูกค้า**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **หน้าสำหรับแอดมิน**: [http://localhost:5173/admin](http://localhost:5173/admin)
- 📄 **API Documentation (Swagger)**: [http://localhost:3000/api](http://localhost:3000/api)
- 🐰 **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (user: `user`, pass: `password`)

---

## 🏗 โครงสร้างโฟลเดอร์ (Project Structure)
```text
JONGTOH/
├── apps/
│   ├── backend/      # ระบบหลังบ้าน (NestJS)
│   └── frontend/     # ระบบหน้าบ้าน (React + Vite)
├── docker-compose.yml # การตั้งค่า PostgreSQL, Redis, RabbitMQ
├── package.json       # Root scripts สำหรับจัดการ Monorepo
└── README.md          # เอกสารชุดนี้
```

---

## 🤝 ทีมพัฒนา
- **Developer**: PsyduckOP
- **AI Assistant**: Antigravity by Google Deepmind

© 2026 JONGTOH Table Reservation System. All rights reserved.
