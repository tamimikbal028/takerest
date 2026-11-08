import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Settings2 } from "lucide-react";
import financeHooks from "@/hooks/useFinance";

interface ExpenseCategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const ExpenseCategorySelector: React.FC<
  ExpenseCategorySelectorProps
> = ({ selectedCategory, onSelectCategory }) => {
  const { categories } = financeHooks.useFinanceCategories();
  const { mutate: createCategory, isPending: isCreating } =
    financeHooks.useCreateFinanceCategory();
  const { mutate: updateCategory, isPending: isUpdating } =
    financeHooks.useUpdateFinanceCategory();
  const { mutate: deleteCategory, isPending: isDeleting } =
    financeHooks.useDeleteFinanceCategory();

  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isManaging, setIsManaging] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Ensure current selectedCategory is shown even if it's from an old record not in list
  const displayCategories =
    selectedCategory && !categories.includes(selectedCategory)
      ? [selectedCategory, ...categories]
      : categories;

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    createCategory(trimmed, {
      onSuccess: (res) => {
        onSelectCategory(res.data.category);
        setNewCategoryName("");
        setIsAdding(false);
      },
    });
  };

  const handleStartEdit = (cat: string) => {
    setEditingCat(cat);
    setEditingValue(cat);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCat(null);
      return;
    }

    updateCategory(
      { oldName, newName: trimmed },
      {
        onSuccess: (res) => {
          if (selectedCategory === oldName) {
            onSelectCategory(res.data.category);
          }
          setEditingCat(null);
        },
      }
    );
  };

  const handleDelete = (cat: string) => {
    deleteCategory(cat, {
      onSuccess: (res) => {
        if (selectedCategory === cat && res.data.categories.length > 0) {
          onSelectCategory(res.data.categories[0]);
        }
      },
    });
  };

  return (
    <div className="space-y-2">
      {/* Header with Add & Manage actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-gray-700">
          কী কাজে খরচ হলো? (Category) *
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsAdding((prev) => !prev);
              setIsManaging(false);
              setEditingCat(null);
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
              isAdding
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-3 w-3" />
            <span>নতুন যোগ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsManaging((prev) => !prev);
              setIsAdding(false);
              setEditingCat(null);
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
              isManaging
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Settings2 className="h-3 w-3" />
            <span>{isManaging ? "ডান (Done)" : "এডিট / ডিলিট"}</span>
          </button>
        </div>
      </div>

      {/* Inline Add New Category Box */}
      {isAdding && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="নতুন খাতের নাম লিখুন (যেমন: রিকশা ভাড়া)..."
            className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500"
            autoFocus
          />
          <button
            type="button"
            disabled={isCreating || !newCategoryName.trim()}
            onClick={handleAddCategory}
            className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            যোগ করুন
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewCategoryName("");
            }}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
        {displayCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const isEditingThis = editingCat === cat;

          if (isManaging && isEditingThis) {
            return (
              <div
                key={cat}
                className="col-span-2 flex items-center gap-1 rounded-xl border border-blue-400 bg-blue-50/40 p-1.5 sm:col-span-3"
              >
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEdit(cat);
                    } else if (e.key === "Escape") {
                      setEditingCat(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleSaveEdit(cat)}
                  className="cursor-pointer rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                  title="Save"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="cursor-pointer rounded-lg bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          if (isManaging) {
            return (
              <div
                key={cat}
                className="flex items-center justify-between gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2"
              >
                <span className="truncate text-[11px] font-bold text-gray-800">
                  {cat}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="cursor-pointer rounded-md p-1 text-gray-500 transition hover:bg-blue-100 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting || categories.length <= 1}
                    onClick={() => handleDelete(cat)}
                    className="cursor-pointer rounded-md p-1 text-gray-500 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`flex cursor-pointer items-center justify-center rounded-xl border px-2.5 py-2 text-center transition-all ${
                isSelected
                  ? "border-gray-900 bg-gray-900 text-white shadow-xs"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="truncate text-xs font-bold">{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

