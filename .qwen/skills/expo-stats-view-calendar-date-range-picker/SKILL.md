---
name: expo-stats-view-calendar-date-range-picker
description: 账单统计页面使用双月历组件替代 DateTimePicker 滚筒式选择器
source: auto-skill
extracted_at: '2026-06-04T01:05:03.262Z'
---

# Expo Stats View - Calendar Date Range Picker Pattern

## Overview
Replace native DateTimePicker roller-style components with a custom dual-month calendar picker for better UX and consistent platform behavior.

## Problem Solved

### Original Issues
1. **Platform inconsistency**: iOS used Modal-wrapped DateTimePicker, Android showed two side-by-side spinner pickers
2. **Poor UX**: Roller-style picking makes it hard to see date relationships (start/end/range)
3. **Visual ambiguity**: No clear indication of selected date range spanning multiple months

## Implementation Pattern

### 1. Create Custom MonthCalendarPicker Component

**File**: `src/components/MonthCalendarPicker.tsx`

```typescript
interface MonthCalendarPickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export default function MonthCalendarPicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: MonthCalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate.getFullYear(), startDate.getMonth(), 1));

  // Generate calendar data for current and next month
  const calendarData = useMemo(() => {
    const months: MonthView[] = [];
    
    for (let i = 0; i < 2; i++) {
      const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      const year = current.getFullYear();
      const month = current.getMonth();
      
      // Calculate first day of week offset (0=Sunday)
      const firstDay = new Date(year, month, 1);
      const startDayOfWeek = firstDay.getDay();
      
      // Days in current/previous/next month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      
      const days: DayInfo[] = [];
      
      // Add previous month's trailing days
      for (let j = startDayOfWeek - 1; j >= 0; j--) {
        const dayNum = daysInPrevMonth - j;
        days.push({
          date: new Date(year, month - 1, dayNum),
          isCurrentMonth: false,
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      // Add current month days
      for (let d = 1; d <= daysInMonth; d++) {
        days.push({
          date: new Date(year, month, d),
          isCurrentMonth: true,
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      // Complete grid (6 rows × 7 columns = 42 cells)
      const remainingSlots = 42 - days.length;
      for (let k = 1; k <= remainingSlots; k++) {
        days.push({
          date: new Date(year, month + 1, k),
          isCurrentMonth: false,
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      months.push({ days, monthName: `${year}年${month + 1}月`, year });
    }
    
    // Mark selected dates and ranges
    if (startDate && endDate) {
      markSelectedDates(months[0].days, startDate, endDate);
      if (!isSameMonth(startDate, endDate)) {
        markSelectedDates(months[1].days, startDate, endDate);
      }
    }
    
    return months;
  }, [currentMonth, startDate, endDate]);
```

### 2. Visual Styling Classes

```typescript
// Day cell states with visual distinction
dayCell: {
  width: '14.28%', // 7 columns
  aspectRatio: 1,
  borderRadius: 8,
}

// State modifiers
dayCellOtherMonth: { backgroundColor: '#fafafa' }
dayCellSelectedStart: { backgroundColor: '#ff4757' }  // Red for start date
dayCellSelectedEnd: { backgroundColor: '#2ed573' }   // Green for end date
dayCellSelectedRange: { backgroundColor: '#ede9ff' }  // Purple tint for range
dayCellToday: { borderWidth: 1, borderColor: '#5b6abf' }

// Number text styles
dayNumberSelected: { color: '#fff', fontWeight: '700' }
dayNumberInRange: { color: '#5b6abf' }
dayNumberToday: { color: '#5b6abf', fontWeight: '700' }
```

### 3. Selection Logic

```typescript
const handleDayPress = (date: Date | null) => {
  if (!date) return;
  
  const clickedDate = new Date(date);
  clickedDate.setHours(0, 0, 0, 0);
  
  // Reset selection if clicking outside current range
  if (!startDate || (endDate && (clickedDate < startDate || clickedDate > endDate))) {
    onStartDateChange(clickedDate);
    onEndDateChange(clickedDate);
    return;
  }
  
  // First selection sets start date
  if (!startDate) {
    onStartDateChange(clickedDate);
    return;
  }
  
  // Second selection completes range (or swaps if earlier date clicked)
  if (startDate && !endDate) {
    if (clickedDate >= startDate) {
      onEndDateChange(clickedDate);
    } else {
      onStartDateChange(clickedDate);
    }
  }
};
```

### 4. Usage in StatsView

```tsx
import MonthCalendarPicker from '../components/MonthCalendarPicker';

// In render:
<View style={styles.filterSection}>
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>日期范围</Text>
  </View>

  {/* Dual-month calendar replaces old picker code */}
  <MonthCalendarPicker
    startDate={startDate}
    endDate={endDate}
    onStartDateChange={setStartDate}
    onEndDateChange={setEndDate}
  />
</View>
```

## Benefits Over Native Pickers

| Aspect | Native DateTimePicker | Custom Calendar Picker |
|--------|----------------------|------------------------|
| UX | Requires scrolling to compare dates | Both months visible simultaneously |
| Range visualization | Not possible | Clear color coding for selected range |
| Platform consistency | Different on iOS/Android | Identical experience |
| Memory usage | Multiple native components | Single React component |
| Customization | Limited | Fully customizable |

## Related Patterns

- **Expo AddExpense datetime picker fix**: For handling Android datetime picker crashes
- **Expo modal back handler fix**: For managing keyboard/modal dismissals

## Files Modified

- `src/screens/StatsView.tsx` - Removed iOS Modal DateTimePicker and Android dual-spinner implementation
- `src/components/MonthCalendarPicker.tsx` - New calendar component created

## Key Design Decisions

1. **No state variables for picker visibility**: Unlike the original code with `showStartPicker`/`showEndPicker`, the calendar is always visible inline

2. **Single source of truth**: `startDate` and `endDate` are controlled directly through props, no local picker state

3. **Cross-month range support**: Calendar marks selected range even when it spans both displayed months

4. **Touch-friendly tap targets**: Each day cell maintains square aspect ratio for consistent touch interaction
