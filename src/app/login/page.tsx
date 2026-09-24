'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // หาก Supabase ไม่ได้เปิด Confirm Email มันจะ sign in ให้เลย หรือถ้าเปิดจะแจ้งเตือน
        if (data.session) {
          setSuccessMsg('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ! กำลังนำคุณเข้าสู่หน้า Dashboard...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setSuccessMsg('สมัครสมาชิกสำเร็จแล้ว! หากคุณเปิดระบบยืนยันอีเมล โปรดตรวจสอบกล่องข้อความในอีเมลของคุณ');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccessMsg('เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...');
        setTimeout(() => router.push('/'), 800);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      if (msg.includes('Invalid login credentials')) {
        msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (msg.includes('Password should be at least 6 characters')) {
        msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (msg.includes('User already registered')) {
        msg = 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว โปรดเลือกเข้าสู่ระบบ';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Party Payment Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ระบบติดตามการจ่ายค่าสมาชิกสำหรับหัวตี้ แยกข้อมูลส่วนตัวรายบุคคล
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              เข้าสู่ระบบ (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              สมัครสมาชิก (Sign Up)
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                อีเมล (Email):
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                รหัสผ่าน (Password):
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">ความยาวอย่างน้อย 6 ตัวอักษร</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>สมัครสมาชิกใหม่</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              🔒 ข้อมูลของคุณปลอดภัยด้วย Row Level Security (RLS) สมาชิกและประวัติการเงินของคุณจะมองเห็นได้เฉพาะคุณคนเดียว
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ← กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
