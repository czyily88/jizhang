---
name: expo-stats-view-independent-date-pickers
description: 账单统计独立滚筒式日期选择器（开始/结束分开 + 当月默认 + 三行双栏布局）
source: auto-skill
extracted_at: '2026-06-04T05:37:47.978Z'
---

# Expo StatsView - 独立滚筒式日期选择器（优化版）

## 功能概述
在账单统计页面实现独立的开始日期和结束日期选择器，使用 `@react-native-community/datetimepicker` 的滚筒式 (spinner) 风格。每个日期有独立的弹窗，默认显示当月范围，UI 采用三行双栏布局优化。

## 问题背景
之前的单模态框方案同时显示开始和结束日期选择器，但用户需要：
1. 更灵活地单独调整开始或结束日期
2. 更直观的当月范围作为默认值
3. 更紧凑的 UI 布局以节省垂直空间

## 技术方案

### 1. 获取当月日期范围的工具函数

**文件**: `src/types.ts`（已存在）

```typescript
/** 获取当月日期范围 */
export function getDefaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
```

**要点**:
- 不再生硬返回"最近 30 天"
- 动态计算当前月份的第一天到最后一天的完整范围
- 调用时传入 `today` 参数可获取其他月份的基准

### 2. StatsView.tsx - 独立日期状态管理

**关键变更**:

```typescript
// 计算当月范围
const monthStart = getMonthRange().start;
const monthEnd = getMonthRange().end;

// 过滤条件 + 独立日期状态
const [startDate, setStartDate] = useState<Date>(monthStart);
const [endDate, setEndDate] = useState<Date>(monthEnd);
const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
const [selectedTypes, setSelectedTypes] = useState<FilterType[]>(['expense', 'income']);
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

// 独立日期选择器控制状态（不再共用一个 modal）
const [startDateModalVisible, setStartDateModalVisible] = useState(false);
const [endDateModalVisible, setEndDateModalVisible] = useState(false);
const [tempStartDate, setTempStartDate] = useState<Date>(monthStart);
const [tempEndDate, setTempEndDate] = useState<Date>(monthEnd);

// 其他多选过滤器弹窗
const [showPaymentFilter, setShowPaymentFilter] = useState(false);
const [showCategoryFilter, setShowCategoryFilter] = useState(false);
```

**要点**:
- 两个独立的状态管理 (`startDateModalVisible` / `endDateModalVisible`)
- 每个选择器有自己的临时状态用于编辑
- 重置时将临时状态也同步回初始值

### 3. 更新日期选择事件处理

**开始日期更新**:
```typescript
// 打开开始日期选择器
const openStartDatePicker = () => {
  setTempStartDate(startDate); // 先加载当前值
  setStartDateModalVisible(true);
};

// 确认开始日期
const updateStartDate = () => {
  setStartDate(tempStartDate);
  setStartDateModalVisible(false);
};

// DateTimePicker onChange
<DateTimePicker
  value={tempStartDate}
  mode="date"
  display="spinner"
  onChange={(event, selectedDate) => {
    if (Platform.OS === 'ios' && selectedDate) {
      setTempStartDate(selectedDate);
    } else if (Platform.OS === 'android') {
      // Android 滚动即生效
      if (selectedDate) setTempStartDate(selectedDate);
    }
  }}
  textColor="#333"
  themeVariant="light"
/>
```

**结束日期更新**（对称结构）：
```typescript
const openEndDatePicker = () => {
  setTempEndDate(endDate);
  setEndDateModalVisible(true);
};

const updateEndDate = () => {
  setEndDate(tempEndDate);
  setEndDateModalVisible(false);
};
```

**要点**:
- Android 上自动更新（不需要点击确定）
- iOS 上需要手动判断并更新
- 两个弹窗共用同一套样式定义

### 4. UI - 日期范围筛选器（同屏显示）

