import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables (fallback to hardcoded values)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojqhiqkxdskbjnhzpemt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcWhpcWt4ZHNrYmpuaHpwZW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzY3MDcsImV4cCI6MjA2MzMxMjcwN30.7DWuGn_Nn_m2w88p4wDnv1z8_LZrhKR4CGJEDOj-Ong';

// 완전한 타입 지정을 위한 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 버킷 확인 및 가상 버킷 생성 함수 (필요시 사용)
export const ensureStorageBuckets = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('버킷 목록 조회 오류:', error);
      return false;
    }
    
    // 필요한 버킷 이름들
    const requiredBuckets = ['project-files', 'documents', 'avatars'];
    
    // 각 필요 버킷이 존재하는지 확인
    for (const bucketName of requiredBuckets) {
      const bucketExists = buckets.some(b => b.id === bucketName);
      
      if (!bucketExists) {
        console.log(`${bucketName} 버킷 생성 시도 중...`);
        // 버킷 생성 시도
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          console.error(`${bucketName} 버킷 생성 실패:`, createError);
        } else {
          console.log(`${bucketName} 버킷 생성 성공!`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('버킷 확인 중 오류:', error);
    return false;
  }
};
