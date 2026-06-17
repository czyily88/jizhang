/** 每条记账记录 */
export interface Expense {
  id: string;
  type: 'expense' | 'income';     // 支出 / 收入
  amount: number;                  // 金额（分）
  category: string;                // 分类
  paymentMethod: string;           // 付款方式
  note: string;                    // 备注
  createdAt: number;               // 创建时间戳
}

/** 付款方式定义 */
export interface PaymentMethod {
  id: string;
  name: string;                    // 显示名称
}

// ---- 默认付款方式 ----
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: '现金' },
  { id: 'wechat', name: '微信' },
  { id: 'alipay', name: '支付宝' },
  { id: 'bank', name: '银行卡' },
];

/** 预设支出分类 (默认值) */
export const DEFAULT_EXPENSE_CATEGORIES = [
  '餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育', '通讯', '服饰', '其他'
];

/** 预设收入分类 (默认值) */
export const DEFAULT_INCOME_CATEGORIES = [
  '工资', '奖金', '兼职', '投资', '退款', '红包', '其他'
];

// ---- 工具函数 ----
export function formatMoney(cents: number): string {
  const yuan = (cents / 100).toFixed(2);
  // 加千分位
  return '¥ ' + yuan.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return '今天';
  if (d.toDateString() === yesterday.toDateString()) return '昨天';

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${h}:${m}`;
}

/** 日期范围选择器用的紧凑型格式 (YYYY-MM-DD) */
export function formatDateCompact(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateGroup(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return '今天';
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 获取默认日期范围（最近 30 天） */
export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
