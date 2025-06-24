-- Add parent_task_id column to tasks table for hierarchical structure
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add comment to the column
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for hierarchical structure';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
