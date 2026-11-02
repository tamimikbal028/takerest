import { supabase, getActiveUserId } from "@/config/supabase";
import type {
  ApiResponse,
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NoteFilterParams,
  ChecklistItem,
} from "@/types";

export const NOTE_COLORS = [
  { label: "Classic White", hex: "#ffffff", border: "#e2e8f0" },
  { label: "Warm Amber", hex: "#fef3c7", border: "#fde68a" },
  { label: "Soft Emerald", hex: "#ecfdf5", border: "#a7f3d0" },
  { label: "Calm Blue", hex: "#eff6ff", border: "#bfdbfe" },
  { label: "Gentle Purple", hex: "#f5f3ff", border: "#ddd6fe" },
  { label: "Rose Pink", hex: "#fff1f2", border: "#fecdd3" },
  { label: "Slate Muted", hex: "#f8fafc", border: "#cbd5e1" },
] as const;

// 1. Get Notes directly from Supabase
const getNotes = async (
  params?: NoteFilterParams
): Promise<ApiResponse<{ notes: Note[] }>> => {
  const userId = await getActiveUserId();

  let query = supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (params?.note_type) {
    query = query.eq("note_type", params.note_type);
  }
  if (params?.is_archived !== undefined) {
    query = query.eq("is_archived", params.is_archived);
  } else {
    query = query.eq("is_archived", false);
  }
  if (params?.is_pinned !== undefined) {
    query = query.eq("is_pinned", params.is_pinned);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch notes");
  }

  let notesList = ((data as unknown as Note[]) || []).map((n) => ({
    ...n,
    note_type:
      n.note_type || (n.checklist_items?.length ? "CHECKLIST" : "TEXT"),
    checklist_items: n.checklist_items || [],
  })) as Note[];

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    notesList = notesList.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.checklist_items?.some((item) =>
          item.text.toLowerCase().includes(q)
        ) ||
        n.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return {
    success: true,
    statusCode: 200,
    message: "Notes fetched successfully",
    data: { notes: notesList },
  };
};

// 2. Create Note
const createNote = async (
  payload: CreateNotePayload
): Promise<ApiResponse<{ note: Note }>> => {
  const userId = await getActiveUserId();

  const noteType =
    payload.note_type ||
    (payload.checklist_items?.length ? "CHECKLIST" : "TEXT");
  const checklistItems = payload.checklist_items || [];

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      title: payload.title.trim(),
      content: payload.content || "",
      note_type: noteType,
      checklist_items: checklistItems,
      color: payload.color || "#ffffff",
      is_pinned: Boolean(payload.is_pinned),
      is_archived: false,
      tags: payload.tags || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create note");
  }

  return {
    success: true,
    statusCode: 201,
    message: "New note created",
    data: { note: data as unknown as Note },
  };
};

// 3. Update Note
const updateNote = async (
  payload: UpdateNotePayload
): Promise<ApiResponse<{ note: Note }>> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();

  const updateFields: Partial<Note> = {
    updated_at: now,
  };
  if (payload.title !== undefined) updateFields.title = payload.title.trim();
  if (payload.content !== undefined) updateFields.content = payload.content;
  if (payload.note_type !== undefined)
    updateFields.note_type = payload.note_type;
  if (payload.checklist_items !== undefined)
    updateFields.checklist_items = payload.checklist_items;
  if (payload.color !== undefined) updateFields.color = payload.color;
  if (payload.is_pinned !== undefined)
    updateFields.is_pinned = payload.is_pinned;
  if (payload.is_archived !== undefined)
    updateFields.is_archived = payload.is_archived;
  if (payload.tags !== undefined) updateFields.tags = payload.tags;

  const { data, error } = await supabase
    .from("notes")
    .update(updateFields)
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update note");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Note updated",
    data: { note: data as unknown as Note },
  };
};

// 4. Toggle Checklist Item Completion
const toggleChecklistItem = async (
  noteId: string,
  itemId: string
): Promise<ApiResponse<{ note: Note }>> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("notes")
    .select("checklist_items")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to find note");
  }

  const currentChecklist: ChecklistItem[] = data.checklist_items || [];
  const updatedChecklist = currentChecklist.map((item) =>
    item.id === itemId ? { ...item, completed: !item.completed } : item
  );

  return updateNote({
    id: noteId,
    checklist_items: updatedChecklist,
  });
};

// 5. Delete Note
const deleteNote = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete note");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Note deleted",
    data: { id },
  };
};

// 6. Toggle Pin
const togglePinNote = async (
  id: string,
  is_pinned: boolean
): Promise<ApiResponse<{ note: Note }>> => {
  return updateNote({ id, is_pinned: !is_pinned });
};

// 7. Toggle Archive
const toggleArchiveNote = async (
  id: string,
  is_archived: boolean
): Promise<ApiResponse<{ note: Note }>> => {
  return updateNote({ id, is_archived: !is_archived });
};

const noteServices = {
  getNotes,
  createNote,
  updateNote,
  toggleChecklistItem,
  deleteNote,
  togglePinNote,
  toggleArchiveNote,
} as const;

export default noteServices;
