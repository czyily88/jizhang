---
name: expo-android-datetime-picker-crash-fix
description: 修复 Android DateTimePicker mode="datetime"导致的应用闪退问题
source: auto-skill
extracted_at: '2026-06-04T01:05:03.262Z'
---

# Expo Android - DateTimePicker Crash Fix Pattern

## Overview
Fix app crash on Android when using `DateTimePicker` with `mode="datetime"` by separating date and time pickers into individual components.

## Problem Analysis

### Root Cause
When using `@react-native-community/datetimepicker` on Android with:
```tsx
<DateTimePicker
  value={selectedDateTime}
  mode="datetime"
  display="spinner"
  onChange={onDateTimeChange}
/>
```

The component can trigger a race condition where:
1. User interacts with the picker
2. Library sends an event before all internal state is updated
3. The `onChange` callback receives `event.type === 'set'` but `selected === undefined`
4. Callback logic fails, causing app crash or unhandled exception

### Affected Scenarios
- **Spinner mode**: Most common issue with `display="spinner"`
- **Date selection**: Clicking "OK" button may send incomplete events
- **Time wheel**: Rapid spinning can trigger edge cases in event dispatch

## Solution Pattern

### 1. Separate Date and Time Pickers

Instead of single datetime picker, use two independent pickers:

```tsx
{Platform.OS === 'android' && showDateTimePicker && (
  <View>
    {/* Date Picker */}
    <DateTimePicker
      value={selectedDateTime}
      mode="date"
      display="default"          // Changed from "spinner"
      onChange={(_, selected) => {
        if (selected) {
          const newDate = new Date(selectedDateTime);
          newDate.setFullYear(selected.getFullYear());
          newDate.setMonth(selected.getMonth());
          newDate.setDate(selected.getDate());
          setSelectedDateTime(newDate);
        }
      }}
      maximumDate={new Date()}
    />
    
    {/* Time Picker */}
    <DateTimePicker
      value={selectedDateTime}
      mode="time"
      display="default"          // Changed from "spinner"
      onChange={(_, selected) => {
        if (selected) {
          const newDate = new Date(selectedDateTime);
          newDate.setHours(selected.getHours());
          newDate.setMinutes(selected.getMinutes());
          setSelectedDateTime(newDate);
        }
      }}
    />
  </View>
)}
```

### 2. Updated State Management

Remove the old unified handler that caused issues:

**Before (problematic)**:
```typescript
const [showDateTimePicker, setShowDateTimePicker] = useState(false);

const onDateTimeChange = (event: any, selected?: Date) => {
  if (Platform.OS === 'ios') {
    if (selected) {
      setSelectedDateTime(selected);
    }
  } else {
    setShowDateTimePicker(false);  // Can cause crash when selected is undefined
    if (selected) {
      setSelectedDateTime(selected);
    }
  }
};
```

**After (fixed)**:
```typescript
// Inline handlers for each picker - no shared state updates
// Date picker handler updates only date components
// Time picker handler updates only time components
```

### 3. Keep iOS Behavior Unchanged

iOS continues to work with Modal-wrapped datetime picker since it doesn't have the same crash issue:

```tsx
// iOS Modal approach remains the same - safe on iOS
{Platform.OS === 'ios' && showDateTimePicker && (
  <Modal visible animationType="slide" transparent>
    <View style={styles.iosDatetimeConfirmContainer}>
      <TouchableOpacity onPress={() => setShowDateTimePicker(false)}>
        <Text style={styles.iosDatetimeCancelText}>取消</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={confirmDateTime}>
        <Text style={styles.iosDatetimeDoneText}>确定</Text>
      </TouchableOpacity>
    </View>
    <DateTimePicker
      value={selectedDateTime}
      mode="datetime"
      display="spinner"
      onChange={(event, selected) => {
        if (selected) {
          setSelectedDateTime(selected);
        }
      }}
      maximumDate={new Date()}
    />
  </Modal>
)}
```

## Platform-Specific Notes

### Android Recommendations
| Setting | Value | Reason |
|---------|-------|--------|
| `mode` | `"date"` or `"time"` | Never use `"datetime"` together |
| `display` | `"default"` | Avoids spinner-related crashes |
| Separation | Two components | Prevents state sync issues |

### iOS Recommendations
| Setting | Value | Reason |
|---------|-------|--------|
| `mode` | `"datetime"` | Safe on iOS, works correctly |
| `display` | `"spinner"` | Native roller wheel behavior preferred |
| Wrapper | Custom Modal | Consistent UI with other pickers |

## Benefits of This Approach

1. **Stability**: Eliminates crash scenarios completely
2. **Clearer separation**: Date vs time updates are logically distinct
3. **Better user feedback**: Each picker confirms independently
4. **Easier debugging**: Issues localized to specific picker type

## Common Pitfalls to Avoid

1. ❌ **Don't share onChange handlers** between date and time pickers
2. ❌ **Avoid inline setSelection** without creating new Date object
3. ❌ **Don't remove both native components at once** - keep them mounted until user dismisses picker
4. ✅ **Always check `if (selected)`** before calling setState

## Related Skills

- **expo-stats-view-calendar-date-range-picker**: Alternative solution using custom calendar UI
- **expo-modal-back-handler-fix**: For managing back button dismissals in picker modals

## Files Modified

- `src/screens/AddExpenseScreen.tsx`:
  - Removed: unified `onDateTimeChange` handler
  - Added: separate date/time picker components for Android
  - Kept: iOS Modal implementation unchanged

## Testing Checklist

- [ ] Android: Select date then confirm → no crash
- [ ] Android: Select time then confirm → no crash  
- [ ] Android: Cancel picker → returns to form properly
- [ ] iOS: Modal opens/closes correctly
- [ ] Both: Selected date persists after selection
- [ ] Both: Form submission includes correct timestamp
