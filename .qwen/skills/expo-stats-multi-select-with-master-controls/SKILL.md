---
name: expo-stats-multi-select-with-master-controls
description: Implementing master select/deselect controls for filter modals and edit functionality for configurable items
source: auto-skill
extracted_at: '2026-06-16T07:45:00.000Z'
---

# Multi-Select Filter with Master Controls and Edit Functionality Pattern

## Overview
This skill covers implementing master select/deselect controls (全选/全不选) in filter modals, along with add/edit/delete functionality for user-configurable items like payment methods and categories.

## Implementation Pattern

### 1. Multi-Select Filter with Master Controls (`StatsView.tsx`)

#### State Management
```typescript
// Add state for tracking selection mode
const [paymentSelectAll, setPaymentSelectAll] = useState<'all' | 'none' | 'partial'>('none');
const [categorySelectAll, setCategorySelectAll] = useState<'all' | 'none' | 'partial'>('none');

// Update toggle functions to track selection state
const togglePaymentMethod = (methodId: string) => {
  setSelectedPaymentMethods(prev => {
    const next = prev.includes(methodId) 
      ? prev.filter(id => id !== methodId) 
      : [...prev, methodId];
    
    // Update master selection state based on count
    if (next.length === 0) {
      setPaymentSelectAll('none');
    } else if (next.length === paymentMethods.length) {
      setPaymentSelectAll('all');
    } else {
      setPaymentSelectAll('partial');
    }
    return next;
  });
};

// Master select/deselect handlers
const handlePaymentSelectAll = () => {
  if (paymentSelectAll === 'all') {
    // Toggle to deselect all
    setSelectedPaymentMethods([]);
    setPaymentSelectAll('none');
  } else {
    // Select all items
    setSelectedPaymentMethods([...paymentMethods.map(pm => pm.id)]);
    setPaymentSelectAll('all');
  }
};

const handleCategorySelectAll = () => {
  const allCats: string[] = [];
  if (selectedTypes.includes('expense')) {
    allCats.push(...expenseCategories);
  }
  if (selectedTypes.includes('income')) {
    allCats.push(...incomeCategories);
  }
  
  if (categorySelectAll === 'all') {
    setSelectedCategories([]);
    setCategorySelectAll('none');
  } else {
    setSelectedCategories(allCats);
    setCategorySelectAll('all');
  }
};
```

#### UI Structure
```tsx
<View style={styles.bottomSheetHeader}>
  <View style={styles.sheetHeaderLeft}>
    <Text style={styles.bottomSheetTitle}>选择付款方式（可多选）</Text>
    <TouchableOpacity
      style={[styles.selectAllBtn, paymentSelectAll === 'all' && styles.selectAllBtnActive]}
      onPress={handlePaymentSelectAll}
    >
      <Text style={[styles.selectAllBtnText, paymentSelectAll === 'all' && styles.selectAllBtnTextActive]}>
        {paymentSelectAll === 'all' ? '全不选' : '全选'}
      </Text>
    </TouchableOpacity>
  </View>
  <TouchableOpacity onPress={() => setShowPaymentFilter(false)}>
    <Text style={styles.bottomSheetClose}>✕</Text>
  </TouchableOpacity>
</View>
```

#### Styles
```typescript
sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
bottomSheetTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', flex: 1 },
selectAllButtonContainer: { flexShrink: 0 },
selectAllBtn: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#5b6abf',
},
selectAllBtnActive: { backgroundColor: '#5b6abf', borderColor: '#5b6abf' },
selectAllBtnText: { fontSize: 13, color: '#5b6abf', fontWeight: '600' },
selectAllBtnTextActive: { color: '#fff' },
```

### 2. Prevent Deleting Default Items (`AppContext.tsx` + Screen)

#### Context Protection
```typescript
const removePaymentMethod = useCallback((id: string) => {
  const pm = paymentMethods.find(m => m.id === id);
  if (pm && DEFAULT_PAYMENT_METHODS.some(d => d.name === pm.name)) {
    Alert.alert('提示', '默认付款方式无法删除');
    return;
  }
  setPaymentMethods(prev => {
    const next = prev.filter(m => m.id !== id);
    persistPaymentMethods(next).catch(() => {});
    return next;
  });
}, [paymentMethods, DEFAULT_PAYMENT_METHODS, persistPaymentMethods]);
```

