-- tasks 테이블의 RLS 정책 수정
-- INSERT와 DELETE 정책 추가

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

-- 코멘트 추가
COMMENT ON TABLE tasks IS 'Tasks table with updated RLS policies for full CRUD operations'; 