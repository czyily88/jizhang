---
name: expo-scroll-position-persistence-v2
description: React Native ScrollView 滚动位置持久化模式（AsyncStorage 增强版）
source: auto-skill
extracted_at: '2026-06-22T17:25:00.000Z'
---

# React Native ScrollView 滚动位置持久化模式 (AsyncStorage 增强版)

## 问题场景
在 Expo/React Native 应用中，当用户在 ScrollView 内滚动到某位置，进入子页面编辑数据后返回，ScrollView 会重置到顶部，丢失用户的浏览位置。

## 根本原因
- **useRef 失效**：`useRef(0)` 在组件重建时虽然能保持值，但在某些情况下（尤其是复杂的导航栈）仍会重置
- **useState 重置**：`useState(0)` 每次组件重建都会回到初始值
- **ScrollView 行为**：React Native 的 ScrollView 在重新挂载时默认会滚动到顶部

## 解决方案：使用 AsyncStorage 持久化滚动位置

### 核心代码模式

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCROLL_POSITION_KEY = '@jizhang_home_scroll_position';

export default function HomeScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // ✅ 使用 state 存储加载的位置
  const [savedScrollY, setSavedScrollY] = useState(0);

  // 📥 加载保存的滚动位置（仅在首次渲染）
  useLayoutEffect(() => {
    AsyncStorage.getItem(SCROLL_POSITION_KEY).then(value => {
      if (value) {
        setSavedScrollY(parseFloat(value));
      }
    });
  }, []); // 空依赖数组，只在 mount 时执行一次

  // 💾 保存滚动位置
  const saveScrollPosition = async (y: number) => {
    try {
      await AsyncStorage.setItem(SCROLL_POSITION_KEY, y.toString());
    } catch (error) {
      console.log('保存滚动位置失败:', error);
    }
  };

  // 🎯 恢复滚动位置
  const restoreScrollPosition = (y: number) => {
    if (scrollViewRef.current && y > 0) {
      scrollViewRef.current.scrollTo({ y, animated: false });
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y;
        setSavedScrollY(y);       // 更新 state
        saveScrollPosition(y);     // 保存到 AsyncStorage
      }}
      scrollEventThrottle={16}
      onLayout={() => {
        // 🔄 组件首次布局时恢复滚动位置
        restoreScrollPosition(savedScrollY);
      }}
    >
      {/* 内容 */}
    </ScrollView>
  );
}
```

### 关键点说明

| 要点 | 说明 |
|------|------|
| `AsyncStorage` | 将滚动位置持久化到本地存储，即使应用重启也能保持 |
| `useState` + `useLayoutEffect` | 在组件 mount 时加载上次保存的位置 |
| `scrollEventThrottle={16}` | 每约 16ms（60fps）触发一次 onScroll，提高刷新率 |
| `onLayout` 恢复 | 仅在组件首次布局时恢复，避免频繁强制滚动影响用户体验 |
| `animated: false` | 立即跳转，不产生动画，让用户无感知地保持位置 |
| `> 0` 判断 | 只在有实际滚动距离时才恢复，初次加载不跳 |

## 为什么不使用 useRef？

早期的实现尝试使用 `useRef(0)` 来保持滚动位置，但在实际测试中发现：
1. Ref 虽然在组件重建间保持，但 ScrollView 的 `scrollTo()` 调用在某些情况下无效
2. 更复杂的应用场景下（如 React Navigation），ref 可能在不同生命周期之间不同步

**AsyncStorage 方案的优势**：
- ✅ 完全持久化，不受组件生命周期影响
- ✅ 应用重启后也能记住滚动位置
- ✅ 与 React 的状态管理机制更一致
- ✅ 可以在多个组件间共享（通过状态提升）

## 适用场景

✅ 推荐用于：
- 长列表页面（账单列表、商品列表等）
- 用户可能在列表中任意位置点击编辑的场景
- 需要在编辑前后保持上下文的页面
- 希望在应用重启后也记住滚动位置的场景

❌ 不适用于：
- 短内容页面（不需要滚动的）
- 每次都需要从头开始阅读的页面
- 希望用户看到最新内容的场景（如新闻 feed）
- 实时性要求极高且位置变化频繁的场景

## 注意事项

1. **性能考虑**：`onScroll` 是高频事件，确保不做重计算
2. **异步 IO**：AsyncStorage 操作是异步的，不会阻塞 UI
3. **存储空间**：单个数值几乎不占用空间，但大量数据可能导致体积膨胀
4. **权限问题**：Android/iOS 无需额外权限即可使用 AsyncStorage
5. **状态同步**：如果数据有大量变动，可能需要额外的防抖逻辑

## 变体实现

### 1. 添加防抖优化

对于需要减少 Storage 写操作的场景：

```typescript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const saveScrollPositionDebounced = useCallback(
  debounce(async (y: number) => {
    await AsyncStorage.setItem(SCROLL_POSITION_KEY, y.toString());
  }, 100),
  []
);
```

### 2. 多页面共享位置

```typescript
// 定义统一的 key 命名规范
const getKey = (pageName: string) => `@scroll_${pageName}`;

// 在 HomeScreen 中使用
const HOME_SCROLL_KEY = getKey('home');
```

### 3. 清除保存的位置

```typescript
const clearScrollPosition = async () => {
  try {
    await AsyncStorage.removeItem(SCROLL_POSITION_KEY);
    setSavedScrollY(0);
  } catch (error) {
    console.log('清除滚动位置失败:', error);
  }
};
```

## 调试技巧

### 检查 AsyncStorage 内容

```javascript
// 在开发模式下查看存储的值
AsyncStorage.getAllKeys().then(keys => {
  console.log('All keys:', keys);
});

AsyncStorage.getItem(SCROLL_POSITION_KEY).then(value => {
  console.log('Scroll position:', value);
});
```

### 验证 onScroll 触发频率

```javascript
const lastTime = useRef(Date.now());

onScroll={(e) => {
  const now = Date.now();
  if (now - lastTime.current > 1000) {
    console.log(`onScroll called ${Math.round((now - lastTime.current) / 100)} times/sec`);
    lastTime.current = now;
  }
  // ... rest of logic
}}
```

## 参考资源
- [React Native ScrollView docs](https://reactnative.dev/docs/scrollview)
- [AsyncStorage docs](https://react-native-async-storage.github.io/async-storage/)
- [useRef vs useState](https://react.dev/reference/react/useRef)
- Expo v56 docs: https://docs.expo.dev/versions/v56.0.0/