#### UI Hiding Delete Button
```tsx
renderItem={({ item }) => {
  const isDefault = DEFAULT_PAYMENT_METHODS.some(d => d.name === item.name);
  return (
    <View style={styles.card}>
      <Text style={styles.cardName}>{item.name}</Text>
      {!isDefault && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>删除</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}}
```

### 3. Edit Functionality for Configurable Items

#### Context Update Functions
```typescript
const updatePaymentMethod = useCallback((id: string, newName: string) => {
  const pm = paymentMethods.find(m => m.id === id);
  if (pm && DEFAULT_PAYMENT_METHODS.some(d => d.name === pm.name)) {
    Alert.alert('提示', '默认付款方式无法修改');
    return;
  }
  
  // Update payment method list
  setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  
  // Persist updated methods
  const updatedMethods = paymentMethods.map(m => m.id === id ? { ...m, name: newName } : m);
  persistPaymentMethods(updatedMethods).catch(() => {});
  
  // Sync update to all related expense records
  setExpenses(prev => prev.map(e => e.paymentMethod === pm?.name ? { ...e, paymentMethod: newName } : e));
}, [paymentMethods, DEFAULT_PAYMENT_METHODS, persistPaymentMethods]);
```

For categories (async):
```typescript
const updateExpenseCategory = useCallback(async (oldName: string, newName: string) => {
  if (oldName === newName) return;
  
  // Remove old, add new in storage
  await rmExpenseCat(oldName);
  await addExpenseCat(newName);
  
  // Update local state
  setExpenseCategories(prev => prev.map(c => c === oldName ? newName : c));
  
  // Sync to all related expense records
  setExpenses(prev => prev.map(e => 
    e.type === 'expense' && e.category === oldName ? { ...e, category: newName } : e
  ));
}, []);
```

#### Screen Edit Modal
```typescript
// State for editing
const [showEditModal, setShowEditModal] = useState(false);
const [editingItem, setEditingItem] = useState<typeof paymentMethods[0] | null>(null);
const [editName, setEditName] = useState('');

const openEditModal = (item: typeof paymentMethods[0]) => {
  setEditingItem(item);
  setEditName(item.name);
  setShowEditModal(true);
};

const handleUpdate = async () => {
  if (!editName.trim()) {
    Alert.alert('提示', '请输入付款方式名称');
    return;
  }
  if (editingItem && editName !== editingItem.name) {
    updatePaymentMethod(editingItem.id, editName.trim());
  }
  setShowEditModal(false);
  setEditingItem(null);
  setEditName('');
};
```

#### Edit Button Layout
```tsx
<View style={styles.cardActions}>
  {!isDefault && (
    <>
      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
        <Text style={styles.editBtnText}>编辑</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Text style={styles.deleteBtnText}>删除</Text>
      </TouchableOpacity>
    </>
  )}
</View>
```

#### Edit Button Styles
```typescript
cardActions: { flexDirection: 'row', gap: 8 },
editBtn: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#5b6abf',
  borderRadius: 8
},
editBtnText: { color: '#5b6abf', fontSize: 13 },
deleteBtn: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#ff4757',
  borderRadius: 8
},
deleteBtnText: { color: '#ff4757', fontSize: 13 },
```

## Key Considerations

1. **Three-State Selection Tracking**: Use `'all' | 'none' | 'partial'` to track selection state accurately
2. **Synchronization**: Always sync updates to both the configuration list AND all related expense records
3. **Default Item Protection**: Check for default items before allowing modify/delete operations
4. **Conditional UI**: Hide/disable controls for protected/default items
5. **Storage Consistency**: When updating names, remove old entry and add new entry to maintain clean storage

## Common Pitfalls

- Forgetting to sync edits to existing expense records
- Not handling the case when no items are selected but showing "全选" button
- Missing type guards for default item checks
- Not updating parent state when modifying child states