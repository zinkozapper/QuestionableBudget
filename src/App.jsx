// A modern YNAB-style web budgeting app using React and a simple local storage backend.
// This is a single-file implementation (for demonstration).
// Copy-paste into App.js of a create-react-app project or similar React environment.

import React, { useState, useEffect } from 'react';
import './App.css';
import { PieChart, BarChart, LineChart, DonutChart } from './components/Charts.jsx';
import sampleData from './data/sample-data.json';

// --- Helper functions for LocalStorage ---
const LS_KEY = 'budget_app_data_v1';
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    accounts: [],
    categories: [],
    transactions: []
  };
}
function saveData(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// --- File handling functions ---
function loadSampleData() {
  return sampleData;
}

function exportData(data) {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function loadDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

// --- Components ---
function App() {
  const [data, setData] = useState(loadData());
  const [view, setView] = useState('dashboard');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // File handling functions
  const handleLoadSampleData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(loadSampleData());
      setIsLoading(false);
    }, 500);
  };

  const handleExportData = () => {
    exportData(data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const newData = await loadDataFromFile(file);
      setData(newData);
    } catch (error) {
      alert('Error loading file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const newData = await loadDataFromFile(file);
      setData(newData);
    } catch (error) {
      alert('Error loading file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Utilities
  const addAccount = (name, balance) => {
    if (!name.trim()) return;
    setData(d => ({
      ...d,
      accounts: [...d.accounts, { id: genId(), name, balance: parseFloat(balance) }]
    }));
  };
  const addCategory = (name) => {
    if (!name.trim()) return;
    setData(d => ({
      ...d,
      categories: [...d.categories, { id: genId(), name, budgeted: 0 }]
    }));
  };
  const budgetCategory = (id, delta) => {
    setData(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === id ? { ...c, budgeted: c.budgeted + parseFloat(delta) } : c
      )
    }));
  };
  const addTransaction = (tx) => {
    setData(d => ({
      ...d,
      transactions: [...d.transactions, { ...tx, id: genId(), date: new Date().toISOString() }],
      accounts: d.accounts.map(a =>
        a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a
      )
    }));
  };
  // Data selectors
  const spendingInCategory = (catId) => {
    return data.transactions.filter(tx => tx.categoryId === catId).reduce((s, t) => s + t.amount, 0);
  };
  const availableInCategory = (cat) => cat.budgeted + spendingInCategory(cat.id);

  // UI
  return (
    <div className="app-container">
      <AppBar setView={setView} view={view} />
      <div className="main-content">
        {view === 'dashboard' &&
          <Dashboard
            data={data}
            setView={setView}
            setSelectedAccount={setSelectedAccount}
            onLoadSampleData={handleLoadSampleData}
            onExportData={handleExportData}
            onFileUpload={handleFileUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isLoading={isLoading}
            onQuickAdd={() => setShowQuickAdd(true)}
          />
        }
        {view === 'accounts' &&
          <Accounts
            accounts={data.accounts}
            onAdd={addAccount}
            onSelect={id => { setSelectedAccount(id); setView('account'); }}
          />
        }
        {view === 'categories' &&
          <Categories
            categories={data.categories}
            onAdd={addCategory}
            onBudget={budgetCategory}
            data={data}
          />
        }
        {view === 'transactions' &&
          <Transactions
            data={data}
            onAdd={addTransaction}
          />
        }
        {view === 'account' &&
          <AccountDetail
            account={data.accounts.find(a => a.id === selectedAccount)}
            transactions={data.transactions.filter(tx => tx.accountId === selectedAccount)}
            onBack={() => setView('accounts')}
            categories={data.categories}
          />
        }
      </div>
      <Footer />
      
      {/* Quick Add Transaction Modal */}
      {showQuickAdd && (
        <QuickAddModal
          data={data}
          onAdd={addTransaction}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}

// AppBar: navigation bar
function AppBar({ setView, view }) {
  return (
    <div className="app-bar py-4 px-4 flex items-center justify-between">
      <span className="app-title cursor-pointer" onClick={() => setView('dashboard')}>
        QuestionableBudget <span className="app-version">v2</span>
      </span>
      <nav className="nav-container">
        <NavButton text="Dashboard" onClick={() => setView('dashboard')} active={view === 'dashboard'} />
        <NavButton text="Accounts" onClick={() => setView('accounts')} active={view === 'accounts'} />
        <NavButton text="Categories" onClick={() => setView('categories')} active={view === 'categories'} />
        <NavButton text="Transactions" onClick={() => setView('transactions')} active={view === 'transactions'} />
      </nav>
    </div>
  );
}
function NavButton({ text, onClick, active }) {
  return (
    <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>
      {text}
    </button>
  );
}

// Dashboard: Main summary
function Dashboard({ data, setView, setSelectedAccount, onLoadSampleData, onExportData, onFileUpload, onDragOver, onDragLeave, onDrop, isLoading, onQuickAdd }) {
  const totalBalance = data.accounts.reduce((s, a) => s + a.balance, 0);
  const totalBudgeted = data.categories.reduce((s, c) => s + c.budgeted, 0);
  const totalActivity = data.transactions.reduce((s, t) => s + t.amount, 0);
  const availableToBudget = totalBalance - totalBudgeted;

  // Calculate spending insights
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthSpending = data.transactions
    .filter(tx => tx.date.startsWith(thisMonth) && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const lastMonthSpending = data.transactions
    .filter(tx => tx.date.startsWith(lastMonth) && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const spendingChange = lastMonthSpending > 0 ? ((thisMonthSpending - lastMonthSpending) / lastMonthSpending * 100) : 0;

  // Prepare chart data
  const spendingByCategory = data.categories.map(cat => {
    const spending = data.transactions
      .filter(tx => tx.categoryId === cat.id && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return {
      label: cat.name,
      value: spending
    };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const budgetStatus = data.categories.map(cat => {
    const spending = data.transactions
      .filter(tx => tx.categoryId === cat.id && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const available = cat.budgeted + spending;
    return {
      ...cat,
      spending,
      available,
      status: available >= 0 ? 'good' : 'over'
    };
  });

  return (
    <div className="animate-fade-in">
      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <div className="quick-actions-left">
          <button className="quick-action-btn primary" onClick={onQuickAdd}>
            + Add Transaction
          </button>
          <button className="quick-action-btn secondary" onClick={() => setView('categories')}>
            📊 Budget
          </button>
        </div>
        <div className="quick-actions-right">
          <button className="quick-action-btn icon" onClick={onLoadSampleData} disabled={isLoading}>
            {isLoading ? '⏳' : '📊'}
          </button>
          <button className="quick-action-btn icon" onClick={onExportData}>
            💾
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Available to Budget</div>
            <div className="metric-value">{formatCurrency(availableToBudget)}</div>
            <div className="metric-change">
              {availableToBudget >= 0 ? '✅ On track' : '⚠️ Over budget'}
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">💳</div>
          <div className="metric-content">
            <div className="metric-label">Total Balance</div>
            <div className="metric-value">{formatCurrency(totalBalance)}</div>
            <div className="metric-change">
              {data.accounts.length} account{data.accounts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">This Month</div>
            <div className="metric-value">{formatCurrency(thisMonthSpending)}</div>
            <div className={`metric-change ${spendingChange > 0 ? 'negative' : 'positive'}`}>
              {spendingChange > 0 ? '↗️' : '↘️'} {Math.abs(spendingChange).toFixed(1)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Budget Overview</h2>
          <button className="btn btn-sm" onClick={() => setView('categories')}>Manage</button>
        </div>
        
        {budgetStatus.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No budget categories yet</h3>
            <p>Create your first budget category to start tracking your spending</p>
            <button className="btn btn-primary" onClick={() => setView('categories')}>
              Create Budget
            </button>
          </div>
        ) : (
          <div className="budget-grid">
            {budgetStatus.slice(0, 6).map(cat => (
              <div key={cat.id} className={`budget-item ${cat.status}`}>
                <div className="budget-header">
                  <span className="budget-name">{cat.name}</span>
                  <span className="budget-amount">{formatCurrency(cat.available)}</span>
                </div>
                <div className="budget-bar">
                  <div 
                    className="budget-progress" 
                    style={{ 
                      width: `${Math.min(100, (cat.budgeted / Math.max(cat.budgeted, Math.abs(cat.spending))) * 100)}%` 
                    }}
                  />
                </div>
                <div className="budget-details">
                  <span>Budgeted: {formatCurrency(cat.budgeted)}</span>
                  <span>Spent: {formatCurrency(cat.spending)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      {spendingByCategory.length > 0 && (
        <div className="charts-section">
          <div className="chart-container chart-large">
            <PieChart 
              data={spendingByCategory.slice(0, 6)} 
              title="Spending Breakdown" 
            />
          </div>
          <div className="chart-container">
            <BarChart 
              data={spendingByCategory.slice(0, 5)} 
              title="Top Categories" 
            />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <button className="btn btn-sm" onClick={() => setView('transactions')}>View All</button>
        </div>
        {data.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction to start tracking your spending</p>
            <button className="btn btn-primary" onClick={() => setView('transactions')}>
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {data.transactions.slice(-5).reverse().map(tx => {
              const account = data.accounts.find(a => a.id === tx.accountId);
              const category = data.categories.find(c => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="activity-item">
                  <div className="activity-icon">
                    {tx.amount > 0 ? '💰' : '💸'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-description">
                      <span className="activity-memo">{tx.memo || 'Transaction'}</span>
                      <span className="activity-category">{category?.name}</span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-account">{account?.name}</span>
                      <span className="activity-date">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                  <div className={`activity-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(tx.amount)}
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

// Accounts list/add
function Accounts({ accounts, onAdd, onSelect }) {
  const [form, setForm] = useState({ name: '', balance: 0 });
  return (
    <div className="section animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Accounts</h2>
        <p className="section-subtitle">Manage your financial accounts</p>
      </div>
      
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No accounts yet</p>
          <p className="text-gray-400">Add your first account to get started</p>
        </div>
      )}
      
      {accounts.length > 0 && (
        <ul className="list mb-6">
          {accounts.map(acc =>
            <li key={acc.id} className="list-item">
              <div className="list-item-content">
                <span className="font-semibold text-lg">{acc.name}</span>
                <span className="font-mono text-xl font-bold">{formatCurrency(acc.balance)}</span>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-primary btn-sm" onClick={() => onSelect(acc.id)}>
                  View Details
                </button>
              </div>
            </li>
          )}
        </ul>
      )}
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Add New Account</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Account Name</label>
            <input
              className="form-input"
              placeholder="e.g., Checking Account"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Starting Balance</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <button className="btn btn-success btn-lg"
              onClick={() => {
                onAdd(form.name, form.balance);
                setForm({ name: '', balance: 0 });
              }}>
              Add Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Categories list/add/budgeting
function Categories({ categories, onAdd, onBudget, data }) {
  const [form, setForm] = useState({ name: '', amount: 0 });
  return (
    <div className="section animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Budget Categories</h2>
        <p className="section-subtitle">Organize your spending with budget categories</p>
      </div>
      
      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No categories yet</p>
          <p className="text-gray-400">Create your first budget category to start tracking expenses</p>
        </div>
      )}
      
      {categories.length > 0 && (
        <div className="space-y-4 mb-6">
          {categories.map(cat => {
            const activity = data.transactions.filter(tx => tx.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
            const available = (cat.budgeted || 0) + activity;
            return (
              <div key={cat.id} className="bg-gray-50 p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{cat.name}</h3>
                  <BudgetQuickAdd onBudget={amt => onBudget(cat.id, amt)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Budgeted</p>
                    <p className="text-lg font-mono font-bold">{formatCurrency(cat.budgeted || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Activity</p>
                    <p className="text-lg font-mono font-bold text-gray-700">{formatCurrency(activity)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Available</p>
                    <p className={`text-lg font-mono font-bold ${available >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(available)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              className="form-input"
              placeholder="e.g., Groceries, Entertainment"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <button className="btn btn-primary btn-lg"
              onClick={() => {
                onAdd(form.name);
                setForm({ name: '', amount: 0 });
              }}>
              Add Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function BudgetQuickAdd({ onBudget }) {
  const [amt, setAmt] = useState('');
  return (
    <div className="flex gap-2">
      <input 
        type="number" 
        step="0.01" 
        className="form-input" 
        style={{ width: '80px' }} 
        value={amt}
        onChange={e => setAmt(e.target.value)} 
        placeholder="+$" 
      />
      <button 
        className="btn btn-success btn-sm"
        onClick={() => { onBudget(parseFloat(amt || 0)); setAmt(''); }}
      >
        +
      </button>
    </div>
  );
}

// Transactions: list/add
function Transactions({ data, onAdd }) {
  const [form, setForm] = useState({
    accountId: data.accounts[0]?.id || '',
    categoryId: data.categories[0]?.id || '',
    amount: '',
    memo: '',
  });
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.accountId || !form.categoryId || !form.amount) return;
    onAdd({
      accountId: form.accountId,
      categoryId: form.categoryId,
      amount: parseFloat(form.amount),
      memo: form.memo
    });
    setForm({ ...form, amount: '', memo: '' });
  }
  return (
    <div className="section animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Transactions</h2>
        <p className="section-subtitle">Track your income and expenses</p>
      </div>
      
      {data.transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No transactions yet</p>
          <p className="text-gray-400">Add your first transaction to start tracking your finances</p>
        </div>
      )}
      
      {data.transactions.length > 0 && (
        <div className="mb-6">
          <ul className="list">
            {data.transactions.slice().reverse().map(tx =>
              <li key={tx.id} className="list-item">
                <div className="list-item-content">
                  <span className="text-sm text-gray-500 min-w-[80px]">{formatDate(tx.date)}</span>
                  <span className={`font-mono text-lg font-bold ${tx.amount >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(tx.amount)}
                  </span>
                  <span className="font-semibold">{data.accounts.find(a => a.id === tx.accountId)?.name}</span>
                  <span className="text-gray-600">{data.categories.find(c => c.id === tx.categoryId)?.name}</span>
                  <span className="italic text-gray-700">{tx.memo}</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Account</label>
              <select 
                className="form-input"
                value={form.accountId}
                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              >
                <option value="" disabled>Select Account</option>
                {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="form-input"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="" disabled>Select Category</option>
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input 
                className="form-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Memo</label>
              <input 
                className="form-input"
                type="text"
                placeholder="Transaction description"
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn btn-primary btn-lg" type="submit">
              Add Transaction
            </button>
          </div>
        </form>
        <p className="text-gray-500 mt-4 text-sm">
          <strong>Tip:</strong> Use negative amounts for expenses (e.g. <strong>-25.00</strong> for a purchase).
        </p>
      </div>
    </div>
  );
}

// Account detail
function AccountDetail({ account, transactions, onBack, categories }) {
  if (!account) return (
    <div className="section animate-fade-in">
      <div className="text-center py-12">
        <p className="text-error text-lg">Error: Account not found.</p>
        <button className="btn btn-secondary mt-4" onClick={onBack}>← Back to Accounts</button>
      </div>
    </div>
  );
  
  return (
    <div className="section animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <div>
          <h2 className="section-title">{account.name}</h2>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(account.balance)}</p>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        {transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions for this account yet.</p>
          </div>
        )}
        {transactions.length > 0 && (
          <ul className="list">
            {transactions.slice().reverse().map(tx =>
              <li key={tx.id} className="list-item">
                <div className="list-item-content">
                  <span className="text-sm text-gray-500 min-w-[80px]">{formatDate(tx.date)}</span>
                  <span className={`font-mono text-lg font-bold ${tx.amount >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(tx.amount)}
                  </span>
                  <span className="text-gray-600">{categories.find(c => c.id === tx.categoryId)?.name}</span>
                  <span className="italic text-gray-700">{tx.memo}</span>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

// Footer
function Footer() {
  return (
    <footer className="footer">
      <p>
        Built with <span role="img" aria-label="heart" className="footer-heart">❤️</span> to help you budget. 
        Not affiliated with YNAB.
      </p>
      <p className="mt-2">Copyright &copy; {new Date().getFullYear()}</p>
    </footer>
  );
}

// --- Utility functions ---
function formatCurrency(amount) {
  // US-EN for simplicity
  return "$" + (Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
}
function formatDate(dt) {
  return dt.slice(0,10);
}
function genId() {
  return '_' + Math.random().toString(36).slice(2, 10);
}

// Quick Add Transaction Modal
function QuickAddModal({ data, onAdd, onClose }) {
  const [form, setForm] = useState({
    accountId: data.accounts[0]?.id || '',
    categoryId: data.categories[0]?.id || '',
    amount: '',
    memo: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.accountId || !form.categoryId || !form.amount) return;
    
    onAdd({
      accountId: form.accountId,
      categoryId: form.categoryId,
      amount: parseFloat(form.amount),
      memo: form.memo
    });
    
    setForm({ 
      accountId: data.accounts[0]?.id || '',
      categoryId: data.categories[0]?.id || '',
      amount: '',
      memo: ''
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Quick Add Transaction</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account</label>
              <select 
                className="form-input"
                value={form.accountId}
                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                required
              >
                {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="form-input"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                required
              >
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input 
                className="form-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Memo</label>
              <input 
                className="form-input"
                type="text"
                placeholder="Transaction description"
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;


