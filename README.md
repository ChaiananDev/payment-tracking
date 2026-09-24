# 💳 Party Payment Tracker - ระบบติดตามการจ่ายค่าสมาชิกรายเดือน

ระบบเว็บแอปพลิเคชันส่วนตัวสำหรับ **"หัว Party"** หรือผู้เป็นคนชำระค่าบริการหลัก (เช่น Netflix, YouTube Family, Spotify, iCloud ฯลฯ)
- 🌓 **รองรับ Dark Mode & Light Mode**: ค่าเริ่มต้นจะตั้งตามระบบของผู้ใช้งาน (System Default) และสามารถกดสลับได้ทันที
- 🔐 **หน้าแรกเข้าสู่ระบบทันที (Landing as Login)**: หน้าแรกของเว็บจะทำหน้าที่เป็นหน้า Login/Sign Up ทันที และเมื่อเข้าสู่ระบบจะเปิดหน้า Dashboard จัดการตี้
- 🏷️ **Display Name**: แสดงชื่อที่ต้องการแทน Email เช่น "ชัยอนันต์" พร้อมระบบแก้ไขข้อมูลส่วนบุคคล (Profile)
- ✏️ **แก้ไขข้อมูลสมาชิก (Edit Member)**: สามารถแก้ไขชื่อเล่น, ชื่อจริง, ค่าตี้ต่อเดือน, วันตัดรอบ และสถานะ (Active/Inactive) ของสมาชิกเดิมได้ตลอดเวลา
- 🧾 **จัดเก็บข้อมูลใบเสร็จ & รูปสลิป (Receipts & Slips Storage)**: บันทึกเลขที่ใบเสร็จ, รหัสอ้างอิง และอัปโหลดรูปภาพสลิปโอนเงินเก็บลงฐานข้อมูล พร้อมปุ่มเปิดดูรูปสลิปย้อนหลังได้ทุกเมื่อ
- 🧪 **ระบบทดสอบทุกเคสอัตโนมัติ (Automated Test Suite)**: กดปุ่มเดียวเพื่อทดสอบทั้ง 7 กรณีศึกษาด้วยบัญชี `chaianan-2001@hotmail.co.th`

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend & Backend**: [Next.js 14](https://nextjs.org/) (App Router, React, TypeScript)
- **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL + Supabase Auth + Row Level Security)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (รองรับ Dark / Light Mode)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment Ready**: ออกแบบพร้อม Deploy สู่ [Vercel](https://vercel.com/)

---

## 🚀 ขั้นตอนการตั้งค่า Supabase (SQL Migration)

1. เข้าไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. ไปที่เมนู **"SQL Editor"** (ไอคอน `>_` ด้านซ้าย) -> กด **"New query"**
3. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์นี้ แล้วคัดลอก (Copy) โค้ดทั้งหมด
4. นำโค้ดไปวางใน SQL Editor แล้วกดปุ่ม **"Run"**
   - สคริปต์จะสร้างตาราง `profiles`, `members`, `subscriptions`, `subscription_members`, `payments`
   - ตั้งค่า **Row Level Security (RLS)** แยกข้อมูลของแต่ละ User 100%
   - ตั้งค่า Trigger ดึง Display Name อัตโนมัติเมื่อสมัครสมาชิกใหม่

---

## 💻 วิธีการรันโปรเจกต์บนเครื่องของคุณ (Localhost)

1. เปิด Terminal ในโฟลเดอร์โปรเจกต์นี้:
   ```bash
   cd "C:\GITHUB REPOSITORY\payment-tracking"
   ```

2. รันโปรเจกต์:
   ```bash
   npm run dev
   ```

3. เปิดเว็บบราวเซอร์ไปที่:
   ```text
   http://localhost:3000
   ```

---

## 🧪 การทดสอบทุกเคสด้วยบัญชีที่ระบุ
### วิธีทดสอบ:
1. หากยังไม่เคยสมัคร ให้กดเลือกแท็บ **"สมัครสมาชิก (Sign Up)"** แล้วกดปุ่ม **"สร้างบัญชีและเริ่มต้นใช้งาน"** (หรือกด Sign In หากสร้างไว้แล้ว)
2. เมื่อเข้าสู่หน้า Dashboard สังเกตที่มุมขวาบน จะมีปุ่ม **"🧪 ทดสอบทุกเคส"**
3. กดปุ่ม **"ทดสอบทุกเคส"** ระบบจะรันเทสทั้ง 7 เคสให้อัตโนมัติ:
   - **Case 1**: การยืนยันตัวตน (Authentication)
   - **Case 2**: การบันทึกและแสดงผล Display Name แทน Email
   - **Case 3**: การสร้างบริการและสมาชิกใหม่
   - **Case 4**: การแก้ไขข้อมูลสมาชิก
   - **Case 5**: การคำนวณตัดยอด Package, เงินทบเข้าเครดิต และการจ่ายล่วงหน้า
   - **Case 6**: การบันทึกข้อมูลใบเสร็จและรูปสลิปลงฐานข้อมูล
   - **Case 7**: การจำแนกสถานะทั้ง 5 รูปแบบ (Paid, Due Soon, Overdue, Prepaid, Inactive)
4. หรือสามารถทดสอบผ่าน API Route ได้ที่: `http://localhost:3000/api/test-runner`
