---
name: expo-stats-view-remove-date-range-filter
description: Remove date range filter from StatsView and use inline datetime pickers
source: auto-skill
extracted_at: '2026-06-04T16:30:00.000Z'
---

# StatsView 日期范围过滤移除 & 内联时间选择器优化

## 问题背景

用户反馈两个主要问题：
1. **记账/编辑界面**：点击日期或时间其中一个确定后再选另一个会循环弹出关不掉
2. **账单统计页面闪退**：Android 手机上 DateTimePicker 直接渲染在 ScrollView 中会导致闪退

最终方案是移除日期范围过滤条件，并将 DateTimePicker 改为内联显示模式（非弹窗）。

## 技术方案

### 1. StatsView.tsx - 移除日期范围过滤

**修改文件**：`C:\jizhang\src\screens\StatsView.tsx`

**关键变更**：
- 删除 `startDate`、`endDate` 状态变量
- 删除 `showStartPicker`、`showEndPicker` 显示控制
- 删除 `formatDateDisplay` 辅助函数
- 从 `filteredExpenses` 的 useMemo 中移除日期范围过滤逻辑
- 删除所有 DateTimePicker、Platform 引用
- 删除相关 iOS/Android 平台特定代码

**代码示例**：
```typescript
// 旧代码（有日期过滤）
const [startDate, setStartDate] = useState<Date>(() => { ... });
const [endDate, setEndDate] = useState<Date>(new Date());
const filteredExpenses = useMemo(() => {
  const startTs = startDate.getTime();
  const endTs = endDate.getTime();
  return expenses.filter(e => {
    if (e.createdAt < startTs || e.createdAt > endDateWithTime.getTime()) return false;
    // ... 其他过滤
  });
}, [expenses, startDate, endDate, ...]);

// 新代码（无日期过滤）
const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
const filteredExpenses = useMemo(() => {
  return expenses.filter(e => {
    // 类型过滤
    if (selectedTypes.length > 0 && !selectedTypes.includes(e.type as FilterType)) return false;
    // 付款方式过滤
    if (selectedPaymentMethods.length > 0 && !selectedPaymentMethods.includes(e.paymentMethod)) return false;
    // 分类过滤
    if (selectedCategories.length > 0 && e.type === 'expense' && !selectedCategories.includes(e.category)) return false;
    return true;
  });
}, [expenses, selectedTypes, selectedPaymentMethods, selectedCategories]);
```

**UI 层变更**：
- 删除"日期范围"标题行
- 删除开始/结束日期选择器按钮
- 删除 "至" 分隔符
- 删除 Android/iOS 平台的 DateTimePicker 组件

### 2. AddExpenseScreen.tsx - 内联 DateTimePicker

**关键变更**：
- 将 Modal 包裹的 DateTimePicker 改为条件渲染的内联形式
- 使用 `DateTimePicker` 的 `onChange` 自动确认并关闭选择器
- 删除 confirm/cancel 按钮

**代码示例**：
```typescript
// 旧代码（Modal 方式）
<Modal visible={showDateSelector} transparent animationType="fade">
  <View style={styles.datePickerOverlay}>
    <DateTimePicker value={tempDateValue} mode="date" onChange={handleDateChange} />
    <View style={styles.datePickerButtons}>
      <TouchableOpacity onPress={handleDateConfirm}>确定</TouchableOpacity>
    </View>
  </View>
</Modal>

// 新代码（inline 方式）
<View style={styles.dateTimeRow}>
  {showDateSelector && (
    <DateTimePicker
      value={tempDateValue}
      mode="date"
      display="spinner"
      onChange={handleDateChange}
      style={styles.inlineDatePicker}
    />
  )}
</View>

// onChange 处理（自动确认）
const handleDateChange = (_: any, selected?: Date) => {
  if (selected) {
    setTempDateValue(selected);
    setDateDisplay(getFormattedDate(selected));
    setShowDateSelector(false); // 选择后立即关闭
  }
};
```

## 构建验证

**命令**：
```bash
cd C:\jizhang\android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

**输出路径**：`android/app/build/outputs/apk/release/app-release.apk`

## TypeScript 检查

```bash
npx tsc --noEmit
```

确保无编译错误。

## 注意事项

1. **StatsView 不再支持按日期筛选**：用户现在只能通过分类、付款方式、消费类型来过滤账单
2. **Inline Picker 行为**：一旦选择日期/时间立即生效并关闭选择器，无法取消
3. **Android 兼容性**：移除了可能导致闪退的 ScrollView 内直接渲染 DateTimePicker 的代码

## 相关文件

- `src/screens/StatsView.tsx` - 主统计视图
- `src/screens/AddExpenseScreen.tsx` - 记账/编辑界面
- `src/types.ts` - PaymentMethod 接口定义

## 参考文档

- Expo DateTimePicker docs: https://docs.expo.dev/versions/v56.0.0/sdk/datetimepicker/
- React Native Platform: https://reactnative.dev/docs/platform
