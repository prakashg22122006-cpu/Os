import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FinancialTransaction, TransactionCategory, Budget } from '../../types';
import { addFile, getFile } from '../../utils/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const downloadData = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d'];

// --- Sub-components for each tab ---

const OverviewTab: React.FC<{ transactions: FinancialTransaction[], categories: TransactionCategory[], budgets: Budget[] }> = ({ transactions, categories, budgets }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const monthlyData = useMemo(() => {
        const filtered = transactions.filter(t => t.date.startsWith(month));
        const income = filtered.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        const expense = filtered.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);
        return { income, expense: Math.abs(expense) };
    }, [transactions, month]);
    
    const expenseByCategory = useMemo(() => {
        const filtered = transactions.filter(t => t.date.startsWith(month) && t.amount < 0);
        const categoryMap = new Map<string, number>();
        filtered.forEach(t => {
            const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
            categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Math.abs(t.amount));
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [transactions, categories, month]);

    const balance = useMemo(() => transactions.reduce((acc, t) => acc + t.amount, 0), [transactions]);

    return (
        <div className="space-y-4">
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="max-w-xs" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="text-sm text-gray-400">Total Balance</h4>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{balance.toFixed(2)}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="text-sm text-gray-400">Income ({month})</h4>
                    <p className="text-2xl font-bold text-green-400">+₹{monthlyData.income.toFixed(2)}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="text-sm text-gray-400">Expenses ({month})</h4>
                    <p className="text-2xl font-bold text-red-400">-₹{monthlyData.expense.toFixed(2)}</p>
                </div>
            </div>
            <div>
                 <h4 className="font-semibold mb-2">Monthly Expense Breakdown</h4>
                 {expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} contentStyle={{ backgroundColor: '#0b1626', border: '1px solid #5aa1ff' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : <p className="text-center text-gray-400 p-8">No expenses this month.</p>}
            </div>
        </div>
    );
};

const TransactionsTab: React.FC<{
    transactions: FinancialTransaction[], setTransactions: (txs: FinancialTransaction[]) => void,
    categories: TransactionCategory[]
}> = ({ transactions, setTransactions, categories }) => {
    const { setViewingFile } = useAppContext();
    const [formData, setFormData] = useState<Partial<FinancialTransaction>>({ date: new Date().toISOString().split('T')[0] });
    const [editingId, setEditingId] = useState<number | null>(null);
    const receiptRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        if (!formData.description || !formData.amount || !formData.categoryId) return alert('Description, amount, and category are required.');
        
        let receiptFileId = formData.receiptFileId;
        const receiptFile = receiptRef.current?.files?.[0];
        if (receiptFile) {
            receiptFileId = await addFile(receiptFile);
        }

        const transactionData = { ...formData, receiptFileId } as FinancialTransaction;

        if (editingId) {
            setTransactions(transactions.map(t => t.id === editingId ? { ...t, ...transactionData } : t));
        } else {
            setTransactions([{ ...transactionData, id: Date.now() }, ...transactions]);
        }
        setFormData({ date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
        if (receiptRef.current) receiptRef.current.value = "";
    };

    const handleEdit = (tx: FinancialTransaction) => {
        setEditingId(tx.id);
        setFormData(tx);
    };
    
    const handleDelete = (id: number) => {
        if (window.confirm('Delete this transaction?')) {
            setTransactions(transactions.filter(t => t.id !== id));
        }
    };
    
    const handleViewReceipt = async (id: number | undefined) => {
        if (!id) return;
        const file = await getFile(id);
        if(file) setViewingFile(file);
    }
    
    const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
    const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

    return (
        <div>
            <div className="p-3 bg-black/20 rounded-lg mb-4 space-y-2">
                <h4 className="font-semibold">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   <Input type="date" value={formData.date || ''} onChange={e => setFormData(f => ({...f, date: e.target.value}))}/>
                   <Input placeholder="Description" value={formData.description || ''} onChange={e => setFormData(f => ({...f, description: e.target.value}))} />
                   <Input type="number" placeholder="Amount (e.g., -50 for expense)" value={formData.amount || ''} onChange={e => setFormData(f => ({...f, amount: parseFloat(e.target.value)}))} />
                   <select value={formData.categoryId || ''} onChange={e => setFormData(f => ({...f, categoryId: parseInt(e.target.value)}))} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full">
                        <option value="">Select Category</option>
                        <optgroup label="Income" className="bg-[#0b1626]">{incomeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
                        <optgroup label="Expense" className="bg-[#0b1626]">{expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
                   </select>
                </div>
                 <textarea placeholder="Notes..." value={formData.notes || ''} onChange={e => setFormData(f => ({...f, notes: e.target.value}))} rows={2} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full" />
                 <div className="text-sm"><label>Receipt: </label><input type="file" ref={receiptRef}/></div>
                <div className="flex gap-2">
                    <Button onClick={handleSave}>{editingId ? 'Save' : 'Add'}</Button>
                    {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setFormData({ date: new Date().toISOString().split('T')[0] }); }}>Cancel</Button>}
                </div>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {transactions.sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
                    <div key={tx.id} className="p-2 bg-white/5 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{tx.description}</p>
                            <p className="text-xs text-gray-400">{tx.date} • {categories.find(c => c.id === tx.categoryId)?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>₹{tx.amount.toFixed(2)}</span>
                            {tx.receiptFileId && <Button variant="outline" className="text-xs !p-1" onClick={() => handleViewReceipt(tx.receiptFileId)}>🧾</Button>}
                            <Button variant="outline" className="text-xs !p-1" onClick={() => handleEdit(tx)}>Edit</Button>
                            <Button variant="outline" className="text-xs !p-1" onClick={() => handleDelete(tx.id)}>Del</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BudgetsTab: React.FC<{
    budgets: Budget[], setBudgets: (b: Budget[]) => void,
    categories: TransactionCategory[], transactions: FinancialTransaction[]
}> = ({ budgets, setBudgets, categories, transactions }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

    const handleBudgetChange = (categoryId: number, amount: number) => {
        const budgetId = Number(`${categoryId}${month.replace('-', '')}`);
        const existing = budgets.find(b => b.id === budgetId);
        if (existing) {
            setBudgets(budgets.map(b => b.id === budgetId ? { ...b, amount } : b));
        } else {
            setBudgets([...budgets, { id: budgetId, categoryId, month, amount }]);
        }
    };
    
    const monthlyExpenses = useMemo(() => {
        const map = new Map<number, number>();
        transactions
            .filter(t => t.date.startsWith(month) && t.amount < 0)
            .forEach(t => map.set(t.categoryId, (map.get(t.categoryId) || 0) + Math.abs(t.amount)));
        return map;
    }, [transactions, month]);

    return (
        <div>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="max-w-xs mb-4" />
            <div className="space-y-3">
                {expenseCategories.map(cat => {
                    const budget = budgets.find(b => b.categoryId === cat.id && b.month === month)?.amount || 0;
                    const spent = monthlyExpenses.get(cat.id) || 0;
                    const progress = budget > 0 ? (spent / budget) * 100 : 0;
                    return (
                        <div key={cat.id}>
                            <div className="flex justify-between items-center mb-1">
                                <label className="font-semibold">{cat.name}</label>
                                <div className="flex gap-2 items-center">
                                    <span>₹</span>
                                    <Input type="number" value={budget || ''} onChange={e => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)} placeholder="Set Budget" className="w-28 text-right" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className={`${progress > 100 ? 'bg-red-500' : 'bg-blue-500'} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                             <p className="text-xs text-right text-gray-400 mt-1">₹{spent.toFixed(2)} / ₹{budget.toFixed(2)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CategoriesTab: React.FC<{
    categories: TransactionCategory[], setCategories: (c: TransactionCategory[]) => void
}> = ({ categories, setCategories }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');

    const handleAdd = () => {
        if (!name.trim()) return;
        setCategories([...categories, { id: Date.now(), name, type }]);
        setName('');
    };
    
    const handleDelete = (id: number) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    return (
        <div className="max-w-md">
            <div className="flex gap-2 mb-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Category Name" />
                <select value={type} onChange={e => setType(e.target.value as any)} className="bg-transparent border border-[rgba(255,255,255,0.08)] rounded-lg">
                    <option value="expense" className="bg-[#0b1626]">Expense</option>
                    <option value="income" className="bg-[#0b1626]">Income</option>
                </select>
                <Button onClick={handleAdd}>Add</Button>
            </div>
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                        <p>{cat.name} <span className="text-xs text-gray-400">({cat.type})</span></p>
                        <Button variant="outline" className="text-xs !p-1" onClick={() => handleDelete(cat.id)}>Delete</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main Component ---

type FinanceTab = 'overview' | 'transactions' | 'budgets' | 'categories';

const FinanceManager: React.FC = () => {
    const { financialTransactions, setFinancialTransactions, transactionCategories, setTransactionCategories, budgets, setBudgets } = useAppContext();
    const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
    const importFileRef = useRef<HTMLInputElement>(null);
    
    const handleExport = (format: 'json' | 'csv') => {
        if (format === 'json') {
            const data = { transactions: financialTransactions, categories: transactionCategories, budgets };
            downloadData(JSON.stringify(data, null, 2), 'finance_export.json', 'application/json');
        } else {
            const header = "Date,Description,Amount,Category\n";
            const rows = financialTransactions.map(t => {
                const category = transactionCategories.find(c => c.id === t.categoryId)?.name || '';
                return `"${t.date}","${t.description.replace(/"/g, '""')}","${t.amount}","${category.replace(/"/g, '""')}"`;
            }).join('\n');
            downloadData(header + rows, 'transactions.csv', 'text/csv');
        }
    };
    
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (file.name.endsWith('.json')) {
                try {
                    const data = JSON.parse(content);
                    if (data.transactions) setFinancialTransactions(data.transactions);
                    if (data.categories) setTransactionCategories(data.categories);
                    if (data.budgets) setBudgets(data.budgets);
                    alert('Finance data imported from JSON.');
                } catch { alert('Invalid JSON file.'); }
            } else if (file.name.endsWith('.csv')) {
                 try {
                    const rows = content.split('\n').slice(1);
                    let newTxs = [...financialTransactions];
                    let newCats = [...transactionCategories];
                    rows.forEach(row => {
                        const [date, description, amount, categoryName] = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                        if (!date || !description || !amount) return;
                        
                        let category = newCats.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                        if (!category) {
                            category = { id: Date.now() + Math.random(), name: categoryName, type: parseFloat(amount) < 0 ? 'expense' : 'income' };
                            newCats.push(category);
                        }
                        
                        newTxs.push({ id: Date.now() + Math.random(), date, description, amount: parseFloat(amount), categoryId: category.id });
                    });
                    setFinancialTransactions(newTxs);
                    setTransactionCategories(newCats);
                    alert('Transactions imported from CSV.');
                } catch { alert('Error parsing CSV file.'); }
            }
        };
        reader.readAsText(file);
        if(importFileRef.current) importFileRef.current.value = "";
    };

    const TABS: { id: FinanceTab, label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'transactions', label: 'Transactions' },
        { id: 'budgets', label: 'Budgets' },
        { id: 'categories', label: 'Categories' },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <CardHeader title="Personal Finance" subtitle="Track your income, expenses, and budgets" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
                    <Button variant="outline" onClick={() => handleExport('json')}>Export JSON</Button>
                    <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import</Button>
                    <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept=".json,.csv" />
                </div>
            </div>
             <div className="flex border-b border-white/10 mb-4">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-[#5aa1ff] border-b-2 border-[#5aa1ff]' : 'text-gray-400 hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === 'overview' && <OverviewTab transactions={financialTransactions} categories={transactionCategories} budgets={budgets} />}
                {activeTab === 'transactions' && <TransactionsTab transactions={financialTransactions} setTransactions={setFinancialTransactions} categories={transactionCategories} />}
                {activeTab === 'budgets' && <BudgetsTab budgets={budgets} setBudgets={setBudgets} categories={transactionCategories} transactions={financialTransactions} />}
                {activeTab === 'categories' && <CategoriesTab categories={transactionCategories} setCategories={setTransactionCategories} />}
            </div>
        </>
    );
};

export default FinanceManager;