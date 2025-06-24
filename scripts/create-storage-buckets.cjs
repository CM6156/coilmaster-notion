/**
 * Supabase Storage 버킷 생성 스크립트
 * 이 스크립트는 필요한 Storage 버킷들을 생성합니다.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (환경변수 또는 직접 입력)
const supabaseUrl = 'https://ojqhiqkxdskbjnhzpemt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcWhpcWt4ZHNrYmpuaHpwZW10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzczNjcwNywiZXhwIjoyMDYzMzEyNzA3fQ.2Puh1Nj6m9xXAHXCVGVLHGJizLWYEz0LwHKB_kgJ1Io';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 생성할 버킷 설정
const bucketsConfig = [
  {
    id: 'project-files',
    name: 'project-files',
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  {
    id: 'documents',
    name: 'documents',
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  {
    id: 'avatars',
    name: 'avatars',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  },
  {
    id: 'temp-files',
    name: 'temp-files',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: ['*/*']
  }
];

// 버킷 생성 함수
async function createBucket(config) {
  try {
    console.log(`Creating bucket: ${config.id}...`);
    
    const { data, error } = await supabase.storage.createBucket(config.id, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`✓ Bucket ${config.id} already exists`);
        return true;
      } else {
        console.error(`✗ Error creating bucket ${config.id}:`, error.message);
        return false;
      }
    }

    console.log(`✓ Successfully created bucket: ${config.id}`);
    return true;
  } catch (error) {
    console.error(`✗ Exception creating bucket ${config.id}:`, error.message);
    return false;
  }
}

// Storage 정책 생성 함수
async function createStoragePolicies() {
  console.log('\nCreating storage policies...');
  
  const policies = [
    // project-files 정책
    {
      name: 'Anyone can view project files',
      bucket: 'project-files',
      operation: 'SELECT',
      definition: `bucket_id = 'project-files'`
    },
    {
      name: 'Authenticated users can upload project files',
      bucket: 'project-files',
      operation: 'INSERT',
      definition: `bucket_id = 'project-files' AND auth.role() = 'authenticated'`
    },
    
    // documents 정책
    {
      name: 'Anyone can view documents',
      bucket: 'documents',
      operation: 'SELECT',
      definition: `bucket_id = 'documents'`
    },
    {
      name: 'Authenticated users can upload documents',
      bucket: 'documents',
      operation: 'INSERT',
      definition: `bucket_id = 'documents' AND auth.role() = 'authenticated'`
    },
    
    // avatars 정책
    {
      name: 'Anyone can view avatars',
      bucket: 'avatars',
      operation: 'SELECT',
      definition: `bucket_id = 'avatars'`
    },
    {
      name: 'Users can upload their own avatar',
      bucket: 'avatars',
      operation: 'INSERT',
      definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('create_storage_policy', {
        policy_name: policy.name,
        bucket_name: policy.bucket,
        operation: policy.operation,
        definition: policy.definition
      });

      if (error) {
        console.log(`⚠ Policy "${policy.name}" may already exist or failed to create:`, error.message);
      } else {
        console.log(`✓ Created policy: ${policy.name}`);
      }
    } catch (error) {
      console.log(`⚠ Exception creating policy "${policy.name}":`, error.message);
    }
  }
}

// 버킷 목록 확인 함수
async function listBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }

    console.log('\nCurrent buckets:');
    if (data && data.length > 0) {
      data.forEach(bucket => {
        console.log(`- ${bucket.id} (public: ${bucket.public})`);
      });
    } else {
      console.log('No buckets found.');
    }
  } catch (error) {
    console.error('Exception listing buckets:', error.message);
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 Starting Supabase Storage bucket creation...\n');

  // 현재 버킷 목록 확인
  await listBuckets();

  console.log('\n📦 Creating storage buckets...');
  
  // 각 버킷 생성
  let successCount = 0;
  for (const config of bucketsConfig) {
    const success = await createBucket(config);
    if (success) successCount++;
  }

  console.log(`\n✅ Bucket creation completed: ${successCount}/${bucketsConfig.length} successful`);

  // 정책 생성
  await createStoragePolicies();

  // 최종 버킷 목록 확인
  console.log('\n📋 Final bucket list:');
  await listBuckets();

  console.log('\n🎉 Storage setup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Verify buckets in Supabase Dashboard > Storage');
  console.log('2. Configure RLS policies if needed');
  console.log('3. Test file upload functionality');
}

// 스크립트 실행
main().catch(console.error); 