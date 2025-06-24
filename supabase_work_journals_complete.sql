-- ========================================
-- 업무일지 시스템 완전한 테이블 구조
-- ========================================

-- 1. 기존 work_journals 테이블이 있다면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS work_journals CASCADE;

-- 2. work_journals 메인 테이블 생성
CREATE TABLE IF NOT EXISTS work_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 기본 정보
    title VARCHAR(255) NOT NULL DEFAULT '업무일지',
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 사용자 정보
    user_id UUID NOT NULL, -- 작성 대상자 (담당자)
    author_id UUID, -- 실제 작성자 (본인 또는 다른 사용자)
    author_name VARCHAR(100), -- 작성자 이름 (캐시용)
    
    -- 업무 연관 정보 (선택사항)
    project_id UUID, -- 프로젝트 연결
    task_id UUID, -- 업무 연결
    
    -- 상태 관리
    status VARCHAR(50) DEFAULT 'in-progress' CHECK (status IN ('not-started', 'in-progress', 'delayed', 'completed', 'on-hold')),
    
    -- 추가 메타데이터
    mood VARCHAR(20), -- 업무 기분/상태
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10), -- 생산성 점수
    work_hours DECIMAL(4,2) DEFAULT 8.0, -- 업무 시간
    overtime_hours DECIMAL(4,2) DEFAULT 0.0, -- 초과 근무 시간
    
    -- 카테고리 및 태그
    category VARCHAR(100), -- 업무 카테고리
    tags TEXT[], -- 태그 배열
    
    -- 첨부파일 정보
    has_attachments BOOLEAN DEFAULT FALSE, -- 첨부파일 여부
    attachment_count INTEGER DEFAULT 0, -- 첨부파일 개수
    
    -- 승인 관련 (선택사항)
    is_approved BOOLEAN DEFAULT FALSE, -- 승인 여부
    approved_by UUID, -- 승인자
    approved_at TIMESTAMP WITH TIME ZONE, -- 승인 시간
    
    -- 시간 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT work_journals_date_not_future CHECK (date <= CURRENT_DATE + INTERVAL '1 day'),
    CONSTRAINT work_journals_hours_valid CHECK (work_hours >= 0 AND work_hours <= 24),
    CONSTRAINT work_journals_overtime_valid CHECK (overtime_hours >= 0 AND overtime_hours <= 12)
);

-- 3. work_journal_attachments 테이블 (이미지 및 파일 첨부)
CREATE TABLE IF NOT EXISTS work_journal_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_journal_id UUID NOT NULL REFERENCES work_journals(id) ON DELETE CASCADE,
    
    -- 파일 정보
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    file_type VARCHAR(100), -- MIME type
    file_extension VARCHAR(10), -- 파일 확장자
    
    -- Supabase Storage 정보
    storage_path VARCHAR(500) NOT NULL, -- Storage에서의 경로
    public_url TEXT, -- 공개 URL
    bucket_name VARCHAR(100) DEFAULT 'uploads', -- Storage 버킷명
    
    -- 메타데이터
    is_image BOOLEAN DEFAULT FALSE, -- 이미지 파일 여부
    image_width INTEGER, -- 이미지 너비 (이미지인 경우)
    image_height INTEGER, -- 이미지 높이 (이미지인 경우)
    
    -- 업로드 정보
    uploaded_by UUID, -- 업로드한 사용자
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 104857600) -- 최대 100MB
);

