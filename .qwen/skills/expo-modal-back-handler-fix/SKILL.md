---
name: expo-modal-back-handler-fix
description: Expo React Native Modal 中处理 Android 返回键的正确方法
source: auto-skill
extracted_at: '2026-06-03'
---

# Expo React Native Modal 中处理 Android 返回键

## 问题现象

在包含 `Modal` 组件的页面（如添加/编辑账单）中，按 Android 物理返回键无反应。

## 根本原因

当子组件内部使用 `Modal` 时，Android 物理返回键事件被 Modal 拦截，不会向上传递给 App 根组件的 `BackHandler` 监听器。

```typescript
// ❌ 错误 - BackHandler 监听在主组件
function MainView() {
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  return (
    <AddExpenseScreen onClose={() => setView('home')} />
  );
}

// AddExpenseScreen.tsx 内部使用了 Modal
return <Modal visible={true}>...</Modal>; // 返回键被 Modal 拦截
```

## 正确做法

**在每个包含 Modal 的子组件内部注册 BackHandler**：

```typescript
import { useEffect } from 'react';
import { BackHandler, Modal, Platform } from 'react-native';

function AddExpenseScreen({ onClose }) {
  const handleBackPress = () => {
    onClose();
    return true; // 已处理返回事件
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );
      return () => backHandler.remove();
    }
  }, []);

  return (
    <Modal visible animationType="slide" transparent>
      {/* Modal 内容 */}
    </Modal>
  );
}
```

## 关键点

1. **每个 Modal 组件都要独立处理返回键**：不要在父组件统一处理
2. **只在 Android 上启用**：iOS 使用导航栏返回按钮
3. **返回 true**：表示已处理事件，阻止默认行为

## 常见场景

### 场景 1：记一笔/编辑账单页面
```typescript
// AddExpenseScreen.tsx
const handleBackPress = () => {
  // 直接关闭，不提示确认
  onClose();
  return true;
};

useEffect(() => {
  if (Platform.OS === 'android') {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }
}, []);
```

### 场景 2：弹窗选择器（分类、付款方式）
```typescript
// CategoryPickerModal.tsx
const closePicker = () => setShowCategoryPicker(false);

const handleBackPress = () => {
  closePicker();
  return true;
};

useEffect(() => {
  if (Platform.OS === 'android') {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }
}, []);
```

## 调试技巧

1. **检查平台判断**：确保在 `Platform.OS === 'android'` 时才绑定监听
2. **检查返回值**：必须返回 `true` 才能阻止系统返回
3. **检查订阅清理**：组件卸载时必须移除监听器，避免内存泄漏
