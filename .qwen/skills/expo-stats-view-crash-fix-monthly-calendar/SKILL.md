---
name: expo-stats-view-crash-fix-monthly-calendar
description: 修复 StatsView 双月历组件导致的闪退问题（闭包陷阱）
source: auto-skill
extracted_at: '2026-06-04T09:35:15.452Z'
---

# Expo StatsView - MonthCalendarPicker Crash Fix

## Overview
Fix crash when opening StatsView caused by closure variable capture in `useMemo` dependencies and invalid date handling.

## Problem Solved

### Crash Symptoms
- **Trigger**: Click "账单统计" button in Settings
- **Result**: App immediately crashes (force closes)
- **No error message visible** - happens during component render

### Root Cause Analysis

#### Issue 1: Closure Variables in useMemo Dependencies
```typescript
// ❌ WRONG - helper functions inside component scope create stale closures
const calendarData = useMemo(() => {
  // These functions reference external state variables
  const compare = (d: Date) => d.getFullYear() === start.getFullYear(); 
  markSelectedDates(days, start, end);
}, [currentMonth, startDate, endDate]);

function markSelectedDates(days, start, end) {
  // Closes over start/end but they're not in dependency array!
}
```

When `startDate` or `endDate` changes:
1. React re-runs the component function with NEW values
2. BUT `markSelectedDates` still references OLD closure values
3. This causes state mutation on wrong dates → crash

#### Issue 2: Invalid Date Handling
```typescript
// ❌ CRASHES if startDate is null/undefined/InvalidDate
new Date(startDate.getFullYear(), startDate.getMonth(), 1)
```

When user navigates from home screen to stats without proper initialization:
- `startDate` might be `undefined` initially
- Calling `.getFullYear()` throws TypeError
- Uncaught exception crashes app

## Implementation Pattern

### 1. Move Helper Functions Outside Component Scope

```typescript
// ✅ CORRECT - Pure functions at module level, no closure issues

interface DayInfo {
  date: Date | null;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isSelectedRange: boolean;
}

export const markSelectedDates = (days: DayInfo[], start: Date, end: Date) => {
  for (const day of days) {
    if (!day.date) continue;
    
    const isStart = day.date.getFullYear() === start.getFullYear() &&
                    day.date.getMonth() === start.getMonth() &&
                    day.date.getDate() === start.getDate();
    
    const isEnd = day.date.getFullYear() === end.getFullYear() &&
                  day.date.getMonth() === end.getMonth() &&
                  day.date.getDate() === end.getDate();
    
    if (isStart) day.isSelectedStart = true;
    if (isEnd) day.isSelectedEnd = true;
    if (day.date > start && day.date < end) day.isSelectedRange = true;
  }
};
```

#### Why This Works
- No `this` context needed
- Takes all dependencies as parameters
- Can't accidentally capture stale values
- Easier to test independently

### 2. Add Defensive Date Validation

```typescript
export default function MonthCalendarPicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: MonthCalendarPickerProps) {
  // ✅ SAFE - Handle null/undefined/invalid cases
  const initialDate = (startDate && !isNaN(startDate.getTime())) 
    ? startDate 
    : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
}
```

### 3. Safe Touch Handler

```typescript
const handleDayPress = (date: Date | null) => {
  // ✅ DEFENSIVE - Return early on invalid input
  if (!date || isNaN(date.getTime())) return;

  const clickedDate = new Date(date);
  clickedDate.setHours(0, 0, 0, 0);

  // Validate current selection state before updating
  const hasValidStartDate = startDate && !isNaN(startDate.getTime());
  const hasValidEndDate = endDate && !isNaN(endDate.getTime());
  
  if (!hasValidStartDate || (hasValidEndDate && (clickedDate < startDate || clickedDate > endDate))) {
    onStartDateChange(clickedDate);
    onEndDateChange(clickedDate);
    return;
  }
  // ... rest of logic
};
```

### 4. State Initialization Safety

In parent component (`StatsView.tsx`):
```typescript
// ✅ SAFE INITIALIZATION - Always provide valid Date objects
const [startDate, setStartDate] = useState<Date>(() => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d; // Guaranteed valid
});

const [endDate, setEndDate] = useState<Date>(new Date()); // Also valid
```

## Debugging Checklist

When facing similar crash issues:

1. **Check dependency arrays** - Are all variables used in `useMemo` listed?
2. **Validate Date objects** - Use `isNaN(date.getTime())` check
3. **Review closure patterns** - Move pure functions outside components
4. **Trace props flow** - Ensure required props always have valid values

## Related Patterns

- **expo-stats-view-calendar-date-range-picker**: Original implementation using this pattern
- **expo-react-native-debugging-fixes-v56**: General debugging strategies for Expo v56

## Files Modified

- `src/components/MonthCalendarPicker.tsx`: Moved `markSelectedDates`, `isSameDate`, `isSameMonth` outside component
- Added `isNaN()` validation in constructor and event handlers
- Updated `handleDayPress` with defensive checks

## Key Takeaways

1. **Pure functions are safer** - Module-level functions don't capture stale state
2. **Always validate Date inputs** - Invalid dates cause silent corruption
3. **Defensive programming pays off** - Early returns prevent cascading errors
4. **Test edge cases first** - Null props should never crash
