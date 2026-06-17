---
name: expo-stats-close-back-to-home
description: Expo 记账应用统计页面关闭后返回主界面的导航行为模式
source: auto-skill
extracted_at: '2026-06-09T08:17:20.398Z'
---

# Expo 记账应用 - 统计页面返回主界面导航模式

## 场景描述

在 Expo/React Native 记账应用中，当统计功能已从设置页移至主界面后，需要确保统计页面的"返回"操作（包括关闭按钮和 Android 物理返回键）直接返回到主界面，而不是误返回到选项（设置）页面。

## 问题根源

如果统计页面接收的是 `onViewStats` 回调（源自设置页面），那么关闭时会返回到设置页面，这违反了用户的心理预期 - 既然入口在主界面，退出也应该回到主界面。

```typescript
// ❌ 错误的做法 - 统计页面关闭后进入设置页
if (view === 'stats') {
  return <StatsView onClose={() => setView('settings')} />;
}
```

## 正确做法

### 1. App.tsx 中传入正确的关闭回调

让 StatsView 的 `onClose` 直接切换到 `home` 视图：

```typescript
// ✅ 正确 - 直接返回主页
if (view === 'stats') {
  return <StatsView onClose={() => setView('home')} />;
}
```

### 2. Android 返回键逻辑相应调整

从需要返回到设置的列表中移除 `stats`，只保留真正需要从设置返回的功能：

```typescript
useEffect(() => {
  if (Platform.OS !== 'android') return;

  const onBackPress = () => {
    // 只有支付管理和分类管理这两个子功能需要返回到设置页
    if (view === 'payment' || view === 'category') {
      setView('settings');
      return true;
    }

    // 其他所有非主页视图都直接返回主界面
    if (view !== 'home' && view !== 'add') {
      setView('home');
      return true;
    }

    // add 页面按返回键直接返回主页，不提示
    if (view === 'add') {
      setView('home');
      return true;
    }

    // 主界面直接退出
    return false;
  };

  const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  return () => subscription.remove();
}, [view]);
```

### 3. 关键代码对比

**修改前（错误）：**
```typescript
// App.tsx
const onBackPress = () => {
  // ❌ stats 被包含在这里，导致返回设置页
  if (view === 'payment' || view === 'category' || view === 'stats') {
    setView('settings');
    return true;
  }
  ...
};

if (view === 'stats') {
  return <StatsView onClose={() => setView('settings')} />;
}
```

**修改后（正确）：**
```typescript
// App.tsx
const onBackPress = () => {
  // ✅ stats 从这里移除
  if (view === 'payment' || view === 'category') {
    setView('settings');
    return true;
  }
  ...
};

if (view === 'stats') {
  return <StatsView onClose={() => setView('home')} />;
}
```

## 适用场景

- 任何从主入口直接进入的功能页面
- 不需要通过设置页作为中转的直接功能访问路径
- 需要保持用户停留在主工作流的场景

## 注意事项

### 返回层级逻辑
| 页面 | 应该返回到哪里 | 原因 |
|------|--------------|------|
| 支付管理 | 设置页 | 它是设置下的子功能 |
| 分类管理 | 设置页 | 它是设置下的子功能 |
| **统计页面** | **主界面** | 它是直接从主页面打开的 |
| 添加/编辑账单 | 主界面 | 记一笔是核心操作 |

### Props 一致性检查
- `HomeScreen` 调用 `onViewStats` → 切换到 `stats` 视图
- `StatsView` 调用 `onClose` → 切换回 `home` 视图
- 形成闭环，不经过 `settings` 中间状态

## 测试验证清单

- [ ] 点击主界面"📊 统计"按钮，进入统计页面
- [ ] 点击统计页面右上角 ✕ 关闭按钮，返回主界面 ✓
- [ ] 在统计页面按 Android 物理返回键，返回主界面 ✓
- [ ] 点击右上角"⚙️ 选项"，进入设置页
- [ ] 点击选项内的"💳 付款方式管理"，进入支付管理
- [ ] 按返回键，回到选项页（不是主页） ✓
- [ ] 无类型错误或控制台警告

## 相关文件

- `App.tsx` - 视图路由和返回键处理
- `src/screens/HomeScreen.tsx` - 主界面入口按钮
- `src/screens/StatsView.tsx` - 统计页面组件
