-- 프로젝트 테이블에 promotion_stage 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS promotion_stage TEXT DEFAULT 'Promotion';

-- 기존 프로젝트들을 Promotion 단계로 설정
UPDATE projects 
SET promotion_stage = 'Promotion'
WHERE promotion_stage IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_projects_promotion_stage ON projects(promotion_stage);

-- 확인 쿼리
SELECT 
    name,
    promotion_status,
    promotion_stage,
    status,
    project_type
FROM projects
ORDER BY created_at DESC
LIMIT 10;
