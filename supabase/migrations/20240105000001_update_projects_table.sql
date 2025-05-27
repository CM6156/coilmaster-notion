-- Projects 테이블 업데이트 마이그레이션
-- 프론트엔드 양식에 맞춰 필요한 컬럼들 추가

-- 기존 projects 테이블에 새 컬럼들 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_quantity INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS average_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'planned';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS competitor TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS issue_corporation_id UUID REFERENCES corporations(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- 기존 컬럼 타입 확인 및 수정 (필요한 경우)
-- request_date와 target_sop_date가 없다면 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS request_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_sop_date TIMESTAMP WITH TIME ZONE;

-- current_phase 컬럼이 없다면 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'planning';

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_promotion_status ON projects(promotion_status);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_issue_corporation_id ON projects(issue_corporation_id);
CREATE INDEX IF NOT EXISTS idx_projects_completed ON projects(completed);

-- RLS 정책 업데이트 (모든 사용자가 projects를 생성/읽기 가능하도록)
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Managers can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- 새로운 RLS 정책 생성
CREATE POLICY "Enable read access for all users" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- 테이블 코멘트 업데이트
COMMENT ON TABLE projects IS 'Projects table with extended fields for coilmaster corporate system';
COMMENT ON COLUMN projects.project_type IS 'Type of project (e.g., 1-1, 1-2, etc.)';
COMMENT ON COLUMN projects.annual_quantity IS 'Annual quantity target';
COMMENT ON COLUMN projects.average_amount IS 'Average amount per unit';
COMMENT ON COLUMN projects.annual_amount IS 'Total annual amount (calculated)';
COMMENT ON COLUMN projects.promotion_status IS 'Current promotion status';
COMMENT ON COLUMN projects.competitor IS 'Main competitor for this project';
COMMENT ON COLUMN projects.issue_corporation_id IS 'Corporation handling the issues';
COMMENT ON COLUMN projects.completed IS 'Whether the project is completed';
COMMENT ON COLUMN projects.team IS 'Array of team member IDs';
COMMENT ON COLUMN projects.department_id IS 'Department responsible for the project'; 