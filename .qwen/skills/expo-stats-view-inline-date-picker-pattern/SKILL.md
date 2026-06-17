---
name: expo-stats-view-inline-date-picker-pattern
description: StatsView 内联日期选择器模式与防重入机制
source: auto-skill
extracted_at: '2026-06-04T09:00:00.000Z'
---

# Expo StatsView - 内联日期选择器模式与防重入机制

## 功能概述
在账单统计页面实现**内联滚动式日期选择器**，支持点击展开、自动关闭，使用 `useRef` 防止并发请求导致的重复渲染问题，并采用紧凑的 `YYYY-MM-DD` 日期格式。

## 核心问题

### 1. 重复触发问题
之前使用 `showDatePicker !== 'start'` 条件判断，但在快速连续点击时仍可能产生多次渲染：
```typescript
// ❌ 旧方案 - 无法防止并发
const openStartDatePicker = () => {
  if (showDatePicker !== 'start') {
    setShowDatePicker('start');
  }
};
```

### 2. UI 残留问题
DateTimePicker 上方显示"选择开始日期"等提示文字，占用空间且不美观。

### 3. 日期格式不统一
原格式 "6 月 1 日 00:00" 包含时间部分，不适合简洁展示。

## 技术方案

### 1. 使用 useRef 防止重入

**关键变更**:

```typescript
import React, { useState, useMemo, useRef } from 'react';

// 日期选择器状态
const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

// 🔑 使用 useRef 跟踪当前正在进行的 picker 操作
const pickerInProgress = useRef<'start' | 'end' | null>(null);
```

**防重入逻辑**:
```typescript
const openStartDatePicker = () => {
  if (pickerInProgress.current !== 'start') {
    pickerInProgress.current = 'start';
    setShowDatePicker('start');
  }
};

const openEndDatePicker = () => {
  if (pickerInProgress.current !== 'end') {
    pickerInProgress.current = 'end';
    setShowDatePicker('end');
  }
};
```

**优点**:
- `useRef` 的值在组件重渲染之间保持，不受 setState 延迟影响
- 物理级别防止并发请求
- 即使在极端情况下也能保证单一 picker 实例

### 2. Inline Picker 模式（无提示文字）

```tsx
{/* 展开的日期选择器 */}
{showDatePicker === 'start' && (
  <View style={styles.inlinePickerContainer}>
    <DateTimePicker
      value={startDate}
      mode="date"
      display="spinner"
      onChange={(event, selectedDate) => {
        if (selectedDate) {
          setStartDate(selectedDate);
          setShowDatePicker(null);           // 立即关闭
          pickerInProgress.current = null;   // 释放锁
        }
      }}
      textColor="#333"
      themeVariant="light"
    />
  </View>
)}
```

**样式定义**:
```typescript
inlinePickerContainer: { 
  backgroundColor: '#fafafa', 
  borderRadius: 12, 
  borderWidth: 1, 
  borderColor: '#eee', 
  padding: 12, 
  marginBottom: 12,
},
```

**对比模态框方案**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| Modal 弹窗 | 视觉隔离明确 | 需要遮罩层，空间占用大 |
| Inline 展开 | 上下文连贯，无需返回 | 需要精心设计折叠效果 |

### 3. 紧凑日期格式工具函数

**文件**: `src/types.ts`

```typescript
/** 日期范围选择器用的紧凑型格式 (YYYY-MM-DD) */
export function formatDateCompact(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

**使用**:
```typescript
<Text style={styles.filterChipTextActive}>
  {formatDateCompact(startDate.getTime())}
</Text>
```

**输出示例**:
- 修改前: `6 月 1 日 00:00`
- 修改后: `2026-06-01`

### 4. UI 布局结构

```
┌─────────────────────────────────┐
│ 日期范围 [2026-06-01] 至 [2026-06-04] │ ← 单行紧凑显示
│ （点击上方区域展开滚轮选择器）      │
├─────────────────────────────────┤
│ 分类      [全部或 X 项]            │
│ 付款方式  [全部或 X 项]            │
├─────────────────────────────────┤
│ [支出] [收入]          [重置]     │
└─────────────────────────────────┘
```

### 5. 完整的日期状态管理

```typescript
// 过滤条件
const [startDate, setStartDate] = useState<Date>(monthStart);
const [endDate, setEndDate] = useState<Date>(monthEnd);

// 控制状态
const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
const pickerInProgress = useRef<'start' | 'end' | null>(null);

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

// 更新日期过滤器
const updateDateRange = () => {
  // ...
};
```

### 6. DateTimePicker Platform 处理

```typescript
<DateTimePicker
  value={value}
  mode="date"
  display="spinner"
  onChange={(event, selectedDate) => {
    if (Platform.OS === 'android') {
      // Android: 选择即确认，无需额外按钮
      if (selectedDate) handleDateChange(selectedDate);
    } else {
      // iOS: 同样表现，但可选择取消
      if (selectedDate) handleDateChange(selectedDate);
    }
  }}
/>
```

**注意**: 当前版本已移除取消/确定按钮，改为选择后立即关闭的模式。

## 完整代码片段

### StatsView.tsx 关键部分

```tsx
import React, { useState, useMemo, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateCompact } from '../types';

