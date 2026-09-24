import { addMonths, differenceInCalendarDays, format, parseISO, isBefore, startOfDay } from 'date-fns';
import { MemberPaymentStatus } from '@/types/database.types';

export interface PaymentCalculationResult {
  totalAvailable: number;        // ยอดรวม (เงินโอนใหม่ + ยอดคงเหลือเดิม)
  packagePrice: number;          // ราคา Package ต่อเดือน
  monthsAdvanced: number;        // จำนวนเดือนที่ครอบคลุม (นำไปเลื่อนวันครบกำหนด)
  deductedToPackage: number;     // ยอดที่นำไปตัด Package
  newCreditBalance: number;      // ยอดเศษเงินคงเหลือสะสมเก็บไว้ตัดรอบถัดไป
  newPaidUntil: string;          // วันที่ครบกำหนดรอบถัดไป (YYYY-MM-DD)
}

/**
 * คำนวณการตัดยอด Package และยอดเงินคงเหลือสะสม (Credit Balance)
 * สูตร: ยอดเงินรวม = ยอดคงเหลือเดิม + ยอดโอนใหม่
 * จำนวนเดือนที่ตัดได้ = floor(ยอดเงินรวม / ราคา Package)
 * ยอดที่ตัด Package = จำนวนเดือน * ราคา Package
 * ยอดเงินคงเหลือสะสมใหม่ = ยอดเงินรวม - ยอดที่ตัด Package
 */
export function calculatePaymentDeduction(
  currentCreditBalance: number,
  amountPaid: number,
  packagePrice: number,
  currentPaidUntil: string | Date
): PaymentCalculationResult {
  const safeCredit = Number(currentCreditBalance) || 0;
  const safeAmount = Number(amountPaid) || 0;
  const safePrice = Number(packagePrice) || 1;

  const totalAvailable = safeCredit + safeAmount;
  const monthsAdvanced = Math.floor(totalAvailable / safePrice);
  const deductedToPackage = monthsAdvanced * safePrice;
  const newCreditBalance = Number((totalAvailable - deductedToPackage).toFixed(2));

  const baseDate = typeof currentPaidUntil === 'string' ? parseISO(currentPaidUntil) : currentPaidUntil;
  const targetDate = monthsAdvanced > 0 ? addMonths(baseDate, monthsAdvanced) : baseDate;
  const newPaidUntil = format(targetDate, 'yyyy-MM-dd');

  return {
    totalAvailable,
    packagePrice: safePrice,
    monthsAdvanced,
    deductedToPackage,
    newCreditBalance,
    newPaidUntil,
  };
}

/**
 * จำแนกสถานะสมาชิก 5 รูปแบบ:
 * 1. 'Inactive'  - ปิดใช้งาน หรือออกจากตี้
 * 2. 'Overdue'   - เลยวันครบกำหนดชำระแล้ว (ค้างจ่าย)
 * 3. 'Due Soon'  - เหลือเวลา 1-5 วันก่อนครบกำหนด
 * 4. 'Prepaid'   - จ่ายล่วงหน้าเกิน 1 รอบขึ้นไป (> 30 วัน) หรือมีเครดิตคงเหลือพอสำหรับเดือนหน้า
 * 5. 'Paid'      - ชำระครบตามรอบปกติแล้ว
 */
export function determinePaymentStatus(
  isActive: boolean,
  paidUntilStr: string,
  creditBalance: number = 0,
  packagePrice: number = 100,
  todayDate: Date = new Date()
): { status: MemberPaymentStatus; daysRemaining: number } {
  if (!isActive) {
    return { status: 'Inactive', daysRemaining: 0 };
  }

  const today = startOfDay(todayDate);
  const paidUntil = startOfDay(parseISO(paidUntilStr));
  const daysRemaining = differenceInCalendarDays(paidUntil, today);

  // 1. เลยวันกำหนดชำระ
  if (daysRemaining < 0) {
    return { status: 'Overdue', daysRemaining };
  }

  // 2. ใกล้ถึงกำหนดจ่ายใน 5 วัน
  if (daysRemaining <= 5) {
    return { status: 'Due Soon', daysRemaining };
  }

  // 3. จ่ายล่วงหน้าเกินรอบปกติ (มากกว่า 31 วัน) หรือมีเครดิตคงเหลือพอตัดเดือนหน้า
  const hasExtraCreditForMonth = packagePrice > 0 && creditBalance >= packagePrice;
  if (daysRemaining > 31 || hasExtraCreditForMonth) {
    return { status: 'Prepaid', daysRemaining };
  }

  // 4. จ่ายครบตามรอบปกติ
  return { status: 'Paid', daysRemaining };
}

/**
 * ตัวช่วยจัดสีและข้อความสำหรับแต่ละสถานะ
 */
export function getStatusBadgeConfig(status: MemberPaymentStatus) {
  switch (status) {
    case 'Prepaid':
      return {
        label: 'Prepaid (จ่ายล่วงหน้า)',
        bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    case 'Paid':
      return {
        label: 'Paid (ชำระแล้ว)',
        bgColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        dotColor: 'bg-blue-500',
      };
    case 'Due Soon':
      return {
        label: 'Due Soon (ใกล้ครบกำหนด)',
        bgColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'Overdue':
      return {
        label: 'Overdue (ค้างชำระ)',
        bgColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        dotColor: 'bg-rose-500',
      };
    case 'Inactive':
    default:
      return {
        label: 'Inactive (ไม่ใช้งาน)',
        bgColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dotColor: 'bg-slate-400',
      };
  }
}
