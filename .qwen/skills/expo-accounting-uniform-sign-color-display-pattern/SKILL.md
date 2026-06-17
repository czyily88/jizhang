---
name: expo-accounting-uniform-sign-color-display-pattern
description: 统一的金额符号和颜色显示规范 - 负数绿色带减号，正数红色带加号
source: auto-skill
extracted_at: '2026-06-05T08:30:00Z'
---

# 统一金额符号和颜色显示规范

## 📋 核心规范

这是一个非传统的配色方案（通常红色代表支出/亏损），但符合用户的明确要求：

| 类型 | 数值符号 | 显示符号 | 颜色 (负数) | 颜色 (正数) | HEX 值 |
|------|---------|---------|------------|------------|-------|
| **支出** | 负数 (-) | `-XX.XX` | 绿色 | - | #2ed573 |
| **收入** | 正数 (+) | `+XX.XX` | - | 红色 | #ff4757 |
| **结余/统计** | 可正可负 | `+/-XX.XX` | 绿色 | 红色 | #2ed573/#ff4757 |

### 颜色说明
- **绿色 (#2ed573)**: 用于**负数**（支出、亏损、负结余）
- **红色 (#ff4757)**: 用于**正数**（收入、盈利、正结余）

## 🎯 应用范围

所有金额显示都需要遵循此规范：

1. **首页列表项**: 每项金额带符号并着色
2. **首页统计卡片**: 支出、收入、结余的统一格式
3. **统计页面筛选结果**: 总支出、总收入、总结余
4. **消费分类统计**: 每个分类的金额
5. **收入分类统计**: 每个分类的金额
6. **付款方式统计**: 每个付款方式的净额
7. **账单明细列表**: 每条记录的金额

## 💻 实现细节

### 样式定义位置

#### HomeScreen.tsx
```typescript
expenseAmountExpense: { color: '#2ed573' },   // 绿色 - 支出
expenseAmountIncome: { color: '#ff4757' },   // 红色 - 收入
summaryValueExpense: { color: '#2ed573' },    // 绿色 - 支出
summaryValueIncome: { color: '#ff4757' },    // 红色 - 收入
summaryValuePositive: { color: '#ff4757' },   // 红色 - 正结余
summaryValueNegative: { color: '#2ed573' },   // 绿色 - 负结余
```

#### StatsView.tsx
```typescript
statValueExpense: { color: '#2ed573' },      // 绿色 - 支出
statValueIncome: { color: '#ff4757' },      // 红色 - 收入
expenseAmountExpense: { color: '#2ed573' },  // 绿色 - 支出
expenseAmountIncome: { color: '#ff4757' },  // 红色 - 收入
positive: { color: '#ff4757' },              // 红色 - 正数
negative: { color: '#2ed573' },              // 绿色 - 负数
typeChipExpense: { backgroundColor: '#f0fff0', borderColor: '#2ed573' },
typeChipTextExpense: { color: '#2ed573' },
typeChipIncome: { backgroundColor: '#fff0f0', borderColor: '#ff4757' },
typeChipTextIncome: { color: '#ff4757' },
catAmount: { ... negative/positive styling }
```

#### AddExpenseScreen.tsx
```typescript
typeBtnActiveExpense: { backgroundColor: '#2ed573' },  // 绿色 - 支出
typeBtnActiveIncome: { backgroundColor: '#ff4757' },  // 红色 - 收入
```

## 📝 显示格式示例

```
首页列表:
  🍜 餐饮             -15.50  ← 绿色 + 负号
                     14:30
  
  💰 工资            +5000.00  ← 红色 + 正号
                      昨天 10:00

首页统计卡片:
  ┌─────────────────────────┐
  │ 今日收支                 │
  │ ───────┬────────┬───────│
  │ 支出    │ 收入   │ 结余   │
  │ -156.00 │ +5200.00 │ +5044.00 │  ← 红色 + 正号
  │ (绿)   │ (红)   │ (红)    │
  └─────────────────────────┘

统计页面 - 消费分类:
  🍜 餐饮          -156.00  ← 绿色 + 负号
  ━━━━━━━━━━━━━━━━ 45%
  
  🎮 娱乐          -89.00   ← 绿色 + 负号
  ━━━━━━━━━━━━━━━━ 25%

统计页面 - 收入分类:
  💰 工资          +5000.00  ← 红色 + 正号
  ━━━━━━━━━━━━━━━━ 92%
```

## ✅ 验证清单

修改金额显示时请检查以下项目：

- [ ] 列表项金额带符号且颜色正确
- [ ] 统计卡片金额带符号且颜色正确
  - [ ] 支出显示为 `-XX.XX` 绿色
  - [ ] 收入显示为 `+XX.XX` 红色
  - [ ] 结余正数显示为 `+XX.XX` 红色
  - [ ] 结余负数显示为 `-XX.XX` 绿色
- [ ] 统计页面筛选结果带符号且颜色正确
- [ ] 统计页面分类统计带符号且颜色正确
- [ ] 统计页面付款方式统计带符号且颜色正确
- [ ] 统计页面账单明细带符号且颜色正确
- [ ] 记一笔页面类型切换按钮颜色正确

## 🔧 注意事项

1. **计算逻辑**: 内部计算使用正常数值，显示时才添加符号和颜色
   - 支出：存储为正数，显示时加 `-` 号和绿色
   - 收入：存储为正数，显示时加 `+` 号和红色
   - 结余：根据实际余额判断正负，分别应用颜色和符号

2. **格式化函数**: `formatMoney(cents: number)` 始终返回正数字符串，符号需手动添加

3. **颜色常量**: 保持颜色值一致，避免散落在各处
   ```typescript
   const EXPENSE_COLOR = '#2ed573';  // 绿色 - 负数
   const INCOME_COLOR = '#ff4757';   // 红色 - 正数
   ```

4. **非传统配色**: 这种"支出绿、收入红"的配色与传统会计习惯相反，需要确保用户理解

## 📚 相关文件

- `src/screens/HomeScreen.tsx` - 首页金额显示
- `src/screens/StatsView.tsx` - 统计页面金额显示
- `src/screens/AddExpenseScreen.tsx` - 记一笔类型按钮颜色
- `src/types.ts` - `formatMoney` 工具函数
- `memory/expense_income_display_spec.md` - 详细规范文档
