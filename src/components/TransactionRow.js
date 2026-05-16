import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useApp } from '../context/AppContext';
import { CATEGORIES, SPACING } from '../constants/theme';
import { CategoryIcon } from './UI';
import { formatDate } from '../utils/helpers';

export function TransactionRow({ transaction: t, onPress }) {
  const { C }          = useTheme();
  const { formatAmount, settings } = useApp();
  const cat      = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[CATEGORIES.length - 1];
  const amtColor = t.isIncome ? C.income : C.text;
  const sign     = t.isIncome ? '+' : '-';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}
    >
      <CategoryIcon emoji={cat.emoji} color={cat.color} size={44} />

      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
          {t.merchant || cat.label}
        </Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
          {cat.label} · {formatDate(t.date)}
          {t.isRecurring ? '  🔄' : ''}
          {t.receiptUri ? '  🧾' : ''}
        </Text>
        {t.notes ? (
          <Text style={{ color: C.textSub, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {t.notes}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ color: amtColor, fontSize: 15, fontWeight: '700' }}>
          {sign}{formatAmount(t.amountBase)}
        </Text>
        {t.currency && t.currency !== settings.currency && (
          <Text style={{ color: C.textSub, fontSize: 11 }}>
            {t.currency} {t.amountOrig?.toFixed(2)}
          </Text>
        )}
        <Text style={{ color: C.textSub, fontSize: 16 }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}
