# 파일 업로드 문제 해결 가이드

## 🔍 문제 진단 체크리스트

### 1단계: 브라우저 콘솔 확인
**F12를 눌러 개발자 도구를 열고 Console 탭에서 다음 오류들을 확인하세요:**

- `❌ Storage 버킷 조회 오류` → Storage 버킷이 생성되지 않음
- `❌ Storage 업로드 오류` → Storage 정책 또는 권한 문제
- `❌ 파일 정보 저장 오류` → files 테이블 문제
- `❌ 첨부파일 연결 오류` → project_attachments 테이블 문제
- `❌ 사용자 인증 오류` → 로그인 상태 문제

### 2단계: Supabase 설정 확인

#### A. Storage 버킷 생성 확인
1. Supabase 대시보드 접속
2. Storage 메뉴 클릭
3. 다음 버킷들이 있는지 확인:
   - `project-files` (공개, 50MB 제한)
   - `task-files` (공개, 50MB 제한)
   - `documents` (공개, 50MB 제한)
   - `avatars` (공개, 5MB 제한)

**버킷이 없다면:**
```sql
-- create_buckets_manual.sql 파일의 전체 내용을 
-- Supabase > SQL Editor에서 실행하세요
```

#### B. RLS 정책 확인
Storage > Policies에서 다음 정책들이 있는지 확인:
- `project_files_select_policy` (조회 허용)
- `project_files_insert_policy` (업로드 허용)
- `project_files_update_policy` (수정 허용)
- `project_files_delete_policy` (삭제 허용)

#### C. 테이블 스키마 확인
1. `files` 테이블 존재 여부
2. `project_attachments` 테이블 존재 여부
3. `projects` 테이블의 `department_id` 컬럼 존재 여부

**테이블 문제가 있다면:**
```sql
-- fix_projects_table_schema.sql 파일을 
-- Supabase > SQL Editor에서 실행하세요
```

### 3단계: 네트워크 확인
- 인터넷 연결 상태
- Supabase 서비스 상태 확인
- 방화벽 설정 확인

### 4단계: 파일 제한 확인
- 파일 크기: 10MB 이하
- 지원 파일 형식:
  - 이미지: jpg, png, gif, webp
  - 문서: pdf, doc, docx, xls, xlsx, txt
  - 압축: zip, rar

## 🛠️ 일반적인 해결 방법

### 방법 1: Storage 버킷 재생성
```sql
-- 1. Supabase > SQL Editor에서 실행
-- create_buckets_manual.sql 전체 내용 실행
```

### 방법 2: 테이블 스키마 수정
```sql
-- 1. Supabase > SQL Editor에서 실행
-- fix_projects_table_schema.sql 전체 내용 실행
```

### 방법 3: 캐시 및 세션 초기화
1. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
2. 로그아웃 후 다시 로그인
3. 페이지 새로고침 (F5)

### 방법 4: 개발 서버 재시작
```bash
# 터미널에서 실행
npm run dev
```

## 🚨 긴급 해결 방법

### 즉시 확인할 사항:
1. **브라우저 콘솔 확인** (F12 → Console)
2. **Network 탭에서 실패한 요청 확인**
3. **Supabase Storage 메뉴에서 버킷 존재 여부 확인**

### 단계별 실행:
```sql
-- 1단계: Supabase SQL Editor에서 실행
SELECT 'Storage 버킷 확인' as step, id, name, public 
FROM storage.buckets 
WHERE id = 'project-files';

-- 2단계: 버킷이 없으면 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- 3단계: 정책 생성
CREATE POLICY "temp_project_files_policy" ON storage.objects
FOR ALL USING (bucket_id = 'project-files');
```

## 📞 추가 지원

문제가 계속 발생하면 다음 정보를 제공해주세요:
1. 브라우저 콘솔의 정확한 오류 메시지
2. Network 탭의 실패한 요청 상세 정보
3. 업로드 시도한 파일의 이름과 크기
4. 현재 사용 중인 브라우저 및 버전

---
*이 문서는 파일 업로드 문제 해결을 위한 완전한 가이드입니다.* 