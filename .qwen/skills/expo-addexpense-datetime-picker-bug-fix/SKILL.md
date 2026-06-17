---
name: expo-addexpense-datetime-picker-bug-fix
description: 修复记账界面日期选择器循环弹出和闪退问题
source: auto-skill
extracted_at: '2026-06-04T10:30:00.000Z'
---

# Expo AddExpense - Date Time Picker Infinite Loop Bug Fix

## Overview
Fixes infinite popup loop when selecting date/time in AddExpense/Edit screens by using separate state primitives (year, month, day, hour, minute) instead of Date objects.

## Problem Solved

### Symptoms
1. **Infinite loop**: Clicking "确定" (confirm) on date picker causes it to reopen immediately
2. **Cascade trigger**: Selecting time triggers date picker again after confirmation
3. **Unresponsive UI**: User must force close app due to un-dismissible modals

### Root Cause Analysis

The bug occurred due to **cascading state updates** in a circular pattern:

```typescript
// BEFORE (problematic pattern)
const [selectedDateTime, setSelectedDateTime] = useState<Date>(editingDate);
const [showDatePicker, setShowDatePicker] = useState(false);
const [dateForPicker, setDateForPicker] = useState(editingDate);

// In onChange handler:
onChange((_, selected) => {
  if (selected) {
    setDateForPicker(selected);           // Update temp state → triggers re-render
    const updated = new Date(selectedDateTime);  // Read stale selectedDateTime
    updated.setFullYear(selected.getFullYear()); // Modify
    setSelectedDateTime(updated);          // Update main state → triggers more re-renders
    setShowDatePicker(false);              // Hide picker
  }
});
```

The problem:
1. Android DateTimePicker sends `onChange` IMMEDIATELY on selection (not just on confirm)
2. Updating multiple states (`dateForPicker`, `selectedDateTime`) triggers re-render
3. Re-render causes component to remount with same props → picker shows again
4. The cycle repeats because `selectedDateTime` changes every time user selects a date

### Why Previous Fixes Failed

The merge approach using single `selectedDateTime` + Modal worked initially but broke when:
- iOS Modal confirmation button tried to read from `selectedDateTime` 
- That value changed during the picker lifecycle
- Caused inconsistent state between picker internal value and parent state

## Implementation Pattern

### Solution: Separate Primitive States

Instead of storing `Date` objects, store individual date/time components:

```typescript
// Initialize from editing date (if exists) or current date
const editingDate = editing ? new Date(expense!.createdAt) : new Date();

// Store individual components (primitives, not Date objects)
const [year, setYear] = useState(editingDate.getFullYear());
const [month, setMonth] = useState(editingDate.getMonth());
const [day, setDay] = useState(editingDate.getDate());
const [hour, setHour] = useState(editingDate.getHours());
const [minute, setMinute] = useState(editingDate.getMinutes());

// Separate visibility controls
const [datePickerVisible, setDatePickerVisible] = useState(false);
const [timePickerVisible, setTimePickerVisible] = useState(false);

// Temporary values for pickers (avoids immediate state sync)
const [tempDate, setTempDate] = useState(new Date(year, month, day));
const [tempTime, setTempTime] = useState(new Date(0, 0, 0, hour, minute));
```

### Platform-Specific Handlers

**Android (direct primitive update):**
```typescript
{Platform.OS === 'android' && datePickerVisible && (
  <DateTimePicker
    value={tempDate}
    mode="date"
    display="spinner"
    onChange={(_, selected) => {
      if (selected) {
        setTempDate(selected);
        // Direct primitive updates - no cascading Date object creation
        setYear(selected.getFullYear());
        setMonth(selected.getMonth());
        setDay(selected.getDate());
        // Picker automatically hides via its own event flow
      }
    }}
    maximumDate={new Date()}
  />
)}
```

