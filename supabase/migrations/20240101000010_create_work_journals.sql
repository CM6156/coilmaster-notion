-- 업무 일지 메인 테이블
CREATE TABLE public.work_journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'delayed', 'completed')),
  author_id TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 일지 파일 테이블
CREATE TABLE public.work_journal_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  file_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 일지 협업자 테이블
CREATE TABLE public.work_journal_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_work_journals_project_id ON public.work_journals(project_id);
CREATE INDEX idx_work_journals_task_id ON public.work_journals(task_id);
CREATE INDEX idx_work_journals_author_id ON public.work_journals(author_id);
CREATE INDEX idx_work_journals_created_at ON public.work_journals(created_at);
CREATE INDEX idx_work_journals_status ON public.work_journals(status);

CREATE INDEX idx_work_journal_files_journal_id ON public.work_journal_files(work_journal_id);
CREATE INDEX idx_work_journal_collaborators_journal_id ON public.work_journal_collaborators(work_journal_id);
CREATE INDEX idx_work_journal_collaborators_user_id ON public.work_journal_collaborators(user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_journals_updated_at 
    BEFORE UPDATE ON public.work_journals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_collaborators ENABLE ROW LEVEL SECURITY;

-- 업무 일지 정책: 모든 사용자가 읽기 가능, 작성자와 협업자만 수정 가능
CREATE POLICY "Anyone can read work journals" ON public.work_journals
  FOR SELECT USING (true);

CREATE POLICY "Authors can insert work journals" ON public.work_journals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors and collaborators can update work journals" ON public.work_journals
  FOR UPDATE USING (
    author_id = auth.uid()::text 
    OR id::text IN (
      SELECT work_journal_id::text 
      FROM public.work_journal_collaborators 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Authors can delete work journals" ON public.work_journals
  FOR DELETE USING (author_id = auth.uid()::text);

-- 파일 정책
CREATE POLICY "Anyone can read work journal files" ON public.work_journal_files
  FOR SELECT USING (true);

CREATE POLICY "Journal authors can manage files" ON public.work_journal_files
  FOR ALL USING (
    work_journal_id::text IN (
      SELECT id::text FROM public.work_journals 
      WHERE author_id = auth.uid()::text
    )
  );

-- 협업자 정책
CREATE POLICY "Anyone can read collaborators" ON public.work_journal_collaborators
  FOR SELECT USING (true);

CREATE POLICY "Journal authors can manage collaborators" ON public.work_journal_collaborators
  FOR ALL USING (
    work_journal_id::text IN (
      SELECT id::text FROM public.work_journals 
      WHERE author_id = auth.uid()::text
    )
  );

-- 테이블 코멘트
COMMENT ON TABLE public.work_journals IS '업무 일지 메인 테이블';
COMMENT ON TABLE public.work_journal_files IS '업무 일지 첨부파일';
COMMENT ON TABLE public.work_journal_collaborators IS '업무 일지 협업자';

COMMENT ON COLUMN public.work_journals.content IS '업무 내용';
COMMENT ON COLUMN public.work_journals.status IS '업무 상태: not-started, in-progress, delayed, completed';
COMMENT ON COLUMN public.work_journals.author_id IS '작성자 ID (TEXT 타입)';
COMMENT ON COLUMN public.work_journal_files.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN public.work_journal_files.file_url IS '파일 저장 경로 또는 URL'; 