import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Expense, PaymentMethod } from './types';
import { generateId, DEFAULT_PAYMENT_METHODS, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types';
import * as storage from './storage';
const {
  loadExpenses,
  saveExpenses,
  addExpense: addExpenseRaw,
  deleteExpense: deleteExpenseRaw,
  updateExpense: updateExpenseRaw,
  loadPaymentMethods,
  savePaymentMethods,
  loadExpenseCategories,
  loadIncomeCategories,
  addExpenseCategory: addExpenseCat,
  addIncomeCategory: addIncomeCat,
  removeExpenseCategory: rmExpenseCat,
  removeIncomeCategory: rmIncomeCat,
} = storage;
import { Alert } from 'react-native';

interface AppContextType {
  expenses: Expense[];
  paymentMethods: PaymentMethod[];
  expenseCategories: string[];
  incomeCategories: string[];
  addExpense: (e: Omit<Expense, 'id'> & { createdAt?: number }) => void;
  editExpense: (id: string, e: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  addPaymentMethod: (name: string) => void;
  updatePaymentMethod: (id: string, newName: string) => void;
  removePaymentMethod: (id: string) => void;
  addExpenseCategory: (name: string) => Promise<void>;
  updateExpenseCategory: (oldName: string, newName: string) => Promise<void>;
  removeExpenseCategory: (name: string) => Promise<void>;
  addIncomeCategory: (name: string) => Promise<void>;
  updateIncomeCategory: (oldName: string, newName: string) => Promise<void>;
  removeIncomeCategory: (name: string) => Promise<void>;
}

const Ctx = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);

  // 初始化加载
  useEffect(() => {
    loadExpenses().then(setExpenses);
    loadPaymentMethods().then(setPaymentMethods);
    loadExpenseCategories().then(setExpenseCategories);
    loadIncomeCategories().then(setIncomeCategories);
  }, []);

  const addExpenseCategory = useCallback(async (name: string) => {
    await addExpenseCat(name);
    setExpenseCategories(prev => [...prev, name]);
  }, []);

  const removeExpenseCategory = useCallback(async (name: string) => {
    await rmExpenseCat(name);
    setExpenseCategories(prev => prev.filter(c => c !== name));
  }, []);

  const updateExpenseCategory = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) return;
    // 从 storage 中删除旧分类并添加新分类
    await rmExpenseCat(oldName);
    await addExpenseCat(newName);
    // 更新本地状态
    setExpenseCategories(prev => prev.map(c => c === oldName ? newName : c));
    // 同步更新所有使用该分类的账单记录
    setExpenses(prev => prev.map(e => e.type === 'expense' && e.category === oldName ? { ...e, category: newName } : e));
  }, []);

  const addIncomeCategory = useCallback(async (name: string) => {
    await addIncomeCat(name);
    setIncomeCategories(prev => [...prev, name]);
  }, []);

  const removeIncomeCategory = useCallback(async (name: string) => {
    await rmIncomeCat(name);
    setIncomeCategories(prev => prev.filter(c => c !== name));
  }, []);

  const updateIncomeCategory = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) return;
    // 从 storage 中删除旧分类并添加新分类
    await rmIncomeCat(oldName);
    await addIncomeCat(newName);
    // 更新本地状态
    setIncomeCategories(prev => prev.map(c => c === oldName ? newName : c));
    // 同步更新所有使用该分类的账单记录
    setExpenses(prev => prev.map(e => e.type === 'income' && e.category === oldName ? { ...e, category: newName } : e));
  }, []);

  const addExpense = useCallback((data: Omit<Expense, 'id'> & { createdAt?: number }) => {
    const expense: Expense = {
      ...data,
      id: generateId(),
      createdAt: data.createdAt ?? Date.now(),
    };
    setExpenses(prev => [expense, ...prev]);
    addExpenseRaw(expense).catch(() => {
      setExpenses(prev => prev.filter(e => e.id !== expense.id));
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    deleteExpenseRaw(id).catch(() => {});
  }, []);

  const editExpense = useCallback((id: string, data: Partial<Omit<Expense, 'id'>>) => {
    setExpenses(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...data } as Expense;
      // 如果提供了 createdAt，使用它；否则保留原值
      if ('createdAt' in data && data.createdAt !== undefined) {
        updated.createdAt = data.createdAt;
      }
      return updated;
    }));
    updateExpenseRaw(id, data).catch(() => {
      setExpenses(prev => prev.filter(e => e.id !== id));
    });
  }, []);

  const persistPaymentMethods = useCallback(async (methods: PaymentMethod[]) => {
    // 直接保存当前状态，允许用户删除默认项
    await savePaymentMethods(methods);
  }, []);

  const addPaymentMethod = useCallback((name: string) => {
    const pm: PaymentMethod = { id: generateId(), name };
    setPaymentMethods(prev => {
      const next = [...prev, pm];
      persistPaymentMethods(next).catch(() => {});
      return next;
    });
  }, [persistPaymentMethods]);

  const updatePaymentMethod = useCallback((id: string, newName: string) => {
    // 检查是否为默认付款方式
    const pm = paymentMethods.find(m => m.id === id);
    if (pm && DEFAULT_PAYMENT_METHODS.some(d => d.name === pm.name)) {
      Alert.alert('提示', '默认付款方式无法修改');
      return;
    }
    // 更新付款方式名称
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
    const updatedMethods = paymentMethods.map(m => m.id === id ? { ...m, name: newName } : m);
    persistPaymentMethods(updatedMethods).catch(() => {});
    // 同步更新所有使用该付款方式的账单记录
    setExpenses(prev => prev.map(e => e.paymentMethod === pm?.name ? { ...e, paymentMethod: newName } : e));
  }, [paymentMethods, DEFAULT_PAYMENT_METHODS, persistPaymentMethods]);

  const removePaymentMethod = useCallback((id: string) => {
    setPaymentMethods(prev => {
      const next = prev.filter(m => m.id !== id);
      persistPaymentMethods(next).catch(() => {});
      return next;
    });
  }, [persistPaymentMethods]);

  const value = React.useMemo(() => ({
    expenses, paymentMethods, expenseCategories, incomeCategories,
    addExpense, editExpense, removeExpense,
    addPaymentMethod, updatePaymentMethod, removePaymentMethod,
    addExpenseCategory, updateExpenseCategory, removeExpenseCategory,
    addIncomeCategory, updateIncomeCategory, removeIncomeCategory,
  }), [expenses, paymentMethods, expenseCategories, incomeCategories, addExpense, editExpense, removeExpense, addPaymentMethod, updatePaymentMethod, removePaymentMethod, addExpenseCategory, updateExpenseCategory, removeExpenseCategory, addIncomeCategory, updateIncomeCategory, removeIncomeCategory]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
