-- 프로젝트 테이블에 담당자(PIC) 정보 필드 추가
-- 고객사의 담당자 정보를 별도 저장

ALTER TABLE projects ADD COLUMN IF NOT EXISTS pic_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pic_email TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pic_phone TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_projects_pic_name ON projects(pic_name);

-- 코멘트 추가
COMMENT ON COLUMN projects.pic_name IS 'Project PIC (Person in Charge) name from client';
COMMENT ON COLUMN projects.pic_email IS 'Project PIC email from client';
COMMENT ON COLUMN projects.pic_phone IS 'Project PIC phone from client'; 