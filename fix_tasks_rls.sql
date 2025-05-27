-- tasks 테이블의 RLS 정책 수정
-- 이 스크립트를 Supabase 대시보드의 SQL 편집기에서 실행하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Assigned users can update tasks" ON tasks;

-- 새로운 RLS 정책 생성
CREATE POLICY "Enable read access for all users" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- 변경사항 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tasks'; 