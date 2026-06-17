---
name: expo-stats-view-datetime-picker-roller-modal
description: 账单统计添加滚筒式日期选择器模态框（非滚轮点击）
source: auto-skill
extracted_at: '2026-06-04T05:15:00.000Z'
---

# Expo StatsView - 滚筒式日期选择器模态框实现

## 功能概述
在账单统计页面添加日期范围过滤功能，使用 `@react-native-community/datetimepicker` 的滚筒式 (spinner) 风格选择器，通过底部弹窗模态框展示。

## 问题背景
之前的版本移除了日期范围过滤以解决 Android 闪退问题，但用户需要按日期筛选账单数据的需求仍然存在。新方案采用模态框方式避免 ScrollView 中直接渲染 DateTimePicker 导致的崩溃。

## 技术方案

### 1. 新增默认日期范围工具函数

**文件**: `src/types.ts`

```typescript
/** 获取默认日期范围（最近 30 天） */
export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
```

**要点**:
- 默认显示最近 30 天的数据
- 开始时间设为当日 00:00:00，结束时间设为 23:59:59
- 返回 Date 对象而非时间戳，方便 UI 显示和二次操作

### 2. StatsView.tsx - 日期状态管理

**关键变更**:

```typescript
import DateTimePicker from '@react-native-community/datetimepicker';

// 初始日期范围（最近 30 天）
const initialStart = getDefaultDateRange().start;
const initialEnd = getDefaultDateRange().end;

// 过滤条件 + 日期状态
const [startDate, setStartDate] = useState<Date>(initialStart);
const [endDate, setEndDate] = useState<Date>(initialEnd);

// 日期选择器控制状态
const [dateModalVisible, setDateModalVisible] = useState(false);
const [tempStartDate, setTempStartDate] = useState<Date>(initialStart);
const [tempEndDate, setTempEndDate] = useState<Date>(initialEnd);

// 打开日期选择器（平台检测）
const openDatePicker = () => {
  if (Platform.OS === 'android') {
    setDateModalVisible(true);
  } else {
    setShowDatePicker(true); // iOS 备用方案
  }
};
```

**要点**:
- 使用临时状态 (`tempStartDate`, `tempEndDate`) 用于编辑
- 提交时再更新正式状态 (`setStartDate`, `setEndDate`)
- Android 和 iOS 分别处理（虽然最终统一用 Modal 包裹）

### 3. 更新日期过滤逻辑

**修改前**：
```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter(e => {
    // ... 其他过滤
    return true;
  });
}, [expenses, selectedTypes, selectedPaymentMethods, selectedCategories]);
```

**修改后**：
```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter(e => {
    // 日期过滤（比较时间戳）
    if (e.createdAt < startDate.getTime() || e.createdAt > endDate.getTime()) return false;
    // 类型过滤
    if (selectedTypes.length > 0 && !selectedTypes.includes(e.type as FilterType)) return false;
    // 付款方式过滤
    if (selectedPaymentMethods.length > 0 && !selectedPaymentMethods.includes(e.paymentMethod)) return false;
    // 分类过滤
    if (selectedCategories.length > 0 && e.type === 'expense' && !selectedCategories.includes(e.category)) return false;
    return true;
  });
}, [expenses, startDate, endDate, selectedTypes, selectedPaymentMethods, selectedCategories]);
```

**要点**:
- `createdAt` 是数字时间戳，需与 `startDate.getTime()`、`endDate.getTime()` 比较
- 将 `startDate`、`endDate` 添加到 dependency array

### 4. UI - 日期范围过滤器

```tsx
<View style={styles.filterSection}>
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>日期范围</Text>
    <TouchableOpacity
      style={[styles.filterChip, styles.filterChipActive]}
      onPress={openDatePicker}
    >
      <Text style={styles.filterChipTextActive}>
        {formatDate(startDate.getTime())} - {formatDate(endDate.getTime())}
      </Text>
    </TouchableOpacity>
  </View>
  
  {/* 其他过滤器... */}
</View>
```

**要点**:
- 位置放在第一个过滤器行，符合用户习惯
- 使用紫色高亮样式区分已激活状态
- 调用 `getTime()` 将 Date 转为时间戳传给 `formatDate()`

### 5. 滚筒式日期选择器模态框

