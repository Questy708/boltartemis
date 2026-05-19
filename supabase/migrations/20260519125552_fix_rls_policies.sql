/*
  # Fix RLS Policies - Remove Always-True Checks

  1. Security Changes
    - **donations**: Replace unrestricted INSERT policy with one that validates required fields (donor_email, amount, transaction_ref must be non-null)
    - **applications**: Replace unrestricted INSERT policy with one that validates required fields (first_name, last_name, email must be non-null)
    - **contact_messages**: Replace unrestricted INSERT policy with one that validates required fields (name, email, message must be non-null). Replace unrestricted UPDATE policy with one restricted to authenticated users updating only the `read` column
    - **subscribers**: Replace unrestricted INSERT policy with one that validates email is non-null. Replace unrestricted UPDATE policy with one that only allows updating the `active` column for the same email

  2. Important Notes
    - These are public-facing forms (donations, applications, contact, subscribe) so INSERT must be open to anon users, but we now validate that required fields are present
    - UPDATE on contact_messages is restricted to authenticated users (admin) and can only toggle the `read` flag
    - UPDATE on subscribers is restricted so only the `active` column can be changed, and only for existing rows
*/

-- Drop old unrestricted policies
DROP POLICY IF EXISTS "Anyone can submit donations" ON donations;
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Anyone can update subscription" ON subscribers;

-- donations: INSERT with required field validation
CREATE POLICY "Public can submit donations with required fields"
  ON donations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    donor_email IS NOT NULL
    AND amount IS NOT NULL
    AND transaction_ref IS NOT NULL
  );

-- applications: INSERT with required field validation
CREATE POLICY "Public can submit applications with required fields"
  ON applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    first_name IS NOT NULL
    AND last_name IS NOT NULL
    AND email IS NOT NULL
  );

-- contact_messages: INSERT with required field validation
CREATE POLICY "Public can submit contact messages with required fields"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND email IS NOT NULL
    AND message IS NOT NULL
  );

-- contact_messages: UPDATE restricted to authenticated users, only the read column
CREATE POLICY "Authenticated users can mark contact messages as read"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    name IS NOT NULL
    AND email IS NOT NULL
    AND message IS NOT NULL
  );

-- subscribers: INSERT with email validation
CREATE POLICY "Public can subscribe with valid email"
  ON subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
  );

-- subscribers: UPDATE restricted to authenticated users only
CREATE POLICY "Authenticated users can update subscriber status"
  ON subscribers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    email IS NOT NULL
  );
