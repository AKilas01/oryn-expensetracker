import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Card, Button, CategoryIcon } from '../components/UI';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import { formatDateFull } from '../utils/helpers';

export default function TransactionDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute();
  const { transactions, deleteTransaction, formatAmount, settings } = useApp();
  const { C } = useTheme();

  const tx  = transactions.find(t => t.id === route.params?.id);
  const cat = CATEGORIES.find(c => c.id === tx?.category) || CATEGORIES[CATEGORIES.length - 1];
  const [deleting, setDeleting] = useState(false);

  if (!tx) return null;

  async function handleDelete() {
    Alert.alert(
      '🗑 Delete this entry?',
      `${tx.merchant || cat.label} · ${formatAmount(tx.amountBase)}\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteTransaction(tx.id);
            nav.goBack();
          },
        },
      ]
    );
  }

  async function shareReceipt() {
    if (tx.receiptUri && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(tx.receiptUri);
    }
  }

  const sign     = tx.isIncome ? '+' : '−';
  const amtColor = tx.isIncome ? C.income : C.expense;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md }}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={{ color: C.accent, fontSize: 17 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', color: C.text, fontSize: 17, fontWeight: '700' }}>Details</Text>
          <TouchableOpacity onPress={() => nav.navigate('AddTransaction', { editId: tx.id, isIncome: tx.isIncome })}>
            <Text style={{ color: C.accent, fontSize: 17 }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Amount hero */}
        <View style={{ alignItems: 'center', paddingVertical: SPACING.xxl }}>
          <CategoryIcon emoji={cat.emoji} color={cat.color} size={64} />
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginTop: SPACING.md }}>{tx.merchant || cat.label}</Text>
          <Text style={{ color: amtColor, fontSize: 42, fontWeight: '800', letterSpacing: -1.5, marginTop: SPACING.sm }}>
            {sign}{formatAmount(tx.amountBase)}
          </Text>
          {tx.currency && tx.currency !== settings.currency && (
            <Text style={{ color: C.textSub, fontSize: 14, marginTop: SPACING.xs }}>
              {tx.currency} {tx.amountOrig?.toFixed(2)} · converted at market rate
            </Text>
          )}
          {tx.isRecurring && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm, backgroundColor: C.accent + '22', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs }}>
              <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>🔄 Recurring {tx.recurringFreq}</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <Card style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          {[
            { label: 'Category',  value: `${cat.emoji} ${cat.label}` },
            { label: 'Date',      value: formatDateFull(tx.date)      },
            { label: 'Currency',  value: tx.currency || settings.currency },
            { label: 'Type',      value: tx.isIncome ? '↑ Income' : '↓ Expense' },
            ...(tx.notes ? [{ label: 'Notes', value: tx.notes }] : []),
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.md }}>
                <Text style={{ color: C.textSub, fontSize: 13, flex: 1 }}>{row.label}</Text>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600', flex: 2, textAlign: 'right' }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: C.border }} />}
            </View>
          ))}
        </Card>

        {/* Receipt */}
        {tx.receiptUri && (
          <Card style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginBottom: SPACING.md }}>🧾 Receipt</Text>
            <TouchableOpacity onPress={shareReceipt}>
              <Image source={{ uri: tx.receiptUri }} style={{ width: '100%', height: 220, borderRadius: RADIUS.md }} resizeMode="cover" />
              <Text style={{ color: C.accent, fontSize: 13, textAlign: 'center', marginTop: SPACING.sm }}>Tap to share</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Actions */}
        <View style={{ paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingBottom: SPACING.xxxl }}>
          <Button label="✎  Edit Entry" onPress={() => nav.navigate('AddTransaction', { editId: tx.id, isIncome: tx.isIncome })} variant="secondary" />
          <Button label="🗑  Delete Entry" onPress={handleDelete} variant="danger" disabled={deleting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
