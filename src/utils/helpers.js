// ───────────── LocalStorage ─────────────
export const getStoredData = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};


export const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};


// ───────────── Formatting ─────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatMonthYear = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });


// ───────────── Category helpers ─────────────
export const getDefaultCategory = (type, categories) => {
  if (!categories || categories.length === 0) return '1';
  if (type === 'income') {
    const incomeCats = categories.filter(c => /salary|income/i.test(c.name));
    return incomeCats.length ? incomeCats[0].id : categories[0].id;
  }
  const expenseCats = categories.filter(c => !/salary|income/i.test(c.name));
  return expenseCats.length ? expenseCats[0].id : categories[0].id;
};


// ───────────── Monthly trend (last 6 months) ─────────────
export const getMonthlyTrend = (transactions) => {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthTx = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });

    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }

  return months;
};


// ───────────── Recurring transactions ─────────────
/**
 * Checks all recurring templates and generates missing transactions
 * for any month between the template's startDate and today.
 * Returns { newTransactions, updatedTemplates }
 */
export const applyRecurringTransactions = (templates, existingTransactions) => {
  const today     = new Date();
  const newTx     = [];
  const updatedTemplates = templates.map(template => ({ ...template }));

  updatedTemplates.forEach(template => {
    if (!template.active) return;

    const start    = new Date(template.startDate);
    const lastDate = template.lastGeneratedDate
      ? new Date(template.lastGeneratedDate)
      : null;

    // Walk every month from start up to and including this month
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    while (cursor <= todayMonthStart) {
      const year  = cursor.getFullYear();
      const month = cursor.getMonth();

      // Skip if we already generated for this month
      const alreadyGenerated =
        lastDate &&
        lastDate.getFullYear() === year &&
        lastDate.getMonth() >= month;

      // Also skip if an identical transaction already exists (safety net)
      const txDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(template.dayOfMonth).padStart(2, '0')}`;
      const duplicate = existingTransactions.some(
        t => t.recurringId === template.id && t.date === txDate
      );

      if (!alreadyGenerated && !duplicate) {
        newTx.push({
          id:          crypto.randomUUID(),
          amount:      template.amount,
          type:        template.type,
          categoryId:  template.categoryId,
          date:        txDate,
          note:        template.note || '',
          createdAt:   new Date().toISOString(),
          recurringId: template.id,   // link back to template
        });
        template.lastGeneratedDate = txDate;
      }

      cursor.setMonth(cursor.getMonth() + 1);
    }
  });

  return { newTransactions: newTx, updatedTemplates };
};


// ───────────── File download helper ─────────────
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};


// ───────────── Demo data generator ─────────────
const random = (min, max) => Math.round(Math.random() * (max - min) + min);

const sampleNotes = [
  'Grocery shopping', 'Lunch out', 'Monthly salary', 'Gas refill', 'Online purchase',
  'Utilities bill', 'Cinema night', 'Coffee', 'Clothes', 'Freelance payment',
];

export const generateDemoData = (categories, months = 6) => {
  const today = new Date();
  const results = [];

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const txCount = random(6, 18);

    for (let i = 0; i < txCount; i++) {
      const day = random(1, 28);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const isIncome = Math.random() < 0.12;
      const availableCats = isIncome
        ? categories.filter(c => /salary|income/i.test(c.name))
        : categories.filter(c => !/salary|income/i.test(c.name));
      const cat = availableCats.length
        ? availableCats[random(0, availableCats.length - 1)]
        : categories[0];

      results.push({
        id: crypto.randomUUID(),
        amount: parseFloat(isIncome ? random(10000, 60000) : random(50, 6000)),
        type: isIncome ? 'income' : 'expense',
        categoryId: cat.id,
        date: date.toISOString().split('T')[0],
        note: sampleNotes[random(0, sampleNotes.length - 1)],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
};


