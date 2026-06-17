---
name: expo-debug-native-modules-and-context-naming-conflicts
description: Debug Expo React Native issues with native modules and context naming conflicts
source: auto-skill
extracted_at: '2026-06-03T08:15:00.000Z'
---

# Debugging Expo React Native Apps: Native Module Issues and Context Naming Conflicts

This procedure outlines how to diagnose and fix common crash issues in Expo/React Native apps caused by naming conflicts in state management contexts and incorrect data source usage.

## 🚨 Real-World Crash Case (2026-06-03)

### Symptoms Reported
1. **"点 + 号记一笔闪退"** - Tapping "+" button to add expense causes immediate crash
2. **"导出数据错误"** - Settings export functionality fails
3. **"增加付款方式管理"** - Payment method feature needed

### Actual Root Cause Found

**File**: `src/AppContext.tsx` Lines 37-40 and 64-68

The crash was NOT in the screen components but in the **Context Provider itself**. When destructuring storage functions:

```typescript
// ❌ BEFORE - Line 17: Direct import without alias
const {
  ...,
  removeExpenseCategory,  // ← Conflict with local function below
  removeIncomeCategory,
} = storage;

// ❌ BEFORE - Line 64-68: Function calls itself!
const removeExpenseCategory = useCallback(async (name: string) => {
  await removeExpenseCategory(name);  // INFINITE RECURSION!
  setExpenseCategories(prev => prev.filter(c => c !== name));
}, []);
```

**Why this crashes**: The callback function `removeExpenseCategory` references itself instead of the imported `storage.removeExpenseCategory`, causing infinite recursion and JavaScript call stack overflow.

### Fixed Code

```typescript
// ✅ AFTER - Line 17-18: Use aliases to avoid shadowing
const {
  ...,
  removeExpenseCategory: rmExpenseCat,
  removeIncomeCategory: rmIncomeCat,
} = storage;

// ✅ AFTER - Line 64-68: Correctly call aliased function
const removeExpenseCategory = useCallback(async (name: string) => {
  await rmExpenseCat(name);  // Calls the storage function
  setExpenseCategories(prev => prev.filter(c => c !== name));
}, []);
```

---

## Problem Pattern Observed

### Symptoms
1. **Tap + button crashes app immediately** - Often happens when navigating to screens that depend on context data
2. **Settings export/import fails silently** - AsyncStorage methods used incorrectly
3. **App works but features are broken** - Data not loading from correct sources

### Root Causes

#### 1. Function Name Shadowing (Most Common)
When destructuring imports with the same name as a function being defined:

```typescript
// ❌ BAD - This causes infinite recursion/crash
const { removeExpenseCategory } = storage;

const removeExpenseCategory = useCallback(async (name: string) => {
  await removeExpenseCategory(name); // Self-referential! Crash on first call
  setCategories(prev => prev.filter(c => c !== name));
}, []);
```

**Solution**: Rename the imported function:

```typescript
// ✅ GOOD
const { removeExpenseCategory: rmExpenseCat } = storage;

const removeExpenseCategory = useCallback(async (name: string) => {
  await rmExpenseCat(name); // Call imported function correctly
  setCategories(prev => prev.filter(c => c !== name));
}, []);
```

#### 2. Incorrect Data Source
Using `AsyncStorage` directly instead of React Context:

```typescript
// ❌ BAD - Bypasses React's state management, inconsistent UI state
const expensesRaw = await AsyncStorage.getItem('expense_tracker_expenses');
const expenses = expensesRaw ? JSON.parse(expensesRaw) : [];

// ✅ GOOD - Uses context for guaranteed consistency
const { expenses } = useApp();
```

### Diagnostic Steps

1. **Check Metro bundler console**: Look for errors like:
   - "Maximum call stack size exceeded" → Infinite recursion (naming conflict)
   - "AsyncStorage is not defined" → Missing import
   - "Cannot read properties of undefined" → Wrong data source

2. **Test screen navigation**: If tapping "+" crashes, check if `AddExpenseScreen` or any parent component uses broken context functions

3. **Verify imports**: Ensure all AsyncStorage/Direct module imports have proper imports at top of file

4. **Search for pattern**: Search codebase for `await functionName(name)` where `functionName` appears in both import and function definition

### Fix Checklist

- [ ] Rename all destructured storage functions that conflict with local function names
- [ ] Use aliases for storage functions (`removeExpenseCategory: rmExpenseCat`)
- [ ] Replace direct AsyncStorage calls with `useApp()` hook in UI components
- [ ] Add try-catch around async operations that could crash the app
- [ ] Verify all screens properly initialize their context dependencies

### Prevention Tips

1. **Always use aliases** when destructuring from storage modules:
   ```typescript
   const {
     addExpense: addExpenseRaw,
     deleteExpense: deleteExpenseRaw,
     updateExpense: updateExpenseRaw,
     removeExpenseCategory: rmExpenseCat,
     removeIncomeCategory: rmIncomeCat,
   } = storage;
   ```

2. **Use typed interfaces** for context to catch missing exports at compile time:
   ```typescript
   interface AppContextType {
     expenses: Expense[];
     paymentMethods: PaymentMethod[];
     addExpense: (e: Omit<Expense, 'id'>) => void;
     removeExpense: (id: string) => void;
   }
   ```

3. **Centralize data access** in Context Provider, never use AsyncStorage directly in UI screens

## Related Files

- `src/AppContext.tsx` - Main state management, defines context API
- `src/storage.ts` - Raw AsyncStorage wrapper functions
- `src/screens/*` - Should only use `useApp()` hook, never direct Storage
