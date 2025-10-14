import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import "./App.css"

// Helper function to get data from localStorage
const getStoredData = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

// Helper function to save data to localStorage
const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food & Dining', color: '#EF4444', icon: 'bi-basket-fill' },      // Red
  { id: '2', name: 'Transportation', color: '#2D7FF9', icon: 'bi-car-front-fill' },  // Blue (logo color)
  { id: '3', name: 'Shopping', color: '#F59E0B', icon: 'bi-bag-fill' },              // Orange
  { id: '4', name: 'Entertainment', color: '#8B5CF6', icon: 'bi-film' },             // Purple
  { id: '5', name: 'Bills & Utilities', color: '#10B981', icon: 'bi-lightbulb' },    // Green
  { id: '6', name: 'Salary', color: '#06B6D4', icon: 'bi-wallet2' },                 // Cyan
  { id: '7', name: 'Other Income', color: '#84CC16', icon: 'bi-cash-stack' }         // Lime
];


// utils to generate demo transactions across last 6 months
const random = (min, max) => Math.round(Math.random() * (max - min) + min);

const sampleNotes = [
  "Grocery shopping", "Lunch out", "Monthly salary", "Gas refill", "Online purchase",
  "Utilities bill", "Cinema night", "Coffee", "Clothes", "Freelance payment"
];

const generateSampleTransactions = (categories, months = 6) => {
  const today = new Date();
  const results = [];

  //* create roughly 6-18 transactions per month varying expense/income
  for (let m = 0; m < months; m++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const txCount = random(6, 18);

    for (let i = 0; i < txCount; i++) {
      const day = random(1, 28);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const isIncome = Math.random() < 0.12;
      const availableCats = isIncome ? categories.filter(c => /salary|income/i.test(c.name)) : categories.filter(c => !/salary|income/i.test(c.name));
      const cat = availableCats.length ? availableCats[random(0, availableCats.length - 1)] : categories[0];
      const amount = isIncome ? random(10000, 60000) : random(50, 6000);

      results.push({
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        type: isIncome ? "income" : "expense",
        categoryId: cat.id,
        date: date.toISOString().split("T")[0],
        note: sampleNotes[random(0, sampleNotes.length - 1)],
        createdAt: new Date().toISOString()
      });
    }
  }

  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
};



