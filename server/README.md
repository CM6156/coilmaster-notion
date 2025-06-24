# LINE API 프록시 서버

이 서버는 프론트엔드에서 LINE API를 직접 호출할 때 발생하는 CORS 문제를 해결하기 위한 프록시 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일에서 다음 값들을 설정하세요:

```env
LINE_ACCESS_TOKEN=your_line_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
PORT=8080
```

### 3. 서버 실행

**개발 모드 (nodemon):**
```bash
npm run dev
```

**프로덕션 모드:**
```bash
npm start
```

서버가 성공적으로 시작되면 `http://localhost:8080`에서 접근할 수 있습니다.

## 📋 API 엔드포인트

### 기본 정보
- **GET** `/` - 서버 상태 및 사용 가능한 엔드포인트 확인

### LINE 메시지 발송
- **POST** `/api/line/send`
- LINE Bot API를 통해 메시지를 발송합니다.

**요청 예시:**
```json
{
  "to": "USER_ID",
  "messages": [
    {
      "type": "text",
      "text": "안녕하세요!"
    }
  ]
}
```

### LINE 사용자 프로필 조회
- **GET** `/api/line/profile/:userId`
- 특정 사용자의 프로필 정보를 조회합니다.

### LINE Webhook 처리
- **POST** `/api/line/webhook`
- LINE에서 보내는 Webhook 이벤트를 처리합니다.
- 사용자가 메시지를 보내거나 봇을 친구 추가/삭제할 때 호출됩니다.

### LINE 그룹 정보 조회
- **GET** `/api/line/group/:groupId`
- 그룹/채팅방의 정보를 조회합니다.

## 🔧 프론트엔드에서 사용법

기존에 직접 LINE API를 호출하던 코드를:

```javascript
// ❌ 기존 (CORS 오류 발생)
fetch('https://api.line.me/v2/bot/message/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(data)
});
```

다음과 같이 변경하세요:

```javascript
// ✅ 수정 (프록시 서버 사용)
fetch('http://localhost:8080/api/line/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## 🌐 LINE Developer Console 설정

### Webhook URL 등록
LINE Developer Console에서 다음 URL을 Webhook URL로 등록하세요:

**로컬 개발:**
- ngrok 등을 사용하여 로컬 서버를 외부에 노출: `https://your-ngrok-url.ngrok.io/api/line/webhook`

**프로덕션:**
- 실제 서버 도메인: `https://your-domain.com/api/line/webhook`

⚠️ **중요:** LINE은 HTTPS URL만 허용하므로, 프로덕션에서는 반드시 SSL 인증서가 필요합니다.

## 🔐 보안 고려사항

1. **환경 변수 보호**: `.env` 파일은 절대 git에 커밋하지 마세요.
2. **CORS 설정**: 필요한 도메인만 허용하도록 CORS를 설정하세요.
3. **Webhook 검증**: 프로덕션에서는 LINE Webhook 서명 검증을 구현하세요.

## 📝 로그

서버는 다음과 같은 상세한 로그를 제공합니다:

- 📤 LINE 메시지 발송 요청/응답
- 👤 사용자 프로필 조회
- 🎯 Webhook 이벤트 수신
- 💬 사용자 메시지 내용
- 👥 팔로우/언팔로우 이벤트

## 🚨 문제 해결

### 서버가 시작되지 않는 경우
1. Node.js 버전 확인 (14.0.0 이상 필요)
2. 환경 변수 설정 확인
3. 포트 충돌 확인

### LINE API 호출 실패
1. `LINE_ACCESS_TOKEN` 확인
2. `LINE_CHANNEL_SECRET` 확인
3. LINE Developer Console에서 Bot 설정 확인

### Webhook 수신되지 않음
1. Webhook URL이 HTTPS인지 확인
2. 외부에서 접근 가능한 URL인지 확인
3. LINE Developer Console에서 Webhook 설정 확인

## 🎯 ExternalNotificationManagement.tsx에서 사용

기존 코드를 다음과 같이 수정하세요:

```typescript
// 기존 LINE API 호출 부분을 프록시 서버로 변경
const sendLineMessage = async (userId: string, message: string) => {
  try {
    const response = await fetch('http://localhost:8080/api/line/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('메시지 발송 실패');
    }

    const result = await response.json();
    console.log('메시지 발송 성공:', result);
  } catch (error) {
    console.error('메시지 발송 오류:', error);
  }
};
```

이제 CORS 오류 없이 LINE API를 사용할 수 있습니다! 🎉 