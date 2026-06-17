---
name: expo-addexpense-datetime-layout-split
description: 记账界面拆分日期时间为独立选择器并优化布局
source: auto-skill
extracted_at: '2026-06-04T09:33:15.452Z'
---

# Expo AddExpense - Date & Time Split Layout Pattern

## Overview
Split date and time into two independent picker fields on AddExpense/Edit screens with improved horizontal layout organization.

## Problem Solved

### Original Issues
1. **Single datetime picker**: One field for both date AND time reduced control granularity
2. **Platform inconsistency**: Android `mode="datetime"` caused crash on some devices
3. **Poor vertical spacing**: Each picker took full width, wasting screen real estate

### Root Cause of Android Crashes
The `@react-native-community/datetimepicker` library has a bug where `mode="datetime"` combined with `display="spinner"` sends an event before the user confirms selection, causing:
```typescript
onChange(event, selected) // selected is undefined!
```

## Implementation Pattern

### 1. Separate Date & Time States

```typescript
// Original single state (problematic)
const [selectedDateTime, setSelectedDateTime] = useState<Date>(editingDate);
const [showDateTimePicker, setShowDateTimePicker] = useState(false);

// Split into separate states (fixed)
const [selectedDateTime, setSelectedDateTime] = useState<Date>(editingDate);

// Independent date picker state
const [showDatePicker, setShowDatePicker] = useState(false);
const [dateForPicker, setDateForPicker] = useState<Date>(editingDate);

// Independent time picker state  
const [showTimePicker, setShowTimePicker] = useState(false);
const [timeForPicker, setTimeForPicker] = useState<Date>(editingDate);
```

### 2. Horizontal Row Layout

```tsx
{/* Date and Time in same row */}
<View style={styles.dateTimeRow}>
  {/* Date field */}
  <View style={styles.dateTimeField}>
    <Text style={styles.pickerLabel}>日期</Text>
    <TouchableOpacity
      style={styles.dateTimePickerButton}
      onPress={() => {
        setDateForPicker(selectedDateTime);
        setShowDatePicker(true);
      }}
    >
      <Text style={styles.dateTimeValue}>{formatDateDisplay(selectedDateTime)}</Text>
      <Text style={styles.pickerArrow}>›</Text>
    </TouchableOpacity>
  </View>

  {/* Time field */}
  <View style={styles.dateTimeField}>
    <Text style={styles.pickerLabel}>时间</Text>
    <TouchableOpacity
      style={styles.dateTimePickerButton}
      onPress={() => {
        setTimeForPicker(selectedDateTime);
        setShowTimePicker(true);
      }}
    >
      <Text style={styles.dateTimeValue}>{formatTimeDisplay(selectedDateTime)}</Text>
      <Text style={styles.pickerArrow}>›</Text>
    </TouchableOpacity>
  </View>
</View>
```

### 3. Platform-Specific Picker Implementations

**iOS Modal Approach:**
```tsx
{Platform.OS === 'ios' && showDatePicker && (
  <Modal visible animationType="slide" transparent>
    <View style={styles.iosOverlay}>
      <View style={styles.iosContainer}>
        <View style={styles.iosHeader}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
            <Text style={styles.iosCancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.iosTitle}>选择日期</Text>
          <TouchableOpacity onPress={() => {
            const updated = new Date(selectedDateTime);
            updated.setFullYear(dateForPicker.getFullYear());
            updated.setMonth(dateForPicker.getMonth());
            updated.setDate(dateForPicker.getDate());
            setSelectedDateTime(updated);
            setShowDatePicker(false);
          }}>
            <Text style={styles.iosConfirm}>确定</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={dateForPicker}
          mode="date"
          display="spinner"
          onChange={(_, selected) => { if (selected) setDateForPicker(selected); }}
          maximumDate={new Date()}
        />
      </View>
    </View>
  </Modal>
)}
```

**Android Spinner Approach:**
```tsx
{Platform.OS === 'android' && showDatePicker && (
  <DateTimePicker
    value={dateForPicker}
    mode="date"
    display="spinner"
    onChange={(_, selected) => {
      if (selected) {
        setDateForPicker(selected);
        const updated = new Date(selectedDateTime);
        updated.setFullYear(selected.getFullYear());
        updated.setMonth(selected.getMonth());
        updated.setDate(selected.getDate());
        setSelectedDateTime(updated);
      }
    }}
    maximumDate={new Date()}
  />
)}
```

### 4. Category & Payment Method Row

```tsx
{/* Category and Payment in same row */}
<View style={styles.categoryPaymentRow}>
  <View style={styles.categoryField}>
    <Text style={styles.pickerLabel}>分类</Text>
    <TouchableOpacity style={styles.pickerInputWrapper} onPress={() => setShowCategoryPicker(true)}>
      <Text style={styles.pickerInput}>{category}</Text>
      <Text style={styles.pickerArrow}>›</Text>
    </TouchableOpacity>
  </View>

  <View style={styles.paymentField}>
    <Text style={styles.pickerLabel}>{type === 'expense' ? '付款' : '收款'}方式</Text>
    <TouchableOpacity style={styles.pickerInputWrapper} onPress={() => setShowPaymentPicker(true)}>
      <Text style={styles.pickerInput}>{pm?.name || '未选择'}</Text>
      <Text style={styles.pickerArrow}>›</Text>
    </TouchableOpacity>
  </View>
</View>
```

### 5. Styles

```typescript
const styles = StyleSheet.create({
  // Horizontal rows
  dateTimeRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16 },
  dateTimeField: { flex: 1 },
  categoryPaymentRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginTop: 8 },
  categoryField: { flex: 1 },
  paymentField: { flex: 1 },
  
  // Pickers as touchable buttons
  dateTimePickerButton: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderWidth: 1, borderColor: '#eee', borderRadius: 10, 
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fafafa' 
  },
  pickerInputWrapper: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderWidth: 1, borderColor: '#eee', borderRadius: 10, 
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fafafa' 
  },
  pickerArrow: { fontSize: 18, color: '#ccc' },
});
```

## Benefits Over Single Picker

| Aspect | Single Datetime Picker | Split Date+Time Picker |
|--------|----------------------|------------------------|
| UX Granularity | Hard to change just time/date | Independent controls |
| Crash Risk | High (`mode="datetime"` bug) | None (using `mode="date"` / `"time"`) |
| Screen Real Estate | Wasted space (full width) | Efficient (half width each) |
| Error Recovery | Must restart entire picker | Only reselect wrong field |

## Related Patterns

- **expo-android-datetime-picker-crash-fix**: Uses same date/time split approach
- **expo-modal-back-handler-fix**: For handling modal dismissals safely

## Files Modified

- `src/screens/AddExpenseScreen.tsx` - Replaced single DateTimeSelector with independent pickers
- `src/components/DateTimeSelector.tsx` - No longer used (deprecated pattern)

## Key Design Decisions

1. **Never use `mode="datetime"` on Android** - This triggers the known crash bug
2. **Separate iOS Modal for confirmation** - Native spinner doesn't have cancel/confirm UI
3. **Inline state update** - Update `selectedDateTime` immediately when picking date OR time
4. **Reusable picker patterns** - Same wrapper styles for all picker inputs maintain consistency
5. **Touch-friendly targets** - Full-width touch areas with visual feedback arrows

## Edge Cases Handled

1. **Editing existing expense**: Pre-populate both date and time from `expense.createdAt`
2. **Empty categories/payment methods**: Show "未选择" placeholder text
3. **Return key handling**: Cancel button intercepts hardware back press