function App() {
  //* this is where we store our app's data
  const [transactions, setTransactions] = useState(() => getStoredData('transactions', []));
  const [categories] = useState(DEFAULT_CATEGORIES)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    categoryId: '1',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [undoTransaction, setUndoTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get category name and color
  const getCategoryInfo = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category || { name: 'Unknown', color: '#999', icon: 'bi-question-circle' };
  };

  //* save transactions to localStorage whenever they change
  useEffect(() => {
    saveData('transactions', transactions);
    saveData('categories', categories);
  }, [transactions, categories]);

  //* auto-clear undo after 5 seconds
  useEffect(() => {
    if (undoTransaction) {
      const timer = setTimeout(() => setUndoTransaction(null), 5000)
      return () => clearTimeout(timer);
    }
  }, [undoTransaction])

  //* filter transactions by current month
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const matchesMonth = 
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear();
    
    if (!matchesMonth) return false;
    
    const category = getCategoryInfo(t.categoryId);
    const matchesSearch = searchQuery === '' || 
      t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  })


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  //* return the first category id appropriate for a type
  const getFirstCategoryIdForType = (type, categories) => {
    if (!categories || categories.length === 0) return '1';
    if (type === 'income') {
      const incomeCats = categories.filter(c => /salary|income/i.test(c.name));
      return incomeCats.length ? incomeCats[0].id : categories[0].id;
    } else {
      const expenseCats = categories.filter(c => !/salary|income/i.test(c.name));
      return expenseCats.length ? expenseCats[0].id : categories[0].id;
    }
  };

  //* open form for adding new transaction
  const openAddForm = () => {
    setEditingTransaction(null);
    setFormData({
      amount: "",
      type: "expense",
      categoryId: getFirstCategoryIdForType("salary", categories),
      date: new Date().toISOString().split("T")[0],
      note: ""
    });

    setShowForm(true)
  }

  //* open form for editing existing transaction
  const openEditForm = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: transaction.date,
      note: transaction.note
    })
    setShowForm(true);
  }


  //* Add or update transaction
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (editingTransaction) {
      //* to update existing transaction
      setTransactions(prev => 
        prev.map(t => 
          t.id === editingTransaction.id 
            ? { ...t, ...formData, amount: parseFloat(formData.amount) }
            : t
        )
      );
    } else {
      //* Add new transaction
      const newTransaction = {
        id: crypto.randomUUID(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId,
        date: formData.date,
        note: formData.note,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setShowForm(false);
    setEditingTransaction(null);
  };

  //* to delete transaction
  const handleDelete = (transaction) => {
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    setUndoTransaction(transaction);
  };

  //* undo delete
  const handleUndo = () => {
    if (undoTransaction) {
      setTransactions(prev => [undoTransaction, ...prev])
      setUndoTransaction(null);
    }

  }

  //* navigate months
  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    })
  }


  const exportToCSV = () => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentDate.getMonth() &&
        transactionDate.getFullYear() === currentDate.getFullYear()
      );
    });

    if (monthTransactions.length === 0) {
      alert('No transactions to export for this month');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = monthTransactions.map(t => {
      const category = getCategoryInfo(t.categoryId);
      return [
        t.date,
        t.type,
        category.name,
        t.amount,
        t.note || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${formatMonthYear(currentDate).replace(' ', '-')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };


  const importFromJSON = (event) => {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload= (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.transactions && Array.isArray(data.transactions)) {
        const confirmImport = window.confirm(
          `Import ${data.transactions.length} transactions? This will merge with your existing data.`
        );
        
        if (confirmImport) {
          setTransactions(prev => [...data.transactions, ...prev]);
          alert('Data imported successfully!');
        }
      } else {
        alert('Invalid file format');
      }
      } catch (error) {
        alert("Error reading file")
      }
    }

    reader.readAsText(file);

  }

  const exportToJSON = () => {
    const data = {
      transactions: transactions,
      categories: categories,
      exportDate: new Date().toISOString()
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  const clearTransactions = () => {
    localStorage.removeItem('transactions');
    setTransactions([]);
    alert('All transactions removed from localStorage.');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all';



  // Calculate summary
  const summary = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      acc.expenses += t.amount;
    } else {
      acc.income += t.amount;
    }
    return acc;
  }, { income: 0, expenses: 0 });
  
  summary.balance = summary.income - summary.expenses;

  //* calculate category breakdown for chart
  const categoryData = categories.map(category => {
    const total = filteredTransactions.filter(t => t.categoryId === category.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      name: category.name,
      value: total,
      color: category.color,
      icon: category.icon
    }
  }).filter(cat => cat.value > 0).sort((a, b) => b.value - a.value);
  

  //* calculate monthly trend data (last 6 months)
  const getMonthlyTrend = () => {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      })

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        income: income,
        expenses: expenses
      })
    }

    return months;

  }
  const monthlyTrendData = getMonthlyTrend();


  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  //* format month/year for header
  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    })
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left" style={{marginRight: 8}}>
          <h1> <img src="/logo.png" alt="" /> Monivera</h1>
          <div className="month-nav">
            <button onClick={() => changeMonth(-1)} className="month-btn">
              ◀
            </button>
            <span className="month-label">{formatMonthYear(currentDate)}</span>
            <button 
              onClick={() => changeMonth(1)} 
              className="month-btn"
              disabled={
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
              }
            >
              ▶
            </button>
          </div>
        </div>

        <div className="header-actions">

          {/* These Buttons are for demo, to generate random transactions and to clear all transactions */}
          {/* <button
            className="btn-export"
            onClick={() => {
              const samples = generateSampleTransactions(categories, 6);
              setTransactions(samples);
              saveData('transactions', samples);
            }}
            title="Load demo data"
          >
            Demo Data
          </button>

          <button className="btn-export" onClick={clearTransactions} title="Clear all transactions">
            Clear Transactions
          </button> */}


          <button className="btn-export" onClick={exportToCSV} title="Export CSV">
            <i className="bi bi-download"></i> CSV
          </button>

           <button className="btn-export" onClick={exportToJSON} title="Export JSON">
            <i class="bi bi-floppy"></i> Backup
          </button>

          <label className="btn-export" style={{ cursor: 'pointer' }} title="Import JSON">
            <i class="bi bi-folder"></i> Import
            <input 
              type="file" 
              accept=".json" 
              onChange={importFromJSON}
              style={{ display: 'none' }}
            />
          </label>

          <button className="btn-add" onClick={openAddForm}>
            + Add Transaction
          </button>
        </div>
      </header>

      {/* Undo Toast */}
      {undoTransaction && (
        <div className="undo-toast">
          <span>Transaction deleted</span>
          <button onClick={handleUndo} className="undo-btn">
            Undo
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary">
        <div className="summary-card income">
          <div className="summary-label">Income</div>
          <div className="summary-amount">{formatCurrency(summary.income)}</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">Expenses</div>
          <div className="summary-amount">{formatCurrency(summary.expenses)}</div>
        </div>
        <div className="summary-card balance">
          <div className="summary-label">Balance</div>
          <div className="summary-amount">{formatCurrency(summary.balance)}</div>
        </div>
      </div>

      {/* Chart Section */}
      {categoryData.length > 0 && (
        <div className="chart-section">
          <h2 className="section-title">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={window.innerWidth < 768 ? false : ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                  const RADIAN = Math.PI /180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                  return (
                    <text
                      x={x} 
                      y={y} 
                      fill="#1a202c"
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      style={{ fontSize: '14px', fontWeight: '600' }}
                    >
                      {`${name}: ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>

          <div className="category-legend">
            {categoryData.slice(0, 5).map(cat => (
              <div key={cat.name} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                <span className="legend-text">
                  <i className={`bi ${cat.icon}`} style={{ marginRight: 8 }} aria-hidden="true" /> 
                  {cat.name}: {formatCurrency(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trend Chart */}
      {transactions.length > 0 && (
        <div className='chart-section'>
          <h2 className='section-title'>Monthly Trend (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke='#f0f0f0' />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '13px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '13px' }} />

              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />

              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />

            </BarChart>
          </ResponsiveContainer>

          <div className='category-legend' style={{ marginTop: '16px' }}>
            <div className='legend-item'>
                <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
              <span className="legend-text">Income</span>
            </div>

            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#f43f5e' }} />
              <span className="legend-text">Expenses</span>
            </div>

          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${hasActiveFilters ? 'active' : ''}`}
          >
            <i className="bi bi-funnel"></i> Filters
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label className="filter-label">Type</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-btn">
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Type</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-button ${formData.type === 'expense' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense', categoryId: getFirstCategoryIdForType('expense', categories) }))}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`type-button ${formData.type === 'income' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'income', categoryId: getFirstCategoryIdForType('income', categories) }))}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Amount (₱)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="label">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="select"
                >
                  {categories
                    .filter(c => 
                      formData.type === 'income' 
                        ? c.name.includes('Salary') || c.name.includes('Income')
                        : !c.name.includes('Salary') && !c.name.includes('Income')
                    )
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label className="label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Note (optional)</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="e.g., Lunch at restaurant"
                  className="input"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="transactions">
        <div className="transaction-header">
          <h2 className="section-title">
            Transactions ({filteredTransactions.length})
          </h2>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className={`bi ${hasActiveFilters ? 'bi-search' : 'bi-journal-text'}`} aria-hidden="true"></i>
            </div>
            <p className="empty-title">
              {hasActiveFilters ? 'No matching transactions' : 'No transactions this month'}
            </p>
            <p className="empty-text">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query'
                : 'Click "Add Transaction" to record your first transaction'
              }
            </p>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map(transaction => {
              const category = getCategoryInfo(transaction.categoryId);
              return (
                <div key={transaction.id} className="transaction-item">

                  <div 
                    className="transaction-icon"
                    style={{ backgroundColor: category.color }}
                  >
                    {console.log('Category:', category.name, 'Icon:', category.icon)}
                    <i className={`bi ${category.icon}`} aria-hidden="true"></i>
                  </div>

                  <div className="transaction-details">
                    <div className="transaction-category">{category.name}</div>
                    <div className="transaction-note">
                      {transaction.note || 'No note'}
                    </div>
                    <div className="transaction-date">{formatDate(transaction.date)}</div>
                  </div>

                  <div className="transaction-right">
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>

                    <div className="transaction-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => openEditForm(transaction)}
                        title="Edit"
                      >
                        <i className="bi bi-pen"></i>
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(transaction)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



export default App;
