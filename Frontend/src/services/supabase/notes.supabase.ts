import { supabase, getActiveUserId } from "@/config/supabase";
import type {
  ApiResponse,
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NoteFilterParams,
  ChecklistItem,
} from "@/types";

const LOCAL_STORAGE_KEY = "takerest_notes_store_v2";

export const NOTE_COLORS = [
  { label: "Classic White", hex: "#ffffff", border: "#e2e8f0" },
  { label: "Warm Amber", hex: "#fef3c7", border: "#fde68a" },
  { label: "Soft Emerald", hex: "#ecfdf5", border: "#a7f3d0" },
  { label: "Calm Blue", hex: "#eff6ff", border: "#bfdbfe" },
  { label: "Gentle Purple", hex: "#f5f3ff", border: "#ddd6fe" },
  { label: "Rose Pink", hex: "#fff1f2", border: "#fecdd3" },
  { label: "Slate Muted", hex: "#f8fafc", border: "#cbd5e1" },
] as const;

// Seed realistic starter notes with both Text and Checklist
const getInitialNotesData = (userId: string): Note[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "note_demo_checklist_1",
      user_id: userId,
      title: "✅ Today's Priority Checklist",
      content: "",
      note_type: "CHECKLIST",
      checklist_items: [
        {
          id: "item_1",
          text: "30 minutes Quran recitation after Fajr",
          completed: true,
        },
        {
          id: "item_2",
          text: "Review project milestones & updates",
          completed: true,
        },
        {
          id: "item_3",
          text: "Log and track daily expenses",
          completed: false,
        },
        {
          id: "item_4",
          text: "1 hour deep work / focused study",
          completed: false,
        },
        {
          id: "item_5",
          text: "Review daily accomplishments before sleep",
          completed: false,
        },
      ],
      color: "#fef3c7",
      is_pinned: true,
      is_archived: false,
      tags: ["todo", "today", "focus"],
      created_at: now,
      updated_at: now,
    },
    {
      id: "note_demo_2",
      user_id: userId,
      title: "🤲 Morning & Evening Adhkar",
      content:
        "• Ayat al-Kursi\n• Surah Al-Ikhlas, Al-Falaq, An-Nas (3x)\n• Sayyidul Istighfar\n• Morning supplication: 'Allahumma bika asbahna...'",
      note_type: "TEXT",
      checklist_items: [],
      color: "#ecfdf5",
      is_pinned: true,
      is_archived: false,
      tags: ["deen", "dhikr"],
      created_at: now,
      updated_at: now,
    },
    {
      id: "note_demo_3",
      user_id: userId,
      title: "💡 Reading & Study List",
      content:
        "1. Riyad as-Salihin (Daily 1 Hadith)\n2. Atomic Habits - James Clear\n3. Deep Work - Cal Newport",
      note_type: "TEXT",
      checklist_items: [],
      color: "#eff6ff",
      is_pinned: false,
      is_archived: false,
      tags: ["books", "reading"],
      created_at: now,
      updated_at: now,
    },
  ];
};

const getLocalNotes = (userId: string): Note[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (!raw) {
      const initial = getInitialNotesData(userId);
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}_${userId}`,
        JSON.stringify(initial)
      );
      return initial;
    }
    const parsed = JSON.parse(raw);
    const mapped: Note[] = parsed.map((n: Partial<Note>) => ({
      ...n,
      note_type:
        n.note_type || (n.checklist_items?.length ? "CHECKLIST" : "TEXT"),
      checklist_items: n.checklist_items || [],
    })) as Note[];

    // Ensure demo checklist is present if missing
    const hasChecklist = mapped.some(
      (n) =>
        n.note_type === "CHECKLIST" ||
        (n.checklist_items && n.checklist_items.length > 0)
    );
    if (!hasChecklist) {
      const demoChecklist = getInitialNotesData(userId)[0];
      mapped.unshift(demoChecklist);
      saveLocalNotes(userId, mapped);
    }

    return mapped;
  } catch {
    return getInitialNotesData(userId);
  }
};

const saveLocalNotes = (userId: string, notes: Note[]) => {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY}_${userId}`,
      JSON.stringify(notes)
    );
  } catch (err) {
    console.error("Failed to save notes locally:", err);
  }
};

