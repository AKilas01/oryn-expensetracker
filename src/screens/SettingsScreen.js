import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch, TouchableOpacity, Alert, Share, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Card, Button } from '../components/UI';
import { SPACING, RADIUS } from '../constants/theme';
import { exportToCSV } from '../utils/helpers';

export default function SettingsScreen() {
  const { settings, updateSettings, transactions, ratesLoading, fetchRates, formatAmount } = useApp();
  const { C, isDark } = useTheme();
  const nav = useNavigation();

  const [showNameEdit, setShowNameEdit] = useState(false);
  const [nameInput,    setNameInput]    = useState(settings.name || '');

  async function saveName() {
    if (!nameInput.trim()) return;
    await updateSettings({ name: nameInput.trim() });
    setShowNameEdit(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function toggleBiometric(val) {
    await updateSettings({ biometric: val });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function exportCSV() {
    try {
      const csv = exportToCSV(transactions, formatAmount);
      await Share.share({ message: csv, title: 'Oryn Export' });
    } catch (e) {
      Alert.alert('Export', 'Could not export. Try again.');
    }
  }

  function confirmReset() {
    Alert.alert('Reset Oryn', 'This will delete ALL your data permanently. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.clear();
          await updateSettings({ setupDone: false });
        }
      },
    ]);
  }

  const Row = ({ icon, label, right, onPress, danger }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ flex: 1, color: danger ? C.danger : C.text, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      {right}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 100 }}>

        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xxl }}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={{ color: C.accent, fontSize: 17 }}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: C.accent, letterSpacing: -1 }}>Oryn</Text>
            <Text style={{ fontSize: 11, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>Expense Tracker</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Profile</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          {/* Name — inline edit */}
          <Row
            icon="👤"
            label={`Name: ${settings.name || '—'}`}
            onPress={() => { setNameInput(settings.name || ''); setShowNameEdit(true); }}
            right={<Text style={{ color: C.accent }}>✎</Text>}
          />
          {/* Currency — goes to Setup currency step */}
          <Row
            icon="💱"
            label={`Main Currency: ${settings.currency}`}
            onPress={() => nav.navigate('Setup')}
            right={<Text style={{ color: C.accent }}>›</Text>}
          />
        </Card>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Appearance</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          <Row icon={isDark ? '🌙' : '☀️'} label="Dark Mode" right={
            <Switch value={isDark} onValueChange={v => updateSettings({ darkMode: v })} trackColor={{ true: C.accent }} />
          } />
        </Card>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Security</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          <Row icon="🔐" label="Face ID / Touch ID" right={
            <Switch value={settings.biometric || false} onValueChange={toggleBiometric} trackColor={{ true: C.accent }} />
          } />
        </Card>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Exchange Rates</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          <Row icon="🌐" label="Source: ECB via Frankfurter.app" />
          <Row icon="🔄" label={ratesLoading ? 'Refreshing...' : 'Refresh Rates Now'} onPress={() => fetchRates()} right={<Text style={{ color: C.accent }}>↻</Text>} />
          <View style={{ paddingVertical: SPACING.sm }}>
            <Text style={{ color: C.textMuted, fontSize: 12, lineHeight: 18 }}>
              ⚠️ Oryn uses live ECB market rates. Your bank may apply its own rate — compare with your statement and edit entries if needed.
            </Text>
          </View>
        </Card>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Data</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          <Row icon="📊" label={`${transactions.length} transactions`} />
          <Row icon="📤" label="Export to CSV" onPress={exportCSV} right={<Text style={{ color: C.accent }}>›</Text>} />
          <Row icon="🗑" label="Reset All Data" danger onPress={confirmReset} right={<Text style={{ color: C.danger }}>›</Text>} />
        </Card>

        <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Apple Pay Shortcut</Text>
        <Card style={{ marginBottom: SPACING.xl }}>
          <Text style={{ color: C.text, fontSize: 14, lineHeight: 24 }}>
            {'1. Open the Shortcuts app\n2. New Automation → Notification → Wallet\n3. Filter: contains "paid"\n4. Action: Open URL →\n'}
            <Text style={{ color: C.accent, fontWeight: '700' }}>oryn://add</Text>
            {'\n5. Turn off "Ask Before Running"'}
          </Text>
        </Card>

        <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center' }}>Oryn — Expense Tracker · v1.0.0</Text>
        <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4, letterSpacing: 1 }}>Know where it goes.</Text>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* ── Inline Name Edit Modal ── */}
      <Modal visible={showNameEdit} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.xl, padding: SPACING.xxl, width: '100%', borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center' }}>Change Name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={C.textMuted}
              autoFocus
              style={{
                backgroundColor: C.bgInput, borderRadius: RADIUS.md,
                borderWidth: 1.5, borderColor: nameInput ? C.accent : C.border,
                color: C.text, fontSize: 18, padding: SPACING.lg,
                textAlign: 'center', fontWeight: '600', marginBottom: SPACING.md,
              }}
            />
            <Button label="Save ✓" onPress={saveName} disabled={!nameInput.trim()} />
            <Button label="Cancel" variant="ghost" onPress={() => setShowNameEdit(false)} style={{ marginTop: SPACING.sm }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
