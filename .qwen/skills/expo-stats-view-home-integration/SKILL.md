---
name: expo-stats-view-home-integration
description: Expo 记账应用中将统计模块从设置页迁移到主页面的 UI 重构模式
source: auto-skill
extracted_at: '2026-06-09T07:51:12.450Z'
---

# Expo 记账应用 - 统计模块主页集成重构模式

## 场景描述
在 Expo/React Native 记账应用中，当需要将某个功能模块（如"账单统计"）从设置页面移至主界面以提升用户体验时，需要进行跨组件的 UI 重构和导航结构调整。

## 核心修改步骤

### 1. 主页面 (HomeScreen) 添加入口按钮

在主界面顶部操作栏添加新的功能按钮：

```tsx
<View style={styles.headerRow}>
  <Text style={styles.title}>📒 日常记账</Text>
  <View style={styles.headerButtons}>
    {/* 新增统计按钮 */}
    <TouchableOpacity style={styles.statsBtn} onPress={onViewStats}>
      <Text style={styles.statsBtnIcon}>📊</Text>
      <Text style={styles.statsBtnText}>统计</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.settingsBtn} onPress={onViewSettings}>
      <Text style={styles.settingsBtnIcon}>⚙️</Text>
      <Text style={styles.settingsBtnText}>选项</Text>
    </TouchableOpacity>
  </View>
</View>
```

样式配置（注意视觉区分）：
```tsx
statsBtn: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  paddingVertical: 7, 
  paddingHorizontal: 14, 
  backgroundColor: '#e8f4fd',  // 区别于选项按钮的背景色
  borderRadius: 8, 
  gap: 6, 
  marginRight: 8  // 与右侧按钮留间距
},
statsBtnIcon: { fontSize: 14, color: '#2ed573', fontWeight: '600' },  // 绿色主题
statsBtnText: { fontSize: 14, color: '#2ed573', fontWeight: '600' },
```

### 2. 设置页面 (SettingsScreen) 移除该功能模块

#### 删除接口定义
```tsx
interface SettingsScreenProps {
  onClose: () => void;
  // onViewStats: () => void;  ← 删除此属性
  onManagePayment: () => void;
  onManageCategories: () => void;
}
```

#### 删除函数参数
```tsx
export default function SettingsScreen({ 
  onClose, 
  // onViewStats,  ← 删除此参数
  onManagePayment, 
  onManageCategories 
}: SettingsScreenProps)
```

#### 删除 UI 组件代码
```tsx
{/* 整个数据统计区域都要删除 */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>数据统计</Text>
  
  <TouchableOpacity style={styles.btn} onPress={onViewStats}>
    ...
  </TouchableOpacity>
</View>
```

### 3. 主 App.tsx 调整参数传递

删除传给 SettingsScreen 的无关回调：

```tsx
if (view === 'settings') {
  return <SettingsScreen
    onClose={() => setView('home')}
    // onViewStats={() => setView('stats')}  ← 删除此行
    onManagePayment={() => setView('payment')}
    onManageCategories={() => setView('category')}
  />;
}
```

## 注意事项

### 视觉设计原则
- 首页功能按钮使用醒目的背景色（如 `#e8f4fd` 浅蓝色）
- 图标颜色应与背景形成对比（如 `#2ed573` 绿色）
- 通过 `marginRight` 等间距样式区分多个按钮

### 类型安全
- 删除 Props 接口中的未用属性
- 更新函数签名避免遗留引用错误
- TypeScript 编译器会帮助发现遗漏的修改

### 版本同步
- 更新 `package.json` 版本号（minor 或 patch）
- 更新 `CHANGELOG.md` 记录新功能
- 更新各页面内的版本显示文本（如底部版权信息）

## 适用场景
- 将低频功能从设置页移至更频繁的访问位置
- 重新组织应用导航结构提升用户效率
- 简化深层菜单层级

## 测试检查清单
- [ ] 主界面按钮点击能正确跳转到目标页面
- [ ] 设置页面不再包含已移除的功能入口
- [ ] Android 返回键行为符合预期
- [ ] 各页面版本号同步更新
- [ ] 无 TypeScript 类型错误
