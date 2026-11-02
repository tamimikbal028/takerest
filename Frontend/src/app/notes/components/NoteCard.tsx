import { useState } from "react";
import {
  Pin,
  Edit2,
  Trash2,
  Copy,
  Check,
  Calendar,
  Tag as TagIcon,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, is_pinned: boolean) => void;
  onToggleChecklistItem?: (noteId: string, itemId: string) => void;
}

export const NoteCard = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleChecklistItem,
}: NoteCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isChecklist =
    note.note_type === "CHECKLIST" ||
    (note.checklist_items && note.checklist_items.length > 0);

  const checklist = note.checklist_items || [];
  const completedCount = checklist.filter((i) => i.completed).length;
  const totalCount = checklist.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine if content is long
  const isContentLong =
    (note.content && note.content.length > 250) ||
    (note.content && note.content.split("\n").length > 6);
  const isChecklistLong = checklist.length > 5;

  const handleCopy = () => {
    let fullText = note.title + "\n\n";
    if (isChecklist) {
      fullText += checklist
        .map((item) => `${item.completed ? "[✓]" : "[ ]"} ${item.text}`)
        .join("\n");
    } else {
      fullText += note.content;
    }
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Note copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(note.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const visibleChecklist = isExpanded ? checklist : checklist.slice(0, 5);

  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl border p-4 transition-shadow duration-200 hover:shadow-md sm:p-5"
      style={{
        backgroundColor: note.color || "#ffffff",
        borderColor:
          note.color && note.color !== "#ffffff"
            ? `${note.color}dd`
            : "rgba(229, 231, 235, 1)",
      }}
    >
      <div>
        {/* If it's a checklist, show small badge */}
        {isChecklist && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              <CheckSquare className="h-3 w-3" />
              Checklist
            </span>
          </div>
        )}

        {/* Title starts directly at top */}
        <h3 className="flex items-start gap-1.5 text-base leading-snug font-bold text-gray-900">
          {note.is_pinned && (
            <Pin className="mt-1 h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
          )}
          <span className="flex-1">{note.title}</span>
        </h3>

        {/* Interactive Checklist Rendering */}
        {isChecklist ? (
          <div className="mt-3 space-y-2.5">
            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                  <span>
                    {completedCount} of {totalCount} completed
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist items */}
            <div className="space-y-1.5 pt-1">
              {visibleChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleChecklistItem) {
                      onToggleChecklistItem(note.id, item.id);
                    }
                  }}
                  className="group/item flex cursor-pointer items-start gap-2 py-0.5 select-none"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="pointer-events-none mt-0.5 h-3.5 w-3.5 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-xs leading-tight transition ${
                      item.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-800 hover:text-blue-700"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}

              {isChecklistLong && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> +
                      {checklist.length - 5} more items
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Text content with expand/collapse */
          note.content && (
            <div className="mt-2">
              <div
                className={`text-xs leading-relaxed whitespace-pre-wrap text-gray-700 transition-all ${
                  isExpanded ? "" : "line-clamp-6"
                }`}
              >
                {note.content}
              </div>
              {isContentLong && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> Read more...
                    </>
                  )}
                </button>
              )}
            </div>
          )
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-medium text-gray-600"
              >
                <TagIcon className="h-2.5 w-2.5 text-gray-400" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar: Timestamp & Actions (Pin, Copy, Edit, Delete) */}
      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Pin Button next to Copy Button */}
          <button
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            title={note.is_pinned ? "Unpin note" : "Pin note to top"}
            className={`rounded-lg p-1.5 transition ${
              note.is_pinned
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                : "text-gray-400 hover:bg-black/5 hover:text-gray-700"
            }`}
          >
            <Pin
              className={`h-3.5 w-3.5 ${
                note.is_pinned ? "fill-amber-500 text-amber-600" : ""
              }`}
            />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-700"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(note)}
            title="Edit note"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this note?")
              ) {
                onDelete(note.id);
              }
            }}
            title="Delete note"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
