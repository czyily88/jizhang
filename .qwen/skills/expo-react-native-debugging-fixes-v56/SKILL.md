---
name: expo-react-native-debugging-fixes-v56
description: Expo React Native v56 常见问题和修复方法（日期选择器、文件系统、分类解构）
source: auto-skill
extracted_at: '2026-06-03'
---

# Expo React Native v56 常见调试和修复技巧

## 1. 日期选择器平台判断错误

### 问题现象
点击 + 号记一笔闪退，通常是因为 Android/iOS 条件判断写反了。

### 原因分析
```typescript
// ❌ 错误写法 - 条件判断颠倒
const onDateChange = (event: any, selected?: Date) => {
  if (Platform.OS === 'android') {
    // 这里应该是 iOS 的逻辑
    setShowDatePicker(false);
    if (selected) setSelectedDate(selected);
  } else {
    // 这里应该是 Android 的逻辑
    if (selected) setSelectedDate(selected);
  }
};
```

### 正确做法
```typescript
// ✅ 正确写法
const onDateChange = (event: any, selected?: Date) => {
  if (Platform.OS === 'ios') {
    // iOS: spinner 模式下保持 picker 显示直到用户确认
    if (selected) {
      setSelectedDate(selected);
    }
  } else {
    // Android: default 模式下立即隐藏并设置日期
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  }
};
```

**关键点**：
- Android `mode="date"` 使用 `display="default"` 是原生弹窗模式，需要手动关闭 picker
- iOS `mode="date"` 使用 `display="spinner"` 是内嵌 picker，不需要手动关闭

## 2. expo-file-system 路径访问问题

### 问题现象
TypeScript 报错：Property 'cacheDirectory' does not exist on type 'typeof import("expo-file-system")'

### 原因分析
Expo FileSystem v56+ 的新版 API 不包含静态目录常量。需要使用 legacy 模块访问。

### 正确做法
```typescript
// ❌ 错误导入
import * as FileSystem from 'expo-file-system';
const uri = `${FileSystem.cacheDirectory}${fileName}`; // TS Error!

// ✅ 正确导入
import * as FileSystem from 'expo-file-system/legacy';
const uri = `${FileSystem.cacheDirectory}${fileName}`; // Works!
```

**注意**：
- `documentDirectory` 和 `cacheDirectory` 只存在于 legacy 模块中
- new 版 API 需要使用动态方式获取路径

## 3. AppContext 中接口解构遗漏

### 问题现象
TypeScript 报错：Cannot find name 'removeIncomeCategory'.

### 原因分析
组件中使用 `useApp()` 解构时，没有包含所有需要的函数。

### 正确做法
```typescript
// ✅ 完整解构所有需要的函数
const { 
  addExpenseCategory, 
  removeExpenseCategory, 
  expenseCategories,
  addIncomeCategory, 
  incomeCategories, 
  removeIncomeCategory  // 不要遗漏这个！
} = useApp();
```

**最佳实践**：
- 定期检查 `src/AppContext.tsx` 中的 interface 定义
- 确保每个组件都解构了它实际使用的全部属性
- 使用 TypeScript 严格模式可以更快发现这类错误

## 4. Props 传递不一致

### 问题现象
编译通过但运行时错误或页面布局错乱。

### 场景示例
首页移除了"分类管理"按钮后，忘记从 props 接口中移除对应的回调函数。

### 正确做法
```typescript
// ❌ 遗留未使用的 props
interface HomeScreenProps {
  onAdd: () => void;
  onManagePayment: () => void;  // ← 已删除但仍存在
  onViewSettings: () => void;
}

// ✅ 清理后的 props
interface HomeScreenProps {
  onAdd: () => void;
  onViewSettings: () => void;
  onEdit?: (expense: Expense) => void;
}
```

## 5. TypeScript 类型别名导入

### 问题现象
Module '"../types"' has no exported member 'EXPENSE_CATEGORIES'.

### 原因分析
从 `DEFAULT_EXPENSE_CATEGORIES` 等命名重新导出为缩写名。

### 正确做法
```typescript
// ❌ 错误导入
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

// ✅ 正确导入 - 使用 as 重命名
import { 
  DEFAULT_EXPENSE_CATEGORIES as EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES as INCOME_CATEGORIES 
} from '../types';
```

## 调试建议

1. **始终运行 TypeScript 检查**
   ```bash
   npx tsc --noEmit
   ```

2. **检查 Platform 条件逻辑**
   - Android 和 iOS 的行为常常相反
   - 特别是涉及 UI 显隐、弹窗关闭等操作

3. **检查依赖版本兼容性**
   - Expo v56 对许多包的 API 有变化
   - 查阅官方文档的版本特定内容

4. **验证 props 完整性**
   - 删除界面元素后，同步清理 props 定义
   - 使用 TypeScript 的 strict mode
