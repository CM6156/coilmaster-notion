# 📱 외부 알림 시스템 설정 가이드

이 가이드는 라인(LINE)과 텔레그램(Telegram) 외부 알림을 설정하는 방법을 안내합니다.

## 🔧 현재 상태

현재 시스템은 **시뮬레이션 모드**로 실행됩니다:
- ✅ 관리자 패널에서 즉시 발송 버튼 클릭 가능
- ✅ 콘솔에 상세한 발송 로그 출력
- ✅ 성공/실패 통계 표시
- ⚠️ **실제 외부 알림은 발송되지 않음**

## 🚀 실제 외부 알림 설정 방법

### 1단계: 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 시뮬레이션 모드 비활성화 (실제 발송 활성화)
VITE_SIMULATION_MODE=true

# 백엔드 서버 URL
VITE_LINE_PROXY_URL=http://localhost:8082

# Supabase 설정
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot Token
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# LINE Channel Access Token
VITE_LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
VITE_LINE_CHANNEL_SECRET=your_line_channel_secret
```

### 2단계: 백엔드 서버 설치 및 실행

#### 2-1. 필요한 패키지 설치
```bash
npm install express cors axios dotenv
```

#### 2-2. 백엔드 서버 실행
```bash
node backend-server.js
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
🚀 외부 알림 API 서버가 포트 8082에서 실행 중입니다.
📋 Health Check: http://localhost:8082/health
```

### 3단계: API 토큰 발급

#### LINE Messaging API 설정
1. [LINE Developers Console](https://developers.line.biz/) 접속
2. 새 프로바이더 생성 또는 기존 프로바이더 선택
3. Messaging API 채널 생성
4. 다음 정보 복사:
   - Channel Access Token
   - Channel Secret

#### Telegram Bot 설정
1. Telegram에서 @BotFather와 대화 시작
2. `/newbot` 명령어로 새 봇 생성
3. 봇 이름과 사용자명 설정
4. 발급받은 Bot Token 복사

### 4단계: 관리자 패널에서 설정 확인

1. 관리자 패널 → 외부 알림 관리 접속
2. Telegram/LINE 탭에서 토큰 정보 입력
3. "연결 테스트" 버튼으로 설정 확인
4. 사용자와 그룹 ID 수집

## 🧪 테스트 방법

### 개발 환경에서 테스트
```bash
# 1. 프론트엔드 실행
npm run dev

# 2. 백엔드 서버 실행 (새 터미널)
node backend-server.js

# 3. 브라우저에서 http://localhost:8081 접속
# 4. 관리자 패널 → 외부 알림 관리에서 즉시 발송 테스트
```

### Health Check
백엔드 서버 상태 확인:
```bash
curl http://localhost:8082/health
```

예상 응답:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "env": {
    "hasLineToken": true,
    "hasTelegramToken": true
  }
}
```

## 📊 로그 확인

### 브라우저 개발자 도구 (F12)
```javascript
// 콘솔에서 다음과 같은 로그 확인:
🚀 외부 알림 발송 시작
📊 모드: 시뮬레이션 모드 // 또는 실제 발송 모드
📁 프로젝트: Parking Transformer
📋 업무 개수: 15
📱 LINE 알림 발송 시작
👥 활성 LINE 사용자: 3 명
📤 LINE 개별 발송: David (U1234567890)
✅ LINE 개별 알림 발송 성공: David
```

### 백엔드 서버 로그
```
📱 LINE API 호출 시작: { to: 'U1234567890', messageCount: 1 }
✅ LINE API 성공: 200
🤖 Telegram API 호출 시작: { chatId: '123456789', textLength: 245 }
✅ Telegram API 성공: 200
```

## ⚠️ 주의사항

1. **토큰 보안**: API 토큰은 절대 public 저장소에 커밋하지 마세요
2. **CORS 설정**: 프로덕션에서는 CORS 정책을 적절히 설정하세요
3. **Rate Limiting**: API 호출 제한을 고려하여 대량 발송 시 주의하세요
4. **에러 핸들링**: 네트워크 오류나 API 제한에 대한 처리를 고려하세요

## 🐛 문제 해결

### 자주 발생하는 오류

#### 1. "프록시 서버에 연결할 수 없습니다"
- 백엔드 서버가 실행 중인지 확인
- 포트 8082가 사용 중인지 확인

#### 2. "Telegram Bot Token이 유효하지 않습니다"
- @BotFather에서 발급받은 토큰이 정확한지 확인
- 환경변수에 올바르게 설정되었는지 확인

#### 3. "LINE Channel Access Token이 유효하지 않습니다"
- LINE Developers Console에서 토큰을 다시 확인
- 토큰이 만료되지 않았는지 확인

#### 4. "시뮬레이션 모드에서 벗어나지 않습니다"
- `.env` 파일에서 `VITE_SIMULATION_MODE=false` 설정
- 브라우저에서 새로고침 (Ctrl+F5)

## 📞 지원

문제가 계속 발생하면 다음을 확인하세요:
1. 콘솔 로그의 자세한 에러 메시지
2. 백엔드 서버 로그
3. 네트워크 탭에서 API 호출 상태
4. 환경변수 설정 상태 