**iOS (Modal with explicit confirmation):**
```typescript
// Confirmation handler only called when user taps "确定"
const confirmDate = () => {
  setYear(tempDate.getFullYear());
  setMonth(tempDate.getMonth());
  setDay(tempDate.getDate());
  setDatePickerVisible(false);
};

{Platform.OS === 'ios' && datePickerVisible && (
  <Modal visible animationType="slide" transparent>
    <View style={styles.iosOverlay}>
      <View style={styles.iosContainer}>
        <View style={styles.iosHeader}>
          <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
            <Text style={styles.iosCancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.iosTitle}>选择日期</Text>
          <TouchableOpacity onPress={confirmDate}>
            <Text style={styles.iosConfirm}>确定</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="spinner"
          onChange={(_, selected) => {
            if (selected) setTempDate(selected);
            // DO NOT call setDatePickerVisible(false) here!
          }}
          maximumDate={new Date()}
        />
      </View>
    </View>
  </Modal>
)}
```

### Final Timestamp Calculation

Create timestamp only when needed (on submit):

```typescript
const getFinalDateTime = (): number => {
  return new Date(year, month, day, hour, minute).getTime();
};

const handleSubmit = () => {
  const amount = Math.round(parseFloat(amountStr) * 100);
  if (!amountStr || isNaN(amount) || amount <= 0) {
    Alert.alert('提示', '请输入有效金额');
    return;
  }
  if (!paymentMethod) {
    Alert.alert('提示', '请选择付款方式');
    return;
  }

  if (editing && expense) {
    editExpense(expense.id, { type, amount, category, paymentMethod, note: note.trim(), createdAt: getFinalDateTime() });
  } else {
    addExpense({ type, amount, category, paymentMethod, note: note.trim(), createdAt: getFinalDateTime() });
  }
  onClose();
};
```

### Display Functions

Format primitives into strings for UI:

```typescript
const formatDateDisplay = (y: number, m: number, d: number): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const checkDate = new Date(y, m, d);
  
  if (checkDate.toDateString() === today.toDateString()) return '今天';
  if (checkDate.toDateString() === yesterday.toDateString()) return '昨天';
  
  const yearStr = y.toString();
  const monthStr = (m + 1).toString().padStart(2, '0');
  const dayStr = d.toString().padStart(2, '0');
  return `${yearStr}-${monthStr}-${dayStr}`;
};

const formatTimeDisplay = (h: number, min: number): string => {
  const hourStr = h.toString().padStart(2, '0');
  const minuteStr = min.toString().padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
};
```

## Why This Pattern Works

| Issue | Old Pattern | New Pattern |
|-------|-------------|-------------|
| State source | `Date` object (mutable) | Primitives (immutable) |
| Picker control | Multiple linked states | Single visibility flag |
| onChange callback | Updates main state directly | Only updates temp state |
| Re-render cause | Any state change triggers | Visibility flag only |
| Lifecycle | Circular updates possible | Linear progression |

## Benefits Over Date Object Approach

1. **No cascading re-renders**: Changing year doesn't trigger `setSelectedDateTime()` cascade
2. **Predictable timing**: Android picks immediately update primitives without intermediate Date creation
3. **Explicit confirmation**: iOS Modal's confirm button is the ONLY way to hide picker
4. **Cleaner code**: No need to manually construct Date objects in handlers
5. **Easier debugging**: Each primitive maps directly to one visual element

## Edge Cases Handled

1. **Editing existing expense**: Initial state derived from `expense.createdAt`
2. **New expense**: Falls back to current date/time
3. **Empty categories/payment methods**: Shows placeholder "未选择"
4. **Hardware back press**: Returns to home screen via `handleBackPress()`

## Related Patterns

- **expo-stats-view-calendar-date-range-picker**: Also uses separate start/end states
- **expo-modal-back-handler-fix**: Uses similar Modal dismissal pattern

## Files Modified

- `src/screens/AddExpenseScreen.tsx` - Complete refactor of date/time handling
- Removed dependency on `DateTimeSelector.tsx` (deprecated component)

## Migration Checklist

If you have an older implementation:

1. ❌ Remove all `Date` object states for dates/times
2. ✅ Replace with 5 integer states: year, month, day, hour, minute
3. ✅ Remove any `selectedDateTime` compound state
4. ✅ Move picker show/hide logic EXCLUSIVELY to Modal confirm buttons (iOS) or native flow (Android)
5. ✅ Calculate timestamp ONLY in submit handler using `new Date(year, month, day, hour, minute)`
6. ✅ Never call `setShowDatePicker(false)` inside `onChange` - let the platform handle it
