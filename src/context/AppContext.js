import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { CATEGORIES, MERCHANT_CATEGORY_MAP } from '../constants/theme';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  TRANSACTIONS: '@me_transactions',
  SETTINGS:     '@me_settings',
  BUDGETS:      '@me_budgets',
  RATES:        '@me_rates',
  RATES_DATE:   '@me_rates_date',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

export function AppProvider({ children }) {
  const [transactions, setTransactions]   = useState([]);
  const [settings,     setSettingsState]  = useState({
    currency:    'CHF',
    darkMode:    true,
    biometric:   false,
    setupDone:   false,
    name:        '',
    monthBudget: 0,
  });
  const [budgets,       setBudgetsState]  = useState({});
  const [rates,         setRates]         = useState({});
  const [ratesLoading,  setRatesLoading]  = useState(false);
  const [ratesError,    setRatesError]    = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);

  // ── Load everything from storage ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [txRaw, stRaw, buRaw, raRaw, raDate] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
          AsyncStorage.getItem(STORAGE_KEYS.RATES),
          AsyncStorage.getItem(STORAGE_KEYS.RATES_DATE),
        ]);
        if (txRaw) setTransactions(JSON.parse(txRaw));
        if (stRaw) setSettingsState(s => ({ ...s, ...JSON.parse(stRaw) }));
        if (buRaw) setBudgetsState(JSON.parse(buRaw));

        // Load cached rates if today
        const today = new Date().toDateString();
        if (raRaw && raDate === today) {
          setRates(JSON.parse(raRaw));
        } else {
          await fetchRates(stRaw ? JSON.parse(stRaw).currency || 'CHF' : 'CHF');
        }
      } catch (e) {
        console.log('Load error', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Fetch live rates from Frankfurter ────────────────────────────────────
  const fetchRates = useCallback(async (base = settings.currency) => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const res  = await fetch(`https://api.frankfurter.app/latest?base=${base}`);
      const data = await res.json();
      const newRates = { ...data.rates, [base]: 1 };
      setRates(newRates);
      await AsyncStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(newRates));
      await AsyncStorage.setItem(STORAGE_KEYS.RATES_DATE, new Date().toDateString());
    } catch (e) {
      setRatesError('Could not fetch live rates. Using cached rates.');
    } finally {
      setRatesLoading(false);
    }
  }, [settings.currency]);

  // ── Convert any amount to base currency ──────────────────────────────────
  const convertToBase = useCallback((amount, fromCurrency) => {
    if (!fromCurrency || fromCurrency === settings.currency) return amount;
    const rate = rates[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
  }, [rates, settings.currency]);

  const convertFromBase = useCallback((amount, toCurrency) => {
    if (!toCurrency || toCurrency === settings.currency) return amount;
    const rate = rates[toCurrency];
    if (!rate) return amount;
    return amount * rate;
  }, [rates, settings.currency]);

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates) => {
    const newSettings = s => {
      const merged = { ...s, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    };
    setSettingsState(newSettings);
    if (updates.currency) await fetchRates(updates.currency);
  }, [fetchRates]);

  // ── Budgets ───────────────────────────────────────────────────────────────
  const updateBudget = useCallback(async (categoryId, amount) => {
    setBudgetsState(prev => {
      const next = { ...prev, [categoryId]: amount };
      AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Budget notifications ──────────────────────────────────────────────────
  const checkBudgetAlerts = useCallback(async (updatedTransactions) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTxns = updatedTransactions.filter(t =>
      !t.isIncome && new Date(t.date) >= startOfMonth
    );

    for (const [catId, budget] of Object.entries(budgets)) {
      if (!budget) continue;
      const spent = monthTxns
        .filter(t => t.category === catId)
        .reduce((s, t) => s + (t.amountBase || 0), 0);
      const pct = spent / budget;
      const cat = CATEGORIES.find(c => c.id === catId);
      if (pct >= 1.0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${cat?.emoji} Budget Exceeded`,
            body: `You've exceeded your ${cat?.label} budget this month.`,
          },
          trigger: null,
        });
      } else if (pct >= 0.8) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${cat?.emoji} Budget Warning`,
            body: `You've used 80% of your ${cat?.label} budget.`,
          },
          trigger: null,
        });
      }
    }
  }, [budgets]);

  // ── Auto-categorize by merchant name ──────────────────────────────────────
  const autoCategory = useCallback((merchantName) => {
    if (!merchantName) return 'other';
    const lower = merchantName.toLowerCase();
    for (const [key, cat] of Object.entries(MERCHANT_CATEGORY_MAP)) {
      if (lower.includes(key)) return cat;
    }
    return 'other';
  }, []);

  // ── Add transaction ───────────────────────────────────────────────────────
  const addTransaction = useCallback(async (tx) => {
    const amountBase = convertToBase(tx.amountOrig, tx.currency);
    const newTx = {
      id:         Date.now().toString(),
      date:       new Date().toISOString(),
      amountBase,
      ...tx,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    if (!tx.isIncome) await checkBudgetAlerts(updated);
    return newTx;
  }, [transactions, convertToBase, checkBudgetAlerts]);

  // ── Edit transaction ──────────────────────────────────────────────────────
  const editTransaction = useCallback(async (id, updates) => {
    const amountBase = updates.amountOrig
      ? convertToBase(updates.amountOrig, updates.currency)
      : undefined;
    const updated = transactions.map(t =>
      t.id === id ? { ...t, ...updates, ...(amountBase ? { amountBase } : {}) } : t
    );
    setTransactions(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  }, [transactions, convertToBase]);

  // ── Delete transaction ────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  }, [transactions]);

  // ── Add recurring transactions ─────────────────────────────────────────────
  const processRecurring = useCallback(async () => {
    const recurring = transactions.filter(t => t.isRecurring && t.recurringNext);
    const now = new Date();
    let newOnes = [];
    for (const t of recurring) {
      const next = new Date(t.recurringNext);
      if (next <= now) {
        const amountBase = convertToBase(t.amountOrig, t.currency);
        newOnes.push({
          ...t,
          id:            Date.now().toString() + Math.random(),
          date:          now.toISOString(),
          amountBase,
          recurringNext: getNextRecurringDate(t.recurringFreq, now).toISOString(),
        });
      }
    }
    if (newOnes.length > 0) {
      const updated = [...newOnes, ...transactions];
      setTransactions(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    }
  }, [transactions, convertToBase]);

  // ── Format amount in base currency ───────────────────────────────────────
  const formatAmount = useCallback((amount, currency) => {
    const cur = currency || settings.currency;
    try {
      return new Intl.NumberFormat('de-CH', {
        style:    'currency',
        currency: cur,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    } catch {
      return `${cur} ${(amount || 0).toFixed(2)}`;
    }
  }, [settings.currency]);

  const value = {
    transactions, settings, budgets, rates, ratesLoading, ratesError, isLoading,
    updateSettings, updateBudget, addTransaction, editTransaction, deleteTransaction,
    convertToBase, convertFromBase, formatAmount, fetchRates, autoCategory, processRecurring,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function getNextRecurringDate(freq, from) {
  const d = new Date(from);
  if (freq === 'daily')   d.setDate(d.getDate() + 1);
  if (freq === 'weekly')  d.setDate(d.getDate() + 7);
  if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  if (freq === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d;
}
