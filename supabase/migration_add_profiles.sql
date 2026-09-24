-- ==============================================================================
-- FIX MIGRATION: สร้างตาราง profiles และรีโหลด Schema Cache ใน Supabase
-- วิธีใช้: คัดลอกโค้ดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด RUN
-- ==============================================================================

-- 1. สร้างตาราง profiles (หากยังไม่มี)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    promptpay_no VARCHAR(30),
    bank_info TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. เปิดใช้งาน Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. สร้างนโยบายความปลอดภัย RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are isolated per user'
    ) THEN
        CREATE POLICY "Profiles are isolated per user"
            ON public.profiles FOR ALL TO authenticated
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. ตรวจสอบคอลัมน์ใบเสร็จในตาราง payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS slip_url TEXT;

-- 5. บังคับให้ PostgREST รีเฟรช Schema Cache ทันที (แก้ปัญหา Could not find the table in schema cache)
NOTIFY pgrst, 'reload schema';
