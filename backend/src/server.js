import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { readStore, updateStore } from "./storage.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "1mb" }));

function isValidTransaction(transaction) {
  if (typeof transaction?.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) return false;
  const [year, month, day] = transaction.date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return transaction !== null &&
    typeof transaction === "object" &&
    !Array.isArray(transaction) &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0 &&
    (transaction.type === "Income" || transaction.type === "Expense") &&
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day &&
    typeof transaction.description === "string" &&
    typeof transaction.category === "string" &&
    transaction.category.trim().length > 0;
}

function isValidCategory(category) {
  return typeof category === "string" && category.trim().length > 0 && category.trim().length <= 50;
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/transactions", (_request, response) => {
  response.json(readStore().transactions);
});

app.post("/api/transactions", (request, response) => {
  if (!isValidTransaction(request.body)) {
    return response.status(400).json({ error: "Provide a valid transaction with a positive amount, date, type, category, and description." });
  }

  const transaction = { ...request.body, id: randomUUID() };
  updateStore((store) => ({ ...store, transactions: [transaction, ...store.transactions] }));
  return response.status(201).json(transaction);
});

app.put("/api/transactions/:id", (request, response) => {
  if (!isValidTransaction(request.body)) {
    return response.status(400).json({ error: "Provide a valid transaction with a positive amount, date, type, category, and description." });
  }

  let updatedTransaction;
  const store = updateStore((current) => {
    if (!current.transactions.some((item) => item.id === request.params.id)) return current;
    updatedTransaction = { ...request.body, id: request.params.id };
    return {
      ...current,
      transactions: current.transactions.map((item) => item.id === request.params.id ? updatedTransaction : item),
    };
  });
  if (!updatedTransaction) return response.status(404).json({ error: "Transaction not found." });
  return response.json(updatedTransaction);
});

app.delete("/api/transactions/:id", (request, response) => {
  let deleted = false;
  updateStore((store) => {
    const transactions = store.transactions.filter((item) => item.id !== request.params.id);
    deleted = transactions.length !== store.transactions.length;
    return { ...store, transactions };
  });
  if (!deleted) return response.status(404).json({ error: "Transaction not found." });
  return response.status(204).end();
});

app.get("/api/categories", (_request, response) => {
  response.json(readStore().categories);
});

app.post("/api/categories", (request, response) => {
  const category = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  if (!isValidCategory(category)) {
    return response.status(400).json({ error: "Category name must contain 1 to 50 characters." });
  }

  let created = false;
  const store = updateStore((current) => {
    if (current.categories.some((item) => item.toLowerCase() === category.toLowerCase())) return current;
    created = true;
    return { ...current, categories: [...current.categories, category] };
  });
  if (!created) return response.status(409).json({ error: "That category already exists." });
  return response.status(201).json({ name: category, categories: store.categories });
});

app.put("/api/categories/:name", (request, response) => {
  const oldName = request.params.name;
  const newName = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  if (!isValidCategory(newName)) {
    return response.status(400).json({ error: "Category name must contain 1 to 50 characters." });
  }

  let updated = false;
  const store = updateStore((current) => {
    if (!current.categories.includes(oldName)) return current;
    if (current.categories.some((item) => item.toLowerCase() === newName.toLowerCase() && item !== oldName)) return current;
    updated = true;
    return {
      categories: current.categories.map((item) => item === oldName ? newName : item),
      transactions: current.transactions.map((item) => item.category === oldName ? { ...item, category: newName } : item),
    };
  });
  if (!updated) {
    const exists = store.categories.includes(oldName);
    return response.status(exists ? 409 : 404).json({ error: exists ? "That category already exists." : "Category not found." });
  }
  return response.json({ name: newName, categories: store.categories });
});

app.delete("/api/categories/:name", (request, response) => {
  let result = "missing";
  updateStore((store) => {
    if (!store.categories.includes(request.params.name)) return store;
    if (store.transactions.some((item) => item.category === request.params.name)) {
      result = "in-use";
      return store;
    }
    result = "deleted";
    return { ...store, categories: store.categories.filter((item) => item !== request.params.name) };
  });
  if (result === "missing") return response.status(404).json({ error: "Category not found." });
  if (result === "in-use") return response.status(409).json({ error: "Category is used by a transaction." });
  return response.status(204).end();
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "Request body must contain valid JSON." });
  }
  console.error("API request failed.", error);
  return response.status(500).json({ error: "Internal server error." });
});

app.listen(port, () => {
  console.log(`ExpenseTracker API listening on http://localhost:${port}`);
});