```tsx
<View style={styles.filterSection}>
  {/* 第一行：开始日期 + 结束日期 */}
  <View style={styles.filterRowDual}>
    <View style={styles.filterCell}>
      <Text style={styles.filterLabel}>开始日期</Text>
      <TouchableOpacity
        style={[styles.filterChip, styles.filterChipActive]}
        onPress={() => { setTempStartDate(startDate); setStartDateModalVisible(true); }}
      >
        <Text style={styles.filterChipTextActive}>
          {formatDate(startDate.getTime())}
        </Text>
      </TouchableOpacity>
    </View>
    <View style={styles.filterCell}>
      <Text style={styles.filterLabel}>结束日期</Text>
      <TouchableOpacity
        style={[styles.filterChip, styles.filterChipActive]}
        onPress={() => { setTempEndDate(endDate); setEndDateModalVisible(true); }}
      >
        <Text style={styles.filterChipTextActive}>
          {formatDate(endDate.getTime())}
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* 第二行：支出分类 + 付款方式 */}
  <View style={styles.filterRowDual}>
    <View style={styles.filterCell}>
      <Text style={styles.filterLabel}>分类</Text>
      <TouchableOpacity
        style={[styles.filterChip, selectedCategories.length > 0 && styles.filterChipActive]}
        onPress={() => setShowCategoryFilter(true)}
      >
        <Text style={[styles.filterChipText, selectedCategories.length > 0 && styles.filterChipTextActive]}>
          {selectedCategories.length === 0 ? '全部' : `${selectedCategories.length}项`}
        </Text>
      </TouchableOpacity>
    </View>
    <View style={styles.filterCell}>
      <Text style={styles.filterLabel}>付款方式</Text>
      <TouchableOpacity
        style={[styles.filterChip, selectedPaymentMethods.length > 0 && styles.filterChipActive]}
        onPress={() => setShowPaymentFilter(true)}
      >
        <Text style={[styles.filterChipText, selectedPaymentMethods.length > 0 && styles.filterChipTextActive]}>
          {selectedPaymentMethods.length === 0 ? '全部' : `${selectedPaymentMethods.length}项`}
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* 第三行：消费类型 + 重置按钮 */}
  <View style={styles.filterRowAction}>
    <View style={styles.typeToggleGroup}>
      {(['expense', 'income'] as FilterType[]).map(type => {
        const label = type === 'expense' ? '支出' : '收入';
        const isActive = selectedTypes.includes(type);
        return (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, isActive && (type === 'expense' ? styles.typeChipExpense : styles.typeChipIncome)]}
            onPress={() => toggleType(type)}
          >
            <Text style={[styles.typeChipText, isActive && (type === 'expense' ? styles.typeChipTextExpense : styles.typeChipTextIncome)]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    <View style={styles.resetBtnWrapper}>
      <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
        <Text style={styles.resetBtnText}>重置</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
```

### 5. 两个独立的日期选择器模态框

