# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/31032f92-72d9-43fd-aafb-ed8c765f7e8d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/31032f92-72d9-43fd-aafb-ed8c765f7e8d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/31032f92-72d9-43fd-aafb-ed8c765f7e8d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 고객 관리 기능

### Supabase 연동
이 시스템은 Supabase와 완전히 연동되어 있어 신규 고객 정보가 실시간으로 데이터베이스에 저장됩니다.

### 주요 기능
- **신규 고객 등록**: 고객사명, 담당자, 국가, 연락처 등 상세 정보 입력
- **실시간 데이터 동기화**: Supabase를 통한 자동 데이터 업데이트
- **고객 정보 수정/삭제**: 기존 고객 정보 편집 및 삭제
- **고객 검색**: 이름, 담당자 등으로 고객 검색

### 클라이언트 테이블 스키마
```sql
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id UUID,
  country VARCHAR(100),
  contact_number VARCHAR(50),
  contact_person VARCHAR(100),
  contact_email VARCHAR(255),
  sales_rep_id UUID,
  requirements TEXT,
  homepage TEXT,
  flag VARCHAR(10),
  remark TEXT,
  files TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 사용 방법
1. 메인 메뉴에서 "고객사 & 협업사 관리" 선택
2. "새 고객사" 버튼 클릭
3. 필수 정보 입력:
   - 고객사명 (필수)
   - 담당자 선택 (필수)
   - 국가
   - 연락처 이메일
   - 요구사항
   - 홈페이지
   - 기타 메모
4. "저장" 버튼으로 Supabase에 데이터 저장

### 데이터베이스 마이그레이션
필요한 경우 다음 명령으로 클라이언트 테이블을 업데이트할 수 있습니다:

```bash
node scripts/migrate-client-table.js
```
