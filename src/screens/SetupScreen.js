import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Button, Card } from '../components/UI';
import { SPACING, RADIUS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

const POPULAR_CURRENCIES = [
  { code: 'CHF', name: 'Swiss Franc',        flag: '🇨🇭' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar',          flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',       flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar',  flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦' },
  { code: 'SEK', name: 'Swedish Krona',      flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone',    flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone',       flag: '🇩🇰' },
  { code: 'INR', name: 'Indian Rupee',       flag: '🇮🇳' },
  { code: 'CNY', name: 'Chinese Yuan',       flag: '🇨🇳' },
  { code: 'BRL', name: 'Brazilian Real',     flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso',       flag: '🇲🇽' },
  { code: 'SGD', name: 'Singapore Dollar',   flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar',   flag: '🇭🇰' },
  { code: 'TRY', name: 'Turkish Lira',       flag: '🇹🇷' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KRW', name: 'South Korean Won',   flag: '🇰🇷' },
  { code: 'PLN', name: 'Polish Zloty',       flag: '🇵🇱' },
];

export default function SetupScreen() {
  const { updateSettings, settings } = useApp();
  const { C } = useTheme();
  const nav = useNavigation();

  // Pre-fill with existing settings if coming from Settings screen
  const isEditing = settings.setupDone;

  const [step,      setStep]      = useState(isEditing ? 1 : 0);
  const [name,      setName]      = useState(settings.name || '');
  const [currency,  setCurrency]  = useState(settings.currency || 'CHF');
  const [search,    setSearch]    = useState('');
  const [biometric, setBiometric] = useState(settings.biometric || false);
  const [hasBio,    setHasBio]    = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setHasBio);
  }, []);

  const filtered = POPULAR_CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function finish() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateSettings({ name, currency, biometric, setupDone: true });
    // If editing from settings, go back. If first time, navigator handles it automatically.
    if (isEditing) {
      nav.goBack();
    }
  }

  const steps = [
    // ── Welcome (first launch only) ──
    <View key="welcome" style={s.stepContainer}>
      <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
        <Text style={{ fontSize: 52, fontWeight: '800', color: C.accent, letterSpacing: -2 }}>Oryn</Text>
        <Text style={{ fontSize: 14, color: C.textSub, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>Expense Tracker</Text>
      </View>
      <Text style={[s.title, { color: C.text }]}>Know where{'\n'}it goes.</Text>
      <Text style={[s.subtitle, { color: C.textSub }]}>
        Track spending, set budgets, scan receipts, and take full control of your finances. Let's get you set up.
      </Text>
      <Button label="Get Started →" onPress={() => setStep(1)} style={{ marginTop: SPACING.xxxl }} />
    </View>,

    // ── Name ──
    <View key="name" style={s.stepContainer}>
      {isEditing && (
        <TouchableOpacity onPress={() => nav.goBack()} style={{ marginBottom: SPACING.xl }}>
          <Text style={{ color: C.accent, fontSize: 17 }}>← Back</Text>
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 40, marginBottom: SPACING.lg, textAlign: 'center' }}>👋</Text>
      <Text style={[s.title, { color: C.text }]}>{isEditing ? 'Change your name' : "What's your name?"}</Text>
      <Text style={[s.subtitle, { color: C.textSub }]}>
        {isEditing ? 'Update the name shown in Oryn.' : 'Oryn will use this to personalise your experience.'}
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={C.textMuted}
        autoFocus
        style={{
          backgroundColor: C.bgInput, borderRadius: RADIUS.md,
          borderWidth: 1.5, borderColor: name ? C.accent : C.border,
          color: C.text, fontSize: 20, padding: SPACING.lg,
          marginTop: SPACING.xxl, textAlign: 'center', fontWeight: '600',
        }}
      />
      {isEditing ? (
        <Button label="Save Name ✓" onPress={finish} disabled={!name.trim()} style={{ marginTop: SPACING.xl }} />
      ) : (
        <Button label="Continue →" onPress={() => setStep(2)} disabled={!name.trim()} style={{ marginTop: SPACING.xl }} />
      )}
    </View>,

    // ── Currency ──
    <View key="currency" style={[s.stepContainer, { flex: 1 }]}>
      <Text style={[s.title, { color: C.text }]}>Your main currency</Text>
      <Text style={[s.subtitle, { color: C.textSub }]}>
        All totals will show in this currency. You can still log in any currency — Oryn converts automatically using live ECB rates.
      </Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search currencies..."
        placeholderTextColor={C.textMuted}
        style={{
          backgroundColor: C.bgInput, borderRadius: RADIUS.md,
          borderWidth: 1.5, borderColor: C.border,
          color: C.text, fontSize: 15, padding: SPACING.lg,
          marginTop: SPACING.xl, marginBottom: SPACING.sm,
        }}
      />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {filtered.map(cur => (
          <TouchableOpacity
            key={cur.code}
            onPress={() => { setCurrency(cur.code); Haptics.selectionAsync(); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
              padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.xs,
              backgroundColor: currency === cur.code ? C.accent + '22' : C.bgInput,
              borderWidth: 1.5,
              borderColor: currency === cur.code ? C.accent : 'transparent',
            }}
          >
            <Text style={{ fontSize: 24 }}>{cur.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>{cur.code}</Text>
              <Text style={{ color: C.textSub, fontSize: 13 }}>{cur.name}</Text>
            </View>
            {currency === cur.code && <Text style={{ color: C.accent, fontSize: 20 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Button label="Continue →" onPress={() => setStep(hasBio ? 3 : 4)} style={{ marginTop: SPACING.md }} />
    </View>,

    // ── Biometric ──
    <View key="bio" style={s.stepContainer}>
      <Text style={{ fontSize: 56, marginBottom: SPACING.xl, textAlign: 'center' }}>🔐</Text>
      <Text style={[s.title, { color: C.text }]}>Secure Oryn</Text>
      <Text style={[s.subtitle, { color: C.textSub }]}>
        Use Face ID or Touch ID to protect your financial data. Only you can open Oryn.
      </Text>
      <View style={{ gap: SPACING.md, marginTop: SPACING.xxxl }}>
        <Button label="Enable Face ID / Touch ID" onPress={() => { setBiometric(true); setStep(4); }} />
        <Button label="Skip for now" variant="ghost" onPress={() => { setBiometric(false); setStep(4); }} />
      </View>
    </View>,

    // ── Done ──
    <View key="done" style={s.stepContainer}>
      <Text style={{ fontSize: 56, marginBottom: SPACING.xl, textAlign: 'center' }}>🎉</Text>
      <Text style={[s.title, { color: C.text }]}>You're all set,{'\n'}{name}!</Text>
      <Text style={[s.subtitle, { color: C.textSub }]}>
        Your main currency is{' '}
        <Text style={{ color: C.accent, fontWeight: '700' }}>{currency}</Text>.
        {' '}Oryn fetches live exchange rates automatically so your foreign spending is always accurate.
      </Text>
      <Card style={{ marginTop: SPACING.xxl }}>
        <Text style={{ color: C.textSub, fontSize: 13, lineHeight: 20 }}>
          💡 <Text style={{ color: C.text, fontWeight: '600' }}>Rate notice:</Text> Oryn uses live ECB market rates. Your bank may apply its own conversion — for exact accuracy, check your statement and edit any entry if needed.
        </Text>
      </Card>
      <Button label="Start with Oryn 💜" onPress={finish} style={{ marginTop: SPACING.xxl }} />
    </View>,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Progress dots — hide when editing from settings */}
      {!isEditing && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: SPACING.xl }}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i <= step ? C.accent : C.border }} />
          ))}
        </View>
      )}
      <View style={{ flex: 1, padding: SPACING.xxl }}>
        {steps[step]}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  stepContainer: { flex: 1, justifyContent: 'center' },
  title:    { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
