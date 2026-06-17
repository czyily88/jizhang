---
name: expo-addexpense-datetime-picker-merge
description: Merge date and time pickers into single datetime spinner for AddExpenseScreen
source: auto-skill
extracted_at: '2026-06-03T23:45:00.000Z'
---

# Expo AddExpense Screen - Date and Time Picker Merge Pattern

## Overview
Merges separate date and time pickers into a single combined `datetime` picker to simplify UI and reduce user interactions from two taps to one.

## Implementation Steps

### 1. Update State Management
Replace separate date/time states with a single `selectedDateTime`:

```typescript
// Before (separate states)
const [selectedDate, setSelectedDate] = useState<Date>(editingDate);
const [selectedTime, setSelectedTime] = useState<string>(() => {
  if (editing) {
    return `${editingDate.getHours().toString().padStart(2, '0')}:${editingDate.getMinutes().toString().padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
});
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);

// After (merged state)
const [selectedDateTime, setSelectedDateTime] = useState<Date>(editingDate);
const [showDateTimePicker, setShowDateTimePicker] = useState(false);
```

### 2. Simplify Handler Functions

Replace separate date/time change handlers with unified handler:

```typescript
const onDateTimeChange = (event: any, selected?: Date) => {
  if (Platform.OS === 'ios') {
    // iOS: keep picker visible until confirmation
    if (selected) {
      setSelectedDateTime(selected);
    }
  } else {
    // Android: hide immediately and set date
    setShowDateTimePicker(false);
    if (selected) {
      setSelectedDateTime(selected);
    }
  }
};

const confirmDateTime = () => {
  setShowDateTimePicker(false);
};
```

### 3. Update Timestamp Display Function

Simplify to use single Date object directly:

```typescript
const formatDateTimeDisplay = (): string => {
  const d = selectedDateTime;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) 
    return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (d.toDateString() === yesterday.toDateString()) 
    return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};
```

### 4. Update Submit Handler

Direct timestamp usage without manual parsing:

```typescript
if (editing && expense) {
  editExpense(expense.id, { 
    type, amount, category, paymentMethod, note: note.trim(), 
    createdAt: selectedDateTime.getTime() 
  });
} else {
  addExpense({ 
    type, amount, category, paymentMethod, note: note.trim(), 
    createdAt: selectedDateTime.getTime() 
  });
}
```

### 5. Update UI Input Field

Single input field labeled "日期时间":

```tsx
<TouchableOpacity
  style={styles.pickerInputWrapper}
  onPress={() => setShowDateTimePicker(true)}
>
  <Text style={styles.pickerLabel}>日期时间</Text>
  <View style={styles.pickerInputContainer}>
    <TextInput
      style={styles.pickerInput}
      value={formatDateTimeDisplay()}
      editable={false}
    />
    <Text style={styles.pickerArrow}>›</Text>
  </View>
</TouchableOpacity>
```

### 6. Replace Separate Pickers with Single Datetime Picker

**Android:**
```tsx
{Platform.OS === 'android' && showDateTimePicker && (
  <DateTimePicker
    value={selectedDateTime}
    mode="datetime"           // Changed from "date"/"time"
    display="spinner"         // Spinner-style scrolling
    onChange={onDateTimeChange}
    maximumDate={new Date()}
  />
)}
```

**iOS Modal:**
```tsx
{Platform.OS === 'ios' && showDateTimePicker && (
  <Modal visible animationType="slide" transparent>
    <View style={styles.iosDatePickerOverlay}>
      <View style={styles.iosDatePickerContainer}>
        <View style={styles.iosDatePickerHeader}>
          <TouchableOpacity onPress={() => setShowDateTimePicker(false)}>
            <Text style={styles.iosCancelBtn}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.iosDatePickerTitle}>选择日期时间</Text>
          <TouchableOpacity onPress={confirmDateTime}>
            <Text style={styles.iosConfirmBtn}>确定</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={selectedDateTime}
          mode="datetime"         // Changed from "date"/"time"
          display="spinner"       // Spinner-style scrolling
          onChange={onDateTimeChange}
          maximumDate={new Date()}
        />
      </View>
    </View>
  </Modal>
)}
```

## Benefits

1. **Reduced User Actions**: From 2 taps (date then time) to 1 tap
2. **Simplified UI**: One input field instead of two
3. **Cleaner Code**: Less state management and handler logic
4. **Consistent UX**: Both platforms use identical `mode="datetime"` spinner

## Platform Notes

- **Android**: Uses native `mode="datetime"` with `display="spinner"` for consistent roller wheel behavior
- **iOS**: Wraps picker in custom Modal with header buttons (same pattern as other pickers)
- Both platforms share same `maximumDate={new Date()}` to prevent future dates

## Common Pitfalls

1. **Don't manually parse time strings**: The old approach of concatenating date+time strings is error-prone
2. **Use direct timestamp**: `selectedDateTime.getTime()` gives correct Unix timestamp
3. **Keep maximumDate**: Always restrict to current date to prevent invalid entries
4. **Update display function**: Must extract hour/minute from single Date object, not separate string

## Related Skills

- `expo-modal-back-handler-fix`: For handling back button in modals
- `expo-android-release-build-gradle-931-java17`: For building APKs with this code changes