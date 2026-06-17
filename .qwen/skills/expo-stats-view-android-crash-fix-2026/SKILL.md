---
name: expo-stats-view-android-crash-fix-2026
description: 账单统计页面 Android 闪退修复 - DateTimePicker 跨平台实现
source: auto-skill
extracted_at: '2026-06-04T11:06:00.000Z'
---

# 账单统计页面 Android 闪退修复

## 问题描述

在 Expo React Native 的 `StatsView`（账单统计）组件中，Android 用户点击设置中的「账单统计」按钮时应用直接闪退崩溃。

### 症状
- iOS：正常打开统计页面
- Android：点击设置 → 账单统计 → **立即闪退**

### 根本原因

在 `StatsView.tsx` 中使用条件渲染 DateTimePicker 时，**Android 端没有对应的 DateTimePicker 组件**，只有 iOS 的 Modal 内嵌模式：

```typescript
// ❌ 错误实现（原有代码）
{Platform.OS === 'ios' && showStartPicker ? (
  <Modal>
    <DateTimePicker /> {/* 只有 iOS 才有 */}
  </Modal>
) : null}

{/* 这里没有 Android 的 DateTimePicker！*/}

<View style={styles.filterRow}>
  <TouchableOpacity onPress={() => setShowStartPicker(true)}>
    <Text>{startDate}</Text>
  </TouchableOpacity>
</View>
```

**问题分析**：
1. Android 上点击日期范围 chip 会触发 `setShowStartPicker(true)`
2. 但因为没有 Android 的 DateTimePicker 条件分支，所以不显示任何选择器
3. 这可能导致：
   - 状态改变但 UI 未响应导致的异常
   - 后续的日期计算使用无效值导致崩溃
   - React 状态机不一致

## 解决方案

### 核心思路
为 Android 提供独立的 DateTimePicker 实现，与 iOS 的 Modal 内嵌模式保持功能一致。

### 实现代码

```typescript
// ✅ 正确实现 - 分别处理 iOS 和 Android
<View style={styles.filterRow}>
  <Text>日期范围</Text>
</View>

{/* Android 开始日期选择器 */}
{Platform.OS === 'android' && showStartPicker && (
  <DateTimePicker
    value={startDate}
    mode="date"
    display="spinner"
    onChange={(_: any, selected?: Date) => {
      if (selected) setStartDate(selected);
    }}
    maximumDate={endDate}
  />
)}

{/* Android 结束日期选择器 */}
{Platform.OS === 'android' && showEndPicker && (
  <DateTimePicker
    value={endDate}
    mode="date"
    display="spinner"
    onChange={(_: any, selected?: Date) => {
      if (selected) setEndDate(selected);
    }}
    minimumDate={startDate}
    maximumDate={new Date()}
  />
)}

{/* iOS 开始日期选择器 Modal */}
{Platform.OS === 'ios' && showStartPicker ? (
  <Modal visible animationType="slide" transparent>
    <View style={styles.iosOverlay}>
      <View style={styles.iosContainer}>
        <View style={styles.iosHeader}>
          <TouchableOpacity onPress={() => setShowStartPicker(false)}>
            <Text>取消</Text>
          </TouchableOpacity>
          <Text>开始日期</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(false)}>
            <Text>确定</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={startDate}
          mode="date"
          display="spinner"
          onChange={(_: any, selected?: Date) => { 
            if (selected) setStartDate(selected); 
          }}
          maximumDate={endDate}
        />
      </View>
    </View>
  </Modal>
) : Platform.OS === 'ios' && showEndPicker ? (
  // iOS 结束日期选择器 Modal...
)} : null}

{/* 显示当前选择的日期范围（可点击） */}
<View style={styles.filterRow}>
  <TouchableOpacity 
    style={styles.filterChip} 
    onPress={() => { 
      setShowStartPicker(false); 
      setShowEndPicker(false); 
      setShowStartPicker(true); 
    }}
  >
    <Text>{formatDateDisplay(startDate)}</Text>
  </TouchableOpacity>
  <Text style={styles.filterSeparator}>至</Text>
  <TouchableOpacity 
    style={styles.filterChip} 
    onPress={() => { 
      setShowStartPicker(false); 
      setShowEndPicker(false); 
      setShowEndPicker(true); 
    }}
  >
    <Text>{formatDateDisplay(endDate)}</Text>
  </TouchableOpacity>
</View>
```

## 关键改进点

### 1. 平台差异化实现
| 平台 | 选择器形式 | 交互方式 |
|------|-----------|---------|
| **iOS** | Modal 内嵌 DateTimePicker | 点击 → 弹出 Modal → 选择 → 确认/取消关闭 |
| **Android** | 直接 render DateTimePicker | 点击 → 打开选择器 → 选择后自动滚动关闭 |

### 2. 状态控制逻辑优化
```typescript
// Android/iOS 共同的日期范围显示
<TouchableOpacity onPress={() => { 
  setShowStartPicker(false);  // 先关闭任何已打开的选择器
  setShowEndPicker(false);
  setShowStartPicker(true);   // 再打开目标选择器
}}>
```

**为什么要先关闭再打开？**
- 避免同时打开两个选择器的冲突
- 确保 UI 状态的一致性
- Android DateTimePicker 可能不会自动关闭时需要手动管理

### 3. iOS Modal 样式定义
```typescript
const styles = StyleSheet.create({
  iosOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iosContainer: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden' 
  },
  iosHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  iosCancel: { fontSize: 16, color: '#999' },
  iosTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  iosConfirm: { fontSize: 16, color: '#5b6abf', fontWeight: '600' },
});
```

### 4. 日期约束规则
```typescript
// 开始日期不能晚于结束日期
<DateTimePicker
  value={startDate}
  maximumDate={endDate}  // 关键约束
/>

// 结束日期不能早于开始日期且不能超过今天
<DateTimePicker
  value={endDate}
  minimumDate={startDate}
  maximumDate={new Date()}
/>
```

## 注意事项

1. **状态同步**：点击日期范围 chip 时必须先关闭其他选择器，避免冲突
2. **平台检测**：始终使用 `Platform.OS === 'android'` 或 `'ios'` 进行条件渲染
3. **初始值检查**：确保 `startDate` 和 `endDate` 始终是有效的 Date 对象
4. **MaximumDate/MinimumDate**：必须正确设置日期约束，否则可能产生无效状态

## 测试要点

1. ✅ **打开统计页面**：Android 能正常打开，不闪退
2. ✅ **开始日期选择**：点击左侧日期范围 chip → 打开选择器 → 选择 → 关闭
3. ✅ **结束日期选择**：点击右侧日期范围 chip → 打开选择器 → 选择 → 关闭
4. ✅ **日期约束**：
   - 开始日期不能选晚于结束日期的
   - 结束日期不能早于开始日期且不能超过今天
5. ✅ **连续切换**：开始 → 结束 → 开始，每次都能正常打开/关闭

## 相关文件
- `src/screens/StatsView.tsx` - 主要实现文件

## 参考资料
- React Native Platform: https://reactnative.dev/docs/platform
- DateTimePicker Props: https://react-native-community.github.io/datepicker-android/
