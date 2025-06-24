-- 업무 일지 테이블 생성 (간단 버전)
CREATE TABLE work_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID,
    author_id UUID,
    author_name VARCHAR(255),
    project_id UUID,
    task_id UUID,
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_work_journals_user_id ON work_journals(user_id);
CREATE INDEX idx_work_journals_date ON work_journals(date);
CREATE INDEX idx_work_journals_created_at ON work_journals(created_at);

-- RLS 활성화
ALTER TABLE work_journals ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능한 정책 (임시)
CREATE POLICY "Allow all users to view work journals" ON work_journals FOR SELECT USING (true);

-- 인증된 사용자가 생성 가능한 정책
CREATE POLICY "Allow authenticated users to create work journals" ON work_journals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 작성자가 수정 가능한 정책
CREATE POLICY "Allow authors to update their work journals" ON work_journals FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid()::text = author_id::text);

-- 작성자가 삭제 가능한 정책
CREATE POLICY "Allow authors to delete their work journals" ON work_journals FOR DELETE USING (auth.uid()::text = user_id::text OR auth.uid()::text = author_id::text); 