interface StatsViewProps {
  onClose: () => void;
}

export default function StatsView({ onClose }: StatsViewProps) {
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const pickerInProgress = useRef<'start' | 'end' | null>(null);

  // 获取当月日期范围
  const getMonthRange = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const monthStart = getMonthRange().start;
  const monthEnd = getMonthRange().end;

  const [startDate, setStartDate] = useState<Date>(monthStart);
  const [endDate, setEndDate] = useState<Date>(monthEnd);

  const openStartDatePicker = () => {
    if (pickerInProgress.current !== 'start') {
      pickerInProgress.current = 'start';
      setShowDatePicker('start');
    }
  };

  const openEndDatePicker = () => {
    if (pickerInProgress.current !== 'end') {
      pickerInProgress.current = 'end';
      setShowDatePicker('end');
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* 第一行：日期范围 - 单行显示 */}
      <View style={styles.filterRowSingle}>
        <Text style={styles.filterLabel}>日期范围</Text>
        <TouchableOpacity onPress={openStartDatePicker}>
          <Text style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={styles.filterChipTextActive}>
              {formatDateCompact(startDate.getTime())}
            </Text>
          </Text>
        </TouchableOpacity>
        <Text style={styles.dateRangeTo}>至</Text>
        <TouchableOpacity onPress={openEndDatePicker}>
          <Text style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={styles.filterChipTextActive}>
              {formatDateCompact(endDate.getTime())}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* 展开的日期选择器 */}
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

      {/* 第二行：分类 + 付款方式 */}
      <View style={styles.filterRowAlign}>
        <Text style={styles.filterLabelFixed}>分类</Text>
        <TouchableOpacity style={styles.filterChipRight}>...</TouchableOpacity>
        
        <Text style={styles.filterLabelFixed}>付款方式</Text>
        <TouchableOpacity style={styles.filterChipRight}>...</TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### 类型工具函数

**文件**: `src/types.ts`

```typescript
/** 原始日期格式（用于列表显示）*/
export function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

/** 日期范围选择器用的紧凑型格式 (YYYY-MM-DD) */
export function formatDateCompact(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## CSS 样式定义

```typescript
// 过滤区域样式
filterRowSingle: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  marginBottom: 12, 
  gap: 8, 
  flexWrap: 'wrap' 
},
filterLabel: { 
  fontSize: 14, 
  fontWeight: '600', 
  color: '#666', 
  minWidth: 70 
},
filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
filterChipActive: { backgroundColor: '#5b6abf' },
filterChipTextActive: { color: '#fff', fontWeight: '600' },
dateRangeTo: { fontSize: 14, color: '#999', paddingHorizontal: 4 },

// Inline 日期选择器容器
inlinePickerContainer: { 
  backgroundColor: '#fafafa', 
  borderRadius: 12, 
  borderWidth: 1, 
  borderColor: '#eee', 
  padding: 12, 
  marginBottom: 12,
},

// 第二行对齐
filterRowAlign: { 
  flexDirection: 'row', 
  flexWrap: 'wrap',
  gap: 12,
},
filterLabelFixed: { fontSize: 14, fontWeight: '600', color: '#666', width: 65 },
filterChipRight: { 
  paddingHorizontal: 12, 
  paddingVertical: 6, 
  borderRadius: 8, 
  backgroundColor: '#f5f6fa' 
},
```

## 注意事项

1. **useRef 时机**: `useRef` 在组件挂载时初始化一次，之后持久化，适合跟踪跨渲染的状态

2. **状态同步**: `setShowDatePicker(null)` 和 `pickerInProgress.current = null` 应在同一作用域确保原子性

3. **日期格式**: 区分用途使用不同格式化函数
   - `formatDate()` - 列表项中的简洁格式
   - `formatDateCompact()` - 日期筛选器的 ISO 格式
   - `formatDateGroup()` - 分组显示的年月格式

4. **性能**: 每次日期变化触发 re-filter，建议数据量较大时考虑分页或虚拟列表

5. **平台差异**: DateTimePicker 在 Android/iOS 上行为基本一致，但某些边界情况仍需测试

## 相关问题解决

| 问题 | 根本原因 | 解决方案 |
|------|----------|----------|
| 点击后弹出多个选择器 | showDatePicker 判断有竞争条件 | 使用 useRef 作为锁 |
| DateTimePicker 标题占用空间 | pickerSubLabel 文本多余 | 删除 Text 元素 |
| 日期格式混乱 | 使用时间戳直接调用 formatDate | 新增 formatDateCompact() |
| 选择后不关闭 | onChange 未更新状态 | 添加 setSchowDatePicker(null) |

## 相关文件

- `src/screens/StatsView.tsx` - 主统计视图，包含内联日期选择器
- `src/types.ts` - 日期格式化辅助函数
- `package.json` - @react-native-community/datetimepicker 依赖

## 构建验证

```bash
cd C:\jizhang
npx tsc --noEmit

# Android 构建
cd android && gradle assembleRelease --no-daemon
```