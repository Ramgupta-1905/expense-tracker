# CodeNova Expense Tracker

A modern, responsive expense tracking application built to help users manage their income and expenses, organize transactions by category, and monitor their overall financial activity through an intuitive dashboard.

## 🚀 Features

- **Dashboard Overview** — View total income, total expenses, and net savings at a glance.
- **Transaction Management** — Add, view, and delete income and expense transactions.
- **Category Organization** — Organize transactions using categories such as Food, Travel, Shopping, Education, Salary, and Entertainment.
- **Transaction History** — Browse transaction records with details including title, amount, date, type, and category.
- **Financial Summaries** — Understand spending patterns through summaries and visual charts.
- **Sample Data** — Explore the application with preloaded demo transactions instead of an empty dashboard.
- **Data Persistence** — Preserve transactions using browser local storage.
- **Input Validation** — Validate transaction details and amounts before saving.
- **Responsive Design** — Use the application across desktop, tablet, and mobile devices.
- **Indian Currency Support** — Display financial amounts in Indian Rupees (₹).

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Charting library (if included in the project)

### Storage
- Browser Local Storage

## 📂 Project Structure

```text
codenova-expense-tracker/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   └── AddTransaction.jsx
│   ├── data/
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

*Note: The structure above is illustrative. Adjust the filenames and folders to match the actual project.*

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/codenova-expense-tracker.git
```

**2. Navigate to the project directory**

```bash
cd codenova-expense-tracker
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the application**

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 📊 How It Works

1. Open the dashboard to review your income, expenses, and net savings.
2. Navigate to the Add Transaction page to record a new transaction.
3. Enter the transaction title, amount, type, category, and date.
4. Save the transaction to update the dashboard and transaction history.
5. Browse existing transactions and delete records when needed.
6. Review financial summaries and charts to understand your spending activity.

## 💾 Data Storage

This version uses **browser Local Storage** to persist transaction data between page refreshes in the same browser.

- No database setup is required.
- No backend server is required for this frontend-only implementation.
- Data is stored locally in the browser and is not automatically synchronized across devices.
- Clearing browser storage may remove saved transactions.

## 🎯 Internship Task

This project was developed as part of the **CodeNova Full Stack Development Internship Program — Task 2: Expense Tracker**.

The project focuses on transaction management, financial summaries, data validation, persistent storage, and responsive user interface design.

## 🔮 Future Improvements

- Integrate a backend API and database.
- Add user authentication and individual financial accounts.
- Support transaction editing and advanced filtering.
- Export transaction history to CSV.
- Introduce monthly budgets and spending limits.
- Add recurring transactions and budget alerts.

## 👨‍💻 Author

**Ram Gupta**

- GitHub: https://github.com/Ramgupta-1905
---

⭐ If you find this project useful, consider giving the repository a star.
