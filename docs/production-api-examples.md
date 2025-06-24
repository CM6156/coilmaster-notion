# 프로덕션 환경 LINE API 연동 가이드

## 개요

프론트엔드에서 CORS 문제 없이 LINE API를 사용하기 위해 백엔드 서버가 필요합니다.
다음은 각종 백엔드 프레임워크별 구현 예제입니다.

## Node.js/Express 예제

### 1. LINE 토큰 검증 API

```javascript
// /api/line/verify-token
app.post('/api/line/verify-token', async (req, res) => {
  try {
    const { channelAccessToken } = req.body;
    
    if (!channelAccessToken) {
      return res.status(400).json({ error: 'Channel Access Token이 필요합니다.' });
    }

    // LINE API 호출
    const response = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const botInfo = await response.json();
      res.json({
        success: true,
        displayName: botInfo.displayName,
        userId: botInfo.userId,
        pictureUrl: botInfo.pictureUrl
      });
    } else {
      const errorData = await response.json();
      res.status(400).json({
        success: false,
        error: errorData.message || '토큰이 유효하지 않습니다.'
      });
    }
  } catch (error) {
    console.error('LINE 토큰 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});
```

### 2. LINE 개별 메시지 발송 API

```javascript
// /api/line/send-message
app.post('/api/line/send-message', async (req, res) => {
  try {
    const { channelAccessToken, to, messages } = req.body;
    
    if (!channelAccessToken || !to || !messages) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages
      })
    });

    if (response.ok) {
      res.json({ success: true, message: '메시지가 성공적으로 발송되었습니다.' });
    } else {
      const errorData = await response.json();
      res.status(400).json({
        success: false,
        error: errorData.message || '메시지 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('LINE 메시지 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});
```

### 3. LINE 그룹 메시지 발송 API

```javascript
// /api/line/send-group-message
app.post('/api/line/send-group-message', async (req, res) => {
  try {
    const { channelAccessToken, to, messages } = req.body;
    
    if (!channelAccessToken || !to || !messages) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages
      })
    });

    if (response.ok) {
      res.json({ success: true, message: '그룹 메시지가 성공적으로 발송되었습니다.' });
    } else {
      const errorData = await response.json();
      res.status(400).json({
        success: false,
        error: errorData.message || '그룹 메시지 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('LINE 그룹 메시지 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});
```

## Python/Flask 예제

### 1. LINE 토큰 검증 API

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/api/line/verify-token', methods=['POST'])
def verify_line_token():
    try:
        data = request.json
        channel_access_token = data.get('channelAccessToken')
        
        if not channel_access_token:
            return jsonify({'error': 'Channel Access Token이 필요합니다.'}), 400
        
        headers = {
            'Authorization': f'Bearer {channel_access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get('https://api.line.me/v2/bot/info', headers=headers)
        
        if response.status_code == 200:
            bot_info = response.json()
            return jsonify({
                'success': True,
                'displayName': bot_info.get('displayName'),
                'userId': bot_info.get('userId'),
                'pictureUrl': bot_info.get('pictureUrl')
            })
        else:
            error_data = response.json()
            return jsonify({
                'success': False,
                'error': error_data.get('message', '토큰이 유효하지 않습니다.')
            }), 400
            
    except Exception as e:
        print(f'LINE 토큰 검증 오류: {e}')
        return jsonify({
            'success': False,
            'error': '서버 오류가 발생했습니다.'
        }), 500
```

### 2. LINE 메시지 발송 API

```python
@app.route('/api/line/send-message', methods=['POST'])
def send_line_message():
    try:
        data = request.json
        channel_access_token = data.get('channelAccessToken')
        to = data.get('to')
        messages = data.get('messages')
        
        if not all([channel_access_token, to, messages]):
            return jsonify({'error': '필수 파라미터가 누락되었습니다.'}), 400
        
        headers = {
            'Authorization': f'Bearer {channel_access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'to': to,
            'messages': messages
        }
        
        response = requests.post(
            'https://api.line.me/v2/bot/message/push',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': '메시지가 성공적으로 발송되었습니다.'
            })
        else:
            error_data = response.json()
            return jsonify({
                'success': False,
                'error': error_data.get('message', '메시지 발송에 실패했습니다.')
            }), 400
            
    except Exception as e:
        print(f'LINE 메시지 발송 오류: {e}')
        return jsonify({
            'success': False,
            'error': '서버 오류가 발생했습니다.'
        }), 500
```

## Java/Spring Boot 예제

### 1. LINE 토큰 검증 API

```java
@RestController
@RequestMapping("/api/line")
public class LineController {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @PostMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestBody Map<String, String> request) {
        try {
            String channelAccessToken = request.get("channelAccessToken");
            
            if (channelAccessToken == null || channelAccessToken.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Channel Access Token이 필요합니다."));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + channelAccessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.line.me/v2/bot/info",
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> botInfo = response.getBody();
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "displayName", botInfo.get("displayName"),
                    "userId", botInfo.get("userId"),
                    "pictureUrl", botInfo.get("pictureUrl")
                ));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "토큰이 유효하지 않습니다."));
            }
            
        } catch (Exception e) {
            logger.error("LINE 토큰 검증 오류: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "서버 오류가 발생했습니다."));
        }
    }
    
    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> request) {
        try {
            String channelAccessToken = (String) request.get("channelAccessToken");
            String to = (String) request.get("to");
            List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
            
            if (channelAccessToken == null || to == null || messages == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "필수 파라미터가 누락되었습니다."));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + channelAccessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> payload = Map.of(
                "to", to,
                "messages", messages
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.line.me/v2/bot/message/push",
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "메시지가 성공적으로 발송되었습니다."
                ));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "메시지 발송에 실패했습니다."));
            }
            
        } catch (Exception e) {
            logger.error("LINE 메시지 발송 오류: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "서버 오류가 발생했습니다."));
        }
    }
}
```

## 프로덕션 배포 시 고려사항

### 1. 환경 변수 설정
- LINE Channel Access Token을 환경 변수로 관리
- API 키 보안 강화

### 2. 에러 처리
- API 호출 실패 시 재시도 로직
- 로그 기록 및 모니터링

### 3. 속도 제한
- LINE API 호출 제한 준수
- 요청 큐잉 시스템 구현

### 4. HTTPS 필수
- 프로덕션 환경에서는 반드시 HTTPS 사용
- SSL 인증서 설정

## 현재 프론트엔드 동작

1. **개발 환경**: 시뮬레이션 모드로 동작
2. **프로덕션 환경**: 
   - 백엔드 API가 있으면 실제 LINE API 호출
   - 백엔드 API가 없으면 시뮬레이션으로 대체
   - 사용자에게 명확한 안내 제공

이를 통해 개발 중에는 CORS 문제 없이 작업할 수 있고, 프로덕션에서는 실제 LINE API를 안전하게 사용할 수 있습니다. 