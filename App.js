import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// 🔑 Replace these with your Supabase credentials
const SUPABASE_URL = 'https://ybmulwztrdisxfjzawls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibXVsd3p0cmRpc3hmanphd2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTU4MjgsImV4cCI6MjA3NzMzMTgyOH0.dOjO1QUdvxCufFzQa1FJlzT6L3m3piWOkvS4Qf2UsQA';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    alt_phone: '',
    email: '',
    note: '',
  });

  // Fetch contacts on load
  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setContacts(data || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingContact(null);
    setForm({ name: '', phone: '', alt_phone: '', email: '', note: '' });
    setModalVisible(true);
  }

  function openEditModal(item) {
    setEditingContact(item);
    setForm({
      name: item.name,
      phone: item.phone,
      alt_phone: item.alt_phone || '',
      email: item.email || '',
      note: item.note || '',
    });
    setModalVisible(true);
  }

  async function saveContact() {
    const { name, phone, alt_phone, email, note } = form;
    if (!name || !phone) {
      Alert.alert('Validation', 'Name and phone are required');
      return;
    }

    setLoading(true);
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({ name, phone, alt_phone, email, note })
          .eq('id', editingContact.id);
        if (error) throw error;
        fetchContacts();
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([{ name, phone, alt_phone, email, note }]);
        if (error) throw error;
        fetchContacts();
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteContact(item) {
    Alert.alert('Delete', `Delete ${item.name}?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const { error } = await supabase
              .from('contacts')
              .delete()
              .eq('id', item.id);
            if (error) throw error;
            fetchContacts();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  function makeCall(phone) {
    Linking.openURL(`tel:${phone}`);
  }

  function sendWhatsApp(phone) {
    const formatted = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${formatted}`);
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
        {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
      </View>

      <View>
        <TouchableOpacity
          style={styles.smallBtn}
          onPress={() => makeCall(item.phone)}>
          <Text style={styles.btnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallBtn}
          onPress={() => sendWhatsApp(item.phone)}>
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallBtn}
          onPress={() => openEditModal(item)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: '#ff4d4d' }]}
          onPress={() => deleteContact(item)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📞 Supabase Phonebook</Text>

      <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
        <Text style={styles.addBtnText}>+ Add Contact</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <Text style={styles.modalTitle}>
            {editingContact ? 'Edit Contact' : 'Add Contact'}
          </Text>

          <TextInput
            placeholder="Name"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
            style={styles.input}
          />
          <TextInput
            placeholder="Alternate Phone"
            keyboardType="phone-pad"
            value={form.alt_phone}
            onChangeText={(t) => setForm({ ...form, alt_phone: t })}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            style={styles.input}
          />
          <TextInput
            placeholder="Note"
            value={form.note}
            onChangeText={(t) => setForm({ ...form, note: t })}
            style={[styles.input, { height: 80 }]}
            multiline
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#aaa' }]}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.saveText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={saveContact}>
              <Text style={styles.saveText}>
                {editingContact ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  addBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  addBtnText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  phone: { color: '#555' },
  email: { color: '#666' },
  smallBtn: {
    backgroundColor: '#007bff',
    padding: 6,
    marginTop: 4,
    borderRadius: 6,
  },
  btnText: { color: 'white', fontSize: 12 },
  modal: { flex: 1, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  saveText: { color: 'white', textAlign: 'center', fontWeight: '700' },
});
