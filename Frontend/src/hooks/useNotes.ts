import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import noteServices from "@/services/supabase/notes.supabase";
import { NOTE_KEYS } from "@/constants/queryKeys";
import type {
  ApiResponse,
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NoteFilterParams,
} from "@/types";

// 1. Get Notes Hook
const useNotes = (params?: NoteFilterParams) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ notes: Note[] }>
  >({
    queryKey: [
      NOTE_KEYS.NOTES,
      params?.search,
      params?.note_type,
      params?.is_pinned,
      params?.is_archived,
    ],
    queryFn: () => noteServices.getNotes(params),
    staleTime: 1000 * 60 * 2, // 2 mins
  });

  return {
    notes: data?.data?.notes ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

// 2. Create Note Mutation Hook
const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ note: Note }>,
    Error,
    CreateNotePayload
  >({
    mutationFn: (payload) => noteServices.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save note");
    },
  });
};

// 3. Update Note Mutation Hook
const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ note: Note }>,
    Error,
    UpdateNotePayload
  >({
    mutationFn: (payload) => noteServices.updateNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update note");
    },
  });
};

// 4. Toggle Checklist Item Mutation Hook
const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ note: Note }>,
    Error,
    { noteId: string; itemId: string }
  >({
    mutationFn: ({ noteId, itemId }) =>
      noteServices.toggleChecklistItem(noteId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update checklist item");
    },
  });
};

// 5. Delete Note Mutation Hook
const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ id: string }>, Error, string>({
    mutationFn: (id) => noteServices.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete note");
    },
  });
};

// 6. Toggle Pin Mutation Hook
const useTogglePinNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ note: Note }>,
    Error,
    { id: string; is_pinned: boolean }
  >({
    mutationFn: ({ id, is_pinned }) =>
      noteServices.togglePinNote(id, is_pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update pin status");
    },
  });
};

// 7. Toggle Archive Mutation Hook
const useToggleArchiveNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ note: Note }>,
    Error,
    { id: string; is_archived: boolean }
  >({
    mutationFn: ({ id, is_archived }) =>
      noteServices.toggleArchiveNote(id, is_archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_KEYS.NOTES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update archive status");
    },
  });
};

const noteHooks = {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useToggleChecklistItem,
  useDeleteNote,
  useTogglePinNote,
  useToggleArchiveNote,
} as const;

export default noteHooks;
