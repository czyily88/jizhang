---
name: expo-accounting-amount-sign-display
description: 记账应用中支出为负数、收入为正数的符号显示模式实现
source: auto-skill
extracted_at: '2026-06-05T10:30:00.000Z'
---

# 记账应用金额符号显示规范

在记账类应用中，为了实现更直观的财务数据展示，需要统一采用以下金额显示规则：

## 核心规则

- **所有支出金额记为负数**，带 `-` 号（如 `-10.00`）
- **所有收入金额记为正数**，带 `+` 号（如 `+20.00`）
- **结余/余额**根据正负显示对应符号（`+XX.XX` 或 `-XX.XX`）

## 实现要点

### 1. 数据存储层面
- 数据库/存储中金额字段保持为正数（分单位）
- 通过 `type` 字段（`'expense' | 'income'`）区分收支类型

### 2. 计算逻辑层面
```typescript
// 错误写法 - 用绝对值相减
const balance = totalIncome - totalExpense;

// 正确写法 - 统一使用正负号计算
const totalExpense = expenses.filter(e => e.type === 'expense')
    .reduce((s, e) => s + (-e.amount), 0);  // 支出为负
const totalIncome = expenses.filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);    // 收入为正
const balance = totalExpense + totalIncome; // 直接相加
```

### 3. 显示层面
```typescript
// 列表项显示
<Text style={styles.expenseAmount}>
  {item.type === 'expense' ? '-' : '+'}{formatMoney(item.amount).replace('¥ ', '')}
</Text>

// 统计卡片显示
{balance >= 0 ? '+' : ''}{formatMoney(Math.abs(balance))}
```

### 4. 百分比计算
当计算占比时，需要使用金额的绝对值：
```typescript
const percentage = Math.abs(amount) > 0 
    ? Math.round((Math.abs(amount) / Math.abs(total)) * 100) 
    : 0;
```

## 需要注意的文件位置

修改时需要检查并更新以下文件中的相关逻辑：

1. **src/screens/HomeScreen.tsx** - 首页今日收支统计
2. **src/screens/StatsView.tsx** - 统计页面各项汇总数据
3. **src/AppContext.tsx** - 如有批量计算逻辑

## 样式建议

- 负数（支出/赤字）使用红色调（如 `#ff4757`）
- 正数（收入/盈余）使用绿色调（如 `#2ed573`）
- 通过颜色辅助增强可读性

## 常见陷阱

1. ❌ 忘记在统计计算中将支出转换为负数
2. ❌ 显示时只用了前缀但没有正确处理数值计算
3. ❌ 百分比计算时没有对分子分母同时取绝对值
4. ❌ 结余计算仍然使用 `totalIncome - totalExpense` 的旧公式

## 适用场景

此规范适用于任何记账、财务追踪、会计相关的移动应用，能够帮助用户快速理解资金流向和账户状态。
