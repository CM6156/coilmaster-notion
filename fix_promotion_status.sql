-- 프로모션 단계 관리를 위한 테이블 수정
-- 1. 프로모션 단계 enum 타입 생성
DO $$ BEGIN
    CREATE TYPE promotion_stage AS ENUM (
        'Promotion',
        'Sample',
        '1차검증',
        '설계검증',
        'Set검증',
        '승인',
        '수주',
        'Drop'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. projects 테이블에 promotion_stage 컬럼 추가
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS promotion_stage promotion_stage DEFAULT 'Promotion';

-- 3. 기존 프로젝트들을 Promotion 단계로 설정
UPDATE projects 
SET promotion_stage = 'Promotion'
WHERE promotion_stage IS NULL;

-- 4. 프로젝트 상태와 프로모션 단계를 분리하여 관리
-- promotion_status는 프로젝트 진행 상태 (진행중, 완료, 보류 등)
-- promotion_stage는 프로모션 단계 (Promotion, Sample, 1차검증 등)

-- 5. 현재 "Parking Transformer"와 "MMPF 막법형 개발" 프로젝트를 Promotion 단계로 설정
UPDATE projects 
SET promotion_stage = 'Promotion'
WHERE name IN ('Parking Transformer', 'MMPF 막법형 개발');

-- 6. 프로젝트 뷰 생성 (필요시)
CREATE OR REPLACE VIEW projects_with_promotion AS
SELECT 
    p.*,
    p.promotion_stage::text as promotion_stage_text,
    CASE 
        WHEN p.promotion_stage = 'Promotion' THEN 'Promotion'
        WHEN p.promotion_stage = 'Sample' THEN 'Sample 및 검적'
        WHEN p.promotion_stage = '1차검증' THEN '1차 특성 검증'
        WHEN p.promotion_stage = '설계검증' THEN '설계 검증'
        WHEN p.promotion_stage = 'Set검증' THEN 'Set 검증'
        WHEN p.promotion_stage = '승인' THEN '승인'
        WHEN p.promotion_stage = '수주' THEN '수주'
        WHEN p.promotion_stage = 'Drop' THEN 'Drop'
        ELSE p.promotion_stage::text
    END as promotion_stage_display
FROM projects p;

-- 7. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_projects_promotion_stage ON projects(promotion_stage);

-- 8. 확인 쿼리
SELECT 
    name,
    promotion_status,
    promotion_stage,
    status,
    project_type
FROM projects
ORDER BY created_at DESC;

-- 9. 프로모션 단계별 통계 확인
SELECT 
    promotion_stage,
    COUNT(*) as project_count,
    ROUND(AVG(progress), 2) as avg_progress
FROM projects 
WHERE promotion_stage IS NOT NULL
GROUP BY promotion_stage
ORDER BY 
    CASE promotion_stage
        WHEN 'Promotion' THEN 1
        WHEN 'Sample' THEN 2
        WHEN '1차검증' THEN 3
        WHEN '설계검증' THEN 4
        WHEN 'Set검증' THEN 5
        WHEN '승인' THEN 6
        WHEN '수주' THEN 7
        WHEN 'Drop' THEN 8
        ELSE 9
    END; 