// 1. Get Notes
const getNotes = async (
  params?: NoteFilterParams
): Promise<ApiResponse<{ notes: Note[] }>> => {
  const userId = await getActiveUserId();

  try {
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
      let filtered = getLocalNotes(userId);

      if (params?.note_type) {
        filtered = filtered.filter((n) => n.note_type === params.note_type);
      }
      if (params?.is_archived !== undefined) {
        filtered = filtered.filter((n) => n.is_archived === params.is_archived);
      } else {
        filtered = filtered.filter((n) => !n.is_archived);
      }
      if (params?.is_pinned !== undefined) {
        filtered = filtered.filter((n) => n.is_pinned === params.is_pinned);
      }
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.checklist_items?.some((item) =>
              item.text.toLowerCase().includes(q)
            ) ||
            n.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Sort pinned first, then updated_at desc
      filtered.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      return {
        success: true,
        statusCode: 200,
        message: "Loaded from local storage",
        data: { notes: filtered },
      };
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
  } catch {
    const local = getLocalNotes(userId);
    return {
      success: true,
      statusCode: 200,
      message: "Loaded local fallback",
      data: { notes: local },
    };
  }
};

// 2. Create Note
const createNote = async (
  payload: CreateNotePayload
): Promise<ApiResponse<{ note: Note }>> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();

  const noteType =
    payload.note_type ||
    (payload.checklist_items?.length ? "CHECKLIST" : "TEXT");
  const checklistItems = payload.checklist_items || [];

  try {
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
      const newNote: Note = {
        id: "note_" + Date.now(),
        user_id: userId,
        title: payload.title.trim(),
        content: payload.content || "",
        note_type: noteType,
        checklist_items: checklistItems,
        color: payload.color || "#ffffff",
        is_pinned: Boolean(payload.is_pinned),
        is_archived: false,
        tags: payload.tags || [],
        created_at: now,
        updated_at: now,
      };

      const list = getLocalNotes(userId);
      list.unshift(newNote);
      saveLocalNotes(userId, list);

      return {
        success: true,
        statusCode: 201,
        message: "Note saved (Local Storage)",
        data: { note: newNote },
      };
    }

    return {
      success: true,
      statusCode: 201,
      message: "New note created",
      data: { note: data },
    };
  } catch {
    const newNote: Note = {
      id: "note_" + Date.now(),
      user_id: userId,
      title: payload.title.trim(),
      content: payload.content || "",
      note_type: noteType,
      checklist_items: checklistItems,
      color: payload.color || "#ffffff",
      is_pinned: Boolean(payload.is_pinned),
      is_archived: false,
      tags: payload.tags || [],
      created_at: now,
      updated_at: now,
    };
    const list = getLocalNotes(userId);
    list.unshift(newNote);
    saveLocalNotes(userId, list);

    return {
      success: true,
      statusCode: 201,
      message: "Note saved",
      data: { note: newNote },
    };
  }
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

  try {
    const { data, error } = await supabase
      .from("notes")
      .update(updateFields)
      .eq("id", payload.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      const list = getLocalNotes(userId);
      const idx = list.findIndex((n) => n.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updateFields };
        saveLocalNotes(userId, list);
        return {
          success: true,
          statusCode: 200,
          message: "Note updated (Local Storage)",
          data: { note: list[idx] },
        };
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Note updated",
      data: { note: data },
    };
  } catch {
    const list = getLocalNotes(userId);
    const idx = list.findIndex((n) => n.id === payload.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updateFields };
      saveLocalNotes(userId, list);
      return {
        success: true,
        statusCode: 200,
        message: "Note updated",
        data: { note: list[idx] },
      };
    }
    throw new Error("Note not found");
  }
};

// 4. Toggle Checklist Item Completion
const toggleChecklistItem = async (
  noteId: string,
  itemId: string
): Promise<ApiResponse<{ note: Note }>> => {
  const userId = await getActiveUserId();
  const list = getLocalNotes(userId);
  const note = list.find((n) => n.id === noteId);

  let currentChecklist: ChecklistItem[] = note?.checklist_items || [];

  try {
    const { data } = await supabase
      .from("notes")
      .select("checklist_items")
      .eq("id", noteId)
      .single();
    if (data?.checklist_items) {
      currentChecklist = data.checklist_items;
    }
  } catch {
    // fallback
  }

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

  try {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      const list = getLocalNotes(userId);
      const updated = list.filter((n) => n.id !== id);
      saveLocalNotes(userId, updated);
      return {
        success: true,
        statusCode: 200,
        message: "Note deleted (Local Storage)",
        data: { id },
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Note deleted",
      data: { id },
    };
  } catch {
    const list = getLocalNotes(userId);
    const updated = list.filter((n) => n.id !== id);
    saveLocalNotes(userId, updated);
    return {
      success: true,
      statusCode: 200,
      message: "Note deleted",
      data: { id },
    };
  }
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
