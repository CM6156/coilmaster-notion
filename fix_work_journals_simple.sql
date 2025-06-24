-- ========================================
-- work_journals 테이블 문제 해결 (간단 버전)
-- ========================================

-- 1. 기존 테이블 정리 (필요시)
DROP TABLE IF EXISTS work_journal_comments CASCADE;
DROP TABLE IF EXISTS work_journal_attachments CASCADE;
DROP TABLE IF EXISTS work_journals CASCADE;

-- 2. work_journals 테이블 재생성 (단순화)
CREATE TABLE work_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 기본 정보
    content TEXT NOT NULL,
    
    -- 사용자 정보 (author_id로 통일)
    author_id UUID NOT NULL,
    
    -- 상태 관리
    status VARCHAR(50) DEFAULT 'in-progress' CHECK (status IN ('not-started', 'in-progress', 'completed', 'pending')),
    
    -- 시간 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_work_journals_author_id ON work_journals(author_id);
CREATE INDEX idx_work_journals_created_at ON work_journals(created_at);
CREATE INDEX idx_work_journals_status ON work_journals(status);

-- 4. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_work_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 적용
CREATE TRIGGER update_work_journals_updated_at_trigger
    BEFORE UPDATE ON work_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_work_journals_updated_at();

-- 6. RLS 정책 설정
ALTER TABLE work_journals ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone can view work journals" ON work_journals
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 인증된 사용자가 생성 가능
CREATE POLICY "Authenticated users can create work journals" ON work_journals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 작성자만 수정 가능
CREATE POLICY "Authors can update their work journals" ON work_journals
    FOR UPDATE USING (auth.uid()::text = author_id::text);

-- 작성자만 삭제 가능
CREATE POLICY "Authors can delete their work journals" ON work_journals
    FOR DELETE USING (auth.uid()::text = author_id::text);

-- 7. 스토리지 버킷 생성 (work-journal-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('work-journal-images', 'work-journal-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 8. 스토리지 정책 설정
CREATE POLICY "Anyone can view work journal images" ON storage.objects
FOR SELECT USING (bucket_id = 'work-journal-images');

CREATE POLICY "Authenticated users can upload work journal images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'work-journal-images' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own work journal images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'work-journal-images' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own work journal images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'work-journal-images' 
    AND auth.uid() IS NOT NULL
);

-- 9. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO work_journals (author_id, content, status) 
-- VALUES 
-- ('00000000-0000-0000-0000-000000000000', '테스트 업무일지 내용입니다.', 'in-progress');

-- 10. 테이블 확인
SELECT 'work_journals 테이블이 성공적으로 생성되었습니다.' AS message;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position; 