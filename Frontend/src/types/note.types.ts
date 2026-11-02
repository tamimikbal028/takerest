export type NoteType = "TEXT" | "CHECKLIST";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  note_type: NoteType;
  checklist_items: ChecklistItem[];
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateNotePayload {
  title: string;
  content?: string;
  note_type?: NoteType;
  checklist_items?: ChecklistItem[];
  color?: string;
  is_pinned?: boolean;
  tags?: string[];
}

export interface UpdateNotePayload {
  id: string;
  title?: string;
  content?: string;
  note_type?: NoteType;
  checklist_items?: ChecklistItem[];
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  tags?: string[];
}

export interface NoteFilterParams {
  search?: string;
  note_type?: NoteType;
  is_pinned?: boolean;
  is_archived?: boolean;
}
