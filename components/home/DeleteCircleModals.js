import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DeleteCircleSelectModal({ 
  visible, 
  circles, 
  onSelectCircle, 
  onCancel 
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <Text style={styles.deleteModalTitle}>Select Circle to Delete</Text>
          <FlatList
            data={circles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.circleOption}
                onPress={() => onSelectCircle(item)}
              >
                <Text style={styles.circleOptionName}>{item.name}</Text>
                <Text style={styles.circleOptionCount}>
                  {item.contacts?.length || 0} contacts
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function DeleteCircleConfirmModal({ 
  visible, 
  circle, 
  onConfirm, 
  onCancel 
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Ionicons name="warning-outline" size={60} color="#ff6b6b" />
          <Text style={styles.confirmTitle}>Delete Circle?</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to delete "{circle?.name}"?
          </Text>
          <Text style={styles.confirmWarning}>This action cannot be undone.</Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmCancel]}
              onPress={onCancel}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmDelete]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#1a2a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 24,
    marginHorizontal: 30,
    maxHeight: 400,
    width: '80%',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  circleOption: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  circleOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  circleOptionCount: {
    fontSize: 14,
    color: '#cccccc',
  },
  cancelButton: {
    backgroundColor: '#2a3a2a',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  confirmModal: {
    backgroundColor: '#1a2a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 28,
    marginHorizontal: 30,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmWarning: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancel: {
    backgroundColor: '#2a3a2a',
  },
  confirmDelete: {
    backgroundColor: '#ff6b6b',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
