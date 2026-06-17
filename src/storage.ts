import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, PaymentMethod } from './types';
import { DEFAULT_PAYMENT_METHODS, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types';

const KEY_EXPENSES = 'expense_tracker_expenses';
const KEY_PAYMENT_METHODS = 'expense_tracker_payment_methods';
const KEY_EXPENSE_CATEGORIES = 'expense_tracker_expense_categories';
const KEY_INCOME_CATEGORIES = 'expense_tracker_income_categories';

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_EXPENSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PAYMENT_METHODS);
    if (raw) {
      const saved: PaymentMethod[] = JSON.parse(raw);
      const defaultNames = new Set(DEFAULT_PAYMENT_METHODS.map(d => d.name));
      // 保留用户自定义的 + 补充缺失的默认项
      return saved.filter(m => !defaultNames.has(m.name))
        .concat(DEFAULT_PAYMENT_METHODS.filter(d => !saved.some(s => s.name === d.name)));
    }
  } catch { /* ignore */ }
  return DEFAULT_PAYMENT_METHODS;
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(KEY_EXPENSES, JSON.stringify(expenses));
}

export async function addExpense(expense: Expense): Promise<void> {
  const list = await loadExpenses();
  list.unshift(expense);
  await saveExpenses(list);
}

export async function deleteExpense(id: string): Promise<void> {
  const list = await loadExpenses();
  await saveExpenses(list.filter(e => e.id !== id));
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  const list = await loadExpenses();
  const updated = list.map(e => e.id === id ? { ...e, ...data } as Expense : e);
  await saveExpenses(updated);
}

export async function savePaymentMethods(methods: PaymentMethod[]): Promise<void> {
  await AsyncStorage.setItem(KEY_PAYMENT_METHODS, JSON.stringify(methods));
}

// ---- 分类管理 ----

export async function loadExpenseCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_EXPENSE_CATEGORIES);
    return raw ? JSON.parse(raw) : [...DEFAULT_EXPENSE_CATEGORIES];
  } catch {
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }
}

export async function loadIncomeCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_INCOME_CATEGORIES);
    return raw ? JSON.parse(raw) : [...DEFAULT_INCOME_CATEGORIES];
  } catch {
    return [...DEFAULT_INCOME_CATEGORIES];
  }
}

export async function saveExpenseCategories(categories: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY_EXPENSE_CATEGORIES, JSON.stringify(categories));
}

export async function saveIncomeCategories(categories: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY_INCOME_CATEGORIES, JSON.stringify(categories));
}

export async function addExpenseCategory(name: string): Promise<void> {
  const categories = await loadExpenseCategories();
  if (!categories.includes(name)) {
    categories.push(name);
    await saveExpenseCategories(categories);
  }
}

export async function addIncomeCategory(name: string): Promise<void> {
  const categories = await loadIncomeCategories();
  if (!categories.includes(name)) {
    categories.push(name);
    await saveIncomeCategories(categories);
  }
}

export async function removeExpenseCategory(name: string): Promise<void> {
  const categories = await loadExpenseCategories();
  await saveExpenseCategories(categories.filter(c => c !== name));
}

export async function removeIncomeCategory(name: string): Promise<void> {
  const categories = await loadIncomeCategories();
  await saveIncomeCategories(categories.filter(c => c !== name));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEY_EXPENSES,
    KEY_PAYMENT_METHODS,
    KEY_EXPENSE_CATEGORIES,
    KEY_INCOME_CATEGORIES,
  ]);
}
