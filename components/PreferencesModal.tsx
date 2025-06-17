// components/PreferencesModal.tsx
import { Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput } from 'react-native';

type PreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, stocks: string) => void;
  currentName: string | null;
  currentStocks: string;
  primaryColor: string;
};

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose, onSave, currentName, currentStocks, primaryColor }) => {
  const [name, setName] = useState('');
  const [stocks, setStocks] = useState('');

  useEffect(() => {
    setName(currentName || '');
    setStocks(currentStocks || '');
  }, [currentName, currentStocks, isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), stocks.trim());
    } else {
      alert('Please enter your name.');
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isOpen} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>{currentName ? 'Settings' : 'Welcome to Ohayo!'}</Text>
          
          <Text style={styles.label}>What should I call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Anshul"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Your Stock Watchlist (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., RELIANCE, TCS, INFY"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            value={stocks}
            onChangeText={setStocks}
          />

          <Pressable style={[styles.saveButton, { backgroundColor: primaryColor }]} onPress={handleSave}>
            <Save size={16} color="#fff" />
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 16, color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});