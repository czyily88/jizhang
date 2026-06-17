---
name: expo-accounting-uniform-amount-display-signs-colors
description: 全局收支金额符号和颜色统一规范（支出绿色带负号，收入红色带正号）
source: auto-skill
extracted_at: '2026-06-05T12:30:00.000Z'
---

# 收支金额符号和颜色统一规范

## 📋 规范要求

| 类型 | 数值符号 | 显示符号 | 颜色 | HEX 值 |
|------|---------|---------|------|-------|
| **支出** | 负数 (-) | `-XX.XX` | 绿色 | #2ed573 |
| **收入** | 正数 (+) | `+XX.XX` | 红色 | #ff4757 |
| **结余** | 可正可负 | `+/-XX.XX` | 正绿负红 | #2ed573/#ff4757 |

---

## ✅ 适用场景

此规范应用于记账应用中的所有金额显示位置：
- 首页列表项的金额
- 首页统计卡片的支出、收入、结余
- 统计页面的筛选结果卡片
- 统计页面的分类统计（消费/收入）
- 统计页面的付款方式统计
- 统计页面的账单明细
- 记一笔页面的类型切换按钮

---

## 🔧 实现方法

### 1. HomeScreen.tsx (首页)

#### 列表项显示
```typescript
<Text style={[styles.expenseAmount, item.type === 'expense' ? styles.expenseAmountExpense : styles.expenseAmountIncome]}>
  {item.type === 'expense' ? '-' : '+'}{formatMoney(item.amount).replace('¥ ', '')}
</Text>
```

#### 样式定义
```typescript
expenseAmountExpense: { color: '#2ed573' },   // 绿色 - 支出
expenseAmountIncome: { color: '#ff4757' },   // 红色 - 收入
```

#### 统计卡片显示
```typescript
// 支出（带负号）
<Text style={[styles.summaryValueExpense]}>-{formatMoney(Math.abs(totalExpense)).replace('¥ ', '')}</Text>

// 收入（带正号）
<Text style={[styles.summaryValueIncome]}>+{formatMoney(Math.abs(totalIncome)).replace('¥ ', '')}</Text>

// 结余（根据正负显示符号）
<Text style={[styles.summaryValue, balance >= 0 ? styles.summaryValuePositive : styles.summaryValueNegative]}>
  {balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(balance)).replace('¥ ', '')}
</Text>
```

#### 样式定义
```typescript
summaryValueExpense: { fontSize: 20, fontWeight: '700', color: '#2ed573' },
summaryValueIncome: { fontSize: 20, fontWeight: '700', color: '#ff4757' },
summaryValuePositive: { color: '#2ed573' },   // 正结余用绿色
summaryValueNegative: { color: '#ff4757' },   // 负结余用红色
```

---

### 2. StatsView.tsx (统计页面)

#### 筛选结果卡片
```typescript
// 支出（带负号，绿色）
<Text style={[styles.statValueExpense]}>-{formatMoney(Math.abs(totalExpense))}</Text>

// 收入（带正号，红色）
<Text style={[styles.statValueIncome]}>+{formatMoney(Math.abs(totalIncome))}</Text>

// 结余（根据正负显示符号）
<Text style={[styles.statValue, balance >= 0 ? styles.positive : styles.negative]}>
  {balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(balance))}
</Text>
```

#### 样式定义
```typescript
statValueExpense: { fontSize: 18, fontWeight: 'bold', color: '#2ed573' },
statValueIncome: { fontSize: 18, fontWeight: 'bold', color: '#ff4757' },
positive: { color: '#2ed573' },              // 正数绿色
negative: { color: '#ff4757' },              // 负数红色
```

#### 分类统计
```typescript
// 消费分类（支出，带负号，绿色）
<Text style={[styles.catAmount, styles.negative]}>-{formatMoney(amount)}</Text>

// 收入分类（带正号，红色）
<Text style={[styles.catAmount, styles.positive]}>+{formatMoney(amount)}</Text>
```

#### 付款方式统计
```typescript
const amount = e.type === 'expense' ? -e.amount : e.amount;
// ...
<Text style={[styles.catAmount, amount >= 0 ? styles.positive : styles.negative]}>
  {amount >= 0 ? '+' : '-'}{formatMoney(Math.abs(amount))}
</Text>
```

#### 账单明细
```typescript
<Text style={[styles.expenseAmount, e.type === 'expense' ? styles.expenseAmountExpense : styles.expenseAmountIncome]}>
  {e.type === 'expense' ? '-' : '+'}{formatMoney(e.amount).replace('¥ ', '')}
</Text>
```

