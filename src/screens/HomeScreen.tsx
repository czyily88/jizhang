import React, { useState, Fragment, useRef, useLayoutEffect, useEffect } from 'react';
import { StatusBar, View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../AppContext';
import { formatMoney, formatDate, formatDateGroup, type Expense } from '../types';

interface HomeScreenProps {
  onAdd: () => void;
  onViewStats: () => void;
  onViewSettings: () => void;
  onEdit?: (expense: Expense) => void;
}

const SCROLL_POSITION_KEY = '@jizhang_home_scroll_position';

export default function HomeScreen({ onAdd, onViewStats, onViewSettings, onEdit }: HomeScreenProps) {
  const { expenses, removeExpense, paymentMethods, expenseCategories, incomeCategories } = useApp();

  // ScrollView 引用
  const scrollViewRef = useRef<ScrollView>(null);

  // 使用 state 存储滚动位置和数据加载状态
  const [scrollPositionLoaded, setScrollPositionLoaded] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);

  // 加载保存的滚动位置（异步）
  useEffect(() => {
    AsyncStorage.getItem(SCROLL_POSITION_KEY).then(value => {
      if (value) {
        setSavedScrollY(parseFloat(value));
      }
      setScrollPositionLoaded(true);
    });
  }, []);

  // 保存滚动位置到 AsyncStorage
  const saveScrollPosition = async (y: number) => {
    try {
      await AsyncStorage.setItem(SCROLL_POSITION_KEY, y.toString());
    } catch (error) {
      console.log('保存滚动位置失败:', error);
    }
  };

  // 在数据加载完成且内容变化后恢复滚动位置
  useEffect(() => {
    if (scrollPositionLoaded && groupKeys.length > 0) {
      restoreScrollPosition(savedScrollY);
    }
  }, [expenses.length, scrollPositionLoaded]);

  // 恢复滚动位置
  const restoreScrollPosition = (y: number) => {
    if (scrollViewRef.current && y > 0) {
      scrollViewRef.current.scrollTo({ y, animated: false });
    }
  };

  // 今日收支统计 - 支出为负，收入为正
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const totalExpense = expenses
    .filter(e => e.createdAt >= todayTs && e.type === 'expense')
    .reduce((s, e) => s + (-e.amount), 0);
  const totalIncome = expenses
    .filter(e => e.createdAt >= todayTs && e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);
  const balance = totalExpense + totalIncome;

  // 按天分组，并在每个组内按时间戳倒序排列
  const groups: Record<string, typeof expenses> = {};
  const groupTimestamps: Record<string, number> = {};
  for (const e of expenses) {
    const key = formatDateGroup(e.createdAt);
    if (!groups[key]) {
      groups[key] = [];
      // 记录该组的最新时间戳用于排序
      groupTimestamps[key] = e.createdAt;
    } else {
      groupTimestamps[key] = Math.max(groupTimestamps[key], e.createdAt);
    }
    groups[key].push(e);
  }
  // 对每组内的记录按时间戳倒序排序（最新在前）
  Object.values(groups).forEach(group => {
    group.sort((a, b) => b.createdAt - a.createdAt);
  });
  // 按组内最新时间戳从近到远排序
  const groupKeys = Object.keys(groups).sort((a, b) => groupTimestamps[b] - groupTimestamps[a]);

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      '确认删除',
      `确定要删除这条记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => removeExpense(expense.id)
        },
      ]
    );
  };

  const handleEdit = (expense: Expense) => {
    onEdit?.(expense);
  };

  const renderItem = ({ item }: { item: typeof expenses[0] }) => {
    const pm = paymentMethods.find(m => m.id === item.paymentMethod);
    
    return (
      <TouchableOpacity
        style={styles.expenseRow}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseLeft}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseCat}>{item.category}</Text>
            <Text style={styles.expenseNote}>{item.note || '—'}</Text>
            <Text style={styles.expensePayment}>{pm?.name || item.paymentMethod}</Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, item.type === 'expense' ? styles.expenseAmountExpense : styles.expenseAmountIncome]}>
            {item.type === 'expense' ? '-' : '+'}{formatMoney(item.amount).replace('¥ ', '')}
          </Text>
          <Text style={styles.expenseTime}>{formatDateWithTime(item.createdAt)}</Text>
          <TouchableOpacity style={[styles.deleteBtn, item.note && { marginTop: 0 }]} onPress={(e) => { e.stopPropagation(); handleDelete(item); }}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupHeader = ({ item: groupName }: { item: string }) => (
    <Text style={styles.groupHeader}>{groupName}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* 顶部操作栏 */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>📒 日常记账</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.statsBtn} onPress={onViewStats}>
            <Text style={styles.statsBtnIcon}>📊</Text>
            <Text style={styles.statsBtnText}>统计</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={onViewSettings}>
            <Text style={styles.settingsBtnIcon}>⚙️</Text>
            <Text style={styles.settingsBtnText}>选项</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 顶部统计卡片 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>今日收支</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={[styles.summaryValueExpense]}>-{formatMoney(Math.abs(totalExpense)).replace('¥ ', '')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={[styles.summaryValueIncome]}>+{formatMoney(Math.abs(totalIncome)).replace('¥ ', '')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>结余</Text>
            <Text style={[styles.summaryValue, balance >= 0 ? styles.summaryValuePositive : styles.summaryValueNegative]}>
              {balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(balance)).replace('¥ ', '')}
            </Text>
          </View>
        </View>
      </View>

      {/* 记录总数 */}
      <Text style={styles.totalCount}>共 {expenses.length} 条记录</Text>

      {/* 账单列表 */}
      {groupKeys.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            setSavedScrollY(y);
            saveScrollPosition(y);
          }}
          scrollEventThrottle={16}
        >
          {groupKeys.map(groupName => (
            <Fragment key={groupName}>
              <Text style={styles.groupHeader}>{groupName}</Text>
              {groups[groupName].map(e => renderItem({ item: e }))}
            </Fragment>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>还没有记账，点击下方 + 开始记一笔吧</Text>
        </View>
      )}

      {/* 底部加号按钮 */}
      <TouchableOpacity style={styles.fab} onPress={onAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

function getCategoryEmoji(cat: string, expenseCats?: string[], incomeCats?: string[]): string {
  const map: Record<string, string> = {
    '餐饮': '🍜', '交通': '🚌', '购物': '🛒', '居住': '🏠', '娱乐': '🎮',
    '医疗': '💊', '教育': '📚', '通讯': '📱', '服饰': '👔', '其他': '📌',
    '工资': '💰', '奖金': '🎁', '兼职': '🔧', '投资': '📈', '退款': '↩️',
    '红包': '🧧',
  };
  return map[cat] || '📌';
}

function formatDateWithTime(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14, backgroundColor: '#f0f0ff', borderRadius: 8, gap: 6 },
  settingsBtnIcon: { fontSize: 14, color: '#5b6abf', fontWeight: '600' },
  settingsBtnText: { fontSize: 14, color: '#5b6abf', fontWeight: '600' },
  statsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14, backgroundColor: '#e8f4fd', borderRadius: 8, gap: 6, marginRight: 8 },
  statsBtnIcon: { fontSize: 14, color: '#2ed573', fontWeight: '600' },
  statsBtnText: { fontSize: 14, color: '#2ed573', fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryValueExpense: { fontSize: 20, fontWeight: '700', color: '#2ed573' },
  summaryValueIncome: { fontSize: 20, fontWeight: '700', color: '#ff4757' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  summaryValuePositive: { color: '#ff4757' },
  summaryValueNegative: { color: '#2ed573' },
  summaryDivider: { width: 1, backgroundColor: '#eee', marginHorizontal: 8 },
  actionRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  manageBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#e8e8ff', borderRadius: 8 },
  manageBtnText: { fontSize: 12, color: '#5b6abf' },
  totalCount: { fontSize: 12, color: '#aaa', marginHorizontal: 20, marginTop: -8, marginBottom: 4 },
  groupHeader: { fontSize: 13, color: '#666', paddingHorizontal: 20, paddingVertical: 10, fontWeight: '600' },
  expenseRow: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseInfo: { flexShrink: 1 },
  expenseCat: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  expenseNote: { fontSize: 12, color: '#999', marginTop: 2 },
  expensePayment: { fontSize: 11, color: '#7b8abf', marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', marginLeft: 8 },
  expenseAmount: { fontSize: 16, fontWeight: '700' },
  expenseAmountExpense: { color: '#2ed573' },
  expenseAmountIncome: { color: '#ff4757' },
  expenseTime: { fontSize: 10, color: '#bbb', marginTop: 2 },
  deleteBtn: { marginTop: 4, padding: 2 },
  deleteBtnText: { fontSize: 14, color: '#ddd' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#aaa' },
  fab: {
    position: 'absolute', bottom: 30, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#5b6abf', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#5b6abf', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300', lineHeight: 44 },
});
