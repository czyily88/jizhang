---
name: expo-stats-view-filter-ui-optimization
description: 账单统计页面过滤 UI 优化：日期范围同屏显示、分类拆分支出/收入、删除消费类型筛选
source: auto-skill
extracted_at: '2026-06-04T00:16:31.000Z'
---

# 账单统计页面过滤 UI 优化

## 优化内容

### 1. 日期范围选择器改为同屏显示
- **原来**：使用两个独立的"开始日期"和"结束日期"按钮，需要通过弹窗分别选择
- **优化后**：在同一行显示 `开始日期 至 结束日期`，点击任一日期间弹出日期选择器
- **优势**：减少操作步骤，用户可以更直观地看到完整日期范围

### 2. 分类筛选拆分为支出/收入两类
- **原来**：一个"分类"筛选器，只能同时影响支出和收入
- **优化后**：
  - **支出分类**：独立的多选筛选器，仅过滤支出记录的分类
  - **收入分类**：独立的多选筛选器，仅过滤收入记录的分类
- **优势**：可以更精确地控制不同收支类型的筛选条件

### 3. 删除消费类型（支出/收入）筛选
- **原来**：有"消费类型"选项，可以切换只查看支出或收入
- **优化后**：移除了这个筛选选项
- **原因**：
  - 统计卡片始终同时显示支出和收入的总额
  - 在"分类统计"和"付款方式统计"区域已有切换按钮来控制显示哪种类型的明细
  - 保持视图的一致性，避免混淆

## 实现细节

### 状态管理变化
```typescript
// 旧状态
const [selectedTypes, setSelectedTypes] = useState<FilterType[]>(['expense', 'income']);
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

// 新状态
const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>([]);
const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<string[]>([]);
```

### 过滤逻辑更新
```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter(e => {
    // 日期范围过滤
    if (e.createdAt < startTs || e.createdAt > endDateWithTime.getTime()) return false;
    // 付款方式过滤
    if (selectedPaymentMethods.length > 0 && !selectedPaymentMethods.includes(e.paymentMethod)) return false;
    // 支出分类过滤
    if (e.type === 'expense' && selectedExpenseCategories.length > 0 && !selectedExpenseCategories.includes(e.category)) return false;
    // 收入分类过滤
    if (e.type === 'income' && selectedIncomeCategories.length > 0 && !selectedIncomeCategories.includes(e.category)) return false;
    return true;
  });
}, [expenses, startDate, endDate, selectedPaymentMethods, selectedExpenseCategories, selectedIncomeCategories]);
```

### UI 布局
```
┌─────────────────────────────────────────┐
│ 过滤条件                                 │
├─────────────────────────────────────────┤
│ 日期范围   [开始日期] 至 [结束日期]       │
│ 支出分类   [X 项]                        │
│ 收入分类   [全部]                        │
│ 付款方式   [全部]                        │
│                      [重置]              │
└─────────────────────────────────────────┘
```

## 注意事项

1. **Date Picker 约束**：
   - 开始日期不能晚于结束日期
   - 结束日期不能早于开始日期且不能超过今天

2. **Reset 操作**：需要同时重置所有筛选状态，包括：
   - 日期范围
   - 支出分类
   - 收入分类
   - 付款方式

3. **Filter Count**：计算已应用的筛选数量用于提示用户

4. **Category 数据源**：
   - 支出分类从 `expenseCategories` 获取
   - 收入分类从 `incomeCategories` 获取

## 相关文件
- `src/screens/StatsView.tsx` - 主要实现文件

## 相关技能

### 横向布局优化
对于**同一行合并分类和付款方式**、**增大字体和按钮内边距**的进一步优化，请参考：
- [`expo-stats-view-horizontal-layout-optimization`](../expo-stats-view-horizontal-layout-optimization/SKILL.md)

这两个技能互补使用：
1. **filter-ui-optimization**: 日期范围同屏显示、分类拆分支出/收入、删除消费类型筛选
2. **horizontal-layout-optimization**: 分类 + 付款方式合并到同一行、增大字号和内边距
