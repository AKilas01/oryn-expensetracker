import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export function getFilteredTransactions(transactions, filter, customDate) {
  const now = customDate ? new Date(customDate) : new Date();
  let start, end;

  switch (filter) {
    case 'today':
      start = new Date(now); start.setHours(0,0,0,0);
      end   = new Date(now); end.setHours(23,59,59,999);
      break;
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end   = endOfWeek(now,   { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      end   = endOfMonth(now);
      break;
    case 'last_month':
      start = startOfMonth(subMonths(now, 1));
      end   = endOfMonth(subMonths(now, 1));
      break;
    default:
      return transactions;
  }

  return transactions.filter(t => {
    const d = new Date(t.date);
    return isWithinInterval(d, { start, end });
  });
}

export function getMonthTransactions(transactions, year, month) {
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// Get all transactions BEFORE a given month (for carry-over)
export function getPreviousTransactions(transactions, year, month) {
  const cutoff = new Date(year, month, 1); // start of current month
  return transactions.filter(t => new Date(t.date) < cutoff);
}

// Calculate the cumulative balance from all months before the given month
// This is the "carry-over" — what was saved up until this month started
export function getCarryOver(transactions, year, month) {
  const prev = getPreviousTransactions(transactions, year, month);
  const { balance } = calcTotals(prev);
  return balance;
}

export function groupByDay(transactions) {
  const groups = {};
  for (const t of transactions) {
    const key = format(new Date(t.date), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

export function calcTotals(transactions) {
  let income = 0, expenses = 0;
  for (const t of transactions) {
    if (t.isIncome) income   += (t.amountBase || 0);
    else            expenses += (t.amountBase || 0);
  }
  return { income, expenses, balance: income - expenses };
}

export function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)      return 'just now';
  if (diff < 3600000)    return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000)   return `${Math.floor(diff/3600000)}h ago`;
  if (diff < 172800000)  return 'Yesterday';
  return format(d, 'd MMM yyyy');
}

export function formatDateFull(iso) {
  return format(new Date(iso), 'EEEE, d MMMM yyyy · HH:mm');
}

export function getMonthLabel(year, month) {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}

export function detectDuplicate(transactions, amount, category, withinMinutes = 60) {
  const cutoff = Date.now() - withinMinutes * 60000;
  return transactions.some(t =>
    Math.abs(t.amountBase - amount) < 0.01 &&
    t.category === category &&
    new Date(t.date).getTime() > cutoff
  );
}

export function exportToCSV(transactions, formatAmount) {
  const header = 'Date,Merchant,Category,Amount,Currency,Type,Notes\n';
  const rows = transactions.map(t =>
    [
      format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      `"${t.merchant || ''}"`,
      t.category,
      t.amountOrig?.toFixed(2),
      t.currency,
      t.isIncome ? 'Income' : 'Expense',
      `"${t.notes || ''}"`,
    ].join(',')
  ).join('\n');
  return header + rows;
}
