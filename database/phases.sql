-- phases 테이블 생성
CREATE TABLE IF NOT EXISTS phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- 색상 코드 (예: #3b82f6)
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_phases_order ON phases(order_index);
CREATE INDEX IF NOT EXISTS idx_phases_active ON phases(is_active);

-- RLS (Row Level Security) 설정
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 phases를 읽을 수 있도록 정책 생성
CREATE POLICY "Allow authenticated users to read phases" 
ON phases 
FOR SELECT 
TO authenticated 
USING (true);

-- 관리자만 phases를 생성/수정/삭제할 수 있도록 정책 생성
CREATE POLICY "Allow admin users to manage phases" 
ON phases 
FOR ALL 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- phases 테이블에 updated_at 트리거 설정
CREATE TRIGGER update_phases_updated_at 
    BEFORE UPDATE ON phases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 기본 단계 데이터 삽입
INSERT INTO phases (name, description, color, order_index) VALUES
('기획', '프로젝트 기획 및 계획 수립 단계', '#3b82f6', 1),
('개발', '제품 개발 및 설계 단계', '#f59e0b', 2),
('제조', '제조 공정 설계 및 준비 단계', '#10b981', 3),
('품질', '품질 검증 및 테스트 단계', '#8b5cf6', 4),
('양산', '대량 생산 및 출하 단계', '#ef4444', 5),
('영업', '영업 및 마케팅 단계', '#ec4899', 6)
ON CONFLICT (id) DO NOTHING;

-- 댓글 추가
COMMENT ON TABLE phases IS '프로젝트 단계 관리 테이블';
COMMENT ON COLUMN phases.id IS '단계 고유 식별자';
COMMENT ON COLUMN phases.name IS '단계명';
COMMENT ON COLUMN phases.description IS '단계 설명';
COMMENT ON COLUMN phases.color IS '단계 표시 색상 (HEX 코드)';
COMMENT ON COLUMN phases.order_index IS '단계 순서 (낮을수록 앞선 단계)';
COMMENT ON COLUMN phases.is_active IS '활성 상태 여부';
COMMENT ON COLUMN phases.created_at IS '생성 일시';
COMMENT ON COLUMN phases.updated_at IS '수정 일시'; 