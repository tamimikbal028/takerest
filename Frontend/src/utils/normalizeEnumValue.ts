export const normalizeEnumValue = (value?: string | null) =>
  value ? value.trim().toUpperCase().replace(/\s+/g, "_") : "";
