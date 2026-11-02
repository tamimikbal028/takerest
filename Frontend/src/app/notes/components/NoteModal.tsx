import { useState, useEffect } from "react";
import { X, Pin, Tag, Plus, Trash2, CheckSquare, FileText } from "lucide-react";
import type {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NoteType,
  ChecklistItem,
} from "@/types";
import { NOTE_COLORS } from "@/services/supabase/notes.supabase";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNotePayload | UpdateNotePayload) => void;
  initialData?: Note | null;
  isSubmitting?: boolean;
}

export const NoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: NoteModalProps) => {
  const [noteType, setNoteType] = useState<NoteType>("TEXT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [isPinned, setIsPinned] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setNoteType(
        initialData.note_type ||
          (initialData.checklist_items?.length ? "CHECKLIST" : "TEXT")
      );
      setTitle(initialData.title);
      setContent(initialData.content || "");
      setChecklistItems(initialData.checklist_items || []);
      setNewItemText("");
      setColor(initialData.color || "#ffffff");
      setIsPinned(initialData.is_pinned);
      setTagsInput((initialData.tags || []).join(", "));
    } else {
      setNoteType("TEXT");
      setTitle("");
      setContent("");
      setChecklistItems([]);
      setNewItemText("");
      setColor("#ffffff");
      setIsPinned(false);
      setTagsInput("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Add a checklist item
  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id:
        "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      text: newItemText.trim(),
      completed: false,
    };
    setChecklistItems([...checklistItems, newItem]);
    setNewItemText("");
  };

  // Toggle item in modal
  const handleToggleItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Remove item in modal
  const handleRemoveItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const finalChecklist = [...checklistItems];
    if (noteType === "CHECKLIST" && newItemText.trim()) {
      finalChecklist.push({
        id: "item_" + Date.now(),
        text: newItemText.trim(),
        completed: false,
      });
    }

    if (initialData) {
      onSubmit({
        id: initialData.id,
        title: title.trim(),
        content: noteType === "TEXT" ? content.trim() : "",
        note_type: noteType,
        checklist_items: finalChecklist,
        color,
        is_pinned: isPinned,
        tags,
      });
    } else {
      onSubmit({
        title: title.trim(),
        content: noteType === "TEXT" ? content.trim() : "",
        note_type: noteType,
        checklist_items: finalChecklist,
        color,
        is_pinned: isPinned,
        tags,
      });
    }
  };

  const completedCount = checklistItems.filter((item) => item.completed).length;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs transition-opacity sm:p-4">
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        style={{
          borderTop: `5px solid ${color !== "#ffffff" ? color : "#2563eb"}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">
              {initialData
                ? noteType === "CHECKLIST"
                  ? "✏️ Edit Checklist"
                  : "✏️ Edit Note"
                : "📝 Create New Entry"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Note Type Switcher */}
        <div className="px-5 pt-4">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setNoteType("TEXT")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition ${
                noteType === "TEXT"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Text Note
            </button>
            <button
              type="button"
              onClick={() => setNoteType("CHECKLIST")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition ${
                noteType === "CHECKLIST"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Checklist / To-Do
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col space-y-4 overflow-y-auto p-5"
        >
          {/* Title and Pin Button in clean row */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                {noteType === "CHECKLIST"
                  ? "Checklist Title"
                  : "Note Title"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 transition select-none hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <Pin
                  className={`h-3.5 w-3.5 ${
                    isPinned ? "fill-amber-500 text-amber-500" : "text-gray-400"
                  }`}
                />
                <span className={isPinned ? "font-bold text-amber-600" : ""}>
                  Pin to top
                </span>
              </label>
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder={
                noteType === "CHECKLIST"
                  ? "e.g. Daily priorities, Grocery items..."
                  : "Enter note title..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Interactive Checklist Editor */}
          {noteType === "CHECKLIST" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <CheckSquare className="h-3.5 w-3.5 text-blue-600" />{" "}
                  Items
                </label>
                {checklistItems.length > 0 && (
                  <span className="text-[11px] font-medium text-gray-500">
                    {checklistItems.length} items ({completedCount} completed)
                  </span>
                )}
              </div>

              {/* Add item input row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type an item and press Enter..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  disabled={!newItemText.trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {/* Items List */}
              <div
                className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-gray-100 p-2.5"
                style={{
                  backgroundColor:
                    color !== "#ffffff" ? `${color}40` : "#f9fafb",
                }}
              >
                {checklistItems.length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-400">
                    No items added yet. Type above and click Add.
                  </div>
                ) : (
                  checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-2.5 rounded-lg border border-gray-100/80 bg-white/80 p-2 shadow-2xs transition"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleItem(item.id)}
                          className="h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`text-xs break-words select-none ${
                            item.completed
                              ? "font-normal text-gray-400 line-through"
                              : "font-medium text-gray-800"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-md p-1 text-gray-400 opacity-80 transition group-hover:opacity-100 hover:text-red-500"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Text Content Area */
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Note Content
                </label>
                <span className="text-[10px] text-gray-400">
                  {content.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                placeholder="Write your note content or thoughts here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-y rounded-xl border border-gray-200 p-3.5 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                style={{
                  backgroundColor:
                    color !== "#ffffff" ? `${color}50` : "#fafafa",
                }}
              />
            </div>
          )}

          {/* Color Palette */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Card Color Theme
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c.hex
                      ? "scale-115 ring-2 ring-blue-600 ring-offset-1"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c.hex,
                    borderColor: c.border,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Tag className="h-3.5 w-3.5 text-gray-500" /> Tags (optional,
              comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. work, todo, urgent, books"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Update Note"
                  : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
