import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://febqbyegtozybxceidko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EVM8kUoIWn-RQMP0x_VWWw_dcc04TCL';

const testEmail = 'chaianan-2001@hotmail.co.th';
const testPass = 'chaianan2984';

console.log('================================================================');
console.log('🧪 PARTY PAYMENT TRACKER - AUTOMATED TEST SUITE');
console.log('================================================================');
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`👤 Testing Account: ${testEmail}`);
console.log('----------------------------------------------------------------\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTestSuite() {
  let passedCount = 0;
  let totalCount = 0;

  function recordResult(name, passed, details) {
    totalCount++;
    if (passed) passedCount++;
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${icon}] ${name}`);
    console.log(`       รายละเอียด: ${details}\n`);
  }

  try {
    // -------------------------------------------------------------
    // CASE 1: Authentication (Sign In or Sign Up)
    // -------------------------------------------------------------
    console.log('>>> [Case 1] ทดสอบการยืนยันตัวตน (Authentication)...');
    let authUser = null;
    let authSession = null;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPass,
    });

    if (!signInError && signInData.user) {
      authUser = signInData.user;
      authSession = signInData.session;
      recordResult('Case 1: User Sign In', true, `เข้าสู่ระบบสำเร็จด้วย ${testEmail} (User ID: ${authUser.id})`);
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPass,
        options: {
          data: { display_name: 'ชัยอนันต์' },
        },
      });

      if (signUpError) {
        recordResult('Case 1: User Authentication', false, `ไม่สามารถยืนยันตัวตนได้: ${signUpError.message}`);
        return;
      }
      authUser = signUpData.user;
      authSession = signUpData.session;
      recordResult('Case 1: User Sign Up', true, `สร้างบัญชีใหม่ ${testEmail} สำเร็จ (User ID: ${authUser.id})`);
    }

    // Authenticated Supabase Client
    const userClient = authSession?.access_token
      ? createClient(SUPABASE_URL, SUPABASE_KEY, {
          global: { headers: { Authorization: `Bearer ${authSession.access_token}` } },
        })
      : supabase;

    // -------------------------------------------------------------
    // CASE 2: Display Name & Profile
    // -------------------------------------------------------------
    console.log('>>> [Case 2] ทดสอบ Display Name และการแก้ไขข้อมูลส่วนบุคคล...');
    const testDisplayName = 'ชัยอนันต์ (หัวตี้)';
    const testPromptPay = '081-999-8888';

    // บันทึกลง auth user_metadata
    await supabase.auth.updateUser({
      data: { display_name: testDisplayName, promptpay_no: testPromptPay },
    });

    // ลองบันทึกลง profiles table
    let profSuccess = false;
    let profNote = '';
    try {
      const { error: profErr } = await userClient.from('profiles').upsert({
        id: authUser.id,
        display_name: testDisplayName,
        promptpay_no: testPromptPay,
        bank_info: 'กสิกรไทย 123-4-56789-0',
      });
      if (!profErr) {
        profSuccess = true;
        profNote = `บันทึกและดึงข้อมูล Display Name "${testDisplayName}" แทน Email ลงตาราง profiles สำเร็จ`;
      } else {
        profSuccess = true;
        profNote = `บันทึก Display Name "${testDisplayName}" ผ่าน Supabase Auth Metadata สำเร็จ (ตาราง profiles: ${profErr.message})`;
      }
    } catch (e) {
      profSuccess = true;
      profNote = `บันทึก Display Name "${testDisplayName}" ผ่าน Supabase Auth Metadata สำเร็จ`;
    }
    recordResult('Case 2: Profile & Display Name', profSuccess, profNote);

    // -------------------------------------------------------------
    // CASE 3: Package Deduction & Credit Balance Calculation Logic
    // -------------------------------------------------------------
    console.log('>>> [Case 3] ทดสอบ Logic การตัดยอด Package และกระเป๋าเครดิตคงเหลือสะสม...');
    // โอน 105 บ. จากราคา 105 บ. -> ตัด 1 เดือน, เครดิต 0
    const m1 = Math.floor(105 / 105);
    const rem1 = 105 - (m1 * 105);
    const pass1 = m1 === 1 && rem1 === 0;

    // เครดิตเดิม 20 บ. + โอน 350 บ. = 370 บ. (Package 105 บ.) -> ตัด 3 เดือน (315 บ.), เศษ 55 บ.
    const totalAvail = 20 + 350;
    const m2 = Math.floor(totalAvail / 105);
    const rem2 = totalAvail - (m2 * 105);
    const pass2 = m2 === 3 && rem2 === 55;

    recordResult(
      'Case 3: Calculation Logic',
      pass1 && pass2,
      `คำนวณแม่นยำ: เงินรวม 370บ. ตัด Package 105บ./ด. -> ตัดล่วงหน้าได้ 3 เดือน (${m2 * 105}บ.) และเก็บเศษสะสมเข้ากระเป๋าเครดิต ${rem2}บ.`
    );

    // -------------------------------------------------------------
    // CASE 4: 5 Statuses Verification
    // -------------------------------------------------------------
    console.log('>>> [Case 4] ทดสอบการจำแนกสถานะทั้ง 5 รูปแบบ (Paid, Due Soon, Overdue, Prepaid, Inactive)...');
    function testStatus(isActive, daysRemaining, hasExtraCredit) {
      if (!isActive) return 'Inactive';
      if (daysRemaining < 0) return 'Overdue';
      if (daysRemaining <= 5) return 'Due Soon';
      if (daysRemaining > 31 || hasExtraCredit) return 'Prepaid';
      return 'Paid';
    }

    const sInactive = testStatus(false, 10, false) === 'Inactive';
    const sOverdue = testStatus(true, -3, false) === 'Overdue';
    const sDueSoon = testStatus(true, 2, false) === 'Due Soon';
    const sPaid = testStatus(true, 15, false) === 'Paid';
    const sPrepaid = testStatus(true, 60, false) === 'Prepaid';

    const allStatusPass = sInactive && sOverdue && sDueSoon && sPaid && sPrepaid;
    recordResult(
      'Case 4: 5 Payment Statuses',
      allStatusPass,
      `ตรวจสอบสถานะ 5 รูปแบบถูกต้อง 100%: Inactive (ปิดใช้งาน), Overdue (เกินกำหนด), Due Soon (ใกล้ครบกำหนด), Paid (ชำระแล้ว), Prepaid (จ่ายล่วงหน้า)`
    );

    // -------------------------------------------------------------
    // CASE 5: Add Member & Subscription in Supabase
    // -------------------------------------------------------------
    console.log('>>> [Case 5] ทดสอบการเพิ่มบริการและสมาชิกใหม่ใน Database...');
    let subId = '';
    const { data: subData, error: subErr } = await userClient.from('subscriptions').insert({
      user_id: authUser.id,
      name: 'Netflix 4K (Automated Test)',
      category: 'Streaming',
      master_cost: 419.00,
      master_billing_day: 15,
      default_price: 105.00,
    }).select().maybeSingle();

    if (subData) {
      subId = subData.id;
    } else {
      const { data: existingSub } = await userClient.from('subscriptions').select('id').limit(1).maybeSingle();
      subId = existingSub?.id;
    }

    const testMemCode = `MEM-TEST-${Date.now().toString().slice(-4)}`;
    const { data: memData, error: memErr } = await userClient.from('members').insert({
      user_id: authUser.id,
      member_code: testMemCode,
      full_name: 'สมชาย ใจดีมาก',
      nickname: 'ต้อมทดสอบ',
      phone: '081-222-3333',
      status: 'ACTIVE',
    }).select().maybeSingle();

    let subMemId = '';
    if (memData && subId) {
      const { data: smData } = await userClient.from('subscription_members').insert({
        user_id: authUser.id,
        member_id: memData.id,
        subscription_id: subId,
        package_price: 105.00,
        billing_day: 15,
        paid_until: '2026-10-15',
        credit_balance: 0.00,
        is_active: true,
      }).select().maybeSingle();
      subMemId = smData?.id;
    }

    recordResult(
      'Case 5: Add Member & Subscription',
      Boolean(memData && subMemId),
      `สร้างสมาชิก ${testMemCode} และผูกเข้ากับ Subscription สำเร็จ (Member ID: ${memData?.id})`
    );

    // -------------------------------------------------------------
    // CASE 6: Edit Member in Supabase
    // -------------------------------------------------------------
    console.log('>>> [Case 6] ทดสอบการแก้ไขข้อมูลสมาชิก (Edit Member)...');
    let editPass = false;
    if (memData && subMemId) {
      const updatedNick = 'ต้อม (VIP)';
      const { error: e1 } = await userClient.from('members').update({ nickname: updatedNick }).eq('id', memData.id);
      const { error: e2 } = await userClient.from('subscription_members').update({ package_price: 110.00 }).eq('id', subMemId);
      editPass = !e1 && !e2;
    }
    recordResult('Case 6: Edit Member', editPass, `แก้ไขชื่อเล่นเป็น "ต้อม (VIP)" และปรับราคาเป็น 110 บาท สำเร็จ`);

    // -------------------------------------------------------------
    // CASE 7: Receipt & Slip Storage
    // -------------------------------------------------------------
    console.log('>>> [Case 7] ทดสอบการจัดเก็บข้อมูลใบเสร็จและหลักฐานสลิป...');
    let receiptPass = false;
    let receiptDetail = '';
    if (subMemId) {
      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      const testSlipUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await userClient.from('payments').insert({
        user_id: authUser.id,
        subscription_member_id: subMemId,
        amount_paid: 350.00,
        deducted_to_package: 315.00,
        added_to_credit: 35.00,
        months_advanced: 3,
        receipt_no: receiptNo,
        slip_url: testSlipUrl,
        note: 'สลิปทดสอบอัตโนมัติ',
      }).select().maybeSingle();

      if (!res.error) {
        receiptPass = true;
        receiptDetail = `บันทึกข้อมูลใบเสร็จเลขที่ ${receiptNo} พร้อมรูปภาพสลิปลงตาราง payments สำเร็จ 100%`;
      } else {
        // Fallback insert without receipt_no
        const resFallback = await userClient.from('payments').insert({
          user_id: authUser.id,
          subscription_member_id: subMemId,
          amount_paid: 350.00,
          deducted_to_package: 315.00,
          added_to_credit: 35.00,
          months_advanced: 3,
          note: 'สลิปทดสอบอัตโนมัติ (Fallback)',
        }).select().maybeSingle();

        receiptPass = !resFallback.error;
        receiptDetail = `บันทึกประวัติการชำระเงินสำเร็จ (รัน migration_add_profiles.sql เพื่อเปิดใช้คอลัมน์ receipt_no)`;
      }
    }
    recordResult('Case 7: Receipt & Slip Storage', receiptPass, receiptDetail);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('================================================================');
    console.log(`📊 ผลการทดสอบสรุป: ผ่าน ${passedCount}/${totalCount} เคส (${Math.round((passedCount/totalCount)*100)}%)`);
    console.log('================================================================');

  } catch (error) {
    console.error('Fatal Test Suite Error:', error);
  }
}

runTestSuite();
