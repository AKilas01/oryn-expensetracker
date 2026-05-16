import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { SectionTitle, Pill, EmptyState } from '../components/UI';
import { TransactionRow } from '../components/TransactionRow';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import { getFilteredTransactions, groupByDay, calcTotals } from '../utils/helpers';
import { format } from 'date-fns';

const FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'today',      label: 'Today'      },
  { key: 'week',       label: 'This Week'  },
  { key: 'month',      label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
];

export default function TransactionsScreen() {
  const { transactions, formatAmount } = useApp();
  const { C }  = useTheme();
  const nav    = useNavigation();
  const [filter,    setFilter]   = useState('all');
  const [search,    setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState(null);

  const filtered = useMemo(() => {
    let txns = filter === 'all' ? transactions : getFilteredTransactions(transactions, filter);
    if (search) txns = txns.filter(t =>
      t.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase())
    );
    if (catFilter) txns = txns.filter(t => t.category === catFilter);
    return txns;
  }, [transactions, filter, search, catFilter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const { income, expenses } = useMemo(() => calcTotals(filtered), [filtered]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.md }}>
        <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md }}>Transactions</Text>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: C.bgInput, borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: C.border,
          marginBottom: SPACING.md,
        }}>
          <Text style={{ color: C.textMuted, fontSize: 16, marginRight: SPACING.sm }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor={C.textMuted}
            style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: SPACING.md }}
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: C.textMuted }}>✕</Text></TouchableOpacity> : null}
        </View>

        {/* Income / Expense summary */}
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <View style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.textSub, fontSize: 11 }}>Total Income</Text>
            <Text style={{ color: C.income, fontSize: 15, fontWeight: '700' }}>+{formatAmount(income)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.textSub, fontSize: 11 }}>Total Expenses</Text>
            <Text style={{ color: C.expense, fontSize: 15, fontWeight: '700' }}>−{formatAmount(expenses)}</Text>
          </View>
        </View>
      </View>

      {/* Period filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm, alignItems: 'center' }}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => (
          <Pill key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, alignItems: 'center' }}
        style={{ flexGrow: 0 }}
      >
        <Pill label="All Categories" active={!catFilter} onPress={() => setCatFilter(null)} />
        {CATEGORIES.map(cat => (
          <Pill
            key={cat.id}
            label={`${cat.emoji} ${cat.label.split(' ')[0]}`}
            active={catFilter === cat.id}
            onPress={() => setCatFilter(catFilter === cat.id ? null : cat.id)}
            color={cat.color}
          />
        ))}
      </ScrollView>

      {/* Transaction list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}>
        {grouped.length === 0 ? (
          <EmptyState icon="📋" title="No transactions" subtitle="Try a different filter or add your first entry." />
        ) : (
          grouped.map(group => (
            <View key={group.date}>
              <Text style={{
                color: C.textSub, fontSize: 12, fontWeight: '600',
                letterSpacing: 0.8, textTransform: 'uppercase',
                paddingVertical: SPACING.sm,
              }}>
                {format(new Date(group.date), 'EEEE, d MMMM')}
              </Text>
              <View style={{
                backgroundColor: C.bgCard, borderRadius: RADIUS.lg,
                paddingHorizontal: SPACING.lg, borderWidth: 1, borderColor: C.border,
                marginBottom: SPACING.md,
              }}>
                {group.items.map(t => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    onPress={() => nav.navigate('TransactionDetail', { id: t.id })}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
