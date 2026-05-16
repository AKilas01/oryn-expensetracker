import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Card, SectionTitle, Pill, EmptyState, CategoryIcon, ProgressBar } from '../components/UI';
import { TransactionRow } from '../components/TransactionRow';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import {
  getFilteredTransactions, calcTotals, getMonthTransactions,
  getMonthLabel, getCarryOver,
} from '../utils/helpers';
import * as Haptics from 'expo-haptics';

const FILTERS = [
  { key: 'today',      label: 'Today'      },
  { key: 'week',       label: 'This Week'  },
  { key: 'month',      label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
];

export default function HomeScreen() {
  const { transactions, settings, budgets, formatAmount, fetchRates, ratesLoading } = useApp();
  const { C } = useTheme();
  const nav = useNavigation();
  const [filter,      setFilter]      = useState('month');
  const [monthOffset, setMonthOffset] = useState(0);

  const now   = new Date();
  const year  = new Date(now.getFullYear(), now.getMonth() - monthOffset).getFullYear();
  const month = new Date(now.getFullYear(), now.getMonth() - monthOffset).getMonth();

  const filtered = useMemo(() => {
    if (filter === 'month' && monthOffset !== 0) return getMonthTransactions(transactions, year, month);
    return getFilteredTransactions(transactions, filter);
  }, [transactions, filter, monthOffset, year, month]);

  const prevFiltered = useMemo(() =>
    getMonthTransactions(transactions, year, month === 0 ? 11 : month - 1),
    [transactions, year, month]
  );

  const { income, expenses, balance } = useMemo(() => calcTotals(filtered), [filtered]);
  const { expenses: prevExpenses }    = useMemo(() => calcTotals(prevFiltered), [prevFiltered]);
  const expenseDiff = prevExpenses ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

  // Carry-over: cumulative balance from all months before this one
  const carryOver = useMemo(() => {
    if (filter !== 'month') return 0;
    return getCarryOver(transactions, year, month);
  }, [transactions, year, month, filter]);

  // True balance = carry-over from all previous months + this month's net
  const trueBalance = carryOver + balance;

  const recentTxns = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const catBreakdown = useMemo(() =>
    CATEGORIES.filter(c => c.id !== 'income').map(cat => ({
      ...cat,
      total:  filtered.filter(t => t.category === cat.id && !t.isIncome).reduce((s, t) => s + (t.amountBase || 0), 0),
      budget: budgets[cat.id] || 0,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total),
    [filtered, budgets]
  );

  const daysIn    = new Date(year, month + 1, 0).getDate();
  const dayOfM    = month === now.getMonth() && year === now.getFullYear() ? now.getDate() : daysIn;
  const projected = dayOfM > 0 ? (expenses / dayOfM) * daysIn : expenses;

  const showCarryOver = filter === 'month' && carryOver !== 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ratesLoading} onRefresh={() => fetchRates()} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.md }}>
          <View>
            <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {settings.name ? `Hi, ${settings.name}` : 'My Expenses'}
            </Text>
            <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
              {getMonthLabel(year, month)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => nav.navigate('Settings')}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Month nav */}
        {filter === 'month' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, paddingBottom: SPACING.md }}>
            <TouchableOpacity onPress={() => setMonthOffset(o => o + 1)} style={{ padding: SPACING.sm }}>
              <Text style={{ color: C.accent, fontSize: 26, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', minWidth: 130, textAlign: 'center' }}>
              {getMonthLabel(year, month)}
            </Text>
            <TouchableOpacity onPress={() => setMonthOffset(o => Math.max(0, o - 1))} style={{ padding: SPACING.sm, opacity: monthOffset === 0 ? 0.3 : 1 }}>
              <Text style={{ color: C.accent, fontSize: 26, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Balance card */}
        <View style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          <View style={{ backgroundColor: C.accent, borderRadius: RADIUS.xxl, padding: SPACING.xxl, overflow: 'hidden' }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.xs }}>
              {showCarryOver ? 'Total Balance' : 'Balance'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1.5, marginBottom: SPACING.xl }}>
              {trueBalance >= 0 ? '' : '-'}{formatAmount(Math.abs(trueBalance))}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 3 }}>Income</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>+{formatAmount(income)}</Text>
              </View>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 3 }}>Expenses</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>-{formatAmount(expenses)}</Text>
              </View>
              {showCarryOver && (
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 3 }}>Carried over</Text>
                  <Text style={{ color: carryOver >= 0 ? '#B3FFD1' : '#FFB3B3', fontSize: 15, fontWeight: '700' }}>
                    {carryOver >= 0 ? '+' : '-'}{formatAmount(Math.abs(carryOver))}
                  </Text>
                </View>
              )}
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 3 }}>vs last month</Text>
                <Text style={{ color: expenseDiff > 10 ? '#FFB3B3' : '#B3FFD1', fontSize: 15, fontWeight: '700' }}>
                  {expenseDiff > 0 ? 'up ' : 'down '}{Math.abs(expenseDiff).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carry-over info banner */}
        {showCarryOver && (
          <View style={{
            marginHorizontal: SPACING.xl, marginBottom: SPACING.md,
            backgroundColor: carryOver >= 0 ? C.income + '18' : C.expense + '18',
            borderRadius: RADIUS.md, padding: SPACING.lg,
            borderWidth: 1, borderColor: carryOver >= 0 ? C.income + '40' : C.expense + '40',
            flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
          }}>
            <Text style={{ fontSize: 20 }}>{carryOver >= 0 ? '⟳' : '⚠️'}</Text>
            <Text style={{ color: C.text, fontSize: 13, flex: 1, lineHeight: 18 }}>
              <Text style={{ fontWeight: '700' }}>{formatAmount(Math.abs(carryOver))}</Text>
              {carryOver >= 0 ? ' carried over from previous months' : ' deficit carried over from previous months'}
            </Text>
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md }}>
          {FILTERS.map(f => (
            <Pill key={f.key} label={f.label} active={filter === f.key}
              onPress={() => { setFilter(f.key); setMonthOffset(0); Haptics.selectionAsync(); }} />
          ))}
        </ScrollView>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          {[
            { label: 'Transactions', value: String(filtered.length), icon: '🔢', color: C.accent  },
            { label: 'Largest',      value: formatAmount(Math.max(...filtered.filter(t => !t.isIncome).map(t => t.amountBase || 0), 0)), icon: '📊', color: C.warning },
            { label: 'Projected',    value: formatAmount(projected),  icon: '📈', color: C.income  },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</Text>
              <Text style={{ color: s.color, fontSize: 14, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>{s.value}</Text>
              <Text style={{ color: C.textSub, fontSize: 11, marginTop: 3, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Add buttons */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nav.navigate('AddTransaction', { isIncome: false }); }}
            style={{ flex: 1, height: 56, backgroundColor: C.accent, borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>+</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nav.navigate('AddTransaction', { isIncome: true }); }}
            style={{ flex: 1, height: 56, backgroundColor: C.bgCard, borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1.5, borderColor: C.income }}
          >
            <Text style={{ color: C.income, fontSize: 20, fontWeight: '700' }}>+</Text>
            <Text style={{ color: C.income, fontSize: 15, fontWeight: '700' }}>Add Income</Text>
          </TouchableOpacity>
        </View>

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <>
            <SectionTitle label="Spending by Category" action="Set Budgets" onAction={() => nav.navigate('Budgets')} />
            <Card style={{ marginHorizontal: SPACING.xl, gap: SPACING.md }}>
              {catBreakdown.slice(0, 5).map((cat, i) => (
                <View key={cat.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xs }}>
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{cat.label}</Text>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{formatAmount(cat.total)}</Text>
                      </View>
                      {cat.budget > 0 ? (
                        <>
                          <ProgressBar value={cat.total} max={cat.budget} color={cat.color} />
                          <Text style={{ color: C.textSub, fontSize: 11, marginTop: 3 }}>
                            {formatAmount(Math.max(cat.budget - cat.total, 0))} remaining of {formatAmount(cat.budget)}
                          </Text>
                        </>
                      ) : (
                        <ProgressBar value={cat.total} max={catBreakdown[0].total} color={cat.color} />
                      )}
                    </View>
                  </View>
                  {i < Math.min(catBreakdown.length, 5) - 1 && (
                    <View style={{ height: 1, backgroundColor: C.border, marginVertical: SPACING.xs }} />
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recent */}
        <SectionTitle label="Recent" action="See All" onAction={() => nav.navigate('Transactions')} />
        {recentTxns.length === 0 ? (
          <EmptyState icon="💳" title="No transactions yet" subtitle="Tap 'Add Expense' to log your first entry." />
        ) : (
          <Card style={{ marginHorizontal: SPACING.xl }}>
            {recentTxns.map(t => (
              <TransactionRow key={t.id} transaction={t} onPress={() => nav.navigate('TransactionDetail', { id: t.id })} />
            ))}
          </Card>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
