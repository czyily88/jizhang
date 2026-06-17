---
name: expo-stats-view-type-separation-pattern
description: Split statistics by expense/income types with toggle switches
source: auto-skill
extracted_at: '2026-06-03T23:40:00.000Z'
---

# Expo Stats View - Type Separation Pattern

## Overview
Separate expense and income statistics into distinct views with toggle switches, allowing users to compare spending vs income patterns across different categories (expenses) and payment methods (income).

## Implementation Steps

### 1. Add State for Selected Statistics Type

Add state variables to track which type is currently selected for each statistics section:

```typescript
const [selectedPaymentStatsType, setSelectedPaymentStatsType] = useState<'expense' | 'income'>('expense');
const [selectedCategoryStatsType, setSelectedCategoryStatsType] = useState<'expense' | 'income'>('expense');
```

**Default to 'expense'** since it's typically more relevant for budget tracking.

### 2. Create Separate Statistics Computations

#### Category Statistics (Expense/Income):

```typescript
// Expense category stats
const categoryStatsExpense = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.filter(e => e.type === 'expense').forEach(e => {
    stats[e.category] = (stats[e.category] || 0) + e.amount;
  });
  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}, [filteredExpenses]);

// Income category stats
const categoryStatsIncome = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.filter(e => e.type === 'income').forEach(e => {
    stats[e.category] = (stats[e.category] || 0) + e.amount;
  });
  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}, [filteredExpenses]);
```

#### Payment Method Statistics (Expense/Income):

```typescript
// Expense payment method stats
const paymentStatsExpense = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.filter(e => e.type === 'expense').forEach(e => {
    stats[e.paymentMethod] = (stats[e.paymentMethod] || 0) + e.amount;
  });
  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}, [filteredExpenses]);

// Income payment method stats
const paymentStatsIncome = useMemo(() => {
  const stats: Record<string, number> = {};
  filteredExpenses.filter(e => e.type === 'income').forEach(e => {
    stats[e.paymentMethod] = (stats[e.paymentMethod] || 0) + e.amount;
  });
  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}, [filteredExpenses]);
```

### 3. Update getCategoryColor Function

Support different color schemes for expense vs income:

```typescript
const getCategoryColor = (cat: string, statsType?: 'expense' | 'income'): string => {
  const expenseColors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#7bed9f', '#70a1ff', '#eccc68', '#a29bfe', '#fd79a8'];
  const incomeColors = ['#2ed573', '#ffa502', '#1e90ff', '#ff4757', '#7bed9f', '#70a1ff', '#eccc68', '#a29bfe', '#fd79a8', '#ffa502'];
  
  const allCats = statsType === 'expense' ? expenseCategories : incomeCategories;
  const colors = statsType === 'expense' ? expenseColors : incomeColors;
  
  const index = allCats.indexOf(cat);
  return index >= 0 ? colors[index % colors.length] : '#5b6abf';
};
```

**Note**: Color arrays are intentionally different to visually distinguish expense (warm colors) from income (cooler colors).

### 4. Render Toggle Switch UI

Add toggle component above statistics sections:

