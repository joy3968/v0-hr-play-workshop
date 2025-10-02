-- Add workshop_goal column to contacts table
ALTER TABLE contacts
ADD COLUMN workshop_goal TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN contacts.workshop_goal IS '플레이워크샵을 통해 얻어가고 싶은 것';
