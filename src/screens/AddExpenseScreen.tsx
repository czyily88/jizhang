import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert, Platform, StatusBar, BackHandler } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../AppContext';
import { formatMoney, DEFAULT_EXPENSE_CATEGORIES as EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES as INCOME_CATEGORIES, type Expense } from '../types';

interface AddExpenseScreenProps {
  onClose: () => void;
  expense?: Expense | null;
  isEditing?: boolean;
}

export default function AddExpenseScreen({ onClose, expense, isEditing = false }: AddExpenseScreenProps) {
  const { addExpense, editExpense, paymentMethods, expenseCategories: savedExpenseCats, incomeCategories: savedIncomeCats } = useApp();

  const editing = !!expense && isEditing;
  const [type, setType] = useState<'expense' | 'income'>(() => editing ? expense!.type : 'expense');
  
  const categories = type === 'expense'
    ? (savedExpenseCats.length > 0 ? savedExpenseCats : EXPENSE_CATEGORIES)
    : (savedIncomeCats.length > 0 ? savedIncomeCats : INCOME_CATEGORIES);
  
  const [amountStr, setAmountStr] = useState(editing ? (expense!.amount / 100).toFixed(2) : '');
  const [category, setCategory] = useState(() => {
    if (editing) return expense!.category;
    return categories[0] || (type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  });
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (editing && expense!.paymentMethod) return expense!.paymentMethod;
    return paymentMethods.length > 0 ? paymentMethods[0].id : '';
  });
  const [note, setNote] = useState(editing ? expense!.note || '' : '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  // 初始日期时间
  const initialDateTime = editing ? new Date(expense!.createdAt) : new Date();
  
  // 日期和时间分别存储为字符串（用于显示）
  const [dateDisplay, setDateDisplay] = useState(getFormattedDate(initialDateTime));
  const [timeDisplay, setTimeDisplay] = useState(getFormattedTime(initialDateTime));
  
  // 选择器控制状态
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  
  // Picker 内部使用的临时值
  const [tempDateValue, setTempDateValue] = useState(initialDateTime);
  const [tempTimeValue, setTempTimeValue] = useState(initialDateTime);

  const toggleType = (newType: 'expense' | 'income') => {
    if (newType !== type) {
      setType(newType);
      setCategory(categories[0]);
    }
  };

  const cancel = () => {
    onClose();
  };

  const handleSubmit = () => {
    const amount = Math.round(parseFloat(amountStr) * 100);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('提示', '请选择付款方式');
      return;
    }

    try {
      // 解析日期和时间字符串创建最终日期
      let combined = dateDisplay;
      if (combined === '今天') {
        const now = new Date();
        combined = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (combined === '昨天') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        combined = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      }
      
      const timeParts = timeDisplay.split(':');
      const year = parseInt(combined.split('-')[0]);
      const month = parseInt(combined.split('-')[1]) - 1;
      const day = parseInt(combined.split('-')[2]);
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      
      const finalDateTime = new Date(year, month, day, hour, minute).getTime();

      if (editing && expense) {
        editExpense(expense.id, { type, amount, category, paymentMethod, note: note.trim(), createdAt: finalDateTime });
      } else {
        addExpense({ type, amount, category, paymentMethod, note: note.trim(), createdAt: finalDateTime });
      }
      onClose();
    } catch (e) {
      Alert.alert('错误', '日期时间格式错误，请重新选择');
    }
  };

  const handleBackPress = () => {
    cancel();
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const pm = paymentMethods.find(m => m.id === paymentMethod);
  const statusBarHeight = StatusBar.currentHeight || 0;

  // 辅助函数
  function getFormattedDate(d: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return '今天';
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getFormattedTime(d: Date): string {
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${min}`;
  }

  function formatDate(y: number, m: number, d: number): string {
    const monthStr = (m + 1).toString().padStart(2, '0');
    const dayStr = d.toString().padStart(2, '0');
    return `${y}-${monthStr}-${dayStr}`;
  }

  // 日期和时间选择器处理（inline 模式）
  const handleDateChange = (_: any, selected?: Date) => {
    if (selected) {
      setTempDateValue(selected);
      setDateDisplay(getFormattedDate(selected));
      setShowDateSelector(false);
    }
  };

  const handleTimeChange = (_: any, selected?: Date) => {
    if (selected) {
      setTempTimeValue(selected);
      setTimeDisplay(getFormattedTime(selected));
      setShowTimeSelector(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalContent, { paddingTop: statusBarHeight, maxHeight: '95%' }]}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={cancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{editing ? '编辑账单' : '记一笔'}</Text>
            <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
              <Text style={styles.saveText}>{editing ? '更新' : '保存'}</Text>
            </TouchableOpacity>
          </View>

          {/* 收支切换 */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
              onPress={() => toggleType('expense')}
            >
              <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActiveExpense]}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
              onPress={() => toggleType('income')}
            >
              <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActiveIncome]}>收入</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 金额输入 */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>金额</Text>
              <TextInput
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0.00"
                placeholderTextColor="#ddd"
                keyboardType="numeric"
                autoFocus={true}
                style={styles.amountInput}
              />
            </View>

            {/* 日期和时间 - 同一行 */}
            <View style={styles.dateTimeRow}>
              {/* 日期 */}
              <View style={styles.dateTimeField}>
                <Text style={styles.pickerLabel}>日期</Text>
                <TouchableOpacity
                  style={styles.dateTimePickerButton}
                  onPress={() => {
                    setTempDateValue(new Date(dateDisplay === '今天' ? new Date() : new Date(getParsedDate(dateDisplay))));
                    setShowDateSelector(true);
                  }}
                >
                  <Text style={styles.dateTimeValue}>{dateDisplay}</Text>
                  <Text style={styles.pickerArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* 时间 */}
              <View style={styles.dateTimeField}>
                <Text style={styles.pickerLabel}>时间</Text>
                <TouchableOpacity
                  style={styles.dateTimePickerButton}
                  onPress={() => {
                    const baseDate = new Date(dateDisplay === '今天' ? new Date() : new Date(getParsedDate(dateDisplay)));
                    const [h, m] = timeDisplay.split(':').map(Number);
                    baseDate.setHours(h, m);
                    setTempTimeValue(baseDate);
                    setShowTimeSelector(true);
                  }}
                >
                  <Text style={styles.dateTimeValue}>{timeDisplay}</Text>
                  <Text style={styles.pickerArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 日期选择器 - inline 显示 */}
            <View style={styles.dateTimeRow}>
              {showDateSelector && (
                <DateTimePicker
                  value={tempDateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.inlineDatePicker}
                />
              )}
            </View>

            {/* 时间选择器 - inline 显示 */}
            <View style={styles.dateTimeRow}>
              {showTimeSelector && (
                <DateTimePicker
                  value={tempTimeValue}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.inlineDatePicker}
                />
              )}
            </View>

            {/* 分类和付款方式 - 同一行 */}
            <View style={styles.categoryPaymentRow}>
              {/* 分类 */}
              <View style={styles.categoryField}>
                <Text style={styles.pickerLabel}>分类</Text>
                <TouchableOpacity
                  style={styles.pickerInputWrapper}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text style={styles.pickerInput}>{category}</Text>
                  <Text style={styles.pickerArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* 付款方式 */}
              <View style={styles.paymentField}>
                <Text style={styles.pickerLabel}>{type === 'expense' ? '付款' : '收款'}方式</Text>
                <TouchableOpacity
                  style={styles.pickerInputWrapper}
                  onPress={() => setShowPaymentPicker(true)}
                >
                  <Text style={styles.pickerInput}>{pm?.name || '未选择'}</Text>
                  <Text style={styles.pickerArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 备注 */}
            <View style={styles.noteSection}>
              <Text style={styles.pickerLabel}>备注（可选）</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="随便写点什么..."
                placeholderTextColor="#ccc"
                style={styles.noteInput}
                autoFocus={false}
                multiline
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* 分类选择弹窗 */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.pickerOverlay, { paddingTop: statusBarHeight }]}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={[styles.pickerBottomSheet, { marginTop: 'auto' }]}>
            <Text style={styles.pickerTitle}>选择分类</Text>
            <ScrollView style={styles.pickerList} contentContainerStyle={{ paddingBottom: 30 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerListItem, category === cat && styles.pickerListItemSelected]}
                  onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                >
                  <Text style={styles.pickerListItemText}>{cat}</Text>
                  {category === cat && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: 30 }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 付款方式选择弹窗 */}
      <Modal visible={showPaymentPicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.pickerOverlay, { paddingTop: statusBarHeight }]}
          activeOpacity={1}
          onPress={() => setShowPaymentPicker(false)}
        >
          <View style={[styles.pickerBottomSheet, { marginTop: 'auto' }]}>
            <Text style={styles.pickerTitle}>{type === 'expense' ? '选择付款方式' : '选择收款方式'}</Text>
            <ScrollView style={styles.pickerList} contentContainerStyle={{ paddingBottom: 30 }}>
              {paymentMethods.length === 0 ? (
                <Text style={styles.pickerEmpty}>暂无付款方式，请先在设置中添加</Text>
              ) : paymentMethods.map(pm => (
                <TouchableOpacity
                  key={pm.id}
                  style={[styles.pickerListItem, paymentMethod === pm.id && styles.pickerListItemSelected]}
                  onPress={() => { setPaymentMethod(pm.id); setShowPaymentPicker(false); }}
                >
                  <Text style={styles.pickerListItemText}>{pm.name}</Text>
                  {paymentMethod === pm.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: 30 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

// 辅助函数：解析日期字符串
function getParsedDate(dateStr: string): Date {
  if (dateStr === '今天') return new Date();
  if (dateStr === '昨天') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cancelBtn: { padding: 8 },
  cancelText: { color: '#999', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  saveBtn: { padding: 8 },
  saveText: { color: '#5b6abf', fontSize: 16, fontWeight: '600' },
  typeToggle: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f5f6fa' },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  typeBtnActiveExpense: { backgroundColor: '#2ed573' },
  typeBtnActiveIncome: { backgroundColor: '#ff4757' },
  typeBtnText: { fontSize: 15, color: '#999', fontWeight: '600' },
  typeBtnTextActiveExpense: { color: '#fff' },
  typeBtnTextActiveIncome: { color: '#fff' },
  amountSection: { margin: 20, alignItems: 'center' },
  amountLabel: { fontSize: 13, color: '#999', marginBottom: 8 },
  amountInput: { fontSize: 42, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', maxWidth: '100%' },
  
  // 日期和时间样式（同一行）
  dateTimeRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16 },
  dateTimeField: { flex: 1 },
  pickerLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  dateTimePickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fafafa' },
  dateTimeValue: { fontSize: 15, color: '#333', flex: 1 },
  pickerArrow: { fontSize: 18, color: '#ccc' },

  // 内联日期/时间选择器样式
  inlineDatePicker: { marginVertical: 8, width: '100%' },

  // 分类和付款方式样式（同一行）
  categoryPaymentRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginTop: 8 },
  categoryField: { flex: 1 },
  paymentField: { flex: 1 },
  pickerInputWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fafafa' },
  pickerInput: { fontSize: 15, color: '#333', flex: 1 },
  
  // 备注样式
  noteSection: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  noteInput: { fontSize: 14, color: '#333', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', minHeight: 80, textAlignVertical: 'top' },
  
  // Picker 底部弹窗样式
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerBottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 16 },
  pickerList: { paddingHorizontal: 16 },
  pickerListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 10, marginVertical: 2 },
  pickerListItemSelected: { backgroundColor: '#ede9ff' },
  pickerListItemText: { fontSize: 16, color: '#333' },
  checkmark: { fontSize: 18, color: '#5b6abf' },
  pickerEmpty: { textAlign: 'center', color: '#aaa', padding: 20 },
});
