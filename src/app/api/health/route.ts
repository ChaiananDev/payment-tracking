import { NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  if (!isServerSupabaseConfigured) {
    return NextResponse.json({
      status: 'unconfigured',
      connected: false,
      message: 'ยังไม่ได้ตั้งค่า Supabase URL หรือ Anon Key ในไฟล์ .env.local',
      help: 'โปรดไปที่ Supabase Dashboard -> Project Settings -> API แล้วนำ URL กับ anon key มาใส่ใน .env.local',
    });
  }

  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // อาจเกิดจากยังไม่ได้รัน SQL Schema
      if (error.code === '42P01') {
        return NextResponse.json({
          status: 'schema_missing',
          connected: true,
          message: 'เชื่อมต่อ Supabase ได้แล้ว แต่ยังไม่ได้รัน SQL Script เพื่อสร้างตาราง',
          help: 'โปรดเปิดไฟล์ supabase/schema.sql แล้วนำโค้ดไปวางใน Supabase SQL Editor แล้วกด Run',
          error: error.message,
        });
      }

      return NextResponse.json({
        status: 'error',
        connected: false,
        message: 'เชื่อมต่อ Supabase ล้มเหลว: ' + error.message,
        hint: error.hint || error.details || 'โปรดตรวจสอบความถูกต้องของ Key หรือรัน SQL Schema',
        error: error.message,
      });
    }

    return NextResponse.json({
      status: 'connected',
      connected: true,
      message: 'เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จเรียบร้อย!',
      subscriptionsCount: count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'exception',
      connected: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบการเชื่อมต่อ: ' + (err?.message || String(err)),
      error: err?.message || String(err),
    });
  }
}
