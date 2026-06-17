---
name: expo-stats-view-payment-type-separation
description: 修复账单统计页面支付方式累计逻辑（支出正数/收入负数）及 UI 重复问题
source: auto-skill
extracted_at: '2026-06-04T12:30:00.000Z'
---

# 账单统计页面支付方式累计与显示优化

## 问题描述

在 Expo 记账应用的 StatsView.tsx（账单统计页面），"付款方式"统计功能存在三个 bug：

1. **累计逻辑错误**：支出和收入都按正数累加，无法正确计算净收支
   - 错误示例：收入 1 元 + 支出 1 元 = 合计 2 元 ❌（应为 0 元）
   
2. **UI 重复显示**：每行同时显示图标、名称和金额（如"💵 现金 ¥50"），信息冗余
   
3. **筛选结果区域视觉混乱**：支出/收入/结余之间有竖线分隔

## 根本原因

### 1. 支付方式的累计逻辑

原始代码将所有交易记录的金额都作为正数累加：

```typescript
// ❌ 错误：所有金额都计为正数
const paymentStats = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    stats[e.paymentMethod] = (stats[e.paymentMethod] || 0) + e.amount; // 未考虑 type
  });
  return Object.entries(stats);
}, [filteredExpenses]);
```

这导致：
- 用同一支付方式收款后消费会被重复累加
- 百分比计算的分母也是错误的总和

### 2. UI 显示问题

```typescript
// ❌ 重复显示名称
<Text style={styles.catName}>{getPaymentIcon(methodId)} {getPaymentName(methodId)}</Text>
```

### 3. 统计卡片边框

```typescript
// ❌ 保留竖线分隔
statItemExpense: { borderLeftWidth: 1, borderRightWidth: 1 },
balanceItem: { borderRightWidth: 1 },
```

## 解决方案

### 1. 实现正确的累计逻辑（净收支模式）

支出记为**正数**，收入记为**负数**：

```typescript
// ✅ 正确：支出正数，收入负数
const paymentStats = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    const amount = e.type === 'expense' ? e.amount : -e.amount; // ⭐ 关键改动
    stats[e.paymentMethod] = (stats[e.paymentMethod] || 0) + amount;
  });
  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}, [filteredExpenses]);
```

### 2. 正确计算百分比基准

总额应该是总支出减去总收入（而非所有金额的绝对值和）：

```typescript
const totalExpense = filteredExpenses
  .filter(e => e.type === 'expense')
  .reduce((s, e) => s + e.amount, 0);
  
const totalIncome = filteredExpenses
  .filter(e => e.type === 'income')
  .reduce((s, e) => s + e.amount, 0);
  
const total = totalExpense - totalIncome; // ⭐ 净收支总额
const percentage = Math.abs(total) > 0 
  ? Math.round((Math.abs(amount) / Math.abs(total)) * 100) 
  : 0;
```

### 3. 消除 UI 重复显示

只显示图标，在底部单独显示名称标签：

```typescript
// ✅ 简洁显示
<View style={styles.catHeader}>
  <Text style={styles.catName}>{getPaymentIcon(methodId)}</Text>
  <Text style={[styles.catAmount, amount >= 0 ? undefined : styles.negative]}>
    {amount >= 0 ? '' : '-'}{formatMoney(Math.abs(amount))}
  </Text>
</View>
<View style={styles.catProgress}>...</View>
{/* 底部标签 */}
<Text style={styles.catPercent}>{categoryNameMap[methodId]}: {percentage}%</Text>
```

### 4. 移除统计卡片的竖线分隔

删除边框相关的样式：

```typescript
// ❌ 旧样式
expenseItem: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#eee' },
balanceItem: { borderRightWidth: 1, borderColor: '#eee' },

// ✅ 新样式
statItemExpense: { flex: 1, alignItems: 'center', paddingVertical: 8 },
balanceItem: {},
```

### 5. 添加付款方式名称映射

用于底部的百分比标签显示：

```typescript
const categoryNameMap: Record<string, string> = {
  cash: '现金', wechat: '微信', alipay: '支付宝', bank: '银行卡'
};
```

## 文件修改

- **文件**: `src/screens/StatsView.tsx`
- **主要改动**:
  1. 在 `paymentStats` 的 useMemo 中增加类型判断逻辑
  2. 新增 `categoryNameMap` 常量映射
  3. 修改付款方式统计 UI，分离 icon 和名称显示
  4. 调整百分比计算逻辑使用净收支总额
  5. 移除统计卡片中的竖线边框样式

## 验证方法

1. **测试数据**：创建一条 1 元支出（微信支付）和一条 1 元收入（微信支付）
2. **期望结果**：
   - 筛选结果区域：支出 ¥1.00, 收入 ¥1.00, 结余 ¥0.00（无竖线）
   - 付款方式统计：微信支付 -¥0.00（或 0%）
3. **对比测试**：只有一笔支出时，应显示正数；只有一笔收入时，应显示负数

## 设计理念

### 净收支模式 vs 分开视图模式

| 方案 | 优点 | 缺点 |
|------|------|------|
| **净收支模式**（本实现） | 直观显示某支付方式对整体资金流的影响 | 需要理解负数的含义 |
| **分开视图模式** | 支出/收入完全独立，易于理解 | 界面复杂度高，占用空间大 |

### 选择净收支模式的理由

对于记账应用的核心业务场景：
- 用户最关心的是"**用这个方式花钱还是收钱多**"
- 净收支能快速识别某个支付方式是净流入还是净流出
- 符合财务报表的基本逻辑（收入 - 支出 = 结余）

## 扩展建议

后续可以考虑增强显示：
1. **颜色编码**：正数为绿色（+），负数为红色（-）
2. **双轴显示**：同时在顶部显示"支出/收入"两种视角的比例
3. **趋势分析**：对比上月/上季度的净收支变化

---

## 关键教训

- 统计数据的计算基准必须与业务语义一致
- 当涉及双向流动的数据（收支）时，需要考虑符号系统
- UI 设计应避免信息重复，层级清晰
- 统计组件的视觉分割应该服务于内容组织而非技术限制