**开始日期选择器**:
```tsx
<Modal visible={startDateModalVisible} transparent animationType="fade">
  <TouchableOpacity
    style={[styles.dateOverlay, { paddingTop: statusBarHeight }]}
    activeOpacity={1}
    onPress={() => setStartDateModalVisible(false)}
  >
    <View style={styles.datePickerContainer}>
      <View style={styles.datePickerHeader}>
        <TouchableOpacity onPress={() => setStartDateModalVisible(false)}>
          <Text style={styles.datePickerCancel}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.datePickerTitle}>选择开始日期</Text>
        <TouchableOpacity onPress={updateStartDate}>
          <Text style={styles.datePickerConfirm}>确定</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.datePickerContent}>
        <View style={styles.datePickerSection}>
          <View style={styles.datePickerWheel}>
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'ios' && selectedDate) {
                  setTempStartDate(selectedDate);
                } else if (Platform.OS === 'android') {
                  if (selectedDate) setTempStartDate(selectedDate);
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

**结束日期选择器**（对称结构，标题改为"选择结束日期"）

### 6. 重置所有筛选条件

```typescript
const resetFilters = () => {
  setStartDate(monthStart);
  setEndDate(monthEnd);
  setTempStartDate(monthStart);   // 重要：同步临时状态
  setTempEndDate(monthEnd);       // 重要：同步临时状态
  setSelectedPaymentMethods([]);
  setSelectedTypes(['expense', 'income']);
  setSelectedCategories([]);
};
```

### 7. CSS 新布局样式

```typescript
// 新增的双栏布局样式
filterRowDual: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
filterCell: { flex: 1, backgroundColor: '#fafafa', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
filterRowAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
resetBtnWrapper: { flexShrink: 0 },

// 原有标签样式调整
filterLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f5f6fa' },

// 日期选择器样式（复用自之前版本）
dateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
datePickerContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
datePickerCancel: { fontSize: 16, color: '#666' },
datePickerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
datePickerConfirm: { fontSize: 16, color: '#5b6abf', fontWeight: '600' },
datePickerContent: { padding: 20 },
datePickerSection: { marginBottom: 0 }, // 删除了多余的间距
datePickerWheel: { backgroundColor: '#f5f6fa', borderRadius: 12, overflow: 'hidden' },
```

## UI 布局效果

```
┌──────────────────────────────────────────────────┐
│ 📈 账单统计                              ✕      │
├──────────────────────────────────────────────────┤
│ ┌─ 过滤条件 ───────────────────────────────────┐ │
│ │ [开始日期]   [结束日期]                      │ │ ← Row 1: 双栏
│ │                                              │ │
│ │ [分类]      [付款方式]                       │ │ ← Row 2: 双栏
│ │                                              │ │
│ │ [支出][收入]                        [重置]   │ │ ← Row 3: 左右分布
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ 筛选结果 ──────────────────────────────────┐ │
│ │ 支出    ¥1,234  │ 收入    ¥2,345  │ 结余  ... │ │
│ │             共 XX 条记录                      │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ 消费分类 ──────────────────────────────────┐ │
│ │ 🍜 餐饮  ██████████  ¥XXX (30%)              │ │
│ │ 🚌 交通  ████  ¥XXX (15%)                   │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 依赖库要求

**必须安装**:
```json
{
  "@react-native-community/datetimepicker": "^9.1.0"
}
```

## 构建验证

```bash
cd C:\jizhang
npx tsc --noEmit
cd android && gradle assembleRelease --no-daemon
```

确保无 TypeScript 编译错误且 APK 构建成功。

## 注意事项

1. **Android vs iOS 行为差异**:
   - Android: 滚动即立即生效，没有"取消"概念
   - iOS: 滚动时不会立即提交，需点击"确定"才生效
   - 两种平台都需要正确处理 `onChange` 回调

2. **状态同步陷阱**:
   - 重置按钮必须同步 `tempStartDate/end`，否则下次打开弹窗会显示旧值
   - 临时状态用于编辑，正式状态用于过滤逻辑

3. **日期有效性**:
   - 理论上用户可以设置"结束日期早于开始日期"
   - 后续可增加验证逻辑进行限制（非必需）

4. **性能优化**:
   - `filteredExpenses` 依赖 `startDate`/`endDate`，每次更改都会重新过滤
   - 数据量较大时可考虑添加防抖或缓存

5. **用户体验改进点**:
   - 可添加快捷按钮："今天"、"本月"、"本周"、"清除日期"
   - 可在选择时对比开始/结束日期的合理性

## 相关文件

- `src/screens/StatsView.tsx` - 主统计视图，含独立日期选择器
- `src/types.ts` - 工具函数 `getDefaultDateRange()`
- `package.json` - 依赖配置

## 参考文档

- Expo DateTimePicker v56: https://docs.expo.dev/versions/v56.0.0/sdk/datetimepicker/
- React Native Platform API: https://reactnative.dev/docs/platform
- @react-native-community/datetimepicker: https://github.com/react-native-community/datetimepicker

## 演进历史对比

| 版本 | 日期选择方式 | 默认范围 | 布局特点 |
|------|-------------|---------|----------|
| v1（移除） | 无日期过滤 | N/A | 简化过滤区 |
| v2（单模态框） | 单个弹窗同时选开始/结束 | 最近 30 天 | 双选择器垂直排列 |
| v3（独立弹窗） | 两个独立弹窗 | **当月** | **三行双栏布局** |

本方案（v3）相比 v2 的优势：
1. 更灵活的交互 - 可以单独修改任一日期
2. 更符合直觉的默认值 - 当月范围而非固定天数
3. 更紧凑的布局 - 节省垂直空间，减少滚动