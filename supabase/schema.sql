-- ==============================================================================
-- PROJECT: Party Payment Tracker (Multi-User, Profiles, Receipts & RLS)
-- DATABASE: Supabase (PostgreSQL)
-- INSTRUCTIONS: คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด RUN
-- ==============================================================================

-- 1. ลบตารางเดิมหากเคยสร้างไว้ (Safe reset)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_setup CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscription_members CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ตารางโปรไฟล์ผู้ใช้งาน (profiles) - เก็บ Display Name, PromptPay, ข้อมูลส่วนตัว
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,            -- ชื่อที่ต้องการให้แสดงแทน Email
    promptpay_no VARCHAR(30),                     -- เลขพร้อมเพย์เริ่มต้นสำหรับทวงเงิน
    bank_info TEXT,                               -- บัญชีธนาคารสำหรับทวงเงิน
    phone VARCHAR(20),                            -- เบอร์โทรศัพท์
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางสมาชิกในตี้ (members)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    member_code VARCHAR(20) NOT NULL,              -- เช่น MEM-001
    full_name VARCHAR(100) NOT NULL,               -- ชื่อ-นามสกุล
    nickname VARCHAR(50) NOT NULL,                -- ชื่อเล่น
    phone VARCHAR(20),                            -- เบอร์โทรศัพท์
    email VARCHAR(100),                           -- Email
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE, -- วันที่เริ่มเป็นสมาชิก
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / INACTIVE
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_member_code UNIQUE (user_id, member_code)
);

-- 4. ตารางบริการ/Package หลักที่เราจ่าย (subscriptions)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name VARCHAR(100) NOT NULL,                    -- เช่น Netflix 4K, YouTube Family, Spotify
    category VARCHAR(50) DEFAULT 'Streaming',      -- หมวดหมู่บริการ
    master_cost DECIMAL(10,2) NOT NULL,            -- ยอดบิลรวมที่หัวตี้จ่าย เช่น 419.00
    master_billing_day INT NOT NULL CHECK (master_billing_day BETWEEN 1 AND 31),
    default_price DECIMAL(10,2) NOT NULL,          -- ราคา Package มาตรฐานต่อคน เช่น 105.00
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    icon_color VARCHAR(30) DEFAULT '#E50914',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางสมาชิกในแต่ละ Package (subscription_members)
CREATE TABLE subscription_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    package_price DECIMAL(10,2) NOT NULL,          -- ยอด package ต่อเดือนของคนนี้
    billing_day INT NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
    paid_until DATE NOT NULL,                      -- วันที่ได้รับชำระครอบคลุมถึง (Next Due Date)
    credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- ยอดเงินคงเหลือสะสมรอตัดรอบถัดไป
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางประวัติการโอนเงินและใบเสร็จ (payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    subscription_member_id UUID NOT NULL REFERENCES subscription_members(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2) NOT NULL,            -- ยอดที่สมาชิกโอนมา (เช่น 350.00)
    deducted_to_package DECIMAL(10,2) NOT NULL,    -- ยอดที่นำไปตัด package
    added_to_credit DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- ยอดเศษที่นำเข้ากระเป๋าเครดิต
    months_advanced INT NOT NULL DEFAULT 0,        -- จำนวนเดือนที่ขยับไปข้างหน้า
    receipt_no VARCHAR(100),                       -- เลขที่ใบเสร็จ หรือ รหัสอ้างอิงการโอน
    slip_url TEXT,                                 -- รูปภาพสลิป/ใบเสร็จ (Data URL หรือ Storage URL)
    payment_method VARCHAR(30) DEFAULT 'PROMPTPAY',
    note TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS: แต่ละ User เข้าถึงได้เฉพาะข้อมูลของตัวเอง
CREATE POLICY "Profiles are isolated per user"
    ON profiles FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Members are isolated per user"
    ON members FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscriptions are isolated per user"
    ON subscriptions FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscription members are isolated per user"
    ON subscription_members FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Payments are isolated per user"
    ON payments FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Trigger อัตโนมัติเมื่อ User สมัครสมาชิกใหม่:
-- - สร้างโปรไฟล์พร้อม Display Name
-- - สร้าง Subscription Netflix ตัวอย่าง
-- - สร้าง Member ตัวอย่าง 1 คนให้พร้อมใช้งานทันที
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    new_sub_id UUID;
    new_mem_id UUID;
    init_display_name TEXT;
BEGIN
    -- กำหนด Display Name จาก metadata หรือตัดเอาจากชื่อหน้า email
    init_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );

    -- 1. สร้าง Profile
    INSERT INTO public.profiles (id, display_name, promptpay_no, bank_info)
    VALUES (NEW.id, init_display_name, '08X-XXX-XXXX', 'กสิกรไทย 123-X-XXXXX-X')
    ON CONFLICT (id) DO NOTHING;

    -- 2. สร้าง Subscription Netflix เริ่มต้น
    INSERT INTO public.subscriptions (user_id, name, category, master_cost, master_billing_day, default_price, icon_color)
    VALUES (NEW.id, 'Netflix 4K Premium', 'Streaming', 419.00, 15, 105.00, '#E50914')
    RETURNING id INTO new_sub_id;

    -- 3. สร้างสมาชิกตัวอย่าง 1 คนให้เห็นภาพ
    INSERT INTO public.members (user_id, member_code, full_name, nickname, phone, status)
    VALUES (NEW.id, 'MEM-001', 'ตัวอย่าง สมาชิกใจดี', 'ต้อม', '081-234-5678', 'ACTIVE')
    RETURNING id INTO new_mem_id;

    -- 4. ผูกเข้าตี้
    INSERT INTO public.subscription_members (user_id, member_id, subscription_id, package_price, billing_day, paid_until, credit_balance, is_active)
    VALUES (NEW.id, new_mem_id, new_sub_id, 105.00, 15, CURRENT_DATE + INTERVAL '14 days', 0.00, true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- 9. แจ้งเตือนให้ Supabase PostgREST รีโหลด Schema Cache ทันที
NOTIFY pgrst, 'reload schema';
