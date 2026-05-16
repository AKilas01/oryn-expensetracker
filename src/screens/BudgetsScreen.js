import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Card, Button, ProgressBar, CategoryIcon } from '../components/UI';
import { CATEGORIES, SPACING, RADIUS } from '../constants/theme';
import { getMonthTransactions, calcTotals } from '../utils/helpers';
import * as Haptics from 'expo-haptics';

export default function BudgetsScreen() {
  const { budgets, updateBudget, transactions, formatAmount, settings } = useApp();
  const { C } = useTheme();
  const nav = useNavigation();
  const [editing,  setEditing]  = useState(null);
  const [inputVal, setInputVal] = useState('');

  const now       = new Date();
  const monthTxns = useMemo(() => getMonthTransactions(transactions, now.getFullYear(), now.getMonth()), [transactions]);

  const catData = useMemo(() => CATEGORIES.filter(c => c.id !== 'income').map(cat => ({
    ...cat,
    spent:  monthTxns.filter(t => t.category === cat.id && !t.isIncome).reduce((s, t) => s + (t.amountBase || 0), 0),
    budget: budgets[cat.id] || 0,
  })), [monthTxns, budgets]);

  const overallBudget = settings.monthBudget || 0;
  const { expenses }  = useMemo(() => calcTotals(monthTxns), [monthTxns]);

  function startEdit(cat) {
    setEditing(cat.id);
    setInputVal(cat.budget > 0 ? cat.budget.toString() : '');
    Haptics.selectionAsync();
  }

  async function saveBudget(catId) {
    const val = parseFloat(inputVal) || 0;
    await updateBudget(catId, val);
    setEditing(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 100 }}>

        <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.xl }}>Budgets</Text>

        {/* Overall */}
        {overallBudget > 0 && (
          <Card style={{ marginBottom: SPACING.md }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.md }}>💼 Monthly Overall</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
              <Text style={{ color: C.textSub, fontSize: 13 }}>{formatAmount(expenses)} spent</Text>
              <Text style={{ color: C.textSub, fontSize: 13 }}>of {formatAmount(overallBudget)}</Text>
            </View>
            <ProgressBar value={expenses} max={overallBudget} color={C.accent} height={8} />
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: SPACING.sm }}>
              {formatAmount(Math.max(overallBudget - expenses, 0))} remaining
            </Text>
          </Card>
        )}

        <Text style={{ color: C.textSub, fontSize: 13, marginBottom: SPACING.md, lineHeight: 18 }}>
          Set a monthly budget per category. You'll get a notification when you reach 80% and 100%.
        </Text>

        {catData.map(cat => (
          <Card key={cat.id} style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: cat.budget > 0 ? SPACING.md : 0 }}>
              <CategoryIcon emoji={cat.emoji} color={cat.color} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>{cat.label}</Text>
                <Text style={{ color: C.textSub, fontSize: 13 }}>Spent: {formatAmount(cat.spent)}</Text>
              </View>
              {editing === cat.id ? (
                <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                  <TextInput
                    value={inputVal}
                    onChangeText={setInputVal}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.textMuted}
                    autoFocus
                    style={{
                      backgroundColor: C.bgInput, borderRadius: RADIUS.sm,
                      borderWidth: 1.5, borderColor: C.accent,
                      color: C.text, fontSize: 16, padding: SPACING.sm,
                      minWidth: 80, textAlign: 'center',
                    }}
                  />
                  <TouchableOpacity onPress={() => saveBudget(cat.id)}>
                    <Text style={{ color: C.income, fontSize: 22, fontWeight: '700' }}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(null)}>
                    <Text style={{ color: C.expense, fontSize: 22, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startEdit(cat)}
                  style={{
                    backgroundColor: cat.budget > 0 ? C.accent + '22' : C.bgInput,
                    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
                    borderWidth: 1, borderColor: cat.budget > 0 ? C.accent : C.border,
                  }}
                >
                  <Text style={{ color: cat.budget > 0 ? C.accent : C.textSub, fontSize: 13, fontWeight: '600' }}>
                    {cat.budget > 0 ? formatAmount(cat.budget) : '+ Set'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {cat.budget > 0 && (
              <>
                <ProgressBar value={cat.spent} max={cat.budget} color={cat.color} height={6} />
                <Text style={{ color: C.textSub, fontSize: 11, marginTop: SPACING.xs }}>
                  {((cat.spent / cat.budget) * 100).toFixed(0)}% used · {formatAmount(Math.max(cat.budget - cat.spent, 0))} left
                </Text>
              </>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
