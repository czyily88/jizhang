import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, StatusBar, SafeAreaView } from 'react-native';
import { useApp } from '../AppContext';

interface CategoryManagerScreenProps {
  onClose: () => void;
}

export default function CategoryManagerScreen({ onClose }: CategoryManagerScreenProps) {
  const { addExpenseCategory, removeExpenseCategory, expenseCategories,
          addIncomeCategory, incomeCategories, removeIncomeCategory,
          updateExpenseCategory, updateIncomeCategory } = useApp();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // 编辑状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editCategoryName, setEditCategoryName] = useState('');

  const handleAdd = () => {
    if (!newCategory.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    if (activeTab === 'expense') {
      addExpenseCategory(newCategory.trim());
    } else {
      addIncomeCategory(newCategory.trim());
    }

    setNewCategory('');
    setShowAddModal(false);
  };

  // 打开编辑弹窗
  const openEditModal = (cat: string) => {
    setEditingCategory(cat);
    setEditCategoryName(cat);
    setShowEditModal(true);
  };

  // 保存修改
  const handleUpdate = async () => {
    if (!editCategoryName.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }
    if (editingCategory && editCategoryName !== editingCategory) {
      if (activeTab === 'expense') {
        await updateExpenseCategory(editingCategory, editCategoryName.trim());
      } else {
        await updateIncomeCategory(editingCategory, editCategoryName.trim());
      }
    }
    setShowEditModal(false);
    setEditingCategory('');
    setEditCategoryName('');
  };

  const handleDelete = (cat: string) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${cat}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            if (activeTab === 'expense') {
              removeExpenseCategory(cat);
            } else {
              removeIncomeCategory(cat);
            }
          },
        },
      ]
    );
  };

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
  const listTitle = activeTab === 'expense' ? '支出分类' : '收入分类';
  const allCategories = [...expenseCategories, ...incomeCategories];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>分类管理</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtn}>+ 新增</Text>
          </TouchableOpacity>
        </View>

        {/* 标签切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
            onPress={() => setActiveTab('expense')}
          >
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>支出分类</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'income' && styles.tabActive]}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>收入分类</Text>
          </TouchableOpacity>
        </View>

        {/* 列表 */}
        <FlatList
          data={categories}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                  <Text style={styles.editBtnText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>还没有{listTitle.toLowerCase()}，点击右上角「新增」添加</Text>
            </View>
          }
        />

        {/* 新增弹窗 */}
        <Modal visible={showAddModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>新增{activeTab === 'expense' ? '支出' : '收入'}分类</Text>

              <TextInput
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder={`例如：${activeTab === 'expense' ? '外卖/聚餐/零食...' : '补贴/佣金...'}`}
                placeholderTextColor="#bbb"
                autoFocus
                style={styles.input}
                onSubmitEditing={handleAdd}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => { setShowAddModal(false); setNewCategory(''); }}
                >
                  <Text style={styles.modalBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleAdd}
                >
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
              <Text style={styles.modalTitle}>修改{activeTab === 'expense' ? '支出' : '收入'}分类</Text>

              <TextInput
                value={editCategoryName}
                onChangeText={setEditCategoryName}
                placeholder="请输入新的分类名称"
                placeholderTextColor="#bbb"
                autoFocus
                style={styles.input}
                onSubmitEditing={handleUpdate}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => { setShowEditModal(false); setEditingCategory(''); setEditCategoryName(''); }}
                >
                  <Text style={styles.modalBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleUpdate}
                >
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 28, color: '#333', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  addBtn: { color: '#5b6abf', fontSize: 16, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f5' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { color: '#1a1a2e', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardName: { fontSize: 16, fontWeight: '500', color: '#1a1a2e', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#5b6abf',
    borderRadius: 8
  },
  editBtnText: { color: '#5b6abf', fontSize: 13 },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ff4757',
    borderRadius: 8
  },
  deleteBtnText: { color: '#ff4757', fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '82%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 20 },
  input: { 
    borderWidth: 1, 
    borderColor: '#e8e8e8', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 16, 
    color: '#333', 
    backgroundColor: '#fafafa',
    marginBottom: 12
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f5f6fa' },
  modalBtnConfirm: { backgroundColor: '#5b6abf' },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#5b6abf' },
});
