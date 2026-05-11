# ระบบจองโต๊ะ (JONGTOH)

## ภาพรวม (Overview)
ระบบจองโต๊ะแบบเรียลไทม์ที่มีความทนทาน ออกแบบมาเพื่อรองรับการใช้งานพร้อมกันจำนวนมาก (High Concurrency) ในช่วงเวลาเร่งด่วน โดยรับประกันความถูกต้องของข้อมูล (Data Integrity) และมอบประสบการณ์การใช้งานที่ลื่นไหล

## สถาปัตยกรรม (Architecture)

### 1. Client Layer (ส่วนติดต่อผู้ใช้งาน)
- **Tech Stack**: React.js (Web) / Flutter (Mobile)
- **ฟีเจอร์หลัก**:
  - แผนผังโต๊ะแบบตอบโต้ได้เรียลไทม์
  - **Optimistic UI**: แสดงผลการตอบสนองทันทีเมื่อผู้ใช้กดเลือก เพื่อให้รู้สึกว่าระบบทำงานรวดเร็ว
  - การจัดการสถานะ (State management) สำหรับการอัปเดตแบบเรียลไทม์

### 2. Edge & Routing Layer (ส่วนการจัดการทราฟฟิก)
- **CDN & WAF**: ใช้ Cloudflare เพื่อแคชข้อมูล Static และป้องกันการโจมตี DDoS
- **Load Balancer**: กระจายทราฟฟิกไปยัง Backend หลายชุด

### 3. Real-Time Communication Layer (ส่วนการสื่อสารเรียลไทม์)
- **Managed Service**: Pusher หรือ AWS API Gateway (WebSocket)
- **หน้าที่**: กระจายข่าวสารสถานะโต๊ะ (เช่น "โต๊ะ A ถูกจองแล้ว") ไปยังผู้ใช้ทุกคนที่เชื่อมต่ออยู่ทันที

### 4. Application Layer (Backend)
- **Tech Stack**: NestJS (Modular Monolithic)
- **Containerization**: Docker
- **โมดูล (Modules)**:
  - **Auth Module**: การจัดการตัวตนและสิทธิ์เข้าถึง
  - **Booking Module**: ลอจิกการจองและการออกรหัสการจอง
  - **Table Availability Module**: การคำนวณสถานะโต๊ะแบบเรียลไทม์

### 5. Caching & Queue Layer (ส่วนกันชนและคิว)
- **Distributed Cache (Redis)**: 
  - เก็บข้อมูล Session
  - **Redis Lock**: ป้องกันการเกิด Race Condition ในระดับแอปพลิเคชัน (เช่น ล็อกโต๊ะไว้ 3 นาทีระหว่างทำรายการ)
- **Message Queue (RabbitMQ)**: 
  - รองรับคำขอจองในช่วงที่มีทราฟฟิกสูง
  - รับประกันการประมวลผลแบบ FIFO (First-In-First-Out) เพื่อป้องกันฐานข้อมูลทำงานหนักเกินไป

### 6. Data Layer (ส่วนข้อมูล)
- **Database**: PostgreSQL
- **การควบคุม Concurrency**: 
  - **Pessimistic Locking**: ใช้ `SELECT ... FOR UPDATE` ระหว่างประมวลผลคิวเพื่อยืนยันว่าไม่มีการจองซ้ำซ้อนแน่นอน
  - **Read/Write Splitting**: (แผนในอนาคต) แยก Master สำหรับเขียน และ Slaves สำหรับอ่าน

### 7. Infrastructure & DevOps
- **Cloud Provider**: AWS
- **Orchestration**: AWS ECS หรือ Kubernetes
- **CI/CD**: GitHub Actions สำหรับการทดสอบอัตโนมัติและการ Deploy แบบ Zero Downtime

## ขั้นตอนการทำงานหลัก (Key Workflows)

### ขั้นตอนการจอง (Reservation Flow)
1. ผู้ใช้เลือกโต๊ะ
2. Frontend แสดงผลทันทีด้วย Optimistic UI
3. ระบบทำการจองด้วย **Redis Lock** (เป็นเวลา 3 นาที)
4. คำขอการจองถูกส่งเข้า **RabbitMQ**
5. Backend Worker ดึงข้อมูลจากคิวไปประมวลผล
6. Worker ใช้ **Pessimistic Locking** ใน PostgreSQL เพื่อบันทึกข้อมูลขั้นสุดท้าย
7. กระจายข่าวสารความสำเร็จผ่าน **WebSockets**