#### 样式定义
```typescript
expenseAmountExpense: { color: '#2ed573' },  // 支出绿色
expenseAmountIncome: { color: '#ff4757' },  // 收入红色
```

---

### 3. AddExpenseScreen.tsx (记一笔/编辑)

#### 类型切换按钮
```typescript
<TouchableOpacity
  style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
  onPress={() => toggleType('expense')}
>
  <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActiveExpense]}>支出</Text>
</TouchableOpacity>
```

#### 样式定义
```typescript
typeBtnActiveExpense: { backgroundColor: '#2ed573' },  // 支出激活态背景色 - 绿色
typeBtnActiveIncome: { backgroundColor: '#ff4757' },  // 收入激活态背景色 - 红色
```

---

## 📝 完整代码示例

### HomeScreen.tsx 关键片段
```typescript
// 列表项渲染
<View style={styles.expenseRight}>
  <Text style={[styles.expenseAmount, item.type === 'expense' ? styles.expenseAmountExpense : styles.expenseAmountIncome]}>
    {item.type === 'expense' ? '-' : '+'}{formatMoney(item.amount).replace('¥ ', '')}
  </Text>
  <Text style={styles.expenseTime}>{formatDateWithTime(item.createdAt)}</Text>
  <TouchableOpacity 
    style={[styles.deleteBtn, item.note && { marginTop: 0 }]} 
    onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
  >
    <Text style={styles.deleteBtnText}>✕</Text>
  </TouchableOpacity>
</View>

// 统计卡片
<View style={styles.summaryRow}>
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>支出</Text>
    <Text style={[styles.summaryValueExpense]}>-{formatMoney(Math.abs(totalExpense)).replace('¥ ', '')}</Text>
  </View>
  <View style={styles.summaryDivider} />
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>收入</Text>
    <Text style={[styles.summaryValueIncome]}>+{formatMoney(Math.abs(totalIncome)).replace('¥ ', '')}</Text>
  </View>
  <View style={styles.summaryDivider} />
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>结余</Text>
    <Text style={[styles.summaryValue, balance >= 0 ? styles.summaryValuePositive : styles.summaryValueNegative]}>
      {balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(balance)).replace('¥ ', '')}
    </Text>
  </View>
</View>
```

---

## ⚠️ 注意事项

1. **非传统配色**: 通常会计领域使用红色表示支出、绿色表示收入，但本项目采用相反的颜色方案以符合用户要求。

2. **绝对值处理**: 所有显示都需要使用 `Math.abs()` 获取绝对值来格式化金额，符号通过三元运算符或条件拼接添加。

3. **结余颜色逻辑**: 结余的正负决定颜色 - 正数（余额充足）用绿色，负数（透支）用红色。

4. **格式化工具**: 统一使用 `formatMoney(cents)` 将分转换为元并添加千分位分隔符。

5. **符号前缀**: 必须在 formatMoney 返回的结果前手动添加符号，因为 formatMoney 只返回数值部分。

---

## 🎨 配色方案总结

| 用途 | 颜色名称 | HEX | RGB | 说明 |
|------|---------|-----|-----|------|
| 支出/负数 | Green | #2ed573 | rgb(46, 213, 115) | 用于所有支出相关显示 |
| 收入/正数 | Red | #ff4757 | rgb(255, 71, 87) | 用于所有收入相关显示 |
| 结余正数 | Green Positive | #2ed573 | rgb(46, 213, 115) | 余额为正时 |
| 结余负数 | Red Negative | #ff4757 | rgb(255, 71, 87) | 余额为负时 |

---

## ✅ 验证清单

在部署前请检查：

- [ ] 首页列表的所有金额都带有正确的符号（支出 `-`，收入 `+`）
- [ ] 首页列表的支出显示为绿色 (#2ed573)
- [ ] 首页列表的收入显示为红色 (#ff4757)
- [ ] 首页统计卡片的支出/收入/结余都有正确的符号
- [ ] 首页统计卡片的颜色符合要求
- [ ] 统计页面所有卡片金额都有符号且颜色正确
- [ ] 统计页面的分类统计带符号
- [ ] 统计页面的付款方式统计带符号
- [ ] 记一笔页面的类型切换按钮颜色正确
- [ ] 所有结余显示根据正负使用正确的颜色

---

## 📅 更新记录

- **2026-06-05**: 创建技能文档，完成全局收支金额符号和颜色统一规范