```tsx
{/* 日期选择器模态框 - Android 原生滚轮风格 */}
<Modal visible={dateModalVisible} transparent animationType="fade">
  <TouchableOpacity
    style={[styles.dateOverlay, { paddingTop: statusBarHeight }]}
    activeOpacity={1}
    onPress={() => setDateModalVisible(false)}
  >
    <View style={styles.datePickerContainer}>
      <View style={styles.datePickerHeader}>
        <TouchableOpacity onPress={() => setDateModalVisible(false)}>
          <Text style={styles.datePickerCancel}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.datePickerTitle}>选择日期范围</Text>
        <TouchableOpacity onPress={updateDateRange}>
          <Text style={styles.datePickerConfirm}>确定</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.datePickerContent}>
        {/* 开始日期滚动选择器 */}
        <View style={styles.datePickerSection}>
          <Text style={styles.datePickerLabel}>起始日期</Text>
          <View style={styles.datePickerWheel}>
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'ios' && selectedDate) {
                  setTempStartDate(selectedDate);
                }
              }}
              textColor="#333"
              themeVariant="light"
            />
          </View>
        </View>

        {/* 分隔线 */}
        <View style={styles.datePickerDivider} />

        {/* 结束日期滚动选择器 */}
        <View style={styles.datePickerSection}>
          <Text style={styles.datePickerLabel}>结束日期</Text>
          <View style={styles.datePickerWheel}>
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'ios' && selectedDate) {
                  setTempEndDate(selectedDate);
                }
              }}
              textColor="#333"
              themeVariant="light"
            />
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
</Modal>
```

**要点**:
- `display="spinner"` 启用滚筒式滚动效果
- Android 上的 `onChange` 自动确认，iOS 上需手动判断
- 两个选择器上下排列，用分隔线区隔
- 整个组件用半透明遮罩 + 底部弹出样式包裹

### 6. 提交日期范围

```typescript
const updateDateRange = () => {
  setStartDate(tempStartDate);
  setEndDate(tempEndDate);
  setDateModalVisible(false);
};
```

### 7. 重置所有过滤器

```typescript
const resetFilters = () => {
  setStartDate(initialStart);
  setEndDate(initialEnd);
  setSelectedPaymentMethods([]);
  setSelectedTypes(['expense', 'income']);
  setSelectedCategories([]);
};
```

## CSS 样式定义

```typescript
// 日期选择器样式
dateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
datePickerContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
datePickerCancel: { fontSize: 16, color: '#666' },
datePickerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
datePickerConfirm: { fontSize: 16, color: '#5b6abf', fontWeight: '600' },
datePickerContent: { padding: 20 },
datePickerSection: { marginBottom: 20 },
datePickerLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10 },
datePickerWheel: { backgroundColor: '#f5f6fa', borderRadius: 12, overflow: 'hidden' },
datePickerDivider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
```

## 构建验证

**命令**:
```bash
cd C:\jizhang
npx tsc --noEmit
```

确保无 TypeScript 编译错误。

## 注意事项

1. **platform 分支**: iOS 和 Android 对 DateTimePicker 的 onChange 行为不同
   - Android: 一旦滚动立即生效
   - iOS: 可滚动查看不立即生效
   - 当前仅处理了 iOS 的情况（设置条件 `if (Platform.OS === 'ios' && selectedDate)`）

2. **日期格式显示**: `formatDate()` 接收的是时间戳，需要显式调用 `.getTime()` 转换

3. **性能考虑**: 由于使用了 `useMemo` 依赖数组中包含 `startDate`/`endDate`，每次更改都会重新计算过滤结果，但在常规数据量下影响不大

4. **用户体验**: 
   - 支持取消操作（点关闭或取消按钮）
   - 重置按钮恢复默认 30 天范围
   - 视觉上明确显示当前选中的日期范围

## 相关文件

- `src/screens/StatsView.tsx` - 主统计视图，包含日期选择器 UI
- `src/types.ts` - 新增 `getDefaultDateRange()` 工具函数
- `package.json` - 已有 `@react-native-community/datetimepicker` 依赖

## 参考文档

- Expo DateTimePicker docs (v56): https://docs.expo.dev/versions/v56.0.0/sdk/datetimepicker/
- React Native Platform: https://reactnative.dev/docs/platform
- @react-native-community/datetimepicker GitHub: https://github.com/react-native-community/datetimepicker

## 与其他日期选择方案的对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 滚轮式 (spinner) 模态框 | 原生体验，跨平台一致 | 不能直观看到日期关系 | 精确选择单个日期 |
| 双月历组件 | 可看到多个月份，直观显示范围 | 实现复杂，自定义成本高 | 需要可视化日期范围 |
| 内联 Picker | 简化交互流程 | 无法取消选择 | 记账输入时的快速日期选择 |

本方案选择滚轮式模态框的原因：
1. 代码复杂度低，维护成本低
2. 充分利用现有依赖库的能力
3. 兼容之前移除日期过滤后的 UX 预期
4. 适配 Android/iOS 原生滚动行为
