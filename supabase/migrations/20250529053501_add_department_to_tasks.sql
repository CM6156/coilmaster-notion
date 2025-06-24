-- Add department column to tasks table
ALTER TABLE tasks ADD COLUMN department TEXT;

-- Add comment to the column
COMMENT ON COLUMN tasks.department IS 'Department associated with the task';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
