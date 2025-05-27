-- projects 테이블에 current_phase_id 컬럼 추가 (phases 테이블 참조)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS current_phase_id UUID REFERENCES phases(id);

-- 기존 current_phase 컬럼이 문자열로 되어 있다면 데이터 마이그레이션 수행
-- 기존 데이터를 새로운 phase_id로 매핑
UPDATE projects 
SET current_phase_id = (
    CASE 
        WHEN current_phase = 'planning' OR current_phase = '기획' THEN 
            (SELECT id FROM phases WHERE name = '기획' LIMIT 1)
        WHEN current_phase = 'development' OR current_phase = '개발' THEN 
            (SELECT id FROM phases WHERE name = '개발' LIMIT 1)
        WHEN current_phase = 'manufacturing' OR current_phase = '제조' THEN 
            (SELECT id FROM phases WHERE name = '제조' LIMIT 1)
        WHEN current_phase = 'quality' OR current_phase = '품질' THEN 
            (SELECT id FROM phases WHERE name = '품질' LIMIT 1)
        WHEN current_phase = 'production' OR current_phase = '양산' THEN 
            (SELECT id FROM phases WHERE name = '양산' LIMIT 1)
        WHEN current_phase = 'sales' OR current_phase = '영업' THEN 
            (SELECT id FROM phases WHERE name = '영업' LIMIT 1)
        ELSE 
            (SELECT id FROM phases WHERE name = '기획' LIMIT 1)
    END
)
WHERE current_phase_id IS NULL;

-- 기존 current_phase 컬럼이 있다면 제거 (선택사항)
-- ALTER TABLE projects DROP COLUMN IF EXISTS current_phase;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_projects_current_phase_id ON projects(current_phase_id);

-- 외래키 제약조건에 대한 댓글
COMMENT ON COLUMN projects.current_phase_id IS '현재 프로젝트 단계 (phases 테이블 참조)';

-- projects 테이블에서 phases 테이블 조인을 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW projects_with_phases AS
SELECT 
    p.*,
    ph.name as phase_name,
    ph.description as phase_description,
    ph.color as phase_color,
    ph.order_index as phase_order
FROM projects p
LEFT JOIN phases ph ON p.current_phase_id = ph.id;

-- 뷰에 대한 댓글
COMMENT ON VIEW projects_with_phases IS '프로젝트와 단계 정보가 조인된 뷰'; 