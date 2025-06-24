-- target_sop_date 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_sop_date TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_projects_target_sop_date ON projects(target_sop_date);

-- 기존 데이터 마이그레이션 (필요한 경우)
UPDATE projects 
SET target_sop_date = end_date 
WHERE target_sop_date IS NULL AND end_date IS NOT NULL; 