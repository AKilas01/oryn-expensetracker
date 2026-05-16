import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Card, SectionTitle, CategoryIcon, ProgressBar } from '../components/UI';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import { getMonthTransactions, calcTotals, getMonthLabel } from '../utils/helpers';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const { transactions, formatAmount, budgets } = useApp();
  const { C } = useTheme();
  const [monthOffset, setMonthOffset] = useState(0);

  const now   = new Date();
  const year  = new Date(now.getFullYear(), now.getMonth() - monthOffset).getFullYear();
  const month = new Date(now.getFullYear(), now.getMonth() - monthOffset).getMonth();

  const current  = useMemo(() => getMonthTransactions(transactions, year, month),  [transactions, year, month]);
  const previous = useMemo(() => getMonthTransactions(transactions, year, month === 0 ? 11 : month - 1), [transactions, year, month]);

  const { income, expenses, balance } = useMemo(() => calcTotals(current),  [current]);
  const { expenses: prevExp }         = useMemo(() => calcTotals(previous), [previous]);

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth  = month === now.getMonth() && year === now.getFullYear() ? now.getDate() : daysInMonth;
  const dailyAvg    = dayOfMonth > 0 ? expenses / dayOfMonth : 0;
  const projected   = dailyAvg * daysInMonth;
  const expChange   = prevExp > 0 ? ((expenses - prevExp) / prevExp) * 100 : 0;

  const catBreakdown = useMemo(() =>
    CATEGORIES.filter(c => c.id !== 'income').map(cat => ({
      ...cat,
      total:  current.filter(t => t.category === cat.id && !t.isIncome).reduce((s, t) => s + (t.amountBase || 0), 0),
      budget: budgets[cat.id] || 0,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total),
    [current, budgets]
  );

  const last6 = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const txns = getMonthTransactions(transactions, d.getFullYear(), d.getMonth());
    const { expenses: exp } = calcTotals(txns);
    return { label: d.toLocaleString('default', { month: 'short' }), value: exp };
  }), [transactions]);

  const maxBar = Math.max(...last6.map(d => d.value), 1);

  const kpiItems = [
    { label: 'Income',        value: formatAmount(income),         icon: '↑', color: C.income  },
    { label: 'Expenses',      value: formatAmount(expenses),       icon: '↓', color: C.expense },
    { label: 'Balance',       value: formatAmount(balance),        icon: '=', color: balance >= 0 ? C.income : C.expense },
    { label: 'Savings Rate',  value: `${savingsRate.toFixed(0)}%`, icon: '◈', color: C.accent  },
    { label: 'Daily Average', value: formatAmount(dailyAvg),       icon: '◷', color: C.warning },
    { label: 'Projected',     value: formatAmount(projected),      icon: '→', color: C.accent  },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header + month nav */}
        <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl }}>
          <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md }}>
            Insights
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl }}>
            <TouchableOpacity onPress={() => setMonthOffset(o => o + 1)} style={{ padding: SPACING.sm }}>
              <Text style={{ color: C.accent, fontSize: 28, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{getMonthLabel(year, month)}</Text>
            <TouchableOpacity onPress={() => setMonthOffset(o => Math.max(0, o - 1))} style={{ padding: SPACING.sm, opacity: monthOffset === 0 ? 0.3 : 1 }}>
              <Text style={{ color: C.accent, fontSize: 28, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          {kpiItems.map(s => (
            <View key={s.label} style={{
              width: (width - SPACING.xl * 2 - SPACING.md) / 2 - 1,
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: C.border,
            }}>
              {/* Icon always uses C.text so it's white on dark, dark on light */}
              <Text style={{ fontSize: 20, marginBottom: 6, color: C.text, fontWeight: '700' }}>{s.icon}</Text>
              <Text style={{ color: s.color, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
                {s.value}
              </Text>
              <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* vs last month */}
        <Card style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <Text style={{ fontSize: 28 }}>{expChange > 0 ? '📈' : '📉'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>
              {Math.abs(expChange).toFixed(0)}% {expChange > 0 ? 'more' : 'less'} than last month
            </Text>
            <Text style={{ color: C.textSub, fontSize: 13, marginTop: 2 }}>
              Last month: {formatAmount(prevExp)}
            </Text>
          </View>
        </Card>

        {/* 6-month bar chart */}
        <SectionTitle label="6-Month Overview" />
        <Card style={{ marginHorizontal: SPACING.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, height: 130 }}>
            {last6.map((d, i) => {
              const isActive = i === 6 - 1 - monthOffset;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: C.textSub, fontSize: 9, fontWeight: '500' }} numberOfLines={1}>
                    {d.value > 0 ? formatAmount(d.value).replace(/[^0-9.,]/g, '') : ''}
                  </Text>
                  <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
                    <View style={{
                      width: '100%',
                      height: `${Math.max((d.value / maxBar) * 100, 4)}%`,
                      backgroundColor: isActive ? C.accent : C.accent + '55',
                      borderRadius: RADIUS.sm,
                    }} />
                  </View>
                  <Text style={{
                    color: isActive ? C.accent : C.textSub,
                    fontSize: 10,
                    fontWeight: isActive ? '700' : '500',
                  }}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Category breakdown */}
        <SectionTitle label="By Category" />
        {catBreakdown.length === 0 ? (
          <View style={{ alignItems: 'center', padding: SPACING.xxxl }}>
            <Text style={{ fontSize: 36, marginBottom: SPACING.md }}>📊</Text>
            <Text style={{ color: C.textSub, fontSize: 15, textAlign: 'center' }}>No expenses this month</Text>
          </View>
        ) : (
          <Card style={{ marginHorizontal: SPACING.xl }}>
            {catBreakdown.map((cat, i) => (
              <View key={cat.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md }}>
                  <CategoryIcon emoji={cat.emoji} color={cat.color} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{cat.label}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{formatAmount(cat.total)}</Text>
                        <Text style={{ color: C.textSub, fontSize: 11, marginTop: 1 }}>
                          {expenses > 0 ? ((cat.total / expenses) * 100).toFixed(0) : 0}%
                        </Text>
                      </View>
                    </View>
                    {cat.budget > 0 ? (
                      <>
                        <ProgressBar value={cat.total} max={cat.budget} color={cat.color} />
                        <Text style={{ color: C.textSub, fontSize: 11, marginTop: 3 }}>
                          {formatAmount(Math.max(cat.budget - cat.total, 0))} of {formatAmount(cat.budget)} remaining
                        </Text>
                      </>
                    ) : (
                      <ProgressBar value={cat.total} max={expenses || 1} color={cat.color} />
                    )}
                  </View>
                </View>
                {i < catBreakdown.length - 1 && (
                  <View style={{ height: 1, backgroundColor: C.border }} />
                )}
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
