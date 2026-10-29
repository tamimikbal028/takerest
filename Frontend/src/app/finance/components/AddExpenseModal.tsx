import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Coins,
  Calendar,
  Clock,
  Tag,
  FileText,
  CreditCard,
  Sparkles,
} from "lucide-react";
import type { CreateFinancePayload } from "@/types";
import {
  EXPENSE_CATEGORIES,
  FINANCE_CATEGORY_COLORS,
} from "@/services/supabase/finance.supabase";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateFinancePayload) => void;
  isPending: boolean;
  initialDate?: string;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

const COMMON_EXPENSE_PRESETS = [
  "চা ও নাস্তা",
  "রিকশা ভাড়া",
  "দুপুরের খাবার (Lunch)",
  "বাস / যাতায়াত ভাড়া",
  "কাঁচাবাজার ও সদাই",
  "মোবাইল রিচার্জ",
  "রাতের ডিনার",
  "ঔষধ ক্রয়",
  "চা ও রিফ্রেশমেন্ট",
];

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank Transfer", "Card"];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialDate,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleQuickAddAmount = (add: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + add));
  };

  const handleSelectPreset = (preset: string) => {
    setTitle(preset);
    // Auto-suggest category if matches
    if (preset.includes("চা") || preset.includes("নাস্তা")) {
      setCategory("চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)");
    } else if (preset.includes("ভাড়া") || preset.includes("রিকশা") || preset.includes("বাস")) {
      setCategory("যাতায়াত ও ভাড়া (Transport / Commute)");
    } else if (preset.includes("খাবার") || preset.includes("Lunch") || preset.includes("ডিনার")) {
      setCategory("খাবার ও নাস্তা (Food & Snacks)");
    } else if (preset.includes("বাজার") || preset.includes("সদাই")) {
      setCategory("বাজার ও মুদি (Groceries & Bazar)");
    } else if (preset.includes("রিচার্জ")) {
      setCategory("মোবাইল রিচার্জ ও নেট (Mobile & Net)");
    } else if (preset.includes("ঔষধ")) {
      setCategory("ঔষধ ও চিকিৎসা (Medicine & Health)");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSubmit({
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
        {/* Header */}
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                খরচের হিসাব যোগ করুন
              </h2>
              <p className="text-xs font-medium text-gray-400">
                কখন, কত টাকা এবং কী কাজে খরচ করলেন লিখে রাখুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {/* 1. Amount Input Card */}
            <div className="rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50/60 to-orange-50/30 p-4 transition-all focus-within:border-amber-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-amber-500/15">
              <label className="block text-xs font-bold text-amber-900 uppercase">
                কত টাকা খরচ করলেন? (Amount in ৳) *
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-black text-amber-600 sm:text-3xl">৳</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-black tracking-tight text-gray-900 outline-none sm:text-3xl"
                  autoFocus
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/50">
                <span className="text-[11px] font-semibold text-amber-800">দ্রুত যোগ করুন:</span>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAddAmount(amt)}
                    className="cursor-pointer rounded-lg border border-amber-200 bg-white px-2 py-0.5 text-xs font-bold text-gray-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 active:scale-95"
                  >
                    +৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Date & Time Row - PROMINENT: KUNDIN & KOKHN */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  কোন দিন খরচ করেছেন? (Date) *
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
                  কখন খরচ করেছেন? (Exact Time) *
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

            {/* 3. Title / Purpose */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                কী কাজে খরচ হলো? (Purpose / Description) *
              </label>
              <div className="relative flex items-center">
                <Tag className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: দুপুরের লাঞ্চ, রিকশা ভাড়া, চা-বিস্কুট..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 py-2.5 pr-3.5 pl-10 text-xs font-semibold text-gray-800 transition focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMMON_EXPENSE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Category Selector */}
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

            {/* 5. Payment Method */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                কীভাবে দিলেন? (Payment Method)
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

            {/* 6. Notes (Optional) */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                অতিরিক্ত নোট (Optional)
              </label>
              <div className="relative flex items-start">
                <FileText className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-gray-400" />
                <textarea
                  rows={2}
                  placeholder="কোনো বিশেষ মন্তব্য বা বিস্তারিত..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 py-2.5 pr-3 pl-10 text-xs font-medium text-gray-800 transition focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>খরচ যোগ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
