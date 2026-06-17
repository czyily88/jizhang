import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, StatusBar, SafeAreaView, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocumentAsync } from 'expo-document-picker';
import { useApp } from '../AppContext';

interface SettingsScreenProps {
  onClose: () => void;
  onManagePayment: () => void;
  onManageCategories: () => void;
}

interface BackupData {
  expenses: any[];
  paymentMethods: any[];
  expenseCategories?: string[];
  incomeCategories?: string[];
  timestamp: number;
}

export default function SettingsScreen({ onClose, onManagePayment, onManageCategories }: SettingsScreenProps) {
  const { expenses, paymentMethods, expenseCategories, incomeCategories } = useApp();

// 生成临时文件路径（使用 legacy API）
const generateTempUri = (fileName: string): string => {
  return `${FileSystem.cacheDirectory}${fileName}`;
};

// 导出数据为文件
const handleExport = async () => {
  try {
    const backupData: BackupData = {
      expenses,
      paymentMethods,
      expenseCategories,
      incomeCategories,
      timestamp: Date.now(),
    };

    const fileName = `记账备份_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const fileContent = JSON.stringify(backupData, null, 2);

    // 生成临时文件路径
    const tempUri = generateTempUri(fileName);

    // 写入临时文件
    await FileSystem.writeAsStringAsync(tempUri, fileContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 验证文件是否创建成功
    const stats = await FileSystem.getInfoAsync(tempUri);
    if (!stats.exists) {
      throw new Error('文件保存失败');
    }

    // Android - 使用 Share 功能让用户选择保存位置
    if (Platform.OS === 'android') {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error('设备不支持分享功能');
      }

      await Sharing.shareAsync(tempUri, {
        mimeType: 'application/json',
        dialogTitle: '保存记账备份',
        UTI: 'public.json',
      });
    } else {
      // iOS - 直接保存到文件
      const documentDir = `${FileSystem.documentDirectory}`;
      const destUri = `${documentDir}/${fileName}`;
      await FileSystem.copyAsync({ from: tempUri, to: destUri });
    }

    // 清理临时文件
    try {
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
    } catch {}
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    Alert.alert('导出失败', errorMessage);
  }
};

  // 导入数据
  const handleImport = async () => {
    try {
      // 使用 getDocumentAsync 选择文件
      const result = await getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      // 读取文件内容
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      try {
        const backupData: BackupData = JSON.parse(text);

        if (!backupData.expenses || !backupData.timestamp) {
          Alert.alert('错误', '无效的备份文件格式');
          return;
        }

        Alert.alert(
          '确认导入',
          `将从 ${new Date(backupData.timestamp).toLocaleString()} 的备份中导入数据。\n\n当前数据将被覆盖，确定继续吗？`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '导入',
              style: 'destructive',
              onPress: async () => {
                try {
                  await AsyncStorage.setItem('expense_tracker_expenses', JSON.stringify(backupData.expenses));
                  if (backupData.paymentMethods) {
                    await AsyncStorage.setItem('expense_tracker_payment_methods', JSON.stringify(backupData.paymentMethods));
                  }
                  if (backupData.expenseCategories) {
                    await AsyncStorage.setItem('expense_tracker_expense_categories', JSON.stringify(backupData.expenseCategories));
                  }
                  if (backupData.incomeCategories) {
                    await AsyncStorage.setItem('expense_tracker_income_categories', JSON.stringify(backupData.incomeCategories));
                  }
                  Alert.alert('成功', '数据导入成功！应用将刷新。', [{ text: '确定' }]);
                  onClose();
                } catch (err) {
                  Alert.alert('错误', '导入失败：' + (err as Error).message);
                }
              },
            },
          ]
        );
      } catch (parseError) {
        Alert.alert('错误', '文件解析失败，请确保是有效的备份文件');
      }
    } catch (error) {
      Alert.alert('错误', '导入失败：' + (error as Error).message);
    }
  };

  // 清除所有数据
  const handleClearAll = async () => {
    Alert.alert(
      '警告',
      '此操作将删除所有记账记录和自定义付款方式！\n\n此操作无法撤销，确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '全部清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'expense_tracker_expenses',
                'expense_tracker_payment_methods',
                'expense_tracker_expense_categories',
                'expense_tracker_income_categories',
              ]);
              Alert.alert('成功', '所有数据已清除', [{ text: '确定' }]);
              onClose();
            } catch (err) {
              Alert.alert('错误', '清除失败：' + (err as Error).message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 选项</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>

        <TouchableOpacity style={styles.btn} onPress={onManagePayment}>
          <View style={styles.btnIconContainer}>
            <Text style={styles.btnIcon}>💳</Text>
          </View>
          <View style={styles.btnContent}>
            <Text style={styles.btnTitle}>付款方式管理</Text>
            <Text style={styles.btnDesc}>添加、删除自定义付款方式</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onManageCategories}>
          <View style={styles.btnIconContainer}>
            <Text style={styles.btnIcon}>📑</Text>
          </View>
          <View style={styles.btnContent}>
            <Text style={styles.btnTitle}>分类管理</Text>
            <Text style={styles.btnDesc}>添加、删除收支分类</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>

        <TouchableOpacity style={styles.btn} onPress={handleExport}>
          <View style={styles.btnIconContainer}>
            <Text style={styles.btnIcon}>📤</Text>
          </View>
          <View style={styles.btnContent}>
            <Text style={styles.btnTitle}>导出数据</Text>
            <Text style={styles.btnDesc}>将记账数据导出为备份文件</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleImport}>
          <View style={styles.btnIconContainer}>
            <Text style={styles.btnIcon}>📥</Text>
          </View>
          <View style={styles.btnContent}>
            <Text style={styles.btnTitle}>导入数据</Text>
            <Text style={styles.btnDesc}>从备份文件恢复记账数据</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>

        <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={handleClearAll}>
          <View style={styles.btnIconContainer}>
            <Text style={styles.btnIcon}>🗑️</Text>
          </View>
          <View style={styles.btnContent}>
            <Text style={[styles.btnTitle, styles.dangerText]}>清除所有数据</Text>
            <Text style={[styles.btnDesc, styles.dangerText]}>删除所有记账记录和设置</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>版本 2.1.0</Text>
        <Text style={styles.copyright}>©czy</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 15, color: '#5b6abf' },
  section: { margin: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12, paddingHorizontal: 4 },
  btn: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dangerBtn: { borderColor: '#ff4757', borderWidth: 1 },
  btnIconContainer: { marginRight: 14, alignItems: 'center' },
  btnIcon: { fontSize: 28 },
  btnContent: { flex: 1 },
  btnTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  dangerText: { color: '#ff4757' },
  btnDesc: { fontSize: 13, color: '#999' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  version: { fontSize: 14, color: '#999', marginBottom: 4 },
  copyright: { fontSize: 12, color: '#ccc' },
});
