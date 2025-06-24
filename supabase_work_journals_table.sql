-- 업무 일지 테이블 생성
CREATE TABLE IF NOT EXISTS work_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 작성자 정보
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    
    -- 연관 정보
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- 상태 관리
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- 메타데이터
    tags TEXT[], -- 태그 배열
    attachments JSONB DEFAULT '[]'::jsonb, -- 첨부파일 정보
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스를 위한 제약조건
    CONSTRAINT work_journals_date_check CHECK (date <= CURRENT_DATE + INTERVAL '1 year')
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_journals_user_id ON work_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_author_id ON work_journals(author_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_project_id ON work_journals(project_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_task_id ON work_journals(task_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_date ON work_journals(date);
CREATE INDEX IF NOT EXISTS idx_work_journals_status ON work_journals(status);
CREATE INDEX IF NOT EXISTS idx_work_journals_created_at ON work_journals(created_at);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_work_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_journals_updated_at
    BEFORE UPDATE ON work_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_work_journals_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE work_journals ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일지만 조회 가능
CREATE POLICY "Users can view their own work journals" ON work_journals
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = author_id::text
    );

-- 관리자와 매니저는 모든 일지 조회 가능
CREATE POLICY "Admins and managers can view all work journals" ON work_journals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role IN ('admin', 'manager')
        )
    );

-- 사용자는 자신의 일지만 생성 가능
CREATE POLICY "Users can create their own work journals" ON work_journals
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = author_id::text
    );

-- 사용자는 자신의 일지만 수정 가능
CREATE POLICY "Users can update their own work journals" ON work_journals
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = author_id::text
    );

-- 사용자는 자신의 일지만 삭제 가능 (관리자는 모든 일지 삭제 가능)
CREATE POLICY "Users can delete their own work journals" ON work_journals
    FOR DELETE USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = author_id::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- 샘플 데이터 삽입 (선택사항)
-- INSERT INTO work_journals (title, content, user_id, author_id, author_name, date, status) VALUES
-- ('첫 번째 업무 일지', '오늘은 프로젝트 기획 회의를 진행했습니다.', 
--  (SELECT id FROM users LIMIT 1), 
--  (SELECT id FROM users LIMIT 1), 
--  (SELECT name FROM users LIMIT 1), 
--  CURRENT_DATE, 'published');

-- 테이블 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'work_journals 테이블이 성공적으로 생성되었습니다.';
    RAISE NOTICE '다음 기능들이 포함되어 있습니다:';
    RAISE NOTICE '- 업무 일지 제목, 내용, 날짜';
    RAISE NOTICE '- 작성자 정보 (user_id, author_id, author_name)';
    RAISE NOTICE '- 프로젝트/업무 연관 정보';
    RAISE NOTICE '- 상태 관리 (draft, published, archived)';
    RAISE NOTICE '- 태그 및 첨부파일 지원';
    RAISE NOTICE '- 자동 타임스탬프 관리';
    RAISE NOTICE '- RLS 보안 정책 적용';
END $$; 