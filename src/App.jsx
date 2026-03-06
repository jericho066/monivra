import { useState, useEffect, useMemo } from 'react';
import './App.css';

import { DEFAULT_CATEGORIES } from './constants/categories';
import { getStoredData, saveData, getDefaultCategory, getMonthlyTrend, triggerDownload } from './utils/helpers';

import Header from './components/Header';
import UndoToast from './components/UndoToast';
import SummaryCards from './components/SummaryCards';
import ChartSection from './components/ChartSection';
import FilterSection from './components/FilterSection';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import BudgetGoals from './components/BudgetGoals';
import RecurringList from './components/RecurringList';
import { applyRecurringTransactions } from './utils/helpers';

const blankForm = (categories, type = 'expense') => ({
  amount: '',
  type,
  categoryId: getDefaultCategory(type, categories),
  date: new Date().toISOString().split('T')[0],
  note: '',
  recurring: false,
});

function App() {
  const [transactions, setTransactions] = useState(() => getStoredData('transactions', []));
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState(() => blankForm(DEFAULT_CATEGORIES));
  const [undoTransaction, setUndoTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [budgets, setBudgets] = useState(() => getStoredData('budgets', {}));
  const [recurringTemplates, setRecurringTemplates] = useState(
    () => getStoredData('recurringTemplates', [])
  );

  useEffect(() => {
    saveData('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveData('recurringTemplates', recurringTemplates);
  }, [recurringTemplates]);

  useEffect(() => {
    if (!undoTransaction) return;
    const timer = setTimeout(() => setUndoTransaction(null), 5000);
    return () => clearTimeout(timer);
  }, [undoTransaction]);

  useEffect(() => {
    saveData('budgets', budgets);
  }, [budgets]);


  useEffect(() => {
    if (recurringTemplates.length === 0) return;
    const { newTransactions, updatedTemplates } = applyRecurringTransactions(
      recurringTemplates,
      transactions
    );
    if (newTransactions.length > 0) {
      setTransactions(prev => [...newTransactions, ...prev]);
      setRecurringTemplates(updatedTemplates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const getCategoryInfo = (categoryId) =>
    categories.find(c => c.id === categoryId) ||
    { name: 'Unknown', color: '#999', icon: 'bi-question-circle' };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesMonth =
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear();
      if (!matchesMonth) return false;

      const category = getCategoryInfo(t.categoryId);
      const matchesSearch =
        searchQuery === '' ||
        t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
      const matchesType     = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, currentDate, searchQuery, selectedCategory, selectedType]);

  const summary = useMemo(() => {
    const result = filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'expense') acc.expenses += t.amount;
        else acc.income += t.amount;
        return acc;
      },
      { income: 0, expenses: 0 }
    );
    result.balance = result.income - result.expenses;
    return result;
  }, [filteredTransactions]);


  const categoryData = useMemo(() => {
    return categories
      .map(cat => ({
        name:  cat.name,
        value: filteredTransactions
          .filter(t => t.categoryId === cat.id && t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
        color: cat.color,
        icon:  cat.icon,
      }))
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const monthlyTrendData = useMemo(() => getMonthlyTrend(transactions), [transactions]);

  const spentByCategory = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = filteredTransactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return acc;
    }, {});
  }, [filteredTransactions, categories]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all';

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  };

  const openAddForm = () => {
    setEditingTransaction(null);
    setFormData(blankForm(categories, 'expense'));
    setShowForm(true);
  };

  const openEditForm = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount:     transaction.amount,
      type:       transaction.type,
      categoryId: transaction.categoryId,
      date:       transaction.date,
      note:       transaction.note,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTransaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: formData.categoryId,
      date: formData.date,
      note: formData.note,
      createdAt: new Date().toISOString(),
    };

    if (editingTransaction) {
      setTransactions(prev =>
        prev.map(t =>
          t.id === editingTransaction.id
            ? { ...t, ...formData, amount: parseFloat(formData.amount) }
            : t
        )
      );
    } else {
      setTransactions(prev => [newTransaction, ...prev]);

      // If recurring is checked, save a template too
      if (formData.recurring) {
        const template = {
          id: crypto.randomUUID(),
          amount: parseFloat(formData.amount),
          type: formData.type,
          categoryId: formData.categoryId,
          note: formData.note,
          startDate: formData.date,
          dayOfMonth: new Date(formData.date).getDate(),
          active: true,
          lastGeneratedDate: formData.date,
          createdAt: new Date().toISOString(),
        };
        setRecurringTemplates(prev => [...prev, template]);
      }
    }

    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDelete = (transaction) => {
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    setUndoTransaction(transaction);
  };

  const handleUndo = () => {
    if (undoTransaction) {
      setTransactions(prev => [undoTransaction, ...prev]);
      setUndoTransaction(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
  };


  const handleSaveBudget = (categoryId, amount) => {
    setBudgets(prev => ({ ...prev, [categoryId]: amount }));
  };

  const handleRemoveBudget = (categoryId) => {
    setBudgets(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };


  const handlePauseRecurring = (id) => {
    setRecurringTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, active: false } : t)
    );
  };

  const handleResumeRecurring = (id) => {
    setRecurringTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, active: true } : t)
    );
  };

  const handleRemoveRecurring = (id) => {
    if (window.confirm('Remove this recurring transaction? Past transactions it generated will not be deleted.')) {
      setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    }
  };



  const exportCSV = () => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    if (monthTx.length === 0) { alert('No transactions to export for this month'); return; }

    const rows = monthTx.map(t => {
      const cat = getCategoryInfo(t.categoryId);
      return [t.date, t.type, cat.name, t.amount, t.note || ''];
    });
    const csv = [
      ['Date', 'Type', 'Category', 'Amount', 'Note'].join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(',')),
    ].join('\n');
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `expenses-${monthLabel}.csv`);
  };

  const exportJSON = () => {
    const data = { transactions, categories, exportDate: new Date().toISOString() };
    triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    );
  };



  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        //! Step 1: Basic structure check
        if (!data.transactions || !Array.isArray(data.transactions)) {
          alert('Invalid file format. Please use a Monivra backup file.');
          return;
        }

        //! Step 2: Validate each transaction
        const requiredFields = ['id', 'amount', 'type', 'categoryId', 'date'];
        const validTypes = ['income', 'expense'];
        const validCategoryIds = categories.map(c => c.id);

        const invalidItems = [];
        const validItems = [];

        data.transactions.forEach((t, index) => {
          const problems = [];

          // Check required fields exist
          requiredFields.forEach(field => {
            if (t[field] === undefined || t[field] === null || t[field] === '') {
              problems.push(`missing "${field}"`);
            }
          });

          // Check amount is a positive number
          if (t.amount !== undefined) {
            const amt = parseFloat(t.amount);
            if (isNaN(amt) || amt <= 0) {
              problems.push('invalid amount');
            }
          }

          // Check type is valid
          if (t.type && !validTypes.includes(t.type)) {
            problems.push(`unknown type "${t.type}"`);
          }

          // Check date is a real date
          if (t.date) {
            const parsed = new Date(t.date);
            if (isNaN(parsed.getTime())) {
              problems.push('invalid date');
            }
          }

          // Check categoryId exists in our categories
          if (t.categoryId && !validCategoryIds.includes(t.categoryId)) {
            problems.push(`unknown category "${t.categoryId}"`);
          }

          if (problems.length > 0) {
            invalidItems.push({ index: index + 1, problems });
          } else {
            validItems.push(t);
          }

        });

        //! Step 3: Duplicate detection
        const existingIds = new Set(transactions.map(t => t.id));
        const duplicates  = validItems.filter(t => existingIds.has(t.id));
        const newItems    = validItems.filter(t => !existingIds.has(t.id));
        

        //! Step 4: Build a clear summary for the user
        const lines = [];
        lines.push(`📂 File: ${file.name}`);
        lines.push(`📋 Total transactions in file: ${data.transactions.length}`);
        lines.push('');

        if (invalidItems.length > 0) {
          lines.push(`⚠️  Skipped (invalid data): ${invalidItems.length}`);
          // Show details for up to 3 invalid items so we don't flood them
          invalidItems.slice(0, 3).forEach(({ index, problems }) => {
            lines.push(`   • Row ${index}: ${problems.join(', ')}`);
          });
          if (invalidItems.length > 3) {
            lines.push(`   • ...and ${invalidItems.length - 3} more`);
          }
          lines.push('');
        }

        if (duplicates.length > 0) {
          lines.push(`🔁 Duplicates (already exist, will skip): ${duplicates.length}`);
          lines.push('');
        }

        lines.push(`✅ New transactions to import: ${newItems.length}`);

        //! Step 5: Stop if there's nothing to import
        if (newItems.length === 0) {
          alert(
            lines.join('\n') +
            '\n\nNothing new to import. Your data is already up to date.'
          );
          // Reset file input so the same file can be re-selected if needed
          event.target.value = '';
          return;
        }

        //! Step 6: Confirm and import
        lines.push('');
        lines.push('Proceed with import?');

        const confirmed = window.confirm(lines.join('\n'));
        if (confirmed) {
          setTransactions(prev => [...newItems, ...prev]);
          alert(`✅ Successfully imported ${newItems.length} new transaction${newItems.length !== 1 ? 's' : ''}.`);
        }

      } catch (err) {
        alert('Could not read the file. Make sure it is a valid Monivra JSON backup.');
      }

      // Always reset file input after processing
      event.target.value = '';
    };

    reader.readAsText(file);
  };



  return (
    <div className="app">
      <Header
        currentDate={currentDate}
        onChangeMonth={changeMonth}
        onAddTransaction={openAddForm}
        onExportCSV={exportCSV}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
      />

      {undoTransaction && <UndoToast onUndo={handleUndo} />}

      <SummaryCards summary={summary} />

      <BudgetGoals
        categories={categories}
        budgets={budgets}
        spentByCategory={spentByCategory}
        onSave={handleSaveBudget}
        onRemove={handleRemoveBudget}
      />

      <RecurringList
        templates={recurringTemplates}
        categories={categories}
        onPause={handlePauseRecurring}
        onResume={handleResumeRecurring}
        onRemove={handleRemoveRecurring}
      />

      <ChartSection
        categoryData={categoryData}
        monthlyTrendData={monthlyTrendData}
        hasTransactions={transactions.length > 0}
      />

      <FilterSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <TransactionList
        transactions={filteredTransactions}
        getCategoryInfo={getCategoryInfo}
        onEdit={openEditForm}
        onDelete={handleDelete}
        hasActiveFilters={hasActiveFilters}
      />

      {showForm && (
        <TransactionForm
          formData={formData}
          setFormData={setFormData}
          editingTransaction={editingTransaction}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          categories={categories}
        />
      )}
    </div>
  );
}

export default App;
