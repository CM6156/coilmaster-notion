// 전역 데이터 스토어 (실제 프로덕션에서는 데이터베이스 사용)
let collectedUsers = [];
let collectedGroups = [];

// Vercel Serverless Function for LINE Webhook
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-line-signature');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 LINE Webhook 수신:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', req.headers);

    // LINE 서명 검증 (선택사항)
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      console.warn('⚠️ LINE Webhook 서명이 없습니다.');
    }

    // 이벤트 처리
    const events = req.body.events || [];
    const newUsers = [];
    const newGroups = [];
    
    for (const event of events) {
      console.log(`📨 이벤트:`, {
        type: event.type,
        sourceType: event.source?.type,
        userId: event.source?.userId,
        groupId: event.source?.groupId,
        message: event.message?.text,
        timestamp: new Date(event.timestamp).toLocaleString('ko-KR')
      });

      // 메시지 이벤트 처리
      if (event.type === 'message' && event.message.type === 'text') {
        const sourceType = event.source.type;
        
        if (sourceType === 'user') {
          // 개별 사용자 메시지 - User ID 수집
          const userId = event.source.userId;
          const messageText = event.message.text;
          
          console.log(`👤 개별 사용자 ${userId}로부터 메시지: "${messageText}"`);
          
          // 사용자 정보 수집
          const userInfo = {
            userId: userId,
            displayName: `사용자_${userId.substring(0, 8)}`,
            timestamp: new Date().toISOString(),
            lastMessage: messageText
          };

          // 중복 체크
          const existingUser = collectedUsers.find(u => u.userId === userId);
          if (!existingUser) {
            collectedUsers.push(userInfo);
            newUsers.push(userInfo);
            console.log(`✅ 새 사용자 수집됨: ${userInfo.displayName} (${userId})`);
          } else {
            // 기존 사용자 정보 업데이트
            existingUser.lastMessage = messageText;
            existingUser.timestamp = new Date().toISOString();
            console.log(`🔄 기존 사용자 업데이트: ${existingUser.displayName}`);
          }
          
        } else if (sourceType === 'group') {
          // 그룹 메시지 - 그룹 ID 수집
          const groupId = event.source.groupId;
          const userId = event.source.userId;
          const messageText = event.message.text;
          
          console.log(`👥 그룹 ${groupId}에서 사용자 ${userId}가 메시지: "${messageText}"`);
          
          // 그룹 정보 수집
          const groupInfo = {
            groupId: groupId,
            groupName: `그룹_${groupId.substring(0, 8)}`,
            timestamp: new Date().toISOString(),
            lastMessage: messageText,
            lastUserId: userId
          };

          // 중복 체크
          const existingGroup = collectedGroups.find(g => g.groupId === groupId);
          if (!existingGroup) {
            collectedGroups.push(groupInfo);
            newGroups.push(groupInfo);
            console.log(`✅ 새 그룹 수집됨: ${groupInfo.groupName} (${groupId})`);
          } else {
            // 기존 그룹 정보 업데이트
            existingGroup.lastMessage = messageText;
            existingGroup.lastUserId = userId;
            existingGroup.timestamp = new Date().toISOString();
            console.log(`🔄 기존 그룹 업데이트: ${existingGroup.groupName}`);
          }
        }
      }

      // 팔로우 이벤트 처리
      if (event.type === 'follow') {
        const userId = event.source.userId;
        console.log(`👥 새 팔로워: ${userId}`);
        
        const userInfo = {
          userId: userId,
          displayName: `팔로워_${userId.substring(0, 8)}`,
          timestamp: new Date().toISOString(),
          lastMessage: '[팔로우]'
        };

        // 중복 체크
        const existingUser = collectedUsers.find(u => u.userId === userId);
        if (!existingUser) {
          collectedUsers.push(userInfo);
          newUsers.push(userInfo);
          console.log(`✅ 새 팔로워 수집됨: ${userInfo.displayName}`);
        }
      }

      // 언팔로우 이벤트 처리
      if (event.type === 'unfollow') {
        const userId = event.source.userId;
        console.log(`👋 팔로우 해제: ${userId}`);
      }
    }

    // 수집된 데이터 요약
    console.log(`📊 현재 수집된 데이터: 사용자 ${collectedUsers.length}명, 그룹 ${collectedGroups.length}개`);
    if (newUsers.length > 0) {
      console.log('🆕 새로 수집된 사용자:', newUsers);
    }
    if (newGroups.length > 0) {
      console.log('🆕 새로 수집된 그룹:', newGroups);
    }

    // LINE에게 200 응답 반환 (필수)
    return res.status(200).json({ 
      message: 'Webhook 처리 완료',
      eventsCount: events.length,
      totalUsers: collectedUsers.length,
      totalGroups: collectedGroups.length,
      newUsers: newUsers.length,
      newGroups: newGroups.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ LINE Webhook 처리 오류:', error);
    return res.status(500).json({ 
      error: error.message,
      message: 'Webhook 처리 중 오류가 발생했습니다.'
    });
  }
} 