# LINE API 실제 연동 완료! 🚀

## 개요

이제 프론트엔드와 백엔드가 완전히 연동되어 실제 LINE API 호출이 가능합니다!

## 🔧 서버 시작 방법

### 1. 백엔드 서버 시작 (먼저 실행!)

```bash
# 백엔드 서버 폴더로 이동
cd server

# 의존성 설치 (처음만)
npm install

# 서버 시작
npm start
```

**백엔드 서버가 http://localhost:8082 에서 실행됩니다.**

### 2. 프론트엔드 서버 시작

```bash
# 루트 폴더에서 (새 터미널)
npm run dev
```

**프론트엔드가 http://localhost:8080 (또는 8081/8082) 에서 실행됩니다.**

## ✅ 현재 설정 상태

### 백엔드 (server/.env)
- ✅ LINE_ACCESS_TOKEN: 설정 완료
- ✅ LINE_CHANNEL_SECRET: 설정 완료
- ✅ PORT: 8082

### 프론트엔드 (vite.config.ts)
- ✅ API 프록시: `/api` → `http://localhost:8082`
- ✅ CORS 설정: 백엔드에서 프론트엔드 허용

### LINE API 연동
- ✅ `/api/line/verify-token` - 토큰 검증
- ✅ `/api/line/send-message` - 개별 메시지 발송
- ✅ `/api/line/send-group-message` - 그룹 메시지 발송

## 🎯 사용 방법

### 1. LINE 봇 설정 테스트

1. **관리자 패널** → **외부 알림 관리** 접속
2. **LINE 설정** 탭 클릭
3. **Channel Access Token** 입력 (이미 서버에 설정된 토큰 사용 가능)
4. **연결 테스트** 버튼 클릭

**결과**: 실제 LINE API가 호출되어 봇 정보를 가져옵니다!

### 2. 메시지 발송 테스트

1. **LINE 사용자 관리**에서 사용자 추가
2. **테스트 메시지 발송** 버튼 클릭

**결과**: 실제 LINE 사용자에게 메시지가 발송됩니다!

### 3. 그룹 메시지 테스트

1. **LINE 그룹 ID** 입력
2. **그룹 테스트 메시지** 버튼 클릭

**결과**: 실제 LINE 그룹에 메시지가 발송됩니다!

## 📝 API 엔드포인트

### 백엔드 서버 (http://localhost:8082)

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| POST | `/api/line/verify-token` | LINE 토큰 검증 |
| POST | `/api/line/send-message` | 개별 사용자에게 메시지 발송 |
| POST | `/api/line/send-group-message` | 그룹에 메시지 발송 |
| GET | `/api/line/info` | LINE 봇 정보 조회 |
| POST | `/api/line/webhook` | LINE Webhook 처리 |

### 프론트엔드에서 호출

```javascript
// 토큰 검증
fetch('/api/line/verify-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channelAccessToken: 'YOUR_TOKEN'
  })
})

// 메시지 발송
fetch('/api/line/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channelAccessToken: 'YOUR_TOKEN',
    to: 'USER_ID',
    messages: [{ type: 'text', text: '안녕하세요!' }]
  })
})
```

## 🔍 문제 해결

### 백엔드 서버 연결 실패
**에러**: "백엔드 서버가 실행되지 않았습니다"

**해결방법**:
1. 백엔드 서버가 실행 중인지 확인: `http://localhost:8082`
2. 서버 재시작: `cd server && npm start`
3. 포트 충돌 확인

### LINE API 호출 실패
**에러**: "Channel Access Token이 유효하지 않습니다"

**해결방법**:
1. LINE Developers Console에서 토큰 확인
2. `server/.env` 파일의 `LINE_ACCESS_TOKEN` 업데이트
3. 서버 재시작

### CORS 오류
**에러**: "Access to fetch at ... has been blocked by CORS"

**해결방법**:
1. 백엔드 서버가 올바른 CORS 설정을 가지고 있는지 확인
2. 프론트엔드 URL이 백엔드 CORS 허용 목록에 있는지 확인

## 🎉 성공 확인

다음과 같은 메시지를 보면 성공입니다:

- ✅ "LINE 봇 'CoilMaster Bot'에 성공적으로 연결되었습니다"
- ✅ "테스트 메시지 발송 성공"
- ✅ "LINE 그룹 테스트 메시지 발송 성공"

## 📋 체크리스트

- [ ] 백엔드 서버 실행 확인 (http://localhost:8082)
- [ ] 프론트엔드 서버 실행 확인 (http://localhost:8080)
- [ ] LINE 토큰 검증 성공
- [ ] 테스트 메시지 발송 성공
- [ ] 그룹 메시지 발송 성공

## 🚀 프로덕션 배포

프로덕션 환경에서는:

1. **환경 변수 보안**: `.env` 파일을 서버에 안전하게 설정
2. **HTTPS 필수**: SSL 인증서 설정
3. **도메인 설정**: CORS에 실제 도메인 추가
4. **Webhook URL**: LINE Developers Console에서 실제 Webhook URL 설정

---

이제 완전한 LINE API 연동이 완료되었습니다! 🎉 