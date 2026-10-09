import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { Category, Activity } from "@/types";

const COLOR_PALETTE = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

const ActivitiesPage = () => {
  const { categories, isLoading } = trackerHooks.useCategories();
  const { mutateAsync: createCategory, isPending: isCreatingCat } =
    trackerHooks.useCreateCategory();
  const { mutate: updateCategory } = trackerHooks.useUpdateCategory();
  const { mutate: deleteCategory } = trackerHooks.useDeleteCategory();

  const { mutate: createActivity, isPending: isCreatingAct } =
    trackerHooks.useCreateActivity();
  const { mutate: updateActivity, isPending: isUpdatingAct } =
    trackerHooks.useUpdateActivity();
  const { mutate: deleteActivity } = trackerHooks.useDeleteActivity();

  // Active Category Filter
  const [selectedFilterCategory, setSelectedFilterCategory] =
    useState<string>("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<{
    activity: Activity;
    categoryId: string;
  } | null>(null);

  // Edit Category Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState<string>("");
  const [editCategoryColor, setEditCategoryColor] = useState<string>("#3B82F6");

  // Create Activity Form state
  const [activityName, setActivityName] = useState<string>("");
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">(
    "existing"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>("#3B82F6");

  // Open Create Modal
  const handleOpenCreateModal = (prefillCategoryId?: string) => {
    setActivityName("");
    setCategoryMode("existing");
    const defaultCat = prefillCategoryId || categories[0]?.id || "";
    setSelectedCategoryId(defaultCat);
    setNewCategoryName("");
    setNewCategoryColor("#3B82F6");
    setIsCreateModalOpen(true);
  };

  // Submit Create Activity (handles inline category creation if chosen!)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) return;

    try {
      let finalCategoryId = selectedCategoryId;

      // If user wants to create a brand new category on the fly
      if (categoryMode === "new") {
        if (!newCategoryName.trim()) return;
        const catRes = await createCategory({
          name: newCategoryName.trim(),
          color: newCategoryColor,
        });
        finalCategoryId = catRes.data.category.id;
      }

      if (!finalCategoryId) return;

      createActivity(
        {
          name: activityName.trim(),
          category_id: finalCategoryId,
        },
        {
          onSuccess: () => {
            setIsCreateModalOpen(false);
            setActivityName("");
            setNewCategoryName("");
          },
        }
      );
    } catch (err) {
      console.error("Error creating activity with category:", err);
    }
  };

  // Edit Activity Submit
  const handleEditActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !activityName.trim() || !selectedCategoryId) return;

    updateActivity(
      {
        id: editingActivity.activity.id,
        data: {
          name: activityName.trim(),
          category_id: selectedCategoryId,
        },
      },
      {
        onSuccess: () => {
          setEditingActivity(null);
          setActivityName("");
        },
      }
    );
  };

  // Edit Category Submit
  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    updateCategory(
      {
        id: editingCategory.id,
        data: {
          name: editCategoryName.trim(),
          color: editCategoryColor,
        },
      },
      {
        onSuccess: () => {
          setEditingCategory(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">
          Loading activities...
        </p>
      </div>
    );
  }

  // Calculate total activities count across all categories
  const totalActivitiesCount = categories.reduce(
    (acc, cat) => acc + (cat.activities?.length || 0),
    0
  );

  // Filter categories
  const filteredCategories =
    selectedFilterCategory === "ALL"
      ? categories
      : categories.filter((c) => c.id === selectedFilterCategory);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Activities
            </h1>
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Create and organize all the tasks and routines you track daily.
          </p>
        </div>

        {/* Primary Action Button: Create Activity */}
        <button
          onClick={() => handleOpenCreateModal()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create Activity</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedFilterCategory("ALL")}
          className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            selectedFilterCategory === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          All ({totalActivitiesCount})
        </button>

        {categories.map((cat) => {
          const count = cat.activities?.length || 0;
          const isSelected = selectedFilterCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedFilterCategory(cat.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? "bg-gray-900 text-white shadow-xs"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Activities Display (Grouped by Category) */}
      <div className="space-y-5">
        {filteredCategories.map((cat) => {
          const activities = cat.activities || [];
          const isProtected = Boolean(
            cat.is_system_default || cat.name?.trim().toLowerCase() === "study"
          );

          return (
            <div
              key={cat.id}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs sm:p-6"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h2 className="text-base font-bold text-gray-900">
                    {cat.name}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                    {activities.length}{" "}
                    {activities.length === 1 ? "activity" : "activities"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {!isProtected ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                          setEditCategoryColor(cat.color);
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                        title="Edit Category Name / Color"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete category "${cat.name}" and all its activities?`
                            )
                          ) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span
                      className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 select-none"
                      title="Study category cannot be edited or deleted"
                    >
                      Permanent
                    </span>
                  )}
                </div>
              </div>

              {/* Activities Grid */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs transition hover:border-gray-300 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate text-xs font-bold text-gray-900">
                        {act.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingActivity({
                            activity: act,
                            categoryId: cat.id,
                          });
                          setActivityName(act.name);
                          setSelectedCategoryId(cat.id);
                        }}
                        className="cursor-pointer rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                        title="Edit Activity"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete activity "${act.name}"?`)) {
                            deleteActivity(act.id);
                          }
                        }}
                        className="cursor-pointer rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Delete Activity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Inline Add Button under this category */}
                <button
                  onClick={() => handleOpenCreateModal(cat.id)}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-3.5 text-xs font-bold text-gray-500 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to {cat.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE ACTIVITY (with inline Category assignment/creation) */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Create Activity</h3>
            <p className="mt-1 text-xs text-gray-500">
              Add a new task and assign it to an existing category, or create a
              new category right here.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {/* Activity Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="e.g. Namaz, Talimuddin, Web Course, Math"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Category Assignment Section */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
                <div className="flex items-center justify-between pb-2">
                  <label className="text-xs font-bold text-gray-800">
                    Category Assignment
                  </label>

                  {/* Mode switcher: Select Existing vs New */}
                  <div className="flex rounded-lg bg-gray-200 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCategoryMode("existing")}
                      className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                        categoryMode === "existing"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryMode("new")}
                      className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                        categoryMode === "new"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      New Category
                    </button>
                  </div>
                </div>

                {categoryMode === "existing" ? (
                  /* Select Existing Category */
                  <div className="pt-1">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-hidden"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* Create New Category Inline */
                  <div className="space-y-3 pt-2">
                    <div>
                      <input
                        type="text"
                        required={categoryMode === "new"}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter new category name (e.g. Fitness, Work)"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <span className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                        Choose Color:
                      </span>
                      <div className="flex gap-2">
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewCategoryColor(c)}
                            className={`h-6 w-6 cursor-pointer rounded-full transition hover:scale-110 ${
                              newCategoryColor === c
                                ? "ring-2 ring-blue-600 ring-offset-2"
                                : ""
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAct || isCreatingCat}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingAct || isCreatingCat
                    ? "Creating..."
                    : "Create Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ACTIVITY */}
      {/* ========================================================= */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Edit Activity</h3>
            <p className="mt-1 text-xs text-gray-500">
              Rename this activity or reassign to another category.
            </p>

            <form
              onSubmit={handleEditActivitySubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAct}
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdatingAct ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CATEGORY */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Edit Category</h3>
            <p className="mt-1 text-xs text-gray-500">
              Update category name or color theme.
            </p>

            <form
              onSubmit={handleEditCategorySubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-800">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditCategoryColor(c)}
                      className={`h-7 w-7 cursor-pointer rounded-full transition hover:scale-110 ${
                        editCategoryColor === c
                          ? "ring-2 ring-blue-600 ring-offset-2"
                          : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
