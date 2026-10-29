import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Edit2,
  Calendar,
  Clock,
  Tag,
  FileText,
  CreditCard,
  Sparkles,
} from "lucide-react";
import type { FinanceTransaction, UpdateFinancePayload } from "@/types";
import {
  EXPENSE_CATEGORIES,
  FINANCE_CATEGORY_COLORS,
} from "@/services/supabase/finance.supabase";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateFinancePayload) => void;
  isPending: boolean;
  transaction: FinanceTransaction | null;
}

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank Transfer", "Card"];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  transaction,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setPaymentMethod(transaction.payment_method || "Cash");
      setDate(transaction.date);
      setTime(transaction.time || "");
      setNotes(transaction.notes || "");
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSubmit({
      id: transaction.id,
      title: title.trim(),
      amount: numAmount,
      type: "EXPENSE",
      category,
      payment_method: paymentMethod,
      date,
      time,
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-xs duration-200 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                খরচের তথ্য সম্পাদনা করুন
              </h2>
              <p className="text-xs font-medium text-gray-400">
                Edit expense details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase">
                টাকার পরিমাণ (Amount in ৳) *
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-black text-gray-400">৳</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-black text-gray-900 outline-none sm:text-3xl"
                />
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  তারিখ (Date)
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-blue-600" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-2.5 pl-9 text-xs font-bold text-gray-800 transition focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  সময় (Exact Time)
                </label>
                <div className="relative flex items-center">
                  <Clock className="pointer-events-none absolute left-3 h-4 w-4 text-amber-600" />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-2.5 pl-9 text-xs font-bold text-gray-800 transition focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                কী কাজে খরচ হলো? (Description) *
              </label>
              <div className="relative flex items-center">
                <Tag className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 py-2.5 pr-3.5 pl-10 text-xs font-semibold text-gray-800 transition focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                খরচের খাত (Category) *
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 max-h-40 overflow-y-auto pr-1">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  const color = FINANCE_CATEGORY_COLORS[cat] || "#64748B";
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-[11px] font-bold text-gray-800">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                Payment Method
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-600 text-white shadow-xs"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <CreditCard className="h-3 w-3" />
                      <span>{method}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                নোট (Optional)
              </label>
              <div className="relative flex items-start">
                <FileText className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-gray-400" />
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 py-2.5 pr-3 pl-10 text-xs font-medium text-gray-800 transition focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !amount}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isPending ? "আপডেট হচ্ছে..." : "আপডেট নিশ্চিত করুন"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
