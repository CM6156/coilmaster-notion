-- 업무 첨부 파일 관리를 위한 테이블 생성

-- 1. task_attachments 테이블 생성
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    link_url TEXT,
    link_title TEXT,
    link_description TEXT,
    attachment_type VARCHAR(10) NOT NULL CHECK (attachment_type IN ('file', 'link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. task-files 스토리지 버킷 생성 (Supabase 콘솔에서 수동으로 생성 필요)
-- 버킷 이름: task-files
-- 공개 접근: true

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_type ON task_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_task_attachments_created_at ON task_attachments(created_at);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can view task attachments" ON task_attachments
    FOR SELECT USING (true);

-- 인증된 사용자만 삽입 가능
CREATE POLICY "Authenticated users can insert task attachments" ON task_attachments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 업데이트 가능
CREATE POLICY "Authenticated users can update task attachments" ON task_attachments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete task attachments" ON task_attachments
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_task_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 업데이트 트리거 생성
CREATE TRIGGER update_task_attachments_updated_at
    BEFORE UPDATE ON task_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_attachments_updated_at();

-- 7. 제약 조건 추가
-- 파일 첨부의 경우 file_id가 필수, 링크의 경우 link_url과 link_title이 필수
ALTER TABLE task_attachments ADD CONSTRAINT check_file_attachment 
    CHECK (
        (attachment_type = 'file' AND file_id IS NOT NULL AND link_url IS NULL AND link_title IS NULL) OR
        (attachment_type = 'link' AND file_id IS NULL AND link_url IS NOT NULL AND link_title IS NOT NULL)
    );

-- 8. 코멘트 추가
COMMENT ON TABLE task_attachments IS '업무 첨부 파일 및 링크 관리 테이블';
COMMENT ON COLUMN task_attachments.task_id IS '업무 ID (외래키)';
COMMENT ON COLUMN task_attachments.file_id IS '파일 ID (파일 첨부 시)';
COMMENT ON COLUMN task_attachments.link_url IS '링크 URL (링크 첨부 시)';
COMMENT ON COLUMN task_attachments.link_title IS '링크 제목 (링크 첨부 시)';
COMMENT ON COLUMN task_attachments.link_description IS '링크 설명 (선택사항)';
COMMENT ON COLUMN task_attachments.attachment_type IS '첨부 타입 (file 또는 link)';

-- 9. 샘플 데이터 삽입 (선택사항)
-- INSERT INTO task_attachments (task_id, link_url, link_title, link_description, attachment_type)
-- VALUES 
--     ('task-uuid-here', 'https://example.com', '예시 링크', '링크 설명', 'link');

-- 10. 뷰 생성 (업무와 첨부 파일 조인)
CREATE OR REPLACE VIEW task_attachments_with_files AS
SELECT 
    ta.*,
    f.original_filename,
    f.filename,
    f.content_type,
    f.file_size,
    f.file_path
FROM task_attachments ta
LEFT JOIN files f ON ta.file_id = f.id
ORDER BY ta.created_at DESC; 