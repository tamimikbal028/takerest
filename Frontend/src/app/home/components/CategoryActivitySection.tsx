import { useState } from "react";
import { 
  Plus, 
  FolderPlus, 
  Trash2, 
  Play 
} from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { Category, ActiveTimer } from "@/types";

const COLOR_PALETTE = [
  "#10B981", // Emerald (Deen)
  "#3B82F6", // Blue (Academic)
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#06B6D4", // Cyan
  "#64748B", // Slate (Others)
];

interface CategoryActivitySectionProps {
  categories: Category[];
  activeTimer?: ActiveTimer;
  onSwitchActivity: (categoryId: string, activityId: string | null, title: string) => void;
}

export const CategoryActivitySection = ({
  categories,
  activeTimer,
  onSwitchActivity,
}: CategoryActivitySectionProps) => {
  const { mutate: createCategory, isPending: isCreatingCat } =
    trackerHooks.useCreateCategory();
  const { mutate: deleteCategory } = trackerHooks.useDeleteCategory();
  const { mutate: createActivity, isPending: isCreatingAct } =
    trackerHooks.useCreateActivity();
  const { mutate: deleteActivity } = trackerHooks.useDeleteActivity();

  // Modals
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState<boolean>(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState<boolean>(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");

  // Form states
  const [groupName, setGroupName] = useState<string>("");
  const [groupColor, setGroupColor] = useState<string>("#3B82F6");
  const [activityName, setActivityName] = useState<string>("");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    createCategory(
      { name: groupName.trim(), color: groupColor },
      {
        onSuccess: () => {
          setIsAddGroupModalOpen(false);
          setGroupName("");
        },
      }
    );
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim() || !targetCategoryId) return;

    createActivity(
      { category_id: targetCategoryId, name: activityName.trim() },
      {
        onSuccess: () => {
          setIsAddActivityModalOpen(false);
          setActivityName("");
        },
      }
    );
  };

  const currentTargetCat =
    categories.find((c) => c.id === targetCategoryId) ||
    categories.find((c) => !c.is_system_default) ||
    categories[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black tracking-tight text-gray-900">
            Groups & Activities
          </h2>
          <p className="text-xs font-medium text-gray-500">
            Manage your categories, add activities, or click any activity to switch what you're tracking.
          </p>
        </div>

        <button
          onClick={() => setIsAddGroupModalOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-2xs transition hover:bg-gray-100 active:scale-95"
        >
          <FolderPlus className="h-3.5 w-3.5 text-blue-600" />
          + New Group
        </button>
      </div>

      {/* Categories Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const isOthers = cat.is_system_default;
          const actCount = (cat.activities || []).length;

          return (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-bold text-gray-900">
                      {cat.name}
                    </h3>
                    {!isOthers && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        {actCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isOthers && (
                      <>
                        <button
                          onClick={() => {
                            setTargetCategoryId(cat.id);
                            setIsAddActivityModalOpen(true);
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Add Activity to this group"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete group "${cat.name}" and all its activities?`)) {
                              deleteCategory(cat.id);
                            }
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Delete group"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Activities List */}
                <div className="space-y-1.5 pt-3">
                  {/* Default Others button if Others category */}
                  {isOthers && (
                    <button
                      onClick={() => onSwitchActivity(cat.id, null, "Others")}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        activeTimer?.category_id === cat.id && !activeTimer?.activity_id
                          ? "bg-slate-800 text-white shadow-xs"
                          : "border border-gray-200/60 bg-gray-50 text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>⏳ Free / Rest Time</span>
                      </span>
                      {activeTimer?.category_id === cat.id && !activeTimer?.activity_id ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Active</span>
                      ) : (
                        <Play className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  )}

                  {(cat.activities || []).map((act) => {
                    const isActive = activeTimer?.activity_id === act.id;

                    return (
                      <div
                        key={act.id}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "border border-gray-200/60 bg-gray-50 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <button
                          onClick={() => onSwitchActivity(cat.id, act.id, act.name)}
                          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
                        >
                          <span>{act.name}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Active</span>
                          ) : (
                            <button
                              onClick={() => onSwitchActivity(cat.id, act.id, act.name)}
                              className="cursor-pointer opacity-70 hover:opacity-100"
                              title="Switch to this activity"
                            >
                              <Play className="h-3 w-3 fill-current text-gray-600" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Delete "${act.name}"?`)) {
                                deleteActivity(act.id);
                              }
                            }}
                            className={`cursor-pointer rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition ${
                              isActive ? "hover:text-red-200" : "text-gray-400 hover:text-red-500"
                            }`}
                            title="Delete activity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Always show a clear + Add Activity button for custom categories */}
                  {!isOthers && (
                    <button
                      onClick={() => {
                        setTargetCategoryId(cat.id);
                        setIsAddActivityModalOpen(true);
                      }}
                      className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-2.5 text-xs font-bold text-gray-600 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add Activity</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Group */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">
              Create New Group
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Groups organize your activities (e.g. Deen, Academic, Work, Fitness)
            </p>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Academic, Freelance, Deen"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGroupColor(c)}
                      className={`h-7 w-7 cursor-pointer rounded-full transition hover:scale-110 ${
                        groupColor === c ? "ring-2 ring-blue-600 ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCat}
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingCat ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Activity */}
      {isAddActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">
              Add New Activity
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Define a specific task or subject under this group.
            </p>

            <form onSubmit={handleCreateActivity} className="mt-4 space-y-4">
              {/* Target Group Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Target Group
                </label>
                <select
                  value={targetCategoryId || currentTargetCat?.id}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-hidden"
                >
                  {categories
                    .filter((c) => !c.is_system_default)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Activity Name Input */}
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
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddActivityModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAct}
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingAct ? "Adding..." : "Add Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
