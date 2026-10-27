import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  ListFilter,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { DEMO_CATEGORIES, DEMO_TRANSACTIONS, INCOME_CATEGORIES } from "./data/demoTransactions";
import {
  filterTransactionsByRange,
  formatCurrency,
  groupExpensesByCategory,
  groupTransactionsByMonth,
  savingsRate,
  summarizeTransactions,
} from "./utils/finance";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "expense-tracker-transactions";
const CATEGORY_KEY = "expense-tracker-categories";
const COLORS = ["#4c83f5", "#f0b541", "#aa75e8", "#f37578", "#5cbf9a", "#57a6df", "#f18e50", "#8092a8"];
const DEFAULT_CATEGORIES = DEMO_CATEGORIES;
const NAV_ITEMS = [
  { id: "Dashboard", icon: LayoutDashboard },
  { id: "Add Transaction", icon: Plus },
  { id: "Transactions", icon: CreditCard },
  { id: "Reports", icon: BarChart3 },
  { id: "Categories", icon: Tags },
  { id: "Settings", icon: Settings },
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from LocalStorage.`, error);
    return fallback;
  }
}

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(`${value}T00:00:00`));
}

function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><FileText size={19} /></span>
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = readStorage(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [categories, setCategories] = useState(() => {
    const saved = readStorage(CATEGORY_KEY, DEFAULT_CATEGORIES);
    return Array.isArray(saved) ? [...new Set([...DEFAULT_CATEGORIES, ...saved])] : DEFAULT_CATEGORIES;
  });
  const [page, setPage] = useState("Dashboard");
  const [range, setRange] = useState("six");
  const [type, setType] = useState("Expense");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ amount: "", category: "", date: today(), description: "" });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const saveLockRef = useRef(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [confirm, setConfirm] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Unable to save transactions to LocalStorage.", error);
      setToast("Could not save your transactions. Check your browser storage.");
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error("Unable to save categories to LocalStorage.", error);
      setToast("Could not save your categories. Check your browser storage.");
    }
  }, [categories]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (page !== "Add Transaction") return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById("add-transaction-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [page]);

  const filteredTransactions = useMemo(() => filterTransactionsByRange(transactions, range), [transactions, range]);
  const { income, expenses, savings } = useMemo(() => summarizeTransactions(filteredTransactions), [filteredTransactions]);
  const savingRate = savingsRate(income, savings);
  const categoryOptions = useMemo(() => (
    type === "Income"
      ? categories.filter((category) => INCOME_CATEGORIES.includes(category))
      : categories.filter((category) => !INCOME_CATEGORIES.includes(category))
  ), [categories, type]);
  const txSearchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...transactions]
      .filter((item) => filterType === "All" || item.type === filterType)
      .filter((item) => filterCategory === "All" || item.category === filterCategory)
      .filter((item) => !normalized || `${item.description} ${item.category} ${item.type}`.toLowerCase().includes(normalized))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterCategory, filterType, search]);

  const monthlyData = useMemo(() => groupTransactionsByMonth(filteredTransactions, range), [filteredTransactions, range]);
  const breakdown = useMemo(() => groupExpensesByCategory(filteredTransactions), [filteredTransactions]);
  const spendingInsight = breakdown[0] ?? null;
  const dashboardDate = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileNavOpen(false);
    setSaveNotice(null);
    if (nextPage === "Add Transaction") {
      setEditingId(null);
      setType("Expense");
      setForm({ amount: "", category: "", date: today(), description: "" });
      setErrors({});
    }
  }

  function resetForm() {
    setEditingId(null);
    setType("Expense");
    setForm({ amount: "", category: "", date: today(), description: "" });
    setErrors({});
  }

  function persistTransactions(nextTransactions, successMessage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
      setTransactions(nextTransactions);
      if (successMessage) setToast(successMessage);
      return true;
    } catch (error) {
      console.error("Unable to persist transactions to LocalStorage.", error);
      setToast("Could not save your transactions. Check your browser storage.");
      return false;
    }
  }

  function changeTransactionType(nextType) {
    setType(nextType);
    setForm((current) => ({
      ...current,
      category: (nextType === "Income"
        ? categories.filter((category) => INCOME_CATEGORIES.includes(category))
        : categories.filter((category) => !INCOME_CATEGORIES.includes(category))
      ).includes(current.category) ? current.category : "",
    }));
    setErrors((current) => ({ ...current, category: undefined }));
  }

  async function saveTransaction(event) {
    event.preventDefault();
    if (saveLockRef.current) return;
    const nextErrors = {};
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) nextErrors.amount = "Amount must be greater than 0.";
    if (type !== "Income" && type !== "Expense") nextErrors.type = "Please choose income or expense.";
    if (!categoryOptions.includes(form.category)) nextErrors.category = "Please select a category for this transaction type.";
    const [year, month, day] = (form.date || "").split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    if (!form.date || !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
      selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month - 1 || selectedDate.getDate() !== day) {
      nextErrors.date = "Please enter a valid date.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const transaction = {
      id: editingId || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      amount,
      category: form.category,
      date: form.date,
      description: form.description.trim(),
      type,
    };
    const nextTransactions = editingId
      ? transactions.map((item) => item.id === editingId ? transaction : item)
      : [transaction, ...transactions];
    saveLockRef.current = true;
    setIsSaving(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const saved = persistTransactions(nextTransactions, editingId ? "Transaction updated successfully." : "Transaction saved successfully.");
      if (!saved) return;
      setSaveNotice({ updated: Boolean(editingId), transaction });
      resetForm();
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setType(item.type);
    setForm({ amount: String(item.amount), category: item.category, date: item.date, description: item.description });
    setErrors({});
    setSaveNotice(null);
    setPage("Add Transaction");
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTransaction() {
    if (!confirm) return;
    const nextTransactions = transactions.filter((item) => item.id !== confirm.id);
    if (!persistTransactions(nextTransactions, "Transaction deleted.")) return;
    if (editingId === confirm.id) resetForm();
    setConfirm(null);
  }

  function addOrRenameCategory(event) {
    event.preventDefault();
    const value = categoryDraft.trim();
    if (!value) return;
    if (categories.some((item) => item.toLowerCase() === value.toLowerCase() && item !== editingCategory)) {
      setToast("That category already exists.");
      return;
    }
    if (editingCategory) {
      setCategories((items) => items.map((item) => item === editingCategory ? value : item));
      const nextTransactions = transactions.map((item) => item.category === editingCategory ? { ...item, category: value } : item);
      if (nextTransactions.some((item, index) => item !== transactions[index])) {
        persistTransactions(nextTransactions, "Category and transactions updated.");
      } else {
        setToast("Category updated.");
      }
      if (form.category === editingCategory) setForm((current) => ({ ...current, category: value }));
    } else {
      setCategories((items) => [...items, value]);
      setToast("Category added.");
    }
    setCategoryDraft("");
    setEditingCategory(null);
  }

  function deleteCategory(category) {
    if (transactions.some((item) => item.category === category)) {
      setToast("This category is used by a transaction. Edit those transactions first.");
      return;
    }
    setConfirm({ kind: "category", label: category });
  }

  function applyImportedData(data) {
    if (!persistTransactions(data.transactions, "Backup restored successfully.")) return;
    if (data.categories) setCategories(data.categories);
    setPendingImport(null);
    setConfirm(null);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ transactions, categories }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "expense-tracker-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Your backup has been downloaded.");
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.transactions) || !parsed.transactions.every((item) =>
          typeof item.id === "string" && Number.isFinite(item.amount) && (item.type === "Income" || item.type === "Expense") &&
          typeof item.date === "string" && typeof item.description === "string" && typeof item.category === "string")) {
          throw new Error("The backup file has an invalid format.");
        }
        const importedData = {
          transactions: parsed.transactions,
          categories: Array.isArray(parsed.categories) && parsed.categories.every((item) => typeof item === "string")
            ? parsed.categories
            : null,
        };
        if (transactions.length) {
          setPendingImport(importedData);
          setConfirm({ kind: "import", label: file.name });
        } else {
          applyImportedData(importedData);
        }
      } catch (error) {
        console.error("Unable to import backup.", error);
        setToast(error instanceof Error ? error.message : "Could not read the backup file.");
      }
      event.target.value = "";
    };
    reader.onerror = () => setToast("Could not read the selected backup file.");
    reader.readAsText(file);
  }

  function replaceWithDemoData() {
    if (!persistTransactions(DEMO_TRANSACTIONS.map((transaction) => ({ ...transaction })), "Demo data loaded successfully.")) return;
    setCategories((current) => [...new Set([...current, ...DEMO_CATEGORIES])]);
    setConfirm(null);
  }

  function requestDemoData() {
    if (transactions.length) {
      setConfirm({ kind: "demo" });
      return;
    }
    replaceWithDemoData();
  }

  const activeTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate("Dashboard"); }}>
          <span className="brand-icon"><Wallet size={19} strokeWidth={2.2} /></span>
          <span>ExpenseTracker</span>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => navigate(id)}>
              <Icon size={17} strokeWidth={1.9} /><span>{id}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><ShieldCheck size={16} /></span>
            <span><strong>Your data stays yours.</strong><small>Stored securely on this device.</small></span>
          </div>
          <button className="profile-button" onClick={() => navigate("Settings")}>
            <span className="avatar">JD</span>
            <span className="profile-copy"><strong>My account</strong><small>Personal workspace</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <main className="main-area">
        <header className="mobile-header">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <span className="brand-icon"><Wallet size={18} /></span><strong>ExpenseTracker</strong>
          <button className="icon-button mobile-add" aria-label="Add transaction" onClick={() => navigate("Add Transaction")}><Plus size={19} /></button>
        </header>

        {page === "Dashboard" ? (
          <div className="dashboard-layout">
            <section className="dashboard-content">
              <header className="page-header">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR MONEY, IN FOCUS</div>
                  <h1>Good morning<span className="heading-period">.</span></h1>
                  <p>Here’s your financial summary at a glance.</p>
                </div>
                <div className="header-controls">
                  <span className="today-date"><CalendarDays size={14} />{dashboardDate}</span>
                  <label className="range-select">
                    <CalendarDays size={15} />
                    <select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value)}>
                      <option value="six">Last 6 months</option>
                      <option value="year">This year</option>
                      <option value="all">All time</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                  <button className="button button-primary dashboard-add" onClick={() => navigate("Add Transaction")}><Plus size={16} /> Add Transaction</button>
                </div>
              </header>

              <section className="summary-grid" aria-label="Financial summary">
                <SummaryCard title="Total Income" amount={income} hint="Money received in this period" type="income" icon={<ArrowUpRight size={19} />} />
                <SummaryCard title="Total Expenses" amount={expenses} hint="Money spent in this period" type="expense" icon={<ArrowDownRight size={19} />} />
                <SummaryCard title="Net Savings" amount={savings} hint={income ? `${savingRate}% savings rate` : "Income minus expenses"} type="savings" icon={<Wallet size={18} />} />
              </section>

              <section className="charts-grid">
                <article className="card chart-card">
                  <div className="card-heading">
                    <div><h2>Income vs Expenses</h2><p>Your monthly cash flow</p></div>
                    <span className="chart-menu"><span>•••</span></span>
                  </div>
                  <div className="chart-legend">
                    <span><i className="legend-dot income-dot" />Income</span>
                    <span><i className="legend-dot expense-dot" />Expenses</span>
                  </div>
                  {filteredTransactions.length ? (
                    <div className="bar-chart-wrap">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 3, right: 3, left: -19, bottom: 0 }} barGap={3}>
                          <CartesianGrid vertical={false} stroke="#edf1f6" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8290a4", fontSize: 10 }} dy={7} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1adbd", fontSize: 9 }} tickFormatter={(value) => value === 0 ? "0" : `${Math.round(value / 1000)}k`} />
                          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: "1px solid #e3eaf3", borderRadius: 9, fontSize: 12 }} />
                          <Bar dataKey="Income" fill="#35b987" radius={[3, 3, 0, 0]} maxBarSize={12} />
                          <Bar dataKey="Expenses" fill="#f17477" radius={[3, 3, 0, 0]} maxBarSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState title="Your cash flow will appear here" >Add a transaction to get started.</EmptyState>}
                </article>
                <article className="card chart-card breakdown-card">
                  <div className="card-heading">
                    <div><h2>Expense breakdown</h2><p>Where your money goes</p></div>
                    <span className="chart-menu"><span>•••</span></span>
                  </div>
                  {breakdown.length ? (
                    <div className="donut-layout">
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="91%" paddingAngle={2} stroke="none">
                              {breakdown.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: "1px solid #e3eaf3", borderRadius: 9, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center"><strong>{formatCurrency(expenses)}</strong><span>total spent</span></div>
                      </div>
                      <div className="breakdown-legend">
                        {breakdown.slice(0, 5).map((item, index) => (
                          <button className="breakdown-row breakdown-button" key={item.name} title={`View ${item.name} transactions`} onClick={() => { setSearch(""); setFilterType("All"); setFilterCategory(item.name); navigate("Transactions"); }}>
                            <span className="breakdown-name"><i style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name}</span>
                            <span className="breakdown-percent">{expenses ? Math.round(item.value / expenses * 100) : 0}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : <EmptyState title="Nothing spent just yet" >Your spending categories will show up here.</EmptyState>}
                </article>
              </section>

              <section className="card insight-card">
                <span className="insight-icon"><TrendingUp size={18} /></span>
                <div className="insight-copy">
                  <span className="insight-kicker">SPENDING INSIGHT</span>
                  {spendingInsight ? (
                    <>
                      <strong>{spendingInsight.name} is your top expense category</strong>
                      <p>{formatCurrency(spendingInsight.value)} of spending · {expenses ? Math.round(spendingInsight.value / expenses * 100) : 0}% of your expenses this period.</p>
                    </>
                  ) : (
                    <>
                      <strong>Your spending insights will appear here</strong>
                      <p>Start with a transaction or explore the dashboard using realistic demo data.</p>
                    </>
                  )}
                </div>
                {spendingInsight
                  ? <button className="button button-secondary insight-action" onClick={() => { setSearch(""); setFilterType("All"); setFilterCategory(spendingInsight.name); navigate("Transactions"); }}>View transactions</button>
                  : <button className="button button-secondary insight-action" onClick={requestDemoData}><Plus size={14} /> Load Demo Data</button>}
              </section>

              <TransactionTable
                title="Recent transactions"
                transactions={activeTransactions}
                onEdit={startEdit}
                onDelete={(item) => setConfirm({ kind: "transaction", id: item.id, label: item.description })}
                onViewAll={() => navigate("Transactions")}
              />
              <footer className="page-footer"><span>Made for a clearer view of your finances.</span><span><CircleHelp size={13} /> Your data never leaves this device</span></footer>
            </section>
          </div>
        ) : page === "Add Transaction" ? (
          <section id="add-transaction-page" className="page-view transaction-page">
            <div className="breadcrumbs">
              <button onClick={() => navigate("Dashboard")}>Dashboard</button><span>/</span><strong>{editingId ? "Edit transaction" : "Add transaction"}</strong>
            </div>
            <PageIntro
              eyebrow="RECORD A TRANSACTION"
              title={editingId ? "Edit transaction" : "Add a new transaction"}
              subtitle={editingId ? "Update the details and keep your records accurate." : "A quick, clear record of money in or money out."}
            />
            {saveNotice && (
              <div className="save-notice" role="status">
                <span className="toast-check"><Check size={15} /></span>
                <div><strong>{saveNotice.updated ? "Changes saved" : "Transaction saved"}</strong><span>Your transaction is stored on this device.</span></div>
                <div className="save-notice-actions">
                  <button className="button button-secondary" onClick={() => navigate("Dashboard")}>Go to Dashboard</button>
                  {!saveNotice.updated && <button className="button button-primary" onClick={() => setSaveNotice(null)}>Add another</button>}
                </div>
              </div>
            )}
            <div className="entry-layout">
              <TransactionForm
                type={type}
                setType={changeTransactionType}
                form={form}
                setForm={setForm}
                errors={errors}
                categories={categoryOptions}
                editing={Boolean(editingId)}
                isSaving={isSaving}
                onSubmit={saveTransaction}
                onCancel={() => { resetForm(); navigate("Dashboard"); }}
              />
              <TransactionPreview type={type} form={form} summary={{ income, expenses, savings }} editing={Boolean(editingId)} />
            </div>
          </section>
        ) : (
          <section className="page-view">
            {page === "Transactions" && (
              <>
                <PageIntro eyebrow="YOUR ACTIVITY" title="Transactions" subtitle="Every deposit and purchase, all in one place." action={<button className="button button-primary" onClick={() => navigate("Add Transaction")}><Plus size={16} /> Add transaction</button>} />
                <div className="card all-transactions-card">
                  <div className="table-tools">
                    <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions..." /></label>
                    <label className="filter-select"><ListFilter size={15} /><select aria-label="Filter by type" value={filterType} onChange={(event) => setFilterType(event.target.value)}><option>All</option><option>Income</option><option>Expense</option></select><ChevronDown size={13} /></label>
                    <label className="filter-select"><Tags size={15} /><select aria-label="Filter by category" value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={13} /></label>
                  </div>
                  <TransactionTable
                    transactions={txSearchResults}
                    onEdit={startEdit}
                    onDelete={(item) => setConfirm({ kind: "transaction", id: item.id, label: item.description })}
                    compact={false}
                  />
                </div>
              </>
            )}
            {page === "Categories" && (
              <>
                <PageIntro eyebrow="YOUR ORGANIZATION" title="Categories" subtitle="Make your spending easier to understand." />
                <div className="category-layout">
                  <article className="card categories-card">
                    <div className="card-heading category-heading"><div><h2>Your categories</h2><p>{categories.length} categories to organize your money</p></div><span className="count-pill">{categories.length}</span></div>
                    <div className="category-list">
                      {categories.map((category, index) => (
                        <div className="category-item" key={category}>
                          <span className="category-symbol" style={{ backgroundColor: `${COLORS[index % COLORS.length]}17`, color: COLORS[index % COLORS.length] }}><Tags size={16} /></span>
                          <span className="category-name">{category}</span>
                          <span className="category-count">{transactions.filter((item) => item.category === category).length} transactions</span>
                          <button className="icon-button" aria-label={`Edit ${category}`} onClick={() => { setEditingCategory(category); setCategoryDraft(category); }}><Pencil size={15} /></button>
                          <button className="icon-button danger-quiet" aria-label={`Delete ${category}`} onClick={() => deleteCategory(category)}><Trash2 size={15} /></button>
                        </div>
                      ))}
                    </div>
                  </article>
                  <form className="card category-form" onSubmit={addOrRenameCategory}>
                    <span className="form-icon"><Tags size={18} /></span>
                    <h2>{editingCategory ? "Edit category" : "Add a category"}</h2>
                    <p>Keep your finances organized your way.</p>
                    <label className="field-label" htmlFor="category-name">Category name</label>
                    <input id="category-name" className="form-control" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="e.g. Health & wellness" required maxLength={32} />
                    <button className="button button-primary full-button" type="submit">{editingCategory ? "Save changes" : "Add category"}</button>
                    {editingCategory && <button type="button" className="text-button" onClick={() => { setEditingCategory(null); setCategoryDraft(""); }}>Cancel editing</button>}
                  </form>
                </div>
              </>
            )}
            {page === "Reports" && (
              <>
                <PageIntro eyebrow="THE BIGGER PICTURE" title="Reports" subtitle="A thoughtful look at your income and spending." action={<label className="range-select report-range"><CalendarDays size={15} /><select aria-label="Report date range" value={range} onChange={(event) => setRange(event.target.value)}><option value="six">Last 6 months</option><option value="year">This year</option><option value="all">All time</option></select><ChevronDown size={13} /></label>} />
                <div className="summary-grid report-summary">
                  <SummaryCard title="Income" amount={income} hint="For this period" type="income" icon={<TrendingUp size={18} />} />
                  <SummaryCard title="Expenses" amount={expenses} hint="For this period" type="expense" icon={<ArrowDownRight size={19} />} />
                  <SummaryCard title="Net savings" amount={savings} hint={income ? `${savingRate}% savings rate` : "For this period"} type="savings" icon={<Wallet size={18} />} />
                </div>
                <article className="card report-chart-card">
                  <div className="card-heading"><div><h2>Income & expenses over time</h2><p>Monthly comparison for the selected period</p></div></div>
                  {filteredTransactions.length ? <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} margin={{ top: 14, right: 14, left: 0, bottom: 3 }} barGap={5}><CartesianGrid vertical={false} stroke="#edf1f6" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8290a4", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1adbd", fontSize: 10 }} tickFormatter={(value) => value === 0 ? "0" : `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: "1px solid #e3eaf3", borderRadius: 9, fontSize: 12 }} /><Bar dataKey="Income" fill="#35b987" radius={[4, 4, 0, 0]} maxBarSize={28} /><Bar dataKey="Expenses" fill="#f17477" radius={[4, 4, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div> : <EmptyState title="Your report is taking shape" >Add transactions to see your monthly trends.</EmptyState>}
                </article>
                <TransactionTable title="Recent activity" transactions={activeTransactions} onEdit={startEdit} onDelete={(item) => setConfirm({ kind: "transaction", id: item.id, label: item.description })} onViewAll={() => navigate("Transactions")} />
              </>
            )}
            {page === "Settings" && (
              <>
                <PageIntro eyebrow="YOUR PREFERENCES" title="Settings" subtitle="Your account, your data, your way." />
                <div className="settings-layout">
                  <article className="card settings-card">
                    <div className="settings-section-head"><span className="settings-icon"><ShieldCheck size={18} /></span><div><h2>Your privacy</h2><p>Transactions are saved only in this browser.</p></div></div>
                    <div className="privacy-note"><span className="privacy-dot" /><span><strong>Local storage is active</strong><small>No account, server, or external service is connected.</small></span></div>
                  </article>
                  <article className="card settings-card">
                    <div className="settings-section-head"><span className="settings-icon blue"><Download size={18} /></span><div><h2>Back up your data</h2><p>Take your transaction history with you.</p></div></div>
                    <div className="settings-actions">
                      <button className="button button-secondary" onClick={exportData}><Download size={16} /> Export backup</button>
                      <label className="button button-secondary upload-button"><Plus size={16} /> Import backup<input type="file" accept=".json,application/json" onChange={importData} /></label>
                    </div>
                  </article>
                  <article className="card settings-card danger-settings">
                    <div className="settings-section-head"><span className="settings-icon red"><Trash2 size={18} /></span><div><h2>Clear all data</h2><p>Permanently remove every saved transaction.</p></div></div>
                    <button className="button button-danger" onClick={() => setConfirm({ kind: "clear" })}>Clear all transactions</button>
                  </article>
                  <article className="card settings-card demo-settings">
                    <div className="settings-section-head"><span className="settings-icon amber"><TrendingUp size={18} /></span><div><h2>Explore demo data</h2><p>Preview the dashboard with 30 realistic example transactions.</p></div></div>
                    <button className="button button-secondary" onClick={requestDemoData}><Plus size={16} /> Load Demo Data</button>
                  </article>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {toast && <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
      {confirm && <ConfirmDialog
        title={confirm.kind === "clear"
          ? "Clear all transactions?"
          : confirm.kind === "demo"
            ? "Replace existing transactions?"
            : confirm.kind === "import"
              ? "Replace existing data?"
              : confirm.kind === "category"
                ? "Delete this category?"
                : "Delete this transaction?"}
        message={confirm.kind === "clear"
          ? "This will permanently remove all saved transactions from this device. This action cannot be undone."
          : confirm.kind === "demo"
            ? "Loading demo data will replace your current transactions with the example dataset. You can export a backup first in Settings."
            : confirm.kind === "import"
              ? `Importing “${confirm.label}” will replace your current transactions${pendingImport?.categories ? " and categories" : ""}. Export a backup first if you want to keep a copy.`
              : confirm.kind === "category"
                ? `“${confirm.label}” will be removed from your category list.`
                : `“${confirm.label}” will be permanently removed. This action cannot be undone.`}
        confirmLabel={confirm.kind === "clear"
          ? "Clear transactions"
          : confirm.kind === "demo"
            ? "Replace with demo data"
            : confirm.kind === "import"
              ? "Replace with backup"
              : confirm.kind === "category"
                ? "Delete category"
                : "Delete transaction"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.kind === "clear") {
            if (!persistTransactions([], "All transactions have been cleared.")) return;
            resetForm();
            setConfirm(null);
          } else if (confirm.kind === "demo") {
            replaceWithDemoData();
          } else if (confirm.kind === "import") {
            if (pendingImport) applyImportedData(pendingImport);
          } else if (confirm.kind === "category") {
            setCategories((current) => current.filter((category) => category !== confirm.label));
            setConfirm(null);
            setToast("Category deleted.");
          } else deleteTransaction();
        }}
      />}
    </div>
  );
}

