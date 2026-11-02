import { useState, useMemo } from "react";
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  X,
  FileText,
  CheckSquare,
} from "lucide-react";
import noteHooks from "@/hooks/useNotes";
import { NoteCard } from "./components/NoteCard";
import { NoteModal } from "./components/NoteModal";
import type {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NoteType,
} from "@/types";

const NotesPage = () => {
  const [selectedType, setSelectedType] = useState<NoteType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Notes Hook
  const { notes, isLoading } = noteHooks.useNotes({
    note_type: selectedType === "ALL" ? undefined : selectedType,
    search: searchQuery,
    is_pinned: showPinnedOnly ? true : undefined,
  });

  const { mutate: createNote, isPending: isCreating } =
    noteHooks.useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } =
    noteHooks.useUpdateNote();
  const { mutate: deleteNote } = noteHooks.useDeleteNote();
  const { mutate: togglePinNote } = noteHooks.useTogglePinNote();
  const { mutate: toggleChecklistItem } = noteHooks.useToggleChecklistItem();

  // Separate pinned and unpinned notes
  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned), [notes]);
  const unpinnedNotes = useMemo(
    () => notes.filter((n) => !n.is_pinned),
    [notes]
  );

  const checklistCount = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.note_type === "CHECKLIST" ||
          (n.checklist_items && n.checklist_items.length > 0)
      ).length,
    [notes]
  );

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (
    payload: CreateNotePayload | UpdateNotePayload
  ) => {
    if ("id" in payload) {
      updateNote(payload as UpdateNotePayload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createNote(payload as CreateNotePayload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-xl shadow-blue-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
            <StickyNote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              My Notes & Checklists
            </h1>
            <p className="text-xs text-blue-100">
              Capture quick thoughts, ideas, and interactive to-do checklists in
              one place
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Note / Checklist
        </button>
      </div>

      {/* 2. Search Bar and Filter Pills */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes by title, checklist items, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedType("ALL");
              setShowPinnedOnly(false);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedType === "ALL" && !showPinnedOnly
                ? "bg-blue-600 text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All ({notes.length})
          </button>

          <button
            onClick={() => {
              setSelectedType(
                selectedType === "CHECKLIST" ? "ALL" : "CHECKLIST"
              );
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedType === "CHECKLIST"
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CheckSquare className="h-3 w-3" />
            Checklists ({checklistCount})
          </button>

          <button
            onClick={() => {
              setShowPinnedOnly(!showPinnedOnly);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              showPinnedOnly
                ? "bg-amber-500 text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Pin className={`h-3 w-3 ${showPinnedOnly ? "fill-white" : ""}`} />
            Pinned ({pinnedNotes.length})
          </button>
        </div>
      </div>

      {/* 4. Notes List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <StickyNote className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery || showPinnedOnly || selectedType !== "ALL"
              ? "No notes or checklists found"
              : "No notes or checklists yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            {searchQuery
              ? `No results found matching "${searchQuery}".`
              : "Capture your ideas, thoughts, or to-do lists by creating a new entry."}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Note / Checklist
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {!showPinnedOnly && pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-500 uppercase">
                <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                <span>Pinned ({pinnedNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleOpenEditModal}
                    onDelete={deleteNote}
                    onTogglePin={(id, is_pinned) =>
                      togglePinNote({ id, is_pinned })
                    }
                    onToggleChecklistItem={(noteId, itemId) =>
                      toggleChecklistItem({ noteId, itemId })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unpinned / Other Notes Section */}
          <div className="space-y-3">
            {!showPinnedOnly &&
              pinnedNotes.length > 0 &&
              unpinnedNotes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <span>Other Notes ({unpinnedNotes.length})</span>
                </div>
              )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(showPinnedOnly ? pinnedNotes : unpinnedNotes).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleOpenEditModal}
                  onDelete={deleteNote}
                  onTogglePin={(id, is_pinned) =>
                    togglePinNote({ id, is_pinned })
                  }
                  onToggleChecklistItem={(noteId, itemId) =>
                    toggleChecklistItem({ noteId, itemId })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Add / Edit Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingNote}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

export default NotesPage;
