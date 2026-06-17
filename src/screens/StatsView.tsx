import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../AppContext';
import { formatMoney, formatDate, formatDateCompact, DEFAULT_EXPENSE_CATEGORIES as EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES as INCOME_CATEGORIES, type Expense } from '../types';

interface StatsViewProps {
  onClose: () => void;
}

type FilterType = 'expense' | 'income';

export default function StatsView({ onClose }: StatsViewProps) {
  const { expenses, paymentMethods, expenseCategories, incomeCategories } = useApp();
  const statusBarHeight = StatusBar.currentHeight || 0;
  const today = new Date();

  // 获取最早和最晚的日期范围（用于全部日期）
  const getEarliestLatestRange = () => {
    if (expenses.length === 0) {
      const now = new Date();
      return { 
        start: new Date(now.getFullYear() - 1, now.getMonth(), 1), 
        end: now 
      };
    }
    const minTs = Math.min(...expenses.map(e => e.createdAt));
    const maxTs = Math.max(...expenses.map(e => e.createdAt));
    return { 
      start: new Date(minTs), 
      end: new Date(maxTs) 
    };
  };

  // 获取当月日期范围
  const getMonthRange = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // 获取上月日期范围
  const getLastMonthRange = () => {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // 获取今年日期范围
  const getThisYearRange = () => {
    const start = new Date(today.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // 获取去年日期范围
  const getLastYearRange = () => {
    const lastYear = today.getFullYear() - 1;
    const start = new Date(lastYear, 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(lastYear, 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const monthStart = getMonthRange().start;
  const monthEnd = getMonthRange().end;
  const { start: allStart, end: allEnd } = getEarliestLatestRange();

  // 过滤条件 - 直接使用日期状态，默认为全部日期
  const [startDate, setStartDate] = useState<Date>(allStart);
  const [endDate, setEndDate] = useState<Date>(allEnd);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<FilterType[]>(['expense', 'income']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 日期选择器显示控制
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const pickerInProgress = useRef<'start' | 'end' | null>(null);

  // 其他过滤弹窗（多选下拉）
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [paymentSelectAll, setPaymentSelectAll] = useState<'all' | 'none' | 'partial'>('none'); // 'all'=全选，'none'=全不选，'partial'=部分选中
  const [categorySelectAll, setCategorySelectAll] = useState<'all' | 'none' | 'partial'>('none');

  const togglePaymentMethod = (methodId: string) => {
    if (paymentSelectAll === 'all') {
      // 从全选状态退出，变为部分选中
      setPaymentSelectAll('partial');
    }
    setSelectedPaymentMethods(prev => {
      const next = prev.includes(methodId) ? prev.filter(id => id !== methodId) : [...prev, methodId];
      // 更新全选状态
      if (next.length === 0) {
        setPaymentSelectAll('none');
      } else if (next.length === paymentMethods.length) {
        setPaymentSelectAll('all');
      } else {
        setPaymentSelectAll('partial');
      }
      return next;
    });
  };

  const toggleType = (type: FilterType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 付款方式全选/全不选
  const handlePaymentSelectAll = () => {
    if (paymentSelectAll === 'none' || paymentSelectAll === 'partial') {
      // 全选
      setSelectedPaymentMethods([...paymentMethods.map(pm => pm.id)]);
      setPaymentSelectAll('all');
    } else {
      // 全不选
      setSelectedPaymentMethods([]);
      setPaymentSelectAll('none');
    }
  };

  // 分类全选/全不选
  const handleCategorySelectAll = () => {
    const allCats: string[] = [];
    if (selectedTypes.includes('expense')) {
      allCats.push(...expenseCategories);
    }
    if (selectedTypes.includes('income')) {
      allCats.push(...incomeCategories);
    }
    if (categorySelectAll === 'none' || categorySelectAll === 'partial') {
      // 全选
      setSelectedCategories(allCats);
      setCategorySelectAll('all');
    } else {
      // 全不选
      setSelectedCategories([]);
      setCategorySelectAll('none');
    }
  };

  const resetFilters = () => {
    setStartDate(allStart);
    setEndDate(allEnd);
    setSelectedPaymentMethods([]);
    setPaymentSelectAll('none');
    setSelectedTypes(['expense', 'income']);
    setSelectedCategories([]);
    setCategorySelectAll('none');
  };

  // 快捷日期选项
  const quickDateOptions = [
    { label: '本月', fn: () => { const r = getMonthRange(); setStartDate(r.start); setEndDate(r.end); } },
    { label: '上月', fn: () => { const r = getLastMonthRange(); setStartDate(r.start); setEndDate(r.end); } },
    { label: '今年', fn: () => { const r = getThisYearRange(); setStartDate(r.start); setEndDate(r.end); } },
    { label: '去年', fn: () => { const r = getLastYearRange(); setStartDate(r.start); setEndDate(r.end); } },
  ];

  // 分类切换
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const allCats: string[] = [];
      if (selectedTypes.includes('expense')) {
        allCats.push(...expenseCategories);
      }
      if (selectedTypes.includes('income')) {
        allCats.push(...incomeCategories);
      }
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      // 更新全选状态
      if (next.length === 0) {
        setCategorySelectAll('none');
      } else if (next.length === allCats.length) {
        setCategorySelectAll('all');
      } else {
        setCategorySelectAll('partial');
      }
      return next;
    });
  };

  // 更新日期选择器
  const updateDate = (newDate: Date | undefined) => {
    if (!newDate) return;
    if (showDatePicker === 'start') {
      setStartDate(newDate);
    } else if (showDatePicker === 'end') {
      setEndDate(newDate);
    }
    setShowDatePicker(null);
  };

  // 打开开始日期选择器
  const openStartDatePicker = () => {
    if (pickerInProgress.current !== 'start') {
      pickerInProgress.current = 'start';
      setShowDatePicker('start');
    }
  };

  // 打开结束日期选择器
  const openEndDatePicker = () => {
    if (pickerInProgress.current !== 'end') {
      pickerInProgress.current = 'end';
      setShowDatePicker('end');
    }
  };

  // 过滤后的账单（包含日期过滤）
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // 日期过滤
      if (e.createdAt < startDate.getTime() || e.createdAt > endDate.getTime()) return false;
      // 类型过滤
      if (selectedTypes.length > 0 && !selectedTypes.includes(e.type as FilterType)) return false;
      // 付款方式过滤
      if (selectedPaymentMethods.length > 0 && !selectedPaymentMethods.includes(e.paymentMethod)) return false;
      // 分类过滤（支出和收入都适用）
      if (selectedCategories.length > 0 && !selectedCategories.includes(e.category)) return false;
      return true;
    });
  }, [expenses, startDate, endDate, selectedTypes, selectedPaymentMethods, selectedCategories]);

  // 统计信息 - 支出为负，收入为正
  const totalExpense = filteredExpenses
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + (-e.amount), 0);
  const totalIncome = filteredExpenses
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);
  const balance = totalExpense + totalIncome;

  // 分类统计 (支出金额使用绝对值)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredExpenses.filter(e => e.type === 'expense').forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + e.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const totalExpenseAmount = filteredExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  // 收入分类统计
  const incomeCategoriesStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredExpenses.filter(e => e.type === 'income').forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + e.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const totalIncomeAmount = filteredExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  // 付款方式统计 - 支出为负，收入为正
  const paymentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const amount = e.type === 'expense' ? -e.amount : e.amount;
      stats[e.paymentMethod] = (stats[e.paymentMethod] || 0) + amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // 按天分组的账单列表
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    [...filteredExpenses].sort((a, b) => b.createdAt - a.createdAt).forEach(e => {
      const key = formatDate(e.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [filteredExpenses]);

  const getPaymentName = (methodId: string) => {
    const pm = paymentMethods.find(p => p.id === methodId);
    if (pm) return pm.name;
    const defaultMap: Record<string, string> = {
      cash: '现金', wechat: '微信', alipay: '支付宝', bank: '银行卡'
    };
    return defaultMap[methodId] || methodId;
  };

  const getPaymentIcon = (methodId: string) => {
    const pm = paymentMethods.find(p => p.id === methodId);
    if (pm) return pm.name;
    const iconMap: Record<string, string> = {
      cash: '💵', wechat: '💬', alipay: '🔵', bank: '💳'
    };
    return iconMap[methodId] || '📌';
  };

  const getCatEmoji = (cat: string): string => {
    const map: Record<string, string> = {
      '餐饮': '🍜', '交通': '🚌', '购物': '🛒', '居住': '🏠', '娱乐': '🎮',
      '医疗': '💊', '教育': '📚', '通讯': '📱', '服饰': '👔', '其他': '📌',
      '工资': '💰', '奖金': '🎁', '兼职': '🔧', '投资': '📈', '退款': '↩️',
      '红包': '🧧',
    };
    return map[cat] || '📌';
  };

  // 付款方式名称映射
  const categoryNameMap: Record<string, string> = {
    cash: '现金', wechat: '微信', alipay: '支付宝', bank: '银行卡'
  };

  const getCategoryColor = (cat: string): string => {
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#7bed9f', '#70a1ff', '#eccc68', '#a29bfe', '#fd79a8'];
    const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    const index = allCats.indexOf(cat);
    return colors[index % colors.length];
  };

  const filterCount = (selectedCategories.length > 0 ? 1 : 0) + (selectedPaymentMethods.length > 0 ? 1 : 0) + (selectedTypes.length < 2 ? 1 : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 顶部导航 */}
        <View style={styles.header}>
          <Text style={styles.title}>📈 账单统计</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* 过滤条件区域 */}
          <View style={styles.filterSection}>
            {/* 第一行：日期范围 - 单行显示 */}
            <View style={styles.filterRowSingle}>
              <TouchableOpacity onPress={openStartDatePicker} style={styles.datePickerItem}>
                <Text style={styles.datePickerLabel}>开始日期</Text>
                <Text style={[styles.datePickerValue, styles.datePickerValueActive]}>
                  {formatDateCompact(startDate.getTime())}
                </Text>
              </TouchableOpacity>
              <View style={styles.dateRangeToContainer}>
                <Text style={styles.dateRangeTo}>至</Text>
              </View>
              <TouchableOpacity onPress={openEndDatePicker} style={styles.datePickerItem}>
                <Text style={styles.datePickerLabel}>结束日期</Text>
                <Text style={[styles.datePickerValue, styles.datePickerValueActive]}>
                  {formatDateCompact(endDate.getTime())}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 快捷日期选项在同一行 */}
            <View style={styles.quickDateOptionsContainer}>
              {quickDateOptions.map((option) => (
                <TouchableOpacity key={option.label} onPress={option.fn} style={styles.quickDateOptionItem}>
                  <Text style={styles.quickDateOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 展开的日期选择器（在过滤器下方独立显示） */}
            {showDatePicker === 'start' && (
              <View style={styles.inlinePickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      setShowDatePicker(null);
                      pickerInProgress.current = null;
                    }
                  }}
                  textColor="#333"
                  themeVariant="light"
                />
              </View>
            )}
            {showDatePicker === 'end' && (
              <View style={styles.inlinePickerContainer}>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setEndDate(selectedDate);
                      setShowDatePicker(null);
                      pickerInProgress.current = null;
                    }
                  }}
                  textColor="#333"
                  themeVariant="light"
                />
              </View>
            )}

            {/* 第二行：分类 + 付款方式 - 同一行显示 */}
            <View style={styles.filterRowAlign}>
              <TouchableOpacity
                style={[styles.filterChipWide, selectedCategories.length > 0 && styles.filterChipWideActive]}
                onPress={() => setShowCategoryFilter(true)}
              >
                <Text style={styles.filterLabel}>分类</Text>
                <Text style={selectedCategories.length > 0 ? styles.filterChipTextActive : styles.filterChipText}>
                  {selectedCategories.length === 0 ? '全部' : `${selectedCategories.length}项`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChipWide, selectedPaymentMethods.length > 0 && styles.filterChipWideActive]}
                onPress={() => setShowPaymentFilter(true)}
              >
                <Text style={styles.filterLabel}>付款方式</Text>
                <Text style={selectedPaymentMethods.length > 0 ? styles.filterChipTextActive : styles.filterChipText}>
                  {selectedPaymentMethods.length === 0 ? '全部' : `${selectedPaymentMethods.length}项`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 第三行：消费类型 + 重置 */}
            <View style={styles.filterRowAction}>
              <TouchableOpacity
                style={[styles.typeChipExpense, selectedTypes.includes('expense') && styles.typeChipExpenseActive]}
                onPress={() => toggleType('expense')}
              >
                <Text style={selectedTypes.includes('expense') ? styles.typeChipTextActive : styles.typeChipTextExpenseInactive}>
                  支出
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeChipIncome, selectedTypes.includes('income') && styles.typeChipIncomeActive]}
                onPress={() => toggleType('income')}
              >
                <Text style={selectedTypes.includes('income') ? styles.typeChipTextActive : styles.typeChipTextIncomeInactive}>
                  收入
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>重置</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>筛选结果</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItemExpense}>
                <Text style={styles.statLabel}>支出</Text>
                <Text style={[styles.statValueExpense]}>-{formatMoney(Math.abs(totalExpense))}</Text>
              </View>
              <View style={[styles.statItem, styles.incomeItem]}>
                <Text style={styles.statLabel}>收入</Text>
                <Text style={[styles.statValueIncome]}>+{formatMoney(Math.abs(totalIncome))}</Text>
              </View>
              <View style={[styles.statItem, styles.balanceItem]}>
                <Text style={styles.statLabel}>结余</Text>
                <Text style={[styles.statValue, balance >= 0 ? styles.positive : styles.negative]}>
                  {balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(balance))}
                </Text>
              </View>
            </View>
            <Text style={styles.recordCount}>共 {filteredExpenses.length} 条记录</Text>
          </View>

          {/* 支出分类统计 */}
          {categoryStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>支出分类</Text>
              {categoryStats.map(([category, amount]) => {
                const percentage = totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0;
                return (
                  <View key={category} style={styles.catItem}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{getCatEmoji(category)} {category}</Text>
                      <Text style={[styles.catAmount, styles.negative]}>-{formatMoney(amount)}</Text>
                    </View>
                    <View style={styles.catProgress}>
                      <View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: '#2ed573' }]} />
                    </View>
                    <Text style={styles.catPercent}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 收入分类统计 */}
          {incomeCategoriesStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>收入分类</Text>
              {incomeCategoriesStats.map(([category, amount]) => {
                const percentage = totalIncomeAmount > 0 ? Math.round((amount / totalIncomeAmount) * 100) : 0;
                return (
                  <View key={category} style={styles.catItem}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{getCatEmoji(category)} {category}</Text>
                      <Text style={[styles.catAmount, styles.positive]}>+{formatMoney(amount)}</Text>
                    </View>
                    <View style={styles.catProgress}>
                      <View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: '#ff4757' }]} />
                    </View>
                    <Text style={styles.catPercent}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 付款方式统计 */}
          {paymentStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>付款方式</Text>
              {paymentStats.map(([methodId, amount]) => {
                const totalExpense = filteredExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + (-e.amount), 0);
                const totalIncome = filteredExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
                const total = totalExpense + totalIncome;
                const percentage = Math.abs(total) > 0 ? Math.round((Math.abs(amount) / Math.abs(total)) * 100) : 0;
                return (
                  <View key={methodId} style={styles.catItem}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{getPaymentIcon(methodId)}</Text>
                      <Text style={[styles.catAmount, amount >= 0 ? styles.positive : styles.negative]}>
                        {amount >= 0 ? '+' : '-'}{formatMoney(Math.abs(amount))}
                      </Text>
                    </View>
                    <View style={styles.catProgress}>
                      <View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: '#5b6abf' }]} />
                    </View>
                    <Text style={styles.catPercent}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 账单列表 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>账单明细</Text>
            {Object.keys(groupedExpenses).length > 0 ? (
              Object.entries(groupedExpenses).map(([groupName, items]) => (
                <View key={groupName}>
                  <Text style={styles.groupHeader}>{groupName}</Text>
                  {items.map(e => {
                    const categories = e.type === 'expense' ? expenseCategories : incomeCategories;
                    const icon = categories.includes(e.category) ? getCatEmoji(e.category) : '';
                    return (
                      <View key={e.id} style={styles.expenseRow}>
                        <View style={styles.expenseLeft}>
                          {icon && <Text style={styles.expenseIcon}>{icon}</Text>}
                          <View style={styles.expenseInfo}>
                            <Text style={styles.expenseCat}>{e.category}</Text>
                            <Text style={styles.expenseNote}>{e.note || '—'}</Text>
                          </View>
                        </View>
                        <View style={styles.expenseRight}>
                          <Text style={[styles.expenseAmount, e.type === 'expense' ? styles.expenseAmountExpense : styles.expenseAmountIncome]}>
                            {e.type === 'expense' ? '-' : '+'}{formatMoney(e.amount).replace('¥ ', '')}
                          </Text>
                          <Text style={styles.expensePayment}>{getPaymentName(e.paymentMethod)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>筛选条件下暂无记录</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 付款方式多选弹窗 */}
        <Modal visible={showPaymentFilter} transparent animationType="fade">
          <TouchableOpacity
            style={[styles.bottomOverlay, { paddingTop: statusBarHeight }]}
            activeOpacity={1}
            onPress={() => setShowPaymentFilter(false)}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <Text style={styles.bottomSheetTitle}>选择付款方式（可多选）</Text>
                  <View style={styles.selectAllButtonContainer}>
                    <TouchableOpacity
                      style={[styles.selectAllBtn, paymentSelectAll === 'all' && styles.selectAllBtnActive]}
                      onPress={handlePaymentSelectAll}
                    >
                      <Text style={[styles.selectAllBtnText, paymentSelectAll === 'all' && styles.selectAllBtnTextActive]}>
                        {paymentSelectAll === 'all' ? '全不选' : '全选'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowPaymentFilter(false)}>
                  <Text style={styles.bottomSheetClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bottomSheetList} showsVerticalScrollIndicator={false}>
                {paymentMethods.length === 0 ? (
                  <View style={styles.emptyFilterMessage}>
                    <Text style={styles.emptyFilterText}>暂无数据</Text>
                  </View>
                ) : (
                  paymentMethods.map(pm => {
                    const isSelected = selectedPaymentMethods.includes(pm.id);
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[styles.multiSelectItem, isSelected && styles.multiSelectItemActive]}
                        onPress={() => togglePaymentMethod(pm.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.multiSelectItemText}>{pm.name}</Text>
                        <View style={styles.checkmarkContainer}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.bottomSheetConfirm}
                onPress={() => setShowPaymentFilter(false)}
              >
                <Text style={styles.bottomSheetConfirmText}>确认</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 消费分类多选弹窗（包含支出和收入） */}
        <Modal visible={showCategoryFilter} transparent animationType="fade">
          <TouchableOpacity
            style={[styles.bottomOverlay, { paddingTop: statusBarHeight }]}
            activeOpacity={1}
            onPress={() => setShowCategoryFilter(false)}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <Text style={styles.bottomSheetTitle}>选择分类（可多选）</Text>
                  <View style={styles.selectAllButtonContainer}>
                    <TouchableOpacity
                      style={[styles.selectAllBtn, categorySelectAll === 'all' && styles.selectAllBtnActive]}
                      onPress={handleCategorySelectAll}
                    >
                      <Text style={[styles.selectAllBtnText, categorySelectAll === 'all' && styles.selectAllBtnTextActive]}>
                        {categorySelectAll === 'all' ? '全不选' : '全选'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
                  <Text style={styles.bottomSheetClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bottomSheetList} showsVerticalScrollIndicator={false}>
                {expenseCategories.length === 0 && incomeCategories.length === 0 ? (
                  <View style={styles.emptyFilterMessage}>
                    <Text style={styles.emptyFilterText}>暂无数据</Text>
                  </View>
                ) : (
                  <>
                    {selectedTypes.includes('expense') && (
                      <>
                        <Text style={styles.catSectionTitle}>📝 支出分类</Text>
                        {expenseCategories.map(cat => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <TouchableOpacity
                              key={`expense-${cat}`}
                              style={[styles.multiSelectItem, isSelected && styles.multiSelectItemActiveExpense]}
                              onPress={() => toggleCategory(cat)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.multiSelectItemText}>{cat}</Text>
                              <View style={styles.checkmarkContainer}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}

                    {selectedTypes.includes('income') && (
                      <>
                        <Text style={styles.catSectionTitle}>💰 收入分类</Text>
                        {incomeCategories.map(cat => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <TouchableOpacity
                              key={`income-${cat}`}
                              style={[styles.multiSelectItem, isSelected && styles.multiSelectItemActiveIncome]}
                              onPress={() => toggleCategory(cat)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.multiSelectItemText}>{cat}</Text>
                              <View style={styles.checkmarkContainer}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.bottomSheetConfirm}
                onPress={() => setShowCategoryFilter(false)}
              >
                <Text style={styles.bottomSheetConfirmText}>确认</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 消费类型多选弹窗（备用，当前直接在界面上切换） */}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { fontSize: 24, color: '#888', padding: 4 },
  // 过滤区域
  filterSection: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  // 第一行：日期范围单行 - 紧凑布局
  filterRowSingle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 4 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#666', minWidth: 55 },
  filterChip: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  filterChipActive: { backgroundColor: '#4a5aa0' },
  filterChipText: { fontSize: 12, color: '#333' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  dateRangeTo: { fontSize: 13, color: '#999', paddingHorizontal: 2 },
  // 快捷日期选项 - 铺满全行
  quickDateOptionsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  quickDateOptionItem: { flex: 1, backgroundColor: '#e8e8ff', borderRadius: 4, paddingVertical: 6, alignItems: 'center' },
  quickDateOptionText: { fontSize: 13, color: '#5b6abf', fontWeight: '600' },
  datePickerItem: { flex: 1, backgroundColor: '#f0f0ff', borderRadius: 8, padding: 10, alignItems: 'center' },
  datePickerLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  datePickerValue: { fontSize: 14, color: '#5b6abf', fontWeight: '700' },
  datePickerValueActive: { color: '#4a5aa0' },
  dateRangeToContainer: { width: 40, alignItems: 'center' },
  // 展开的日期选择器容器
  inlinePickerContainer: { 
    backgroundColor: '#fafafa', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee', 
    padding: 12, 
    marginBottom: 12,
  },
  // 第二行：分类 + 付款方式 左对齐 - 适配紧凑布局
  filterRowAlign: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  filterLabelWide: { fontSize: 13, fontWeight: '700', color: '#333', width: 40, flexShrink: 0 },
  filterChipWide: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f5f6fa', flex: 1 },
  filterChipWideActive: { backgroundColor: '#4a5aa0' },
  // 第三行：消费类型 + 重置
  filterRowAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, gap: 12 },
  resetBtnWrapper: { flexShrink: 0 },
  typeToggleGroup: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: '#f5f6fa', borderWidth: 1, borderColor: '#e0e0e0', flex: 1, alignItems: 'center' },
  typeChipExpense: { backgroundColor: '#f0fff0', borderColor: '#2ed573', flex: 1, alignItems: 'center' },
  typeChipExpenseActive: { backgroundColor: '#2ed573', borderWidth: 0 },
  typeChipIncome: { backgroundColor: '#fff0f0', borderColor: '#ff4757', flex: 1, alignItems: 'center' },
  typeChipIncomeActive: { backgroundColor: '#ff4757', borderWidth: 0 },
  typeChipText: { fontSize: 11, color: '#666' },
  typeChipTextExpenseInactive: { color: '#2ed573', fontSize: 14, fontWeight: '600' },
  typeChipTextIncomeInactive: { color: '#ff4757', fontSize: 14, fontWeight: '600' },
  typeChipTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: '#f5f6fa' },
  resetBtnText: { fontSize: 12, color: '#666' },
  statsCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statsCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  statsRow: { flexDirection: 'row' },
  statItemExpense: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  incomeItem: { paddingHorizontal: 4 },
  balanceItem: {},
  statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValueExpense: { fontSize: 18, fontWeight: 'bold', color: '#2ed573' },
  statValueIncome: { fontSize: 18, fontWeight: 'bold', color: '#ff4757' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  positive: { color: '#ff4757' },
  negative: { color: '#2ed573' },
  recordCount: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 8 },
  // 分类和付款方式过滤弹窗
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomSheetTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  selectAllButtonContainer: { flexShrink: 0 },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5b6abf',
    marginLeft: 8,
  },
  selectAllBtnActive: {
    backgroundColor: '#5b6abf',
    borderColor: '#5b6abf',
  },
  selectAllBtnText: {
    fontSize: 13,
    color: '#5b6abf',
    fontWeight: '600',
  },
  selectAllBtnTextActive: {
    color: '#fff',
  },
  bottomSheetClose: { fontSize: 24, color: '#999', padding: 4 },
  bottomSheetList: { paddingHorizontal: 20, maxHeight: 300 },
  multiSelectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 10, marginVertical: 4, backgroundColor: '#f9f9f9' },
  multiSelectItemActive: { backgroundColor: '#f0fff0' },
  multiSelectItemText: { fontSize: 15, color: '#333', flex: 1 },
  checkmarkContainer: { padding: 4 },
  checkmark: { fontSize: 18, color: '#2ed573', fontWeight: 'bold' },
  bottomSheetConfirm: { marginHorizontal: 20, marginTop: 16, paddingVertical: 14, backgroundColor: '#5b6abf', borderRadius: 10, alignItems: 'center' },
  bottomSheetConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyFilterMessage: { paddingVertical: 40, alignItems: 'center' },
  emptyFilterText: { fontSize: 14, color: '#999' },
  catSectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', paddingHorizontal: 4, paddingVertical: 8, marginTop: 8 },
  multiSelectItemActiveExpense: { backgroundColor: '#f0fff0' },
  multiSelectItemActiveIncome: { backgroundColor: '#fff0f0' },
  // 分类和付款方式
  section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  catItem: { marginBottom: 20 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  catAmount: { fontSize: 14, fontWeight: 'bold', color: '#5b6abf' },
  catProgress: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  catBar: { height: '100%', borderRadius: 3 },
  catPercent: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' },
  // 账单列表
  groupHeader: { fontSize: 13, color: '#666', paddingHorizontal: 4, paddingVertical: 10, fontWeight: '600' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseIcon: { fontSize: 24, marginRight: 10 },
  expenseInfo: { flexShrink: 1 },
  expenseCat: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  expenseNote: { fontSize: 12, color: '#999', marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', marginLeft: 8 },
  expenseAmount: { fontSize: 15, fontWeight: '700' },
  expenseAmountExpense: { color: '#2ed573' },
  expenseAmountIncome: { color: '#ff4757' },
  expensePayment: { fontSize: 11, color: '#bbb', marginTop: 2 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#aaa' },
});
