import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimeSelectorProps {
  visible: boolean;
  initialValue: Date;
  onClose: (selectedDate: Date | null) => void;
  maximumDate?: Date;
}

export default function DateTimeSelector({
  visible,
  initialValue,
  onClose,
  maximumDate,
}: DateTimeSelectorProps) {
  const [tempDate, setTempDate] = useState(initialValue);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const handleChange = (_: any, selected?: Date) => {
    if (selected) {
      setTempDate(selected);
    }
  };

  const handleConfirm = () => {
    onClose(tempDate);
  };

  const handleCancel = () => {
    onClose(null);
  };

  const switchToTime = () => {
    setMode('time');
  };

  const switchToDate = () => {
    setMode('date');
  };

  // iOS 模式：使用 native DateTimePicker 直接在界面上
  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.iosOverlay}>
          <View style={styles.iosContainer}>
            <View style={styles.iosHeader}>
              <Text style={styles.iosTitle}>选择日期时间</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.iosCancelBtn}>取消</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                maximumDate={maximumDate}
              />
            </View>

            <View style={styles.iosButtonRow}>
              <TouchableOpacity 
                style={[styles.iosActionBtn, styles.confirmBtn]} 
                onPress={handleConfirm}
              >
                <Text style={styles.iosConfirmBtnText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Android 模式：使用 Bottom Sheet + 独立的时间/日期选择器
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.androidOverlay} 
        activeOpacity={1}
        onPress={handleCancel}
      >
        <View style={styles.androidBottomSheet}>
          <Text style={styles.androidTitle}>选择日期时间</Text>

          {/* 日期选择器 */}
          {mode === 'date' ? (
            <View style={styles.androidPickerContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onChange={handleChange}
                maximumDate={maximumDate}
              />
            </View>
          ) : (
            <View style={styles.androidPickerContent}>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="default"
                onChange={handleChange}
              />
            </View>
          )}

          {/* 操作按钮 */}
          <View style={styles.androidButtonRow}>
            <TouchableOpacity 
              style={styles.androidActionBtn} 
              onPress={handleCancel}
            >
              <Text style={styles.androidCancelBtnText}>取消</Text>
            </TouchableOpacity>
            
            {mode === 'date' ? (
              <TouchableOpacity 
                style={[styles.androidActionBtn, styles.androidConfirmBtn]} 
                onPress={switchToTime}
              >
                <Text style={styles.androidConfirmBtnText}>下一步：时间</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.androidButtonGroup}>
                <TouchableOpacity 
                  style={[styles.androidActionBtn, styles.androidSecondaryBtn]} 
                  onPress={switchToDate}
                >
                  <Text style={styles.androidSecondaryBtnText}>上一步：日期</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.androidActionBtn, styles.androidConfirmBtn]} 
                  onPress={handleConfirm}
                >
                  <Text style={styles.androidConfirmBtnText}>确定</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // iOS 样式
  iosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iosTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  iosCancelBtn: {
    fontSize: 16,
    color: '#999',
  },
  pickerWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  iosButtonRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iosActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: '#5b6abf',
    flex: 1,
  },
  iosConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Android 样式
  androidOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  androidBottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  androidTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  androidPickerContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  androidButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  androidButtonGroup: {
    flexDirection: 'column',
    flex: 1,
    gap: 8,
  },
  androidActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  androidConfirmBtn: {
    backgroundColor: '#5b6abf',
  },
  androidCancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  androidConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  androidSecondaryBtn: {
    backgroundColor: '#f5f6fa',
  },
  androidSecondaryBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
