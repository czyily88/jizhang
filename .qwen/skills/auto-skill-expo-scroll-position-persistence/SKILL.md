---
name: expo-scroll-position-persistence
description: React Native ScrollView 编辑返回后保持滚动位置的修复模式
source: auto-skill
extracted_at: '2026-06-22T16:35:50.845Z'
---

# React Native ScrollView 滚动位置持久化模式

## 问题场景
在 Expo/React Native 应用中，当用户在 ScrollView 内滚动到某位置，进入子页面编辑数据后返回，ScrollView 会重置到顶部，丢失用户的浏览位置。

## 根本原因
- 从子页面返回时，父组件作为全新实例被重建
- `useState` 初始化总是回到初始值（通常是 0）
- ScrollView 在重新挂载时会重置到顶部

## 解决方案：使用 useRef 持久化滚动位置

### 核心代码模式

```typescript
import React, { useRef } from 'react';
import { ScrollView } from 'react-native';

export default function HomeScreen() {
  // ✅ 使用 ref 持久化滚动位置（不会随组件重建而丢失）
  const scrollPositionRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={(e) => {
        // 🔄 实时更新滚动位置到 ref
        scrollPositionRef.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      onLayout={() => {
        // 🎯 组件首次布局时恢复保存的位置
        if (scrollViewRef.current && scrollPositionRef.current > 0) {
          scrollViewRef.current.scrollTo({ 
            y: scrollPositionRef.current, 
            animated: false 
          });
        }
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
| `useRef(0)` | Ref 的值会在组件重建之间保持，不像 `useState` 会重置 |
| `scrollEventThrottle={16}` | 每约 16ms（60fps）触发一次 onScroll，提高刷新率 |
| `onLayout` 恢复 | 仅在组件首次布局时恢复，避免频繁强制滚动影响用户体验 |
| `animated: false` | 立即跳转，不产生动画，让用户无感知地保持位置 |
| `> 0` 判断 | 只在有实际滚动距离时才恢复，初次加载不跳 |

## 适用场景

✅ 推荐用于：
- 长列表页面（账单列表、商品列表等）
- 用户可能在列表中任意位置点击编辑的场景
- 需要在编辑前后保持上下文的页面

❌ 不适用于：
- 短内容页面（不需要滚动的）
- 每次都需要从头开始阅读的页面
- 希望用户看到最新内容的场景（如新闻 feed）

## 注意事项

1. **性能考虑**：`onScroll` 是高频事件，确保不做重计算
2. **Android 兼容性**：某些情况下可能需要添加 `removerscrollEnabled` 属性
3. **内存泄漏**：如果使用 `useEffect` 监听滚动，记得清理订阅
4. **状态同步**：如果数据有大量变动，可能需要额外的防抖逻辑

## 变体实现

### 更激进的方案：强制保留位置
如果需要在数据更新时也保持位置，可以添加额外的 `useEffect`：

```typescript
useEffect(() => {
  if (scrollViewRef.current && scrollPositionRef.current > 0) {
    scrollViewRef.current.scrollTo({ 
      y: scrollPositionRef.current, 
      animated: false 
    });
  }
}, [someExpensiveDependency]);
```

### 懒初始化方案
如果需要避免闭包陷阱，可以使用函数形式：

```typescript
const getPosition = () => scrollPositionRef.current;
```

## 参考资源
- [React Native ScrollView docs](https://reactnative.dev/docs/scrollview)
- [useRef vs useState](https://react.dev/reference/react/useRef)
- Expo v56 docs: https://docs.expo.dev/versions/v56.0.0/
