# Supabase Storage 버킷 설정 가이드

이 문서는 Coilmaster 프로젝트에서 필요한 Supabase Storage 버킷을 설정하는 방법을 설명합니다.

## 필요한 버킷들

### 1. project-files
- **용도**: 프로젝트 관련 파일 저장
- **크기 제한**: 50MB
- **허용 파일 타입**: 이미지, PDF, 문서, 압축파일
- **공개**: Yes

### 2. documents  
- **용도**: 업무 문서 저장
- **크기 제한**: 50MB
- **허용 파일 타입**: 이미지, PDF, 문서, 압축파일
- **공개**: Yes

### 3. avatars
- **용도**: 사용자 프로필 이미지
- **크기 제한**: 5MB
- **허용 파일 타입**: 이미지 파일만
- **공개**: Yes

### 4. temp-files
- **용도**: 임시 파일 저장
- **크기 제한**: 100MB
- **허용 파일 타입**: 모든 타입
- **공개**: No

## 설정 방법

### 방법 1: Supabase 대시보드에서 수동 생성

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 로그인
   - 프로젝트 선택

2. **Storage 메뉴로 이동**
   - 좌측 메뉴에서 "Storage" 클릭

3. **버킷 생성**
   - "Create bucket" 버튼 클릭
   - 각 버킷별로 다음 설정 적용:

#### project-files 버킷
```
Name: project-files
Public bucket: ✓ (체크)
File size limit: 52428800 (50MB)
Allowed MIME types: 
- image/*
- application/pdf
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- text/plain
- application/zip
- application/x-rar-compressed
```

#### documents 버킷
```
Name: documents
Public bucket: ✓ (체크)
File size limit: 52428800 (50MB)
Allowed MIME types: (project-files와 동일)
```

#### avatars 버킷
```
Name: avatars
Public bucket: ✓ (체크)
File size limit: 5242880 (5MB)
Allowed MIME types:
- image/jpeg
- image/png
- image/gif
- image/webp
```

#### temp-files 버킷
```
Name: temp-files
Public bucket: ✗ (체크 해제)
File size limit: 104857600 (100MB)
Allowed MIME types: */* (모든 타입)
```

### 방법 2: SQL 마이그레이션 실행

1. **마이그레이션 파일 실행**
   ```sql
   -- supabase/migrations/20240127000000_create_storage_buckets.sql 파일 내용을
   -- Supabase 대시보드의 SQL Editor에서 실행
   ```

2. **SQL Editor 접속**
   - Supabase 대시보드 > SQL Editor
   - 마이그레이션 파일 내용 복사 & 붙여넣기
   - "Run" 버튼 클릭

### 방법 3: JavaScript 스크립트 실행

1. **환경 설정**
   ```bash
   # Service Role Key 설정 (Supabase 대시보드 > Settings > API에서 확인)
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **스크립트 실행**
   ```bash
   node scripts/create-storage-buckets.js
   ```

## RLS (Row Level Security) 정책

각 버킷에 대해 다음 정책들이 자동으로 설정됩니다:

### 기본 정책
- **SELECT**: 모든 사용자가 파일 조회 가능
- **INSERT**: 인증된 사용자만 파일 업로드 가능
- **UPDATE/DELETE**: 파일 소유자만 수정/삭제 가능

### 사용자별 폴더 구조
파일은 다음과 같은 구조로 저장됩니다:
```
bucket-name/
├── user-id-1/
│   ├── file1.pdf
│   └── file2.jpg
├── user-id-2/
│   ├── file3.docx
│   └── file4.png
└── ...
```

## 확인 방법

### 1. 대시보드에서 확인
- Supabase 대시보드 > Storage
- 생성된 버킷들이 목록에 표시되는지 확인

### 2. 코드에서 확인
```javascript
// 버킷 목록 조회
const { data: buckets, error } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets);

// 특정 버킷 존재 확인
const projectFilesBucket = buckets.find(b => b.id === 'project-files');
console.log('project-files bucket:', projectFilesBucket);
```

### 3. 파일 업로드 테스트
```javascript
// 테스트 파일 업로드
const { data, error } = await supabase.storage
  .from('project-files')
  .upload('test/sample.txt', new Blob(['Hello World'], { type: 'text/plain' }));

if (error) {
  console.error('Upload failed:', error);
} else {
  console.log('Upload successful:', data);
}
```

## 문제 해결

### 버킷 생성 실패
- **권한 부족**: Service Role Key가 올바른지 확인
- **이름 중복**: 버킷 이름이 이미 존재하는지 확인
- **설정 오류**: MIME 타입이나 크기 제한 설정 확인

### 파일 업로드 실패
- **인증 문제**: 사용자가 로그인되어 있는지 확인
- **권한 문제**: RLS 정책이 올바르게 설정되어 있는지 확인
- **파일 크기**: 파일이 크기 제한을 초과하지 않는지 확인
- **MIME 타입**: 허용된 파일 타입인지 확인

### 파일 접근 실패
- **URL 확인**: 공개 URL이 올바르게 생성되었는지 확인
- **버킷 설정**: 버킷이 public으로 설정되어 있는지 확인
- **경로 확인**: 파일 경로가 올바른지 확인

## 추가 설정

### CORS 설정 (필요한 경우)
```javascript
// Supabase 클라이언트 설정에서 CORS 허용
const supabase = createClient(url, key, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
});
```

### 파일 압축 설정
대용량 파일의 경우 클라이언트에서 압축 후 업로드하는 것을 권장합니다.

### 백업 정책
중요한 파일들은 정기적으로 백업하는 것을 권장합니다.

---

## 참고 링크
- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [RLS 정책 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript 클라이언트 API](https://supabase.com/docs/reference/javascript/storage-createbucket) 