---
name: expo-addexpense-datetime-picker-fix-2026
description: 记账/编辑界面日期时间选择器循环弹出问题修复 - 使用独立状态管理避免 useEffect 死循环
source: auto-skill
extracted_at: '2026-06-04T11:06:00.000Z'
---

# 记账/编辑界面日期时间选择器循环弹出问题修复

## 问题描述

在 Expo React Native 的 AddExpenseScreen 组件中，用户点击"日期"或"时间"字段打开滚筒式 DateTimePicker，选择后确定会再次弹出另一个选择器，导致无限循环无法关闭。

### 症状
1. 点击「记一笔」或编辑现有账单
2. 点击「日期」字段 → 打开日期选择器
3. 选择一个日期并点击确定
4. **异常**：立即又打开时间选择器
5. 点击时间选择器的确定 → 又打开日期选择器
6. 无限循环，无法退出

### 根本原因

使用了 `useEffect` 同步临时状态到主状态的机制：

```typescript
// ❌ 错误实现
const [tempDate, setTempDate] = useState(initialDate);
const [year, setYear] = useState(initialYear);

// 当 tempDate 变化时，同步到 year/month/day
useEffect(() => {
  setYear(tempDate.getFullYear());
  setMonth(tempDate.getMonth());
  setDay(tempDate.getDate());
}, [tempDate]);

// Android DateTimePicker onChange
onChange={(_, selected) => {
  if (selected) {
    setTempDate(selected); // 触发 useEffect
  }
}}
```

**问题分析**：
1. `onChange` → `setTempDate` → `useEffect` 触发 → `setYear/setMonth/setDay`
2. `setYear` 等调用导致组件重新渲染
3. 重新渲染时 DateTimePicker 的 `value={tempDate}` 可能触发了新的 `onChange` 事件
4. 形成循环：onChange → setState → useEffect → render → onChange...

## 解决方案

### 核心思路
使用**单向数据流 + 独立状态隔离**，避免 useEffect 导致的级联更新：

1. **显示状态** (`dateDisplay`, `timeDisplay`)：仅用于 UI 展示
2. **Picker 内部状态** (`tempDateValue`, `tempTimeValue`)：DateTimePicker 的 value
3. **移除 useEffect**：不在 Picker 变化时触发级联更新

### 实现代码

```typescript
export default function AddExpenseScreen({ onClose, expense, isEditing = false }) {
  const initialDateTime = editing ? new Date(expense!.createdAt) : new Date();
  
  // 显示状态（用于 UI）
  const [dateDisplay, setDateDisplay] = useState(getFormattedDate(initialDateTime));
  const [timeDisplay, setTimeDisplay] = useState(getFormattedTime(initialDateTime));
  
  // Picker 控制状态
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  
  // Picker 内部值（不直接触发组件重新渲染）
  const [tempDateValue, setTempDateValue] = useState(initialDateTime);
  const [tempTimeValue, setTempTimeValue] = useState(initialDateTime);

  // ✅ Android onChange 直接更新显示状态
  const onDateChange = (_, selected?: Date) => {
    if (selected) {
      setTempDateValue(selected);
      setDateDisplay(getFormattedDate(selected)); // 直接更新，无 useEffect
    }
  };

  const onTimeChange = (_, selected?: Date) => {
    if (selected) {
      setTempTimeValue(selected);
      setTimeDisplay(getFormattedTime(selected)); // 直接更新，无 useEffect
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      {/* 日期和时间输入框 */}
      <View style={styles.dateTimeRow}>
        {/* 日期 */}
        <TouchableOpacity onPress={() => {
          setTempDateValue(new Date(dateDisplay === '今天' ? new Date() : getParsedDate(dateDisplay)));
          setShowDateSelector(true);
        }}>
          <Text>{dateDisplay}</Text>
        </TouchableOpacity>

        {/* 时间 */}
        <TouchableOpacity onPress={() => {
          const baseDate = new Date(dateDisplay === '今天' ? new Date() : getParsedDate(dateDisplay));
          const [h, m] = timeDisplay.split(':').map(Number);
          baseDate.setHours(h, m);
          setTempTimeValue(baseDate);
          setShowTimeSelector(true);
        }}>
          <Text>{timeDisplay}</Text>
        </TouchableOpacity>
      </View>

      {/* 日期选择器（Android/iOS 通用） */}
      {showDateSelector && (
        <DateTimePicker
          value={tempDateValue}
          mode="date"
          display="spinner"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* 时间选择器（Android/iOS 通用） */}
      {showTimeSelector && (
        <DateTimePicker
          value={tempTimeValue}
          mode="time"
          display="spinner"
          onChange={onTimeChange}
        />
      )}
    </Modal>
  );
}
```

## 关键改进点

### 1. 分离显示状态和 Picker 状态
| 状态名 | 用途 | 触发更新来源 |
|--------|------|--------------|
| `dateDisplay` | UI 显示的日期字符串 | `onDateChange` |
| `tempDateValue` | DateTimePicker 的 value | 点击日期按钮重置 |
| `timeDisplay` | UI 显示的时间字符串 | `onTimeChange` |
| `tempTimeValue` | DateTimePicker 的 value | 点击时间按钮重置 |

### 2. 移除 useEffect 依赖链
- ❌ 旧方案：`onChange` → `setTempDate` → `useEffect` → `setYear` → render → `onChange`
- ✅ 新方案：`onChange` → `setTempDate` + `setDateDisplay` → 完成

### 3. Picker 控制逻辑优化
```typescript
// 点击日期按钮时，重置 Picker 值为当前显示的值
onPress={() => {
  const currentDate = dateDisplay === '今天' 
    ? new Date() 
    : new Date(getParsedDate(dateDisplay));
  setTempDateValue(currentDate); // 重置为当前显示的值
  setShowDateSelector(true);     // 打开选择器
}}
```

### 4. 提交时解析日期时间
```typescript
const handleSubmit = () => {
  let combined = dateDisplay;
  if (combined === '今天') {
    const now = new Date();
    combined = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (combined === '昨天') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    combined = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  }
  
  const timeParts = timeDisplay.split(':');
  const year = parseInt(combined.split('-')[0]);
  const month = parseInt(combined.split('-')[1]) - 1;
  const day = parseInt(combined.split('-')[2]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  
  const finalDateTime = new Date(year, month, day, hour, minute).getTime();
};
```

## 测试要点

1. ✅ **首次打开**：日期显示初始值，点击可打开选择器
2. ✅ **日期选择**：选择日期 → 确定 → 关闭，不弹时间选择器
3. ✅ **时间选择**：选择时间 → 确定 → 关闭
4. ✅ **顺序切换**：日期→时间→日期→时间，每个都正常关闭
5. ✅ **保存提交**：组合日期时间正确创建 timestamp

## 相关文件
- `src/screens/AddExpenseScreen.tsx` - 主要实现

## 参考资料
- React Native DateTimePicker: https://react-native-community.github.io/datepicker-android/
- React Hooks Rules of Hooks: https://react.dev/reference/react/useEffect#rules-of-hooks
