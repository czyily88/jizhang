import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { StatusBar, StyleSheet, Platform, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './src/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import PaymentMethodScreen from './src/screens/PaymentMethodScreen';
import CategoryManagerScreen from './src/screens/CategoryManagerScreen';
import StatsView from './src/screens/StatsView';
import SettingsScreen from './src/screens/SettingsScreen';
import type { Expense } from './src/types';

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <SafeAreaView style={styles.container}>
        <MainView />
      </SafeAreaView>
    </AppProvider>
  );
}

function MainView() {
  const [view, setView] = useState<'home' | 'add' | 'payment' | 'category' | 'stats' | 'settings'>('home');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Android 返回键处理
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // 从支付/分类页面返回设置，统计直接返回主页
      if (view === 'payment' || view === 'category') {
        setView('settings');
        return true;
      }
      // 非主界面返回主界面（add 页面除外）
      if (view !== 'home' && view !== 'add') {
        setView('home');
        return true;
      }
      // add 页面按返回键直接返回主页，不提示
      if (view === 'add') {
        setView('home');
        return true;
      }
      // 主界面直接退出
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [view]);

  if (view === 'add') {
    return <AddExpenseScreen expense={editingExpense} isEditing={!!editingExpense} onClose={() => setView('home')} />;
  }
  if (view === 'payment') {
    return <PaymentMethodScreen onClose={() => setView('settings')} />;
  }
  if (view === 'category') {
    return <CategoryManagerScreen onClose={() => setView('settings')} />;
  }
  if (view === 'stats') {
    return <StatsView onClose={() => setView('home')} />;
  }
  if (view === 'settings') {
    return <SettingsScreen
      onClose={() => setView('home')}
      onManagePayment={() => setView('payment')}
      onManageCategories={() => setView('category')}
    />;
  }

  return (
    <HomeScreen
      onAdd={() => {
        setEditingExpense(null); // 清空编辑状态，确保点 + 号是记一笔
        setView('add');
      }}
      onViewStats={() => setView('stats')}
      onViewSettings={() => {
        setView('settings');
      }}
      onEdit={(expense) => { 
        setEditingExpense(expense); 
        setView('add'); 
      }}
    />
  );
}
