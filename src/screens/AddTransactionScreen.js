import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, Image, Switch, Modal, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Button, Card, Input, CategoryIcon } from '../components/UI';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import { detectDuplicate } from '../utils/helpers';

const POPULAR_CURRENCIES = [
  'CHF','EUR','USD','GBP','JPY','AUD','CAD','SEK','NOK','DKK',
  'INR','CNY','BRL','MXN','SGD','HKD','TRY','ZAR','KRW','PLN',
];

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Simple date picker using dropdowns — works everywhere including Expo Go
function DatePickerModal({ visible, date, onConfirm, onCancel, C, SPACING, RADIUS }) {
  const now = new Date();
  const [d, setD] = useState(new Date(date));

  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function setDay(day) {
    const nd = new Date(d);
    nd.setDate(day);
    setD(nd);
  }
  function setMonth(m) {
    const nd = new Date(d);
    nd.setMonth(m);
    // Clamp day if new month is shorter
    const maxDay = new Date(nd.getFullYear(), m + 1, 0).getDate();
    if (nd.getDate() > maxDay) nd.setDate(maxDay);
    setD(nd);
  }
  function setYear(y) {
    const nd = new Date(d);
    nd.setFullYear(y);
    setD(nd);
  }

  if (!visible) return null;

  const scrollStyle = {
    height: 180, backgroundColor: C.bgInput,
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.border,
  };

  const itemStyle = (active) => ({
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
    backgroundColor: active ? C.accent + '33' : 'transparent',
    borderRadius: 8, marginVertical: 2,
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
        <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.xl, padding: SPACING.xxl, width: '100%', borderWidth: 1, borderColor: C.border }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.lg, textAlign: 'center' }}>
            Select Date
          </Text>

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl }}>
            {/* Day */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Day</Text>
              <ScrollView style={scrollStyle} showsVerticalScrollIndicator={false}>
                <View style={{ padding: 4 }}>
                  {days.map(day => (
                    <TouchableOpacity key={day} onPress={() => setDay(day)} style={itemStyle(d.getDate() === day)}>
                      <Text style={{ color: d.getDate() === day ? C.accent : C.text, fontWeight: d.getDate() === day ? '700' : '400', fontSize: 16 }}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Month */}
            <View style={{ flex: 1.4 }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Month</Text>
              <ScrollView style={scrollStyle} showsVerticalScrollIndicator={false}>
                <View style={{ padding: 4 }}>
                  {months.map((m, i) => (
                    <TouchableOpacity key={m} onPress={() => setMonth(i)} style={itemStyle(d.getMonth() === i)}>
                      <Text style={{ color: d.getMonth() === i ? C.accent : C.text, fontWeight: d.getMonth() === i ? '700' : '400', fontSize: 16 }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Year */}
            <View style={{ flex: 1.2 }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Year</Text>
              <ScrollView style={scrollStyle} showsVerticalScrollIndicator={false}>
                <View style={{ padding: 4 }}>
                  {years.map(y => (
                    <TouchableOpacity key={y} onPress={() => setYear(y)} style={itemStyle(d.getFullYear() === y)}>
                      <Text style={{ color: d.getFullYear() === y ? C.accent : C.text, fontWeight: d.getFullYear() === y ? '700' : '400', fontSize: 16 }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text style={{ color: C.textSub, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg }}>
            {formatDisplayDate(d)}
          </Text>

          <Button label="Confirm Date ✓" onPress={() => onConfirm(d)} />
          <Button label="Cancel" variant="ghost" onPress={onCancel} style={{ marginTop: SPACING.sm }} />
        </View>
      </View>
    </Modal>
  );
}

export default function AddTransactionScreen() {
  const nav   = useNavigation();
  const route = useRoute();
  const { addTransaction, editTransaction, transactions, settings, autoCategory, convertToBase, formatAmount } = useApp();
  const { C } = useTheme();

  const editId   = route.params?.editId;
  const isIncome = route.params?.isIncome ?? false;
  const existing = editId ? transactions.find(t => t.id === editId) : null;

  const [step,           setStep]          = useState(1);
  const [amount,         setAmount]        = useState(existing?.amountOrig?.toString() || '');
  const [currency,       setCurrency]      = useState(existing?.currency || settings.currency);
  const [category,       setCategory]      = useState(existing?.category || (isIncome ? 'income' : null));
  const [merchant,       setMerchant]      = useState(existing?.merchant || '');
  const [notes,          setNotes]         = useState(existing?.notes || '');
  const [isRecurring,    setIsRecurring]   = useState(existing?.isRecurring || false);
  const [recurFreq,      setRecurFreq]     = useState(existing?.recurringFreq || 'monthly');
  const [receiptUri,     setReceiptUri]    = useState(existing?.receiptUri || null);
  const [showCurPicker,  setShowCurPicker] = useState(false);
  const [curSearch,      setCurSearch]     = useState('');
  const [saving,         setSaving]        = useState(false);
  const [selectedDate,   setSelectedDate]  = useState(existing ? new Date(existing.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const merchantRef = useRef(null);

  const parsedAmount = parseFloat(amount) || 0;
  const previewBase  = convertToBase(parsedAmount, currency);
  const showPreview  = currency !== settings.currency && parsedAmount > 0;
  const displayCats  = isIncome
    ? CATEGORIES.filter(c => c.id === 'income')
    : CATEGORIES.filter(c => c.id !== 'income');

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  useEffect(() => {
    if (merchant && !isIncome && !existing) {
      const suggested = autoCategory(merchant);
      if (suggested !== 'other') setCategory(suggested);
    }
  }, [merchant]);

  function handleAmountKey(key) {
    if (key === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (key === '.' && amount.includes('.')) return;
    if (amount.split('.')[1]?.length >= 2) return;
    if (amount.replace('.', '').length >= 8) return;
    setAmount(a => a + key);
    Haptics.selectionAsync();
  }

  async function pickReceipt() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please go to your phone Settings and allow photo access for Oryn.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setReceiptUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Receipt Added', 'Receipt saved to this transaction.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not open photo library.');
    }
  }

  async function pickReceiptCamera() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please go to your phone Settings and allow camera access for Oryn.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setReceiptUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Receipt Saved', 'Please verify the amount and merchant are correct.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not open camera.');
    }
  }

  function handleReceiptTap() {
    Alert.alert('📷 Add Receipt', 'How would you like to add a receipt?', [
      { text: 'Take Photo',          onPress: pickReceiptCamera },
      { text: 'Choose from Library', onPress: pickReceipt       },
      { text: 'Cancel',              style: 'cancel'            },
    ]);
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || !category) return;
    setSaving(true);

    const base = convertToBase(num, currency);
    if (!editId && !isIncome && detectDuplicate(transactions, base, category)) {
      const proceed = await new Promise(resolve => {
        Alert.alert(
          '⚠️ Possible Duplicate',
          'A similar expense was logged recently. Save anyway?',
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Save',   onPress: () => resolve(true)  },
          ]
        );
      });
      if (!proceed) { setSaving(false); return; }
    }

    try {
      const tx = {
        amountOrig:    num,
        currency,
        category,
        merchant:      merchant.trim() || (isIncome ? 'Income' : 'Apple Pay'),
        notes:         notes.trim(),
        isIncome,
        isRecurring,
        recurringFreq: isRecurring ? recurFreq : null,
        recurringNext: isRecurring ? getNextDate(recurFreq) : null,
        receiptUri,
        date:          selectedDate.toISOString(),
      };
      if (editId) {
        await editTransaction(editId, tx);
      } else {
        await addTransaction(tx);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(4);
      setTimeout(() => nav.goBack(), 1400);
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const filteredCurrencies = POPULAR_CURRENCIES.filter(c =>
    c.toLowerCase().includes(curSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md }}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : nav.goBack()}>
          <Text style={{ color: C.accent, fontSize: 17 }}>← {step > 1 ? 'Back' : 'Cancel'}</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', color: C.text, fontSize: 17, fontWeight: '700' }}>
          {editId ? 'Edit' : isIncome ? 'Add Income' : 'Add Expense'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress bar */}
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? C.accent : C.border }} />
        ))}
      </View>

      {/* ── Step 4: Success ── */}
      {step === 4 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isIncome ? C.income : C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl }}>
            <Text style={{ fontSize: 36, color: '#fff' }}>{editId ? '✎' : '✓'}</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '700', marginBottom: SPACING.sm }}>
            {editId ? 'Updated!' : 'Saved!'}
          </Text>
          <Text style={{ color: C.accent, fontSize: 24, fontWeight: '800' }}>{formatAmount(previewBase)}</Text>
        </View>
      )}

      {/* ── Step 1: Amount ── */}
      {step === 1 && (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
            <TouchableOpacity
              onPress={() => setShowCurPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bgCard, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderWidth: 1.5, borderColor: C.border, marginBottom: SPACING.lg }}
            >
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>{currency}</Text>
              <Text style={{ color: C.textSub, fontSize: 11 }}>▼</Text>
            </TouchableOpacity>

            <Text style={{ color: amount ? C.text : C.textSub, fontSize: 56, fontWeight: '800', letterSpacing: -2, minHeight: 70 }}>
              {amount || '0'}
            </Text>

            {showPreview && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <Text style={{ color: C.textSub, fontSize: 14 }}>≈ {formatAmount(previewBase)}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Live Rate', `1 ${currency} = ${(previewBase / parsedAmount).toFixed(4)} ${settings.currency}\n\nSource: ECB via Frankfurter.app\n\nNote: Your bank may apply a different rate.`)}>
                  <Text style={{ color: C.accent, fontSize: 12 }}>ⓘ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: SPACING.xl, gap: SPACING.sm }}>
            {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: SPACING.sm }}>
                {row.map(k => (
                  <TouchableOpacity key={k} onPress={() => handleAmountKey(k)}
                    style={{ flex: 1, height: 68, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ color: C.text, fontSize: k === '⌫' ? 20 : 26, fontWeight: '500' }}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <Button label="Continue →" onPress={() => setStep(2)} disabled={!amount || parsedAmount === 0} style={{ marginTop: SPACING.sm }} />
          </View>
        </View>
      )}

      {/* ── Step 2: Category ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
          <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.lg }}>
            What's it for?
          </Text>
          <Text style={{ color: C.accent, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.xl }}>
            {formatAmount(previewBase)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {displayCats.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setCategory(cat.id); Haptics.selectionAsync(); setStep(3); }}
                style={{
                  width: '30%', alignItems: 'center', padding: SPACING.md,
                  borderRadius: RADIUS.lg, borderWidth: 1.5,
                  borderColor: category === cat.id ? cat.color : C.border,
                  backgroundColor: category === cat.id ? cat.color + '22' : C.bgCard,
                  gap: SPACING.xs,
                }}
              >
                <Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
                <Text style={{ color: category === cat.id ? cat.color : C.textSub, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Step 3: Details ── */}
      {step === 3 && (
        <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
          {category && (
            <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
              <CategoryIcon emoji={CATEGORIES.find(c => c.id === category)?.emoji} color={CATEGORIES.find(c => c.id === category)?.color} size={56} />
              <Text style={{ color: C.textSub, fontSize: 13, marginTop: SPACING.sm }}>{CATEGORIES.find(c => c.id === category)?.label}</Text>
            </View>
          )}

          <Input label="Merchant / Description" value={merchant} onChangeText={setMerchant}
            placeholder={isIncome ? 'e.g. Salary, Freelance' : 'e.g. Migros, Apple Pay'} inputRef={merchantRef} />

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes}
            placeholder="Add a note..." multiline />

          {/* ── Date picker ── */}
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: C.bgInput, borderRadius: RADIUS.md,
                borderWidth: 1.5, borderColor: C.border,
                padding: SPACING.lg,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <Text style={{ fontSize: 20, color: C.text }}>📅</Text>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>
                  {isToday ? 'Today' : formatDisplayDate(selectedDate)}
                </Text>
              </View>
              <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>Change</Text>
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                <Text style={{ color: C.accent, fontSize: 12 }}>Reset to today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Receipt */}
          <TouchableOpacity onPress={handleReceiptTap}
            style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1.5, borderColor: receiptUri ? C.accent : C.border, marginBottom: SPACING.md }}>
            <Text style={{ fontSize: 24 }}>{receiptUri ? '🧾' : '📷'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{receiptUri ? 'Receipt attached' : 'Add Receipt'}</Text>
              <Text style={{ color: C.textSub, fontSize: 12 }}>{receiptUri ? 'Tap to replace' : 'Take photo or choose from library'}</Text>
            </View>
            {receiptUri && <Text style={{ color: C.accent }}>✓</Text>}
          </TouchableOpacity>

          {receiptUri && (
            <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 160, borderRadius: RADIUS.md, marginBottom: SPACING.md }} resizeMode="cover" />
          )}

          {/* Recurring */}
          {!isIncome && (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isRecurring ? SPACING.md : 0 }}>
                <View>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>🔄 Recurring</Text>
                  <Text style={{ color: C.textSub, fontSize: 12 }}>Auto-add on a schedule</Text>
                </View>
                <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: C.accent }} />
              </View>
              {isRecurring && (
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {['daily','weekly','monthly','yearly'].map(f => (
                    <TouchableOpacity key={f} onPress={() => setRecurFreq(f)}
                      style={{ flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: recurFreq === f ? C.accent : C.bgInput, alignItems: 'center' }}>
                      <Text style={{ color: recurFreq === f ? '#fff' : C.textSub, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Rate notice */}
          {currency !== settings.currency && (
            <Card style={{ marginBottom: SPACING.md, backgroundColor: C.accent + '15', borderColor: C.accent + '40' }}>
              <Text style={{ color: C.textSub, fontSize: 13, lineHeight: 18 }}>
                💱 <Text style={{ color: C.text, fontWeight: '600' }}>Exchange rate notice:</Text> We use live ECB rates (1 {currency} ≈ {formatAmount(convertToBase(1, currency))}). Your bank may charge a different rate — check your statement and edit if needed.
              </Text>
            </Card>
          )}

          <Button label={editId ? 'Save Changes ✓' : 'Save Entry ✓'} onPress={handleSave} disabled={saving} />
        </ScrollView>
      )}

      {/* ── Currency Picker Modal ── */}
      {showCurPicker && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.xxl, padding: SPACING.xxl, maxHeight: '70%' }}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', marginBottom: SPACING.md }}>Select Currency</Text>
            <TextInput value={curSearch} onChangeText={setCurSearch} placeholder="Search..." placeholderTextColor={C.textMuted}
              style={{ backgroundColor: C.bgInput, borderRadius: RADIUS.md, padding: SPACING.md, color: C.text, marginBottom: SPACING.md }} />
            <ScrollView>
              {filteredCurrencies.map(c => (
                <TouchableOpacity key={c} onPress={() => { setCurrency(c); setShowCurPicker(false); setCurSearch(''); Haptics.selectionAsync(); }}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>{c}</Text>
                  {currency === c && <Text style={{ color: C.accent }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button label="Close" variant="ghost" onPress={() => setShowCurPicker(false)} style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      )}

      {/* ── Date Picker Modal ── */}
      <DatePickerModal
        visible={showDatePicker}
        date={selectedDate}
        onConfirm={(d) => { setSelectedDate(d); setShowDatePicker(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        onCancel={() => setShowDatePicker(false)}
        C={C}
        SPACING={SPACING}
        RADIUS={RADIUS}
      />
    </SafeAreaView>
  );
}

function getNextDate(freq) {
  const d = new Date();
  if (freq === 'daily')   d.setDate(d.getDate() + 1);
  if (freq === 'weekly')  d.setDate(d.getDate() + 7);
  if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  if (freq === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
