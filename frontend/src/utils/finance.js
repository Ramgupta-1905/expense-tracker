const asCents = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100);
const fromCents = (amount) => amount / 100;

export function summarizeTransactions(transactions) {
  const totals = transactions.reduce((result, transaction) => {
    const amount = asCents(transaction.amount);
    if (transaction.type === "Income") result.income += amount;
    if (transaction.type === "Expense") result.expenses += amount;
    return result;
  }, { income: 0, expenses: 0 });

  const income = fromCents(totals.income);
  const expenses = fromCents(totals.expenses);
  return { income, expenses, savings: fromCents(totals.income - totals.expenses) };
}

export function savingsRate(income, savings) {
  return income > 0 ? Math.round((savings / income) * 100) : 0;
}

export function filterTransactionsByRange(transactions, range, now = new Date()) {
  if (range === "all") return transactions;
  const start = range === "year"
    ? new Date(now.getFullYear(), 0, 1)
    : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return transactions.filter((transaction) => new Date(`${transaction.date}T00:00:00`) >= start);
}

export function groupExpensesByCategory(transactions) {
  const totals = new Map();
  transactions.filter((transaction) => transaction.type === "Expense").forEach((transaction) => {
    const category = transaction.category || "Other";
    totals.set(category, (totals.get(category) || 0) + asCents(transaction.amount));
  });
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value: fromCents(value) }))
    .sort((left, right) => right.value - left.value);
}

export function groupTransactionsByMonth(transactions, range, now = new Date()) {
  const validDates = transactions
    .map((transaction) => new Date(`${transaction.date}T00:00:00`))
    .filter((date) => !Number.isNaN(date.valueOf()));
  const latestDate = validDates.reduce((latest, date) => date > latest ? date : latest, now);
  const earliestDate = validDates.reduce((earliest, date) => date < earliest ? date : earliest, latestDate);
  const firstMonth = range === "year"
    ? new Date(now.getFullYear(), 0, 1)
    : range === "all"
      ? new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastMonth = range === "year"
    ? new Date(now.getFullYear(), 11, 1)
    : new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const monthCount = Math.max(1, (lastMonth.getFullYear() - firstMonth.getFullYear()) * 12 + lastMonth.getMonth() - firstMonth.getMonth() + 1);
  const monthly = new Map();

  for (let index = 0; index < monthCount; index += 1) {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, {
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      Income: 0,
      Expenses: 0,
    });
  }

  transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = monthly.get(key);
    if (!month) return;
    const amount = fromCents(asCents(transaction.amount));
    if (transaction.type === "Income") month.Income = fromCents(asCents(month.Income) + asCents(amount));
    if (transaction.type === "Expense") month.Expenses = fromCents(asCents(month.Expenses) + asCents(amount));
  });

  return [...monthly.values()];
}

export function formatCurrency(amount) {
  const hasFraction = !Number.isInteger(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: hasFraction ? 2 : 0,
  }).format(amount);
}
