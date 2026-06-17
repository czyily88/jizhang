---
name: expo-stats-view-ui-style-optimization
description: 账单统计页面 UI 样式优化：选项按钮文字、筛选标签字体、分类进度条颜色统一
source: auto-skill
extracted_at: '2026-06-06T08:30:00.000Z'
---

# 账单统计与主界面 UI 样式优化

## 优化内容

### 1. 主界面右上角设置按钮增加"选项"文字提示

**位置**: `src/screens/HomeScreen.tsx`

**改动**:
- 原有设计：仅显示齿轮图标 ⚙️，用户可能不清楚点击后进入设置页面
- 优化后：图标 + "选项"文字的组合 `⚙️ 选项`
- 样式调整：
  - 添加 `flexDirection: 'row'` 使图标和文字横向排列
  - 添加 `gap: 6` 间距
  - 扩展内边距 `paddingHorizontal: 14`

**效果**: 提高界面的可发现性，新用户能更直观理解按钮功能

```typescript
// 修改前
<TouchableOpacity style={styles.settingsBtn} onPress={onViewSettings}>
  <Text style={styles.settingsBtnText}>⚙️</Text>
</TouchableOpacity>

// 修改后
<TouchableOpacity style={styles.settingsBtn} onPress={onViewSettings}>
  <Text style={styles.settingsBtnIcon}>⚙️</Text>
  <Text style={styles.settingsBtnText}>选项</Text>
</TouchableOpacity>

// 样式更新
settingsBtn: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  paddingVertical: 7, 
  paddingHorizontal: 14, 
  backgroundColor: '#f0f0ff', 
  borderRadius: 8, 
  gap: 6 
},
settingsBtnIcon: { fontSize: 14, color: '#5b6abf', fontWeight: '600' },
```

---

### 2. 账单统计过滤条件第四行"支出/收入"标签字体加大

**位置**: `src/screens/StatsView.tsx`

**问题**: 
- 原字体大小 `fontSize: 11`，视觉层级不够突出
- 作为主要的消费类型切换按钮，重要性不足以匹配小字号

**解决**:
- 将未激活状态的"支出"/"收入"标签字体改为 `fontSize: 14`
- 增加字体粗细 `fontWeight: '600'`
- 激活状态同步更新为 `fontSize: 14`

**样式定义**:
```typescript
typeChipTextExpenseInactive: { 
  color: '#2ed573', 
  fontSize: 14, 
  fontWeight: '600' 
},
typeChipTextIncomeInactive: { 
  color: '#ff4757', 
  fontSize: 14, 
  fontWeight: '600' 
},
typeChipTextActive: { 
  color: '#fff', 
  fontWeight: '600', 
  fontSize: 14 
},
```

**视觉效果**: 在第三行过滤区域中，"支出"和"收入"按钮更加醒目，用户可以快速识别当前选择的类型

---

### 3. 分类统计进度条颜色统一化

**位置**: `src/screens/StatsView.tsx`

**需求分析**:
- 支出分类原本使用多彩配色 (getCategoryColor)，视觉上较杂
- 收入分类同样使用多彩配色
- 付款方式已经固定为蓝色 `#5b6abf`

**优化方案**: 为不同类型的统计统一配色，提升视觉一致性和语义表达

| 分类类型 | 原配色 | 新配色 | 色值 | 说明 |
|---------|-------|-------|------|------|
| 支出分类 | 多彩 | **绿色** | `#2ed573` | 表示正向累计/支出占比 |
| 收入分类 | 多彩 | **红色** | `#ff4757` | 表示正向流入/收入占比 |
| 付款方式 | 蓝色 | **保持蓝色** | `#5b6abf` | 已统一无需更改 |

**代码变更**:

**支出分类**:
```typescript
// 修改前
<View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: getCategoryColor(category) }]} />

// 修改后
<View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: '#2ed573' }]} />
```

**收入分类**:
```typescript
// 修改前
<View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: getCategoryColor(category) }]} />

// 修改后
<View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: '#ff4757' }]} />
```

**设计考虑**:
- 绿色用于支出分类符合常见的"支出增长"认知
- 红色用于收入分类配合"+"符号形成视觉关联
- 统一的单色进度条减少视觉干扰，让用户聚焦于百分比数据本身

---

## 技术细节

### 组件结构

```
StatsView.tsx
├── 过滤条件区域 (FilterSection)
│   ├── 第一行：日期范围选择器
│   ├── 第二行：分类 + 付款方式筛选
│   └── 第三行：消费类型 (支出/收入) ← 字体加大的位置
│       └── typeChipTextExpenseInactive / IncomeInactive
│
├── 支出分类统计 ← 进度条改绿色的位置
│   └── catBar with backgroundColor: '#2ed573'
│
├── 收入分类统计 ← 进度条改红色的位置
│   └── catBar with backgroundColor: '#ff4757'
│
└── 付款方式统计
    └── catBar with backgroundColor: '#5b6abf' (保持不变)
```

### 影响文件

| 文件 | 修改内容 |
|-----|---------|
| `src/screens/HomeScreen.tsx` | 设置按钮图标 + 文字布局，样式调整 |
| `src/screens/StatsView.tsx` | 三类 UI 优化：字体加大、进度条颜色 |

---

## 最佳实践建议

### UI 一致性原则
1. **同类型元素统一样式**: 同一功能模块内的同类组件应保持相同的视觉风格
2. **语义化色彩选择**: 颜色应传达清晰的业务含义，如绿色代表支出、红色代表收入
3. **信息层级明确**: 重要操作/信息的字体尺寸应足够突出

### 改进空间
- 若后续需要动态配置主题颜色，可将硬编码的颜色值抽取到 `theme.ts` 或 `constants.ts`
- 进度条颜色可考虑根据上下文动态决定，但目前统一配色更符合需求

---

## 相关文件

- [`expo-stats-view-filter-ui-optimization`](../expo-stats-view-filter-ui-optimization/SKILL.md) - 过滤区域布局优化
- [`expo-stats-view-horizontal-layout-optimization`](../expo-stats-view-horizontal-layout-optimization/SKILL.md) - 分类 + 付款方式合并布局优化
- [`expo-stats-view-unified-filter-card-layout`](../expo-stats-view-unified-filter-card-layout/SKILL.md) - 统一过滤器卡片布局模式

---

## 版本信息

此优化应用于记账项目 v5.x 版本，基于 Expo SDK 56。
