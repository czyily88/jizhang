---
name: expo-inline-datetime-picker-ui-pattern
description: React Native DateTimePicker inline 显示而非弹窗的 UI 模式
source: auto-skill
extracted_at: '2026-06-04T13:16:58.000Z'
---

# React Native DateTimePicker Inline 显示模式

## 核心思路

在某些 UI 场景中，不希望使用模态弹窗来选择日期，而是希望在原地直接显示 DateTimePicker 组件供用户滚动选择。这种方式更适合表单式布局或紧凑的空间设计。

## 实现要点

### 1. 状态控制显示时机
```typescript
const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

// 点击时切换为选择器显示
const openStartDatePicker = () => {
  setShowDatePicker('start');
};

// 日期变更后恢复为文本显示
if (showDatePicker === 'start') {
  // 渲染 DateTimePicker 组件
} else {
  // 渲染格式化后的日期文本
}
```

### 2. 条件渲染组件
```tsx
{showDatePicker === 'start' ? (
  <View style={styles.datePickerInline}>
    <DateTimePicker
      value={startDate}
      mode="date"
      display="spinner"
      onChange={(event, selectedDate) => {
        if (selectedDate) setStartDate(selectedDate);
      }}
      textColor="#333"
      themeVariant="light"
    />
  </View>
) : (
  <TouchableOpacity onPress={openStartDatePicker}>
    <Text style={styles.filterChipActive}>
      {formatDate(startDate.getTime())}
    </Text>
  </TouchableOpacity>
)}
```

### 3. Android 特殊处理
```tsx
onChange={(event, selectedDate) => {
  // Android 和 iOS 的行为差异
  if (Platform.OS === 'android') {
    // Android 自动更新，无需手动设置
    if (selectedDate) setStartDate(selectedDate);
  } else if (Platform.OS === 'ios') {
    // iOS 需要确认后再更新
    if (selectedDate) setStartDate(selectedDate);
  }
}}
```

## UI 布局示例

### 双栏布局（适合日期选择）
```tsx
<View style={styles.filterRowDual}>
  <View style={styles.filterCell}>
    <Text style={styles.filterLabel}>开始日期</Text>
    {/* DateTimePicker inline */}
  </View>
  <View style={styles.filterCell}>
    <Text style={styles.filterLabel}>结束日期</Text>
    {/* DateTimePicker inline */}
  </View>
</View>
```

### CSS 样式建议
```css
filterRowDual: { 
  flexDirection: 'row', 
  gap: 12, 
  marginBottom: 12 
},
filterCell: { 
  flex: 1, 
  backgroundColor: '#fafafa', 
  borderRadius: 12, 
  borderWidth: 1, 
  borderColor: '#eee', 
  padding: 12 
},
datePickerInline: { 
  backgroundColor: '#5b6abf', 
  borderRadius: 8, 
  overflow: 'hidden',
  paddingTop: 4  // 补偿 Picker 的顶部留白
},
```

## 优势与适用场景

| 优势 | 适用场景 |
|------|----------|
| 节省空间，不需要额外的弹窗层级 | 筛选表单、统计页面 |
| 交互更直接，减少操作步骤 | 移动端 APP 快速操作 |
| 视觉一致性更好，保持上下文 | 复杂的多字段筛选界面 |
| 避免系统原生 picker 的兼容性差异 | 跨平台统一 UI 体验 |

## 注意事项

1. **空间占用**：inline 模式下 DateTimePicker 会占用实际布局空间，需要预留足够高度
2. **滚动冲突**：在 ScrollView 中使用时，注意外层滚动与 Picker 滚动的冲突
3. **Android 行为**：Android 上 DateTimePicker 可能自动关闭，需要正确处理 onChange
4. **样式调整**：需要根据 Platform 调整一些细节（如 height、paddingTop 等）
5. **颜色对比**：确保 DatePicker 背景色与周围元素的对比度符合 accessibility 要求

## 相关资源

- [@react-native-community/datetimepicker](https://react-native-community.github.io/datepicker/)
- Expo Docs: https://docs.expo.dev/versions/latest/sdk/datepicker/