```tsx
<View style={styles.section}>
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionTitle}>分类统计</Text>
    <View style={styles.categoryTypeToggle}>
      <TouchableOpacity
        style={[styles.categoryTypeChip, selectedCategoryStatsType === 'expense' && styles.categoryTypeChipActive]}
        onPress={() => setSelectedCategoryStatsType('expense')}
      >
        <Text style={[styles.categoryTypeText, selectedCategoryStatsType === 'expense' && styles.categoryTypeTextActive]}>支出</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.categoryTypeChip, selectedCategoryStatsType === 'income' && styles.categoryTypeChipActiveIncome]}
        onPress={() => setSelectedCategoryStatsType('income')}
      >
        <Text style={[styles.categoryTypeText, selectedCategoryStatsType === 'income' && styles.categoryTypeTextActiveIncome]}>收入</Text>
      </TouchableOpacity>
    </View>
  </View>
  
  {/* Render stats based on selection */}
  {(selectedCategoryStatsType === 'expense' ? categoryStatsExpense : categoryStatsIncome).map(([category, amount]) => {
    const total = selectedCategoryStatsType === 'expense' 
      ? filteredExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
      : filteredExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    
    return (
      <View key={category} style={styles.catItem}>
        <View style={styles.catHeader}>
          <Text style={styles.catName}>{getCatEmoji(category)} {category}</Text>
          <Text style={styles.catAmount}>{formatMoney(amount)}</Text>
        </View>
        <View style={styles.catProgress}>
          <View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: getCategoryColor(category, selectedCategoryStatsType) }]} />
        </View>
        <Text style={styles.catPercent}>{percentage}%</Text>
      </View>
    );
  })}
</View>
```

Repeat similar pattern for payment method statistics.

### 5. Required Styles

```typescript
const styles = StyleSheet.create({
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  // Category type toggle
  categoryTypeToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f5f6fa' },
  categoryTypeChip: { paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  categoryTypeChipActive: { backgroundColor: '#ff4757' },           // Red for expense
  categoryTypeChipActiveIncome: { backgroundColor: '#2ed573' },     // Green for income
  categoryTypeText: { fontSize: 13, color: '#666' },
  categoryTypeTextActive: { color: '#fff', fontWeight: '600' },
  categoryTypeTextActiveIncome: { color: '#fff', fontWeight: '600' },
  
  // Same structure for paymentTypeToggle
  paymentTypeToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f5f6fa' },
  paymentTypeChip: { paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  paymentTypeChipActive: { backgroundColor: '#ff4757' },
  paymentTypeChipActiveIncome: { backgroundColor: '#2ed573' },
  paymentTypeText: { fontSize: 13, color: '#666' },
  paymentTypeTextActive: { color: '#fff', fontWeight: '600' },
  paymentTypeTextActiveIncome: { color: '#fff', fontWeight: '600' },
});
```

## Key Design Decisions

### Why Separate Computation?
- **Performance**: `useMemo` ensures calculations only re-run when `filteredExpenses` changes
- **Clarity**: Explicitly separates concerns between expense and income data
- **Flexibility**: Can extend to add more type-based views later (e.g., custom tags)

### Why Different Totals per Section?
Each statistics section calculates its own total percentage denominator:
- Expense category percent uses total expense amount
- Income category percent uses total income amount
- This ensures percentages always sum to 100% within their context

### Visual Consistency
- Use **red (#ff4757)** for expense active state
- Use **green (#2ed573)** for income active state
- Both use same toggle layout but different colors for instant recognition

## Usage in StatsView

Apply this pattern to any statistics that need type separation:

1. **Category statistics** (expense categories vs income categories)
2. **Payment method statistics** (payment methods used for spending vs receiving)
3. Could also apply to: daily/monthly breakdowns, location-based stats, etc.

## Common Pitfalls

1. **Don't compute separate totals**: Must recalculate total for each selected type to ensure accurate percentages
2. **State persistence**: Consider adding URL/hash params or AsyncStorage if you want to preserve selected type
3. **Empty states**: Handle case where one type has no data in current filter range
4. **Color contrast**: Ensure text color remains readable on both red and green backgrounds

## Related Skills

- `expo-stats-view-payment-type-separation`: Initial implementation of payment method type separation
- `expo-modal-back-handler-fix`: For handling back button when showing filters
- `expo-react-native-debugging-fixes-v56`: Debugging tips for Expo v56+ projects

## Future Enhancements

1. **Persistent preference**: Save user's preferred default type (expense vs income) in AsyncStorage
2. **Side-by-side view**: Option to show both expense and income statistics simultaneously
3. **Visual comparison**: Show difference bars between expense and income for same category/method
4. **Chart integration**: Replace progress bars with mini charts for each type