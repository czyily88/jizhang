---
name: expo-document-picker-export-fix
description: Expo 56 导出数据功能修复 - pickMultiDocumentAsync 改为 getDocumentAsync
source: auto-skill
extracted_at: '2026-06-03T07:23:36.152Z'
---

# Expo DocumentPicker 导出数据功能修复（Expo v56）

## 问题背景
Expo React Native 应用在 v56 中导出数据时出现错误：
```
导出失败，undefined is not a function
```

## 原因分析

### 1. API 方法不存在
`expo-document-picker@^56.0.4` 中**不存在** `pickMultiDocumentAsync` 方法，该方法只存在于旧版本或 Web 平台。

### 2. 导入方式错误
```typescript
// ❌ 错误写法 - 命名空间导入
import * as DocumentPicker from 'expo-document-picker';
await DocumentPicker.pickMultiDocumentAsync({...});

// ✅ 正确写法 - 默认导入
import DocumentPicker from 'expo-document-picker';
await DocumentPicker.getDocumentAsync({...});
```

## 解决方案

### 步骤 1: 修改导入语句
```typescript
// ❌ 之前的错误代码
import * as DocumentPicker from 'expo-document-picker';

// ✅ 修复后
import DocumentPicker from 'expo-document-picker';
```

### 步骤 2: 修改导出方法
```typescript
// ❌ 错误的 API 调用
const result = await DocumentPicker.pickMultiDocumentAsync({
  type: 'application/json',
  copyToCacheDirectory: false,
});

// ✅ 正确的 API 调用
const result = await DocumentPicker.getDocumentAsync({
  type: 'application/json',
  copyToCacheDirectory: false,
});
```

### 步骤 3: 移除不支持的参数
Expo 56 的 `getDocumentAsync` **不支持**以下参数：
- `destination`: 该参数在 v56 中被移除
- `pickMultiDocumentAsync`: 完全不同的方法

## Expo DocumentPicker v56 API 参考

### getDocumentAsync(options)
保存/选择单个文件的现代 API。

**可选参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | string | MIME 类型，如 `'application/json'` |
| `copyToCacheDirectory` | boolean | 是否复制到缓存目录 |
| `pickMultiple` | boolean | **已废弃** - 使用其他方式处理多文件 |

**返回值**:
```typescript
{
  canceled: boolean;
  assets?: Array<{
    uri: string;
    name: string;
    mimeType: string;
  }>;
}
```

## 完整示例代码

```typescript
import DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const handleExport = async () => {
  try {
    const backupData = { /* 要导出的数据 */ };
    const fileContent = JSON.stringify(backupData, null, 2);
    const fileName = `备份_${Date.now()}.json`;

    // 选择保存位置
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      Alert.alert('提示', '您取消了保存操作');
      return;
    }

    const destUri = result.assets[0].uri;

    // 写入文件
    await FileSystem.writeAsStringAsync(destUri, fileContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 验证文件
    const stats = await FileSystem.getInfoAsync(destUri);
    if (!stats.exists) {
      throw new Error('文件保存失败');
    }

    Alert.alert('导出成功', `数据已保存至：${fileName}`);
  } catch (error) {
    Alert.alert('导出失败', error instanceof Error ? error.message : '未知错误');
  }
};
```

## Troubleshooting

### "undefined is not a function"
- 检查导入方式是否为默认导入
- 确认使用的是 `getDocumentAsync` 而非 `pickMultiDocumentAsync`

### 找不到 DocumentSaveLocation
- Expo v56 移除了 `DocumentSaveLocation` 枚举
- 不再需要指定保存位置，由系统对话框决定

### 多文件导出需求
- Expo DocumentPicker 不直接支持多选保存
- 如需多个文件，需循环调用 `getDocumentAsync` 或使用其他方案

## 参考资料
- [Expo DocumentPicker Docs](https://docs.expo.dev/versions/v56.0.0/sdk/document-picker/)
- [Expo FileSystem Docs](https://docs.expo.dev/versions/v56.0.0/sdk/file-system/)
