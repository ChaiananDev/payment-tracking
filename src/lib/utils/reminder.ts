import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface ReminderParams {
  nickname: string;
  subscriptionName: string;
  packagePrice: number;
  creditBalance: number;
  paidUntil: string;
  daysRemaining: number;
  promptPayNumber?: string;
  bankAccountInfo?: string;
}

/**
 * สร้างข้อความแจ้งเตือนค่าตี้ สำหรับกด Copy แล้วนำไปวางใน LINE หรือ Messenger
 */
export function generateReminderMessage({
  nickname,
  subscriptionName,
  packagePrice,
  creditBalance,
  paidUntil,
  daysRemaining,
  promptPayNumber = '08X-XXX-XXXX',
  bankAccountInfo,
}: ReminderParams): string {
  const formattedDate = format(parseISO(paidUntil), 'dd MMMM yyyy');
  
  // ถ้ายอดมีเครดิตค้างอยู่ ยอดที่ต้องจ่ายจริงจะลดลง
  const netAmountDue = Math.max(0, packagePrice - creditBalance);

  let message = `🔔 แจ้งเตือนค่าสมาชิก ${subscriptionName}\n\n`;
  message += `สวัสดีครับคุณ ${nickname} 😊\n`;

  if (daysRemaining < 0) {
    message += `ค่าบริการรอบวันที่ ${formattedDate} เลยกำหนดชำระมาแล้ว ${Math.abs(daysRemaining)} วันครับ\n`;
  } else if (daysRemaining === 0) {
    message += `ค่าบริการถึงกำหนดชำระวันนี้แล้วครับ (${formattedDate})\n`;
  } else {
    message += `ค่าบริการจะถึงกำหนดชำระในวันที่ ${formattedDate} (อีก ${daysRemaining} วัน)\n`;
  }

  message += `\n💵 ยอด Package: ${packagePrice.toLocaleString()} บาท`;

  if (creditBalance > 0) {
    message += `\n💰 มีเครดิตเดิมเหลืออยู่: ${creditBalance.toLocaleString()} บาท`;
    message += `\n👉 ยอดที่ต้องโอนสุทธิ: ${netAmountDue.toLocaleString()} บาท`;
  } else {
    message += `\n👉 ยอดที่ต้องโอน: ${netAmountDue.toLocaleString()} บาท`;
  }

  message += `\n\n📌 ช่องทางการโอน:`;
  message += `\n• พร้อมเพย์: ${promptPayNumber}`;
  if (bankAccountInfo) {
    message += `\n• ธนาคาร: ${bankAccountInfo}`;
  }

  message += `\n\n(หากโอนล่วงหน้าหลายเดือน ระบบจะทบยอดและเลื่อนวันหมดอายุให้ทันทีครับ)`;
  message += `\nโอนแล้วรบกวนส่งสลิปให้ด้วยน้า ขอบคุณมากครับ! 🙏`;

  return message;
}
