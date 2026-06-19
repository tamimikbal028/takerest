export interface Box {
  id: string;
  title: string;
  code: string;
  field_label: string;
  created_by: string;
  is_accepting: boolean;
  submissions_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface Submission {
  id: string;
  box_id: string;
  field_value: string;
  file_url: string;
  file_name: string;
  created_at: string;
  updated_at: string | null;
}
