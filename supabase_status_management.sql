-- 상태 관리를 위한 테이블 생성
-- 1. 상태 타입 테이블 (프로젝트, 업무, 우선순위)
CREATE TABLE IF NOT EXISTS status_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 상태 테이블 (실제 상태들)
CREATE TABLE IF NOT EXISTS statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- HEX 색상 코드
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  status_type_id UUID NOT NULL REFERENCES status_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(status_type_id, order_index),
  UNIQUE(status_type_id, name)
);

-- 3. 기본 상태 타입 데이터 삽입
INSERT INTO status_types (name, description) VALUES
('project', '프로젝트 상태'),
('task', '업무 상태'),
('priority', '우선순위')
ON CONFLICT (name) DO NOTHING;

-- 4. 기본 프로젝트 상태 데이터 삽입
INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '계획', '프로젝트 계획 단계', '#3b82f6', 1, st.id
FROM status_types st WHERE st.name = 'project'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '진행중', '프로젝트 진행 중', '#f59e0b', 2, st.id
FROM status_types st WHERE st.name = 'project'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '완료', '프로젝트 완료', '#10b981', 3, st.id
FROM status_types st WHERE st.name = 'project'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '보류', '프로젝트 보류', '#6b7280', 4, st.id
FROM status_types st WHERE st.name = 'project'
ON CONFLICT (status_type_id, name) DO NOTHING;

-- 5. 기본 업무 상태 데이터 삽입
INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '할 일', '수행해야 할 업무', '#8b5cf6', 1, st.id
FROM status_types st WHERE st.name = 'task'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '진행중', '현재 진행 중인 업무', '#f59e0b', 2, st.id
FROM status_types st WHERE st.name = 'task'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '검토중', '검토가 필요한 업무', '#06b6d4', 3, st.id
FROM status_types st WHERE st.name = 'task'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '완료', '완료된 업무', '#10b981', 4, st.id
FROM status_types st WHERE st.name = 'task'
ON CONFLICT (status_type_id, name) DO NOTHING;

-- 6. 기본 우선순위 데이터 삽입
INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '낮음', '낮은 우선순위', '#6b7280', 1, st.id
FROM status_types st WHERE st.name = 'priority'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '보통', '보통 우선순위', '#3b82f6', 2, st.id
FROM status_types st WHERE st.name = 'priority'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '높음', '높은 우선순위', '#f59e0b', 3, st.id
FROM status_types st WHERE st.name = 'priority'
ON CONFLICT (status_type_id, name) DO NOTHING;

INSERT INTO statuses (name, description, color, order_index, status_type_id) 
SELECT '긴급', '긴급 우선순위', '#ef4444', 4, st.id
FROM status_types st WHERE st.name = 'priority'
ON CONFLICT (status_type_id, name) DO NOTHING;

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_statuses_status_type_id ON statuses(status_type_id);
CREATE INDEX IF NOT EXISTS idx_statuses_order_index ON statuses(order_index);
CREATE INDEX IF NOT EXISTS idx_statuses_is_active ON statuses(is_active);

-- 8. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 업데이트 트리거 적용
CREATE TRIGGER update_status_types_updated_at 
    BEFORE UPDATE ON status_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statuses_updated_at 
    BEFORE UPDATE ON statuses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. RLS (Row Level Security) 정책 설정
ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON status_types FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON statuses FOR SELECT USING (true);

-- 인증된 사용자만 삽입, 업데이트, 삭제 가능
CREATE POLICY "Enable insert for authenticated users only" ON status_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON status_types FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON status_types FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON statuses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON statuses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON statuses FOR DELETE USING (auth.role() = 'authenticated');

-- 11. 상태 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW status_with_type AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.color,
    s.order_index,
    s.is_active,
    s.created_at,
    s.updated_at,
    st.name as status_type,
    st.description as status_type_description
FROM statuses s
JOIN status_types st ON s.status_type_id = st.id
ORDER BY st.name, s.order_index;

-- 12. 상태 순서 변경을 위한 함수
CREATE OR REPLACE FUNCTION reorder_statuses(
    p_status_type VARCHAR(50),
    p_status_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    status_type_uuid UUID;
BEGIN
    -- 상태 타입 ID 조회
    SELECT id INTO status_type_uuid 
    FROM status_types 
    WHERE name = p_status_type;
    
    IF status_type_uuid IS NULL THEN
        RAISE EXCEPTION 'Status type % not found', p_status_type;
    END IF;
    
    -- 순서 업데이트
    FOR i IN 1..array_length(p_status_ids, 1) LOOP
        UPDATE statuses 
        SET order_index = i, updated_at = NOW()
        WHERE id = p_status_ids[i] AND status_type_id = status_type_uuid;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 13. 상태별 통계를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION get_status_statistics(p_status_type VARCHAR(50))
RETURNS TABLE(
    status_name VARCHAR(100),
    status_color VARCHAR(7),
    usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name,
        s.color,
        COALESCE(
            CASE 
                WHEN p_status_type = 'project' THEN (SELECT COUNT(*) FROM projects p WHERE p.status = s.name)
                WHEN p_status_type = 'task' THEN (SELECT COUNT(*) FROM tasks t WHERE t.status = s.name)
                ELSE 0
            END, 0
        ) as usage_count
    FROM statuses s
    JOIN status_types st ON s.status_type_id = st.id
    WHERE st.name = p_status_type AND s.is_active = true
    ORDER BY s.order_index;
END;
$$ LANGUAGE plpgsql; 