import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, StatusBar, SafeAreaView } from 'react-native';
import { useApp } from '../AppContext';

interface PaymentMethodScreenProps {
  onClose: () => void;
}

export default function PaymentMethodScreen({ onClose }: PaymentMethodScreenProps) {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, updatePaymentMethod } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  
  // 编辑状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<typeof paymentMethods[0] | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) {
      Alert.alert('提示', '请输入付款方式名称');
      return;
    }
    addPaymentMethod(newName.trim());
    setNewName('');
    setShowAddModal(false);
  };

  // 打开编辑弹窗
  const openEditModal = (pm: typeof paymentMethods[0]) => {
    setEditingItem(pm);
    setEditName(pm.name);
    setShowEditModal(true);
  };

  // 保存修改
  const handleUpdate = () => {
    if (!editName.trim()) {
      Alert.alert('提示', '请输入付款方式名称');
      return;
    }
    if (editingItem && editName !== editingItem.name) {
      updatePaymentMethod(editingItem.id, editName.trim());
    }
    setShowEditModal(false);
    setEditingItem(null);
    setEditName('');
  };

  const handleDelete = (pm: typeof paymentMethods[0]) => {
    Alert.alert('确认删除', `确定要删除"${pm.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removePaymentMethod(pm.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>付款方式</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtn}>+ 新增</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={paymentMethods}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            return (
              <View style={styles.card}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: 40 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>还没有付款方式，点击右上角「新增」添加</Text>
            </View>
          }
        />

        {/* 新增弹窗 */}
        <Modal visible={showAddModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>新增付款方式</Text>

              {/* 名称输入 */}
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="例如：信用卡、储值卡..."
                placeholderTextColor="#bbb"
                autoFocus
                style={styles.input}
                onSubmitEditing={handleAdd}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setShowAddModal(false); setNewName(''); }}>
                  <Text style={styles.modalBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleAdd}>
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 编辑弹窗 */}
        <Modal visible={showEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>修改付款方式</Text>

              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="请输入新的付款方式名称"
                placeholderTextColor="#bbb"
                autoFocus
                style={styles.input}
                onSubmitEditing={handleUpdate}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setShowEditModal(false); setEditingItem(null); setEditName(''); }}>
                  <Text style={styles.modalBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleUpdate}>
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 8 },
  backText: { fontSize: 28, color: '#333', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  addBtn: { color: '#5b6abf', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#5b6abf', borderRadius: 8 },
  editBtnText: { color: '#5b6abf', fontSize: 13 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ff4757', borderRadius: 8 },
  deleteBtnText: { color: '#ff4757', fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333', backgroundColor: '#fafafa', width: '100%' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f5f6fa' },
  modalBtnConfirm: { backgroundColor: '#5b6abf' },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#5b6abf' },
});