function SummaryCard({ title, amount, hint, type, icon }) {
  return (
    <article className={`summary-card ${type}`}>
      <span className="summary-icon">{icon}</span>
      <div className="summary-copy">
        <span className="summary-title">{title}</span>
        <strong className="summary-value">{formatCurrency(amount)}</strong>
        <span className="summary-hint">{hint}</span>
      </div>
    </article>
  );
}

function TransactionForm({ type, setType, form, setForm, errors, categories, editing, isSaving, onSubmit, onCancel }) {
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <form id="transaction-form-panel" className="card entry-form-card" onSubmit={onSubmit} noValidate aria-busy={isSaving}>
      <div className="entry-form-heading">
        <span className="form-icon"><CreditCard size={19} /></span>
        <div><h2>{editing ? "Transaction details" : "Transaction details"}</h2><p>Fields marked with <span aria-hidden="true">*</span> are required.</p></div>
      </div>
      <div className="entry-fields">
        <fieldset className="type-fieldset">
          <legend>Transaction type <span aria-hidden="true">*</span></legend>
          <div className="type-segment">
            {["Income", "Expense"].map((item) => (
              <button type="button" key={item} aria-pressed={type === item} disabled={isSaving} className={`type-option ${type === item ? `selected ${item.toLowerCase()}` : ""}`} onClick={() => setType(item)}>
                {item === "Income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{item}
              </button>
            ))}
          </div>
        </fieldset>
        <FormField label={<>Amount (₹) <span aria-hidden="true">*</span></>} error={errors.amount}>
          <div className={`input-with-prefix entry-amount ${errors.amount ? "invalid" : ""}`}><span>₹</span><input aria-label="Amount" aria-required="true" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={form.amount} disabled={isSaving} onChange={(event) => setField("amount", event.target.value)} /></div>
        </FormField>
        <FormField label={<>Category <span aria-hidden="true">*</span></>} error={errors.category}>
          <div className={`select-control ${errors.category ? "invalid" : ""}`}><Tags size={15} /><select aria-label="Category" aria-required="true" value={form.category} disabled={isSaving} onChange={(event) => setField("category", event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={14} /></div>
        </FormField>
        <FormField label={<>Date <span aria-hidden="true">*</span></>} error={errors.date}>
          <div className={`date-control ${errors.date ? "invalid" : ""}`}><input aria-label="Date" aria-required="true" type="date" value={form.date} disabled={isSaving} onChange={(event) => setField("date", event.target.value)} /><CalendarDays size={15} /></div>
        </FormField>
        <FormField label="Description" error={errors.description}>
          <textarea className="form-control description-control" aria-label="Description (optional)" value={form.description} disabled={isSaving} onChange={(event) => setField("description", event.target.value)} placeholder="e.g. Monthly salary, groceries, or dinner with friends" rows={3} maxLength={120} />
        </FormField>
      </div>
      <div className="entry-form-actions">
        <button type="button" className="button button-secondary" disabled={isSaving} onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={isSaving}>{isSaving ? "Saving..." : editing ? "Save changes" : "Save Transaction"}</button>
      </div>
    </form>
  );
}

function TransactionPreview({ type, form, summary, editing }) {
  const amount = Number(form.amount);
  const displayAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return (
    <aside className="entry-side-column">
      <article className={`card entry-preview ${type.toLowerCase()}`}>
        <div className="preview-heading">
          <span className={`preview-icon ${type.toLowerCase()}`}>{type === "Income" ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}</span>
          <div><span>TRANSACTION PREVIEW</span><strong>{editing ? "Updated entry" : "New entry"}</strong></div>
        </div>
        <span className="preview-amount">{type === "Income" ? "+" : "−"}{formatCurrency(displayAmount)}</span>
        <span className="preview-type">{type} · {form.category || "Choose a category"}</span>
        <div className="preview-divider" />
        <div className="preview-detail"><span>Date</span><strong>{form.date ? formatDate(form.date) : "Select a date"}</strong></div>
        <div className="preview-detail"><span>Description</span><strong className="preview-description">{form.description.trim() || "No description added"}</strong></div>
      </article>
      <article className="card entry-balance-card">
        <div className="balance-heading"><span className="settings-icon blue"><Wallet size={17} /></span><div><h2>Your current overview</h2><p>For the selected date range</p></div></div>
        <div className="balance-row"><span>Total income</span><strong className="amount-income">{formatCurrency(summary.income)}</strong></div>
        <div className="balance-row"><span>Total expenses</span><strong className="amount-expense">{formatCurrency(summary.expenses)}</strong></div>
        <div className="balance-row balance-total"><span>Net savings</span><strong>{formatCurrency(summary.savings)}</strong></div>
        <p className="balance-note">Your dashboard and reports recalculate as soon as this transaction is saved.</p>
      </article>
    </aside>
  );
}

function FormField({ label, error, children }) {
  return <div className="form-field"><label className="field-label">{label}</label>{children}{error && <span className="field-error"><X size={12} />{error}</span>}</div>;
}

function TransactionTable({ title, transactions, onEdit, onDelete, onViewAll, compact = true }) {
  return (
    <section className={`card transactions-card ${compact ? "recent-card" : "full-table-card"}`}>
      {title && <div className="table-title-row"><div><h2>{title}</h2>{!compact && <p>{transactions.length} transaction{transactions.length === 1 ? "" : "s"}</p>}</div>{onViewAll && <button className="view-all" onClick={onViewAll}>View all <span>→</span></button>}</div>}
      {transactions.length ? (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th className="amount-cell">Amount</th><th className="action-cell">Actions</th></tr></thead>
            <tbody>{transactions.map((item) => {
              const categoryIndex = Math.max(0, DEFAULT_CATEGORIES.indexOf(item.category));
              const color = COLORS[categoryIndex % COLORS.length];
              return (
                <tr key={item.id}>
                  <td className="date-cell">{formatDate(item.date)}</td>
                  <td className="description-cell"><span>{item.description}</span></td>
                  <td><span className="category-badge" style={{ color, backgroundColor: `${color}15` }}>{item.category}</span></td>
                  <td><span className={`type-badge ${item.type.toLowerCase()}`}>{item.type === "Income" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{item.type}</span></td>
                  <td className={`amount-cell amount-${item.type.toLowerCase()}`}>{item.type === "Income" ? "+" : "−"}{formatCurrency(item.amount)}</td>
                  <td className="action-cell"><div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.description}`} onClick={() => onEdit(item)}><Pencil size={14} /></button><button className="icon-button danger-quiet" aria-label={`Delete ${item.description}`} onClick={() => onDelete(item)}><Trash2 size={14} /></button></div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : <EmptyState title={compact ? "No transactions yet" : "No matching transactions"}>{compact ? "Your recent activity will appear here." : "Try a different search or filter, or add a new transaction."}</EmptyState>}
    </section>
  );
}

function PageIntro({ eyebrow, title, subtitle, action }) {
  return <header className="page-header page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</div><h1>{title}<span className="heading-period">.</span></h1><p>{subtitle}</p></div>{action}</header>;
}

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="modal-close icon-button" aria-label="Close dialog" onClick={onCancel}><X size={17} /></button>
        <span className="confirm-icon"><Trash2 size={21} /></span>
        <h2 id="confirm-title">{title}</h2><p>{message}</p>
        <div className="modal-actions"><button className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-danger" onClick={onConfirm}>{confirmLabel}</button></div>
      </section>
    </div>
  );
}

export default App;
