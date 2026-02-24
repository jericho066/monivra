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


// ───────────── File download helper ─────────────
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
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

