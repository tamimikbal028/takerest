========================================================
MAINTENANCE NOTE FOR SCHEMA FILES
========================================================

1. SOURCE OF TRUTH:
   - `master/db_setup_master.sql` is the full database master script.
   - `master/storage_setup_master.sql` is the full storage master script.
   - Storage setup defines bucket metadata only; no bucket-specific policies are defined here because backend uploads use the service-role key.

2. ORDERED SQL SLICES:
   - Use the `ordered/` files when you want to run setup in SQL editor order.
   - Run them in numeric order:
     `00_reset.sql` -> `01_extensions_types.sql` -> `02_tables.sql` -> `03_indexes.sql` -> `04_functions.sql` -> `05_triggers.sql` -> `06_policies.sql` -> `07_grants.sql`
   - Storage buckets are defined only in `master/storage_setup_master.sql`; there is no ordered storage slice anymore.

3. SYNC RULE:
   - Whenever the master scripts change, regenerate the ordered files immediately so they stay identical in behavior.
   - Do not edit the ordered files in a way that diverges from the master scripts.

4. TABLE ANNOTATION:
   - In `02_tables.sql`, keep the table start comments like `-- [Table: Users]` so it is clear where each table block begins.

5. DATABASE FLATTENING (ANTI-NESTING POLICY):
   - Always prefer flat/independent columns (e.g., `student_session`, `student_cgpa`, `faculty_office_room`) instead of nesting fields within objects or JSONB (which was MongoDB's approach).
   - This is critical to maintain native SQL indexing performance, type-safety, simple frontend mapping, and secure RLS (Row Level Security) policies.
   - EXCEPTION: Nested structures (JSONB) are only allowed for highly dynamic links/metadata where database querying or indexing is not required (e.g., `social_links`).

========================================================