-- 4. work_journal_comments 테이블 (댓글 시스템)
CREATE TABLE IF NOT EXISTS work_journal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_journal_id UUID NOT NULL REFERENCES work_journals(id) ON DELETE CASCADE,
    
    -- 댓글 내용
    content TEXT NOT NULL,
    
    -- 작성자 정보
    author_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    
    -- 댓글 타입
    comment_type VARCHAR(20) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'feedback', 'approval', 'question')),
    
    -- 시간 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 답글 기능 (선택사항)
    parent_comment_id UUID REFERENCES work_journal_comments(id) ON DELETE CASCADE
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_work_journals_user_id ON work_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_author_id ON work_journals(author_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_date ON work_journals(date);
CREATE INDEX IF NOT EXISTS idx_work_journals_status ON work_journals(status);
CREATE INDEX IF NOT EXISTS idx_work_journals_created_at ON work_journals(created_at);
CREATE INDEX IF NOT EXISTS idx_work_journals_project_id ON work_journals(project_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_task_id ON work_journals(task_id);

-- 첨부파일 인덱스
CREATE INDEX IF NOT EXISTS idx_work_journal_attachments_journal_id ON work_journal_attachments(work_journal_id);
CREATE INDEX IF NOT EXISTS idx_work_journal_attachments_uploaded_by ON work_journal_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_work_journal_attachments_is_image ON work_journal_attachments(is_image);

-- 댓글 인덱스
CREATE INDEX IF NOT EXISTS idx_work_journal_comments_journal_id ON work_journal_comments(work_journal_id);
CREATE INDEX IF NOT EXISTS idx_work_journal_comments_author_id ON work_journal_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_work_journal_comments_created_at ON work_journal_comments(created_at);

-- 6. 자동 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_work_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_work_journal_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_work_journals_updated_at_trigger
    BEFORE UPDATE ON work_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_work_journals_updated_at();

CREATE TRIGGER update_work_journal_comments_updated_at_trigger
    BEFORE UPDATE ON work_journal_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_work_journal_comments_updated_at();

-- 7. 첨부파일 개수 업데이트 함수
CREATE OR REPLACE FUNCTION update_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE work_journals 
        SET 
            attachment_count = attachment_count + 1,
            has_attachments = TRUE
        WHERE id = NEW.work_journal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE work_journals 
        SET 
            attachment_count = GREATEST(attachment_count - 1, 0),
            has_attachments = (attachment_count > 1)
        WHERE id = OLD.work_journal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 첨부파일 개수 트리거
CREATE TRIGGER update_attachment_count_trigger
    AFTER INSERT OR DELETE ON work_journal_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_attachment_count();

-- 8. RLS (Row Level Security) 정책 설정
ALTER TABLE work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_journal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_journal_comments ENABLE ROW LEVEL SECURITY;

-- 업무일지 정책
-- 조회: 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone can view work journals" ON work_journals
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 생성: 인증된 사용자가 생성 가능
CREATE POLICY "Authenticated users can create work journals" ON work_journals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 수정: 작성자 또는 해당 담당자만 수정 가능
CREATE POLICY "Authors and owners can update work journals" ON work_journals
    FOR UPDATE USING (
        auth.uid()::text = author_id::text 
        OR auth.uid()::text = user_id::text
        OR auth.uid() IN (
            SELECT id::uuid FROM users WHERE role IN ('admin', 'manager')
        )
    );

-- 삭제: 작성자 또는 관리자만 삭제 가능
CREATE POLICY "Authors and admins can delete work journals" ON work_journals
    FOR DELETE USING (
        auth.uid()::text = author_id::text 
        OR auth.uid() IN (
            SELECT id::uuid FROM users WHERE role IN ('admin', 'manager')
        )
    );

-- 첨부파일 정책
CREATE POLICY "Anyone can view attachments" ON work_journal_attachments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload attachments" ON work_journal_attachments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can manage their attachments" ON work_journal_attachments
    FOR ALL USING (
        work_journal_id IN (
            SELECT id FROM work_journals 
            WHERE author_id::text = auth.uid()::text 
               OR user_id::text = auth.uid()::text
        )
    );

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON work_journal_comments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments" ON work_journal_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their comments" ON work_journal_comments
    FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Authors and admins can delete comments" ON work_journal_comments
    FOR DELETE USING (
        auth.uid()::text = author_id::text 
        OR auth.uid() IN (
            SELECT id::uuid FROM users WHERE role IN ('admin', 'manager')
        )
    );

-- 9. 유용한 뷰 생성
CREATE OR REPLACE VIEW work_journals_with_stats AS
SELECT 
    wj.*,
    COALESCE(att.attachment_count, 0) as actual_attachment_count,
    COALESCE(com.comment_count, 0) as comment_count,
    CASE 
        WHEN wj.status = 'completed' THEN '완료'
        WHEN wj.status = 'in-progress' THEN '진행중'
        WHEN wj.status = 'delayed' THEN '지연'
        WHEN wj.status = 'not-started' THEN '시작전'
        WHEN wj.status = 'on-hold' THEN '보류'
        ELSE wj.status
    END as status_korean
FROM work_journals wj
LEFT JOIN (
    SELECT work_journal_id, COUNT(*) as attachment_count
    FROM work_journal_attachments
    GROUP BY work_journal_id
) att ON wj.id = att.work_journal_id
LEFT JOIN (
    SELECT work_journal_id, COUNT(*) as comment_count
    FROM work_journal_comments
    GROUP BY work_journal_id
) com ON wj.id = com.work_journal_id;

-- 10. 테이블 코멘트
COMMENT ON TABLE work_journals IS '업무일지 메인 테이블';
COMMENT ON TABLE work_journal_attachments IS '업무일지 첨부파일 테이블';
COMMENT ON TABLE work_journal_comments IS '업무일지 댓글 테이블';

COMMENT ON COLUMN work_journals.content IS '업무 내용 (HTML 형식 지원)';
COMMENT ON COLUMN work_journals.status IS '업무 상태: not-started, in-progress, delayed, completed, on-hold';
COMMENT ON COLUMN work_journals.mood IS '업무 기분/상태 (선택사항)';
COMMENT ON COLUMN work_journals.productivity_score IS '생산성 점수 (1-10)';
COMMENT ON COLUMN work_journal_attachments.storage_path IS 'Supabase Storage에서의 파일 경로';
COMMENT ON COLUMN work_journal_comments.comment_type IS '댓글 타입: comment, feedback, approval, question';

-- 11. 샘플 데이터 삽입 (선택사항)
-- INSERT INTO work_journals (title, content, user_id, author_id, author_name, status) 
-- VALUES 
-- ('샘플 업무일지', '<p>오늘의 주요 업무 내용입니다.</p>', 'user-uuid', 'author-uuid', '홍길동', 'in-progress');

-- 실행 완료 메시지
SELECT 'Work Journals 테이블 시스템이 성공적으로 생성되었습니다!' as result; 