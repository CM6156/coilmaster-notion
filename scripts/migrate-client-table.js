import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ojqhiqkxdskbjnhzpemt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcWhpcWt4ZHNrYmpuaHpwZW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzY3MDcsImV4cCI6MjA2MzMxMjcwN30.7DWuGn_Nn_m2w88p4wDnv1z8_LZrhKR4CGJEDOj-Ong';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateClientTable() {
  console.log('클라이언트 테이블 마이그레이션 시작...');

  try {
    // 클라이언트 테이블에 필요한 컬럼들 추가
    const alterTableQuery = `
      ALTER TABLE public.clients
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sales_rep_id UUID,
      ADD COLUMN IF NOT EXISTS requirements TEXT,
      ADD COLUMN IF NOT EXISTS homepage TEXT,
      ADD COLUMN IF NOT EXISTS flag VARCHAR(10),
      ADD COLUMN IF NOT EXISTS remark TEXT,
      ADD COLUMN IF NOT EXISTS files TEXT[];
    `;

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: alterTableQuery
    });

    if (alterError) {
      console.error('테이블 수정 실패:', alterError);
      return;
    }

    console.log('테이블 컬럼 추가 완료');

    // RLS 정책 설정
    const rlsQueries = [
      'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY IF NOT EXISTS "Everyone can view clients" ON public.clients
        FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Authenticated users can insert clients" ON public.clients
        FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS "Authenticated users can update clients" ON public.clients
        FOR UPDATE USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Authenticated users can delete clients" ON public.clients
        FOR DELETE USING (true);`
    ];

    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('RLS 정책 설정 실패:', error);
      }
    }

    console.log('RLS 정책 설정 완료');
    console.log('클라이언트 테이블 마이그레이션 완료!');

  } catch (error) {
    console.error('마이그레이션 실패:', error);
  }
}

migrateClientTable(); 