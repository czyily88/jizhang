import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Numpad({ value, onChange }: NumpadProps) {
  const handlePress = (char: string) => {
    if (char === 'DEL') {
      onChange(value.slice(0, -1));
    } else if (char === '.') {
      // 只允许一个小数点
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      // 防止输入多个前导零
      if (char !== '0' || value !== '0') {
        onChange(value + char);
      }
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'DEL'],
  ];

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                key === 'DEL' && styles.keyDel,
              ]}
              onPress={() => handlePress(key)}
            >
              <Text style={[
                styles.keyText,
                key === 'DEL' && styles.keyTextDel,
              ]}>
                {key === 'DEL' ? '⌫' : key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  key: {
    flex: 1,
    height: 56,
    marginHorizontal: 4,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  keyDel: {
    backgroundColor: '#ff4757',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  keyTextDel: {
    color: '#fff',
    fontSize: 24,
  },
});
