-- 업무일지 테이블 생성
CREATE TABLE IF NOT EXISTS work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('진행중', '완료', '보류')) DEFAULT '진행중',
  priority TEXT CHECK (priority IN ('높음', '보통', '낮음')) DEFAULT '보통',
  tags TEXT[], -- 태그 배열
  attachments JSONB DEFAULT '[]'::jsonb, -- 첨부파일 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_log_date ON work_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_work_logs_status ON work_logs(status);
CREATE INDEX IF NOT EXISTS idx_work_logs_created_at ON work_logs(created_at);

-- RLS 정책 활성화
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 모든 사용자는 자신의 업무일지를 조회, 생성, 수정, 삭제할 수 있음
CREATE POLICY "Users can view their own work logs" ON work_logs
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own work logs" ON work_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own work logs" ON work_logs
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own work logs" ON work_logs
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 관리자는 모든 업무일지를 조회할 수 있음 (선택사항)
CREATE POLICY "Admins can view all work logs" ON work_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'manager')
    )
  );

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_work_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_work_logs_updated_at ON work_logs;
CREATE TRIGGER trigger_update_work_logs_updated_at
  BEFORE UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_work_logs_updated_at();

-- 샘플 데이터 (선택사항)
-- INSERT INTO work_logs (user_id, title, content, status, priority) VALUES
-- ((SELECT id FROM users LIMIT 1), '프로젝트 기획서 작성', '새로운 프로젝트의 기획서를 작성하고 검토를 진행했습니다.', '완료', '높음'),
-- ((SELECT id FROM users LIMIT 1), '회의 참석', '주간 팀 회의에 참석하여 진행 상황을 공유했습니다.', '완료', '보통');

-- 통계 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW work_logs_stats AS
SELECT 
  u.name as user_name,
  u.id as user_id,
  COUNT(*) as total_logs,
  COUNT(CASE WHEN wl.status = '완료' THEN 1 END) as completed_logs,
  COUNT(CASE WHEN wl.status = '진행중' THEN 1 END) as in_progress_logs,
  COUNT(CASE WHEN wl.status = '보류' THEN 1 END) as on_hold_logs,
  ROUND(
    COUNT(CASE WHEN wl.status = '완료' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as completion_rate
FROM users u
LEFT JOIN work_logs wl ON u.id = wl.user_id
GROUP BY u.id, u.name
ORDER BY total_logs DESC; 