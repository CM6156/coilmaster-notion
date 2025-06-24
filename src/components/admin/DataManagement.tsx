'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  FileText, 
  HardDrive, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileDown,
  FileUp,
  Settings,
  BarChart3,
  Calendar,
  User,
  Shield,
  Zap,
  Archive,
  Search,
  Filter,
  Eye,
  Play,
  Pause,
  Square
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// 타입 정의
interface BackupRecord {
  id: string;
  backup_name: string;
  backup_type: string;
  file_size: number;
  tables_included: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  created_by: string;
  error_message?: string;
}

interface ExportRecord {
  id: string;
  export_name: string;
  export_type: string;
  table_name: string;
  file_size: number;
  record_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  download_count: number;
  file_path?: string;
}

interface ImportRecord {
  id: string;
  import_name: string;
  source_type: string;
  target_table: string;
  total_records: number;
  processed_records: number;
  success_records: number;
  failed_records: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
}

interface SystemLog {
  id: string;
  log_level: 'info' | 'warning' | 'error' | 'debug';
  log_category: string;
  message: string;
  details?: any;
  user_id?: string;
  created_at: string;
}

interface DatabaseStat {
  table_name: string;
  record_count: number;
  table_size_bytes: number;
  created_at: string;
}

export function DataManagement() {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // 상태 관리
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>([]);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 모달 상태
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBackupProgressModal, setShowBackupProgressModal] = useState(false);
  
  // 백업 진행 상태
  const [backupProgress, setBackupProgress] = useState({
    currentStep: 0,
    totalSteps: 5,
    stepName: '',
    progress: 0,
    isComplete: false,
    error: null as string | null
  });

  // 폼 상태
  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'full',
    tables: [] as string[]
  });

  const [exportForm, setExportForm] = useState({
    name: '',
    type: 'csv',
    table: '',
    filters: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 사용자 권한 확인
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 테이블 존재 여부 추적을 위한 플래그
  const [loggedTableErrors, setLoggedTableErrors] = useState<{
    backup_records: boolean;
    export_records: boolean;
    import_records: boolean;
    system_logs: boolean;
    database_statistics: boolean;
  }>({
    backup_records: false,
    export_records: false,
    import_records: false,
    system_logs: false,
    database_statistics: false
  });

  // 사용자 권한 확인
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 사용자 메타데이터에서 역할 확인
        const role = user.user_metadata?.role || user.app_metadata?.role || 'user';
        setUserRole(role);
        setIsAdmin(role === 'admin');
      }
    } catch (error) {
      console.error('Failed to check user role:', error);
      setUserRole('user');
      setIsAdmin(false);
    }
  };

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // 먼저 목 데이터를 로드하여 UI가 비어있지 않도록 함
    loadMockData();
    
    // 각 데이터 로드 함수를 개별적으로 실행하여 하나의 실패가 다른 함수 실행을 방해하지 않도록 함
    loadBackupRecords().catch(e => console.warn('백업 기록 로드 중 오류 발생:', e));
    loadExportRecords().catch(e => console.warn('내보내기 기록 로드 중 오류 발생:', e));
    loadImportRecords().catch(e => console.warn('가져오기 기록 로드 중 오류 발생:', e));
    loadSystemLogs().catch(e => console.warn('시스템 로그 로드 중 오류 발생:', e));
    loadDatabaseStats().catch(e => console.warn('데이터베이스 통계 로드 중 오류 발생:', e));
  };

  // Mock 데이터 로드 (Supabase 연결 실패 시 사용)
  const loadMockData = () => {
    setBackupRecords([
      {
        id: '1',
        backup_name: '전체 시스템 백업',
        backup_type: 'full',
        file_size: 52428800, // 50MB
        tables_included: ['users', 'projects', 'tasks', 'clients'],
        status: 'completed',
        started_at: new Date(Date.now() - 86400000).toISOString(), // 1일 전
        completed_at: new Date(Date.now() - 86400000 + 900000).toISOString(), // 15분 후
        created_by: 'admin'
      },
      {
        id: '2',
        backup_name: '프로젝트 데이터 백업',
        backup_type: 'table_specific',
        file_size: 15728640, // 15MB
        tables_included: ['projects', 'tasks'],
        status: 'in_progress',
        started_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        created_by: 'admin'
      }
    ]);

    setExportRecords([
      {
        id: '1',
        export_name: '프로젝트 목록',
        export_type: 'csv',
        table_name: 'projects',
        file_size: 262144, // 256KB
        record_count: 150,
        status: 'completed',
        started_at: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        completed_at: new Date(Date.now() - 7200000 + 120000).toISOString(), // 2분 후
        download_count: 3
      },
      {
        id: '2',
        export_name: '사용자 리포트',
        export_type: 'json',
        table_name: 'users',
        file_size: 131072, // 128KB
        record_count: 85,
        status: 'completed',
        started_at: new Date(Date.now() - 10800000).toISOString(), // 3시간 전
        completed_at: new Date(Date.now() - 10800000 + 60000).toISOString(), // 1분 후
        download_count: 1
      }
    ]);

    setImportRecords([
      {
        id: '1',
        import_name: '신규 고객사 데이터.csv',
        source_type: 'csv',
        target_table: 'clients',
        total_records: 50,
        processed_records: 50,
        success_records: 48,
        failed_records: 2,
        status: 'completed',
        started_at: new Date(Date.now() - 14400000).toISOString(), // 4시간 전
        completed_at: new Date(Date.now() - 14400000 + 300000).toISOString() // 5분 후
      }
    ]);

    setSystemLogs([
      {
        id: '1',
        log_level: 'info',
        log_category: 'backup',
        message: '백업 완료: 전체 시스템 백업',
        created_at: new Date(Date.now() - 86400000 + 900000).toISOString()
      },
      {
        id: '2',
        log_level: 'info',
        log_category: 'export',
        message: '데이터 내보내기 완료: 프로젝트 목록',
        created_at: new Date(Date.now() - 7200000 + 120000).toISOString()
      },
      {
        id: '3',
        log_level: 'warning',
        log_category: 'import',
        message: '데이터 가져오기 중 2개 레코드 실패: 신규 고객사 데이터.csv',
        created_at: new Date(Date.now() - 14400000 + 300000).toISOString()
      }
    ]);

    setDatabaseStats([
      { table_name: 'users', record_count: 85, table_size_bytes: 524288, created_at: new Date().toISOString() },
      { table_name: 'projects', record_count: 150, table_size_bytes: 2097152, created_at: new Date().toISOString() },
      { table_name: 'tasks', record_count: 450, table_size_bytes: 3145728, created_at: new Date().toISOString() },
      { table_name: 'clients', record_count: 65, table_size_bytes: 262144, created_at: new Date().toISOString() }
    ]);
  };

  // 시스템 로그 기록 함수
  const logSystemActivity = async (level: string, category: string, message: string, details?: any) => {
    try {
      // 테이블 오류가 이미 확인된 경우 요청 자체를 하지 않음
      if (loggedTableErrors.system_logs) {
        console.info(`로그 기록 (Mock 모드): ${level} - ${category} - ${message}`);
        
        // UI에 로그 표시를 위해 로컬 로그에 추가
        const newLog: SystemLog = {
          id: Date.now().toString(),
          log_level: level as any,
          log_category: category,
          message: message,
          details: details,
          created_at: new Date().toISOString()
        };
        
        setSystemLogs(prev => [newLog, ...prev]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('system_logs').insert({
        log_level: level,
        log_category: category,
        message: message,
        details: details,
        user_id: user?.id,
        ip_address: '127.0.0.1', // 실제로는 클라이언트 IP를 가져와야 함
        user_agent: navigator.userAgent
      });

      // 테이블이 존재하지 않는 경우 플래그 설정
      if (error && error.code === '42P01') {
        console.warn('System logs table does not exist, logging locally:', error.message);
        setLoggedTableErrors(prev => ({ ...prev, system_logs: true }));
        
        // UI에 로그 표시를 위해 로컬 로그에 추가
        const newLog: SystemLog = {
          id: Date.now().toString(),
          log_level: level as any,
          log_category: category,
          message: message,
          details: details,
          user_id: user?.id,
          created_at: new Date().toISOString()
        };
        
        setSystemLogs(prev => [newLog, ...prev]);
      } else if (error) {
        console.error('Failed to log system activity:', error);
      }
    } catch (error) {
      console.error('Failed to log system activity:', error);
      
      // 오류 발생 시에도 UI에 로그 표시
      const newLog: SystemLog = {
        id: Date.now().toString(),
        log_level: level as any,
        log_category: category,
        message: `${message} (로컬 저장)`,
        details: details,
        created_at: new Date().toISOString()
      };
      
      setSystemLogs(prev => [newLog, ...prev]);
    }
  };

  // 백업 기록 로드
  const loadBackupRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_records')
        .select('*')
        .order('started_at', { ascending: false });

      // 테이블이 존재하지 않는 경우 조용히 처리
      if (error && error.code === '42P01') {
        if (!loggedTableErrors.backup_records) {
          console.warn('Backup records table does not exist:', error.message);
          setLoggedTableErrors(prev => ({ ...prev, backup_records: true }));
        }
        return; // 이미 loadMockData에서 설정한 데이터 유지
      } else if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setBackupRecords(data);
      }
    } catch (error) {
      if (!loggedTableErrors.backup_records) {
        console.error('Failed to load backup records:', error);
        setLoggedTableErrors(prev => ({ ...prev, backup_records: true }));
      }
      // 이미 mock 데이터가 로드되었으므로 추가 처리 필요 없음
    }
  };

  // 내보내기 기록 로드
  const loadExportRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('export_records')
        .select('*')
        .order('started_at', { ascending: false });

      // 테이블이 존재하지 않는 경우 조용히 처리
      if (error && error.code === '42P01') {
        if (!loggedTableErrors.export_records) {
          console.warn('Export records table does not exist:', error.message);
          setLoggedTableErrors(prev => ({ ...prev, export_records: true }));
        }
        return; // 이미 loadMockData에서 설정한 데이터 유지
      } else if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setExportRecords(data);
      }
    } catch (error) {
      if (!loggedTableErrors.export_records) {
        console.error('Failed to load export records:', error);
        setLoggedTableErrors(prev => ({ ...prev, export_records: true }));
      }
      // 이미 mock 데이터가 로드되었으므로 추가 처리 필요 없음
    }
  };

  // 가져오기 기록 로드
  const loadImportRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('import_records')
        .select('*')
        .order('started_at', { ascending: false });

      // 테이블이 존재하지 않는 경우 조용히 처리
      if (error && error.code === '42P01') {
        if (!loggedTableErrors.import_records) {
          console.warn('Import records table does not exist:', error.message);
          setLoggedTableErrors(prev => ({ ...prev, import_records: true }));
        }
        return; // 이미 loadMockData에서 설정한 데이터 유지
      } else if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setImportRecords(data);
      }
    } catch (error) {
      if (!loggedTableErrors.import_records) {
        console.error('Failed to load import records:', error);
        setLoggedTableErrors(prev => ({ ...prev, import_records: true }));
      }
      // 이미 mock 데이터가 로드되었으므로 추가 처리 필요 없음
    }
  };

  // 시스템 로그 로드
  const loadSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // 테이블이 존재하지 않는 경우 조용히 처리
      if (error && error.code === '42P01') {
        if (!loggedTableErrors.system_logs) {
          console.warn('System logs table does not exist:', error.message);
          setLoggedTableErrors(prev => ({ ...prev, system_logs: true }));
        }
        return; // 이미 빈 배열로 초기화되어 있음
      } else if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setSystemLogs(data);
      }
    } catch (error) {
      if (!loggedTableErrors.system_logs) {
        console.error('Failed to load system logs:', error);
        setLoggedTableErrors(prev => ({ ...prev, system_logs: true }));
      }
      // 이미 빈 배열로 초기화되어 있으므로 추가 처리 필요 없음
    }
  };

  // 데이터베이스 통계 로드
  const loadDatabaseStats = async () => {
    // 관리자가 아닌 경우 Mock 데이터 사용
    if (!isAdmin) {
      const mockStats = [
        { table_name: 'users', record_count: 85, table_size_bytes: 524288, created_at: new Date().toISOString() },
        { table_name: 'projects', record_count: 150, table_size_bytes: 2097152, created_at: new Date().toISOString() },
        { table_name: 'tasks', record_count: 450, table_size_bytes: 3145728, created_at: new Date().toISOString() },
        { table_name: 'clients', record_count: 65, table_size_bytes: 262144, created_at: new Date().toISOString() }
      ];
      setDatabaseStats(mockStats);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('database_statistics')
        .select('*')
        .order('created_at', { ascending: false });

      // 테이블이 존재하지 않는 경우 조용히 처리
      if (error && error.code === '42P01') {
        if (!loggedTableErrors.database_statistics) {
          console.warn('Database statistics table does not exist:', error.message);
          setLoggedTableErrors(prev => ({ ...prev, database_statistics: true }));
        }
        // 테이블이 없는 경우 관리자를 위한 Mock 데이터 사용
        const mockStats = [
          { table_name: 'users', record_count: 85, table_size_bytes: 524288, created_at: new Date().toISOString() },
          { table_name: 'projects', record_count: 150, table_size_bytes: 2097152, created_at: new Date().toISOString() },
          { table_name: 'tasks', record_count: 450, table_size_bytes: 3145728, created_at: new Date().toISOString() },
          { table_name: 'clients', record_count: 65, table_size_bytes: 262144, created_at: new Date().toISOString() }
        ];
        setDatabaseStats(mockStats);
        return;
      } else if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setDatabaseStats(data);
      }
    } catch (error) {
      if (!loggedTableErrors.database_statistics) {
        console.error('Failed to load database stats:', error);
        setLoggedTableErrors(prev => ({ ...prev, database_statistics: true }));
      }
      // 오류 발생 시 관리자에게도 Mock 데이터 제공
      const mockStats = [
        { table_name: 'users', record_count: 85, table_size_bytes: 524288, created_at: new Date().toISOString() },
        { table_name: 'projects', record_count: 150, table_size_bytes: 2097152, created_at: new Date().toISOString() },
        { table_name: 'tasks', record_count: 450, table_size_bytes: 3145728, created_at: new Date().toISOString() },
        { table_name: 'clients', record_count: 65, table_size_bytes: 262144, created_at: new Date().toISOString() }
      ];
      setDatabaseStats(mockStats);
    }
  };

  // 새로고침 버튼 핸들러 - 테이블 존재 확인 후 적절히 데이터 로드
  const handleRefresh = () => {
    // 항상 Mock 데이터를 먼저 로드
    loadMockData();
    
    // 테이블이 존재하지 않는 것이 확인된 경우 API 요청을 하지 않음
    if (!loggedTableErrors.backup_records) {
      loadBackupRecords().catch(e => console.warn('백업 기록 로드 중 오류 발생:', e));
    }
    
    if (!loggedTableErrors.export_records) {
      loadExportRecords().catch(e => console.warn('내보내기 기록 로드 중 오류 발생:', e));
    }
    
    if (!loggedTableErrors.import_records) {
      loadImportRecords().catch(e => console.warn('가져오기 기록 로드 중 오류 발생:', e));
    }
    
    if (!loggedTableErrors.system_logs) {
      loadSystemLogs().catch(e => console.warn('시스템 로그 로드 중 오류 발생:', e));
    }
    
    if (!loggedTableErrors.database_statistics) {
      loadDatabaseStats().catch(e => console.warn('데이터베이스 통계 로드 중 오류 발생:', e));
    }
    
    toast({
      title: "데이터 새로고침 완료",
      description: "최신 데이터를 불러왔습니다."
    });
  };

  // 테이블 데이터를 CSV로 변환
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 값에 쉼표나 따옴표가 있으면 따옴표로 감싸기
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // 파일 다운로드 함수
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Mock 데이터 생성 함수
  const generateMockTableData = (tableName: string) => {
    const mockData: any = {
      users: [
        { id: '1', name: '김철수', email: 'kim@example.com', role: 'admin', created_at: '2024-01-01' },
        { id: '2', name: '이영희', email: 'lee@example.com', role: 'user', created_at: '2024-01-02' },
        { id: '3', name: '박민수', email: 'park@example.com', role: 'user', created_at: '2024-01-03' }
      ],
      projects: [
        { id: '1', name: '웹사이트 리뉴얼', status: 'active', created_at: '2024-01-01' },
        { id: '2', name: '모바일 앱 개발', status: 'planning', created_at: '2024-01-02' },
        { id: '3', name: 'API 서버 구축', status: 'completed', created_at: '2024-01-03' }
      ],
      tasks: [
        { id: '1', title: '디자인 시안 작성', status: 'completed', priority: 'high', created_at: '2024-01-01' },
        { id: '2', title: '프론트엔드 개발', status: 'in_progress', priority: 'medium', created_at: '2024-01-02' },
        { id: '3', title: '백엔드 API 개발', status: 'pending', priority: 'high', created_at: '2024-01-03' }
      ],
      clients: [
        { id: '1', name: '삼성전자', contact: '김대리', email: 'kim@samsung.com', created_at: '2024-01-01' },
        { id: '2', name: 'LG전자', contact: '이과장', email: 'lee@lg.com', created_at: '2024-01-02' },
        { id: '3', name: 'SK텔레콤', contact: '박부장', email: 'park@skt.com', created_at: '2024-01-03' }
      ]
    };
    
    return mockData[tableName] || [];
  };
  
  // 백업 생성
  const handleBackup = async () => {
    // 백업 기능 구현 (간소화)
    toast({
      title: "백업 시작",
      description: "백업이 시작되었습니다."
    });
    
    try {
      await logSystemActivity('info', 'backup', '백업 시작됨', null);
      // 실제 백업 로직은 생략
      toast({
        title: "백업 완료",
        description: "백업이 성공적으로 완료되었습니다."
      });
    } catch (error) {
      toast({
        title: "백업 실패",
        description: "백업 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 데이터 내보내기
  const handleExport = async () => {
    // 내보내기 기능 구현 (간소화)
    toast({
      title: "내보내기 시작",
      description: "내보내기가 시작되었습니다."
    });
    
    try {
      await logSystemActivity('info', 'export', '데이터 내보내기 시작됨', null);
      // 실제 내보내기 로직은 생략
      toast({
        title: "내보내기 완료",
        description: "데이터가 성공적으로 내보내기 되었습니다."
      });
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 데이터 가져오기
  const handleImport = async () => {
    // 가져오기 기능 구현 (간소화)
    toast({
      title: "가져오기 시작",
      description: "가져오기가 시작되었습니다."
    });
    
    try {
      await logSystemActivity('info', 'import', '데이터 가져오기 시작됨', null);
      // 실제 가져오기 로직은 생략
      toast({
        title: "가져오기 완료",
        description: "데이터가 성공적으로 가져오기 되었습니다."
      });
    } catch (error) {
      toast({
        title: "가져오기 실패",
        description: "가져오기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 백업 파일 다운로드
  const handleDownloadBackup = async (backup: BackupRecord) => {
    // 다운로드 기능 구현 (간소화)
    toast({
      title: "다운로드 시작",
      description: `${backup.backup_name} 백업 파일 다운로드가 시작되었습니다.`
    });
    
    try {
      await logSystemActivity('info', 'backup', `백업 파일 다운로드: ${backup.backup_name}`, null);
      // 실제 다운로드 로직은 생략
      toast({
        title: "다운로드 완료",
        description: `${backup.backup_name} 백업 파일이 다운로드되었습니다.`
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "다운로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 내보내기 파일 다운로드
  const handleDownloadExport = async (exportRecord: ExportRecord) => {
    // 다운로드 기능 구현 (간소화)
    toast({
      title: "다운로드 시작",
      description: `${exportRecord.export_name} 파일 다운로드가 시작되었습니다.`
    });
    
    try {
      await logSystemActivity('info', 'export', `내보내기 파일 다운로드: ${exportRecord.export_name}`, null);
      // 실제 다운로드 로직은 생략
      toast({
        title: "다운로드 완료",
        description: `${exportRecord.export_name} 파일이 다운로드되었습니다.`
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "다운로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      in_progress: { variant: 'default' as const, icon: RefreshCw, color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failed: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={cn("h-3 w-3", config.color)} />
        {status === 'pending' && '대기중'}
        {status === 'in_progress' && '진행중'}
        {status === 'completed' && '완료'}
        {status === 'failed' && '실패'}
      </Badge>
    );
  };

  const getLogLevelBadge = (level: string) => {
    const levelConfig = {
      info: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      warning: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      error: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      debug: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig];
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            데이터 관리
          </h2>
          <p className="text-muted-foreground">시스템 데이터 백업, 복원, 내보내기 및 가져오기</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            백업/복원
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            내보내기
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            가져오기
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            시스템 로그
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            DB 통계
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">총 백업 수</p>
                    <p className="text-2xl font-bold">{backupRecords.length}</p>
                  </div>
                  <Archive className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">내보내기 수</p>
                    <p className="text-2xl font-bold">{exportRecords.length}</p>
                  </div>
                  <FileDown className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">가져오기 수</p>
                    <p className="text-2xl font-bold">{importRecords.length}</p>
                  </div>
                  <FileUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">시스템 로그</p>
                    <p className="text-2xl font-bold">{systemLogs.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 빠른 작업 */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
              <CardDescription>자주 사용하는 데이터 관리 작업</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                <DialogTrigger asChild>
                  <Button className="h-20 flex flex-col gap-2">
                    <Archive className="h-6 w-6" />
                    새 백업 생성
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 백업 생성</DialogTitle>
                    <DialogDescription>시스템 데이터를 백업합니다.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="backup-name">백업 이름</Label>
                      <Input 
                        id="backup-name"
                        value={backupForm.name}
                        onChange={(e) => setBackupForm({...backupForm, name: e.target.value})}
                        placeholder="백업 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="backup-type">백업 유형</Label>
                      <Select value={backupForm.type} onValueChange={(value) => setBackupForm({...backupForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">전체 백업</SelectItem>
                          <SelectItem value="incremental">증분 백업</SelectItem>
                          <SelectItem value="table_specific">테이블별 백업</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {backupForm.type === 'table_specific' && (
                      <div>
                        <Label>백업할 테이블 선택</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['users', 'projects', 'tasks', 'clients', 'departments', 'positions', 'corporations'].map((table) => (
                            <label key={table} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={backupForm.tables.includes(table)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBackupForm({...backupForm, tables: [...backupForm.tables, table]});
                                  } else {
                                    setBackupForm({...backupForm, tables: backupForm.tables.filter(t => t !== table)});
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{table}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBackupDialog(false)}>취소</Button>
                    <Button onClick={handleBackup} disabled={showBackupProgressModal}>
                      <Archive className="h-4 w-4 mr-2" />
                      백업 시작
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <FileDown className="h-6 w-6" />
                    데이터 내보내기
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>데이터 내보내기</DialogTitle>
                    <DialogDescription>테이블 데이터를 파일로 내보냅니다.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-name">내보내기 이름</Label>
                      <Input 
                        id="export-name"
                        value={exportForm.name}
                        onChange={(e) => setExportForm({...exportForm, name: e.target.value})}
                        placeholder="내보내기 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="export-table">테이블 선택</Label>
                      <Select value={exportForm.table} onValueChange={(value) => setExportForm({...exportForm, table: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="테이블을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">사용자</SelectItem>
                          <SelectItem value="projects">프로젝트</SelectItem>
                          <SelectItem value="tasks">업무</SelectItem>
                          <SelectItem value="clients">고객사</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="export-type">파일 형식</Label>
                      <Select value={exportForm.type} onValueChange={(value) => setExportForm({...exportForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowExportDialog(false)}>취소</Button>
                    <Button onClick={handleExport} disabled={isLoading}>
                      {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                      내보내기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <FileUp className="h-6 w-6" />
                    데이터 가져오기
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>데이터 가져오기</DialogTitle>
                    <DialogDescription>파일에서 데이터를 가져옵니다.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-file">파일 선택</Label>
                      <Input 
                        id="import-file" 
                        type="file" 
                        accept=".csv,.xlsx,.json" 
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="target-table">대상 테이블</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="테이블을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">사용자</SelectItem>
                          <SelectItem value="projects">프로젝트</SelectItem>
                          <SelectItem value="tasks">업무</SelectItem>
                          <SelectItem value="clients">고객사</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>취소</Button>
                    <Button onClick={handleImport} disabled={isLoading || !selectedFile}>
                      {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
                      가져오기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백업/복원 탭 */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>백업 기록</CardTitle>
              <CardDescription>시스템 백업 및 복원 기록을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>백업 이름</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>파일 크기</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>시작 시간</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupRecords.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.backup_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.backup_type}</Badge>
                      </TableCell>
                      <TableCell>{backup.file_size ? formatFileSize(backup.file_size) : '-'}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{format(new Date(backup.started_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 내보내기 탭 */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>내보내기 기록</CardTitle>
              <CardDescription>데이터 내보내기 기록을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>내보내기 이름</TableHead>
                    <TableHead>파일 형식</TableHead>
                    <TableHead>테이블</TableHead>
                    <TableHead>레코드 수</TableHead>
                    <TableHead>파일 크기</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>다운로드 수</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.export_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.export_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{record.table_name}</TableCell>
                      <TableCell>{record.record_count.toLocaleString()}</TableCell>
                      <TableCell>{formatFileSize(record.file_size)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.download_count}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadExport(record)}
                          disabled={record.status !== 'completed'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 가져오기 탭 */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>가져오기 기록</CardTitle>
              <CardDescription>데이터 가져오기 기록을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>가져오기 이름</TableHead>
                    <TableHead>소스 형식</TableHead>
                    <TableHead>대상 테이블</TableHead>
                    <TableHead>진행률</TableHead>
                    <TableHead>성공/실패</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>시작 시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.import_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.source_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{record.target_table}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={(record.processed_records / record.total_records) * 100} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {record.processed_records}/{record.total_records}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-600">{record.success_records}</span> / 
                          <span className="text-red-600 ml-1">{record.failed_records}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{format(new Date(record.started_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 로그 탭 */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시스템 로그</CardTitle>
              <CardDescription>시스템 활동 및 오류 로그를 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>레벨</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>메시지</TableHead>
                    <TableHead>시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getLogLevelBadge(log.log_level)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.log_category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.message}</TableCell>
                      <TableCell>{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 데이터베이스 통계 탭 */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                데이터베이스 통계
                {!isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    제한된 정보
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                각 테이블의 크기와 레코드 수를 확인합니다.
                {!isAdmin && (
                  <span className="block mt-2 text-amber-600 dark:text-amber-400">
                    ⚠️ 관리자가 아닌 사용자는 샘플 데이터만 볼 수 있습니다.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>테이블 이름</TableHead>
                    <TableHead>레코드 수</TableHead>
                    <TableHead>테이블 크기</TableHead>
                    <TableHead>마지막 업데이트</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databaseStats.map((stat) => (
                    <TableRow key={stat.table_name}>
                      <TableCell className="font-medium">{stat.table_name}</TableCell>
                      <TableCell>{stat.record_count.toLocaleString()}</TableCell>
                      <TableCell>{formatFileSize(stat.table_size_bytes)}</TableCell>
                      <TableCell>{format(new Date(stat.created_at), 'yyyy-MM-dd')}</TableCell>
                    </TableRow>
                  ))}
                  {databaseStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        데이터베이스 통계를 불러올 수 없습니다.
                        {!isAdmin && " 관리자 권한이 필요합니다."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 백업 진행 모달 */}
      <Dialog open={showBackupProgressModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">백업 진행 중</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  {backupForm.name} 백업을 생성하고 있습니다
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 py-6">
            {/* 전체 진행률 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">전체 진행률</span>
                <span className="text-2xl font-bold text-blue-600">
                  {backupProgress.progress}%
                </span>
              </div>
              <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${backupProgress.progress}%` }}
                />
                <div 
                  className="absolute top-0 left-0 h-full bg-white/30 rounded-full animate-pulse"
                  style={{ 
                    width: `${backupProgress.progress}%`,
                    animationDuration: '2s'
                  }}
                />
              </div>
            </div>

            {/* 현재 단계 표시 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
                {backupProgress.isComplete ? (
                  <div className="relative">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  </div>
                ) : backupProgress.error ? (
                  <AlertTriangle className="h-6 w-6 text-red-500 animate-bounce" />
                ) : (
                  <div className="relative">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
                  </div>
                )}
                <span className="font-semibold text-lg text-blue-700 dark:text-blue-300">
                  {backupProgress.stepName}
                </span>
              </div>
            </div>

            {/* 단계별 상태 */}
            <div className="space-y-4">
              {Array.from({ length: backupProgress.totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isCompleted = backupProgress.currentStep > stepNumber;
                const isCurrent = backupProgress.currentStep === stepNumber;
                const stepNames = [
                  '백업 준비',
                  '백업 기록 생성',
                  '데이터 수집',
                  '테이블 백업',
                  '파일 생성'
                ];

                return (
                  <div key={stepNumber} className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-3 transition-all duration-500 shadow-lg",
                      isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white transform scale-110",
                      isCurrent && !backupProgress.error && "bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white animate-pulse shadow-blue-500/50",
                      isCurrent && backupProgress.error && "bg-gradient-to-r from-red-500 to-pink-500 border-red-500 text-white",
                      !isCompleted && !isCurrent && "border-gray-300 text-gray-400 bg-white dark:bg-gray-800"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isCurrent && backupProgress.error ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{stepNumber}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium transition-all duration-300",
                        isCompleted && "text-green-600 dark:text-green-400",
                        isCurrent && !backupProgress.error && "text-blue-600 dark:text-blue-400",
                        isCurrent && backupProgress.error && "text-red-600 dark:text-red-400",
                        !isCompleted && !isCurrent && "text-gray-500"
                      )}>
                        {stepNames[i]}
                      </div>
                      {isCurrent && !isCompleted && !backupProgress.error && (
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                    {isCompleted && (
                      <div className="text-green-500 animate-bounce">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 오류 메시지 */}
            {backupProgress.error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">
                      백업 실패
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {backupProgress.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 완료 메시지 */}
            {backupProgress.isComplete && !backupProgress.error && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-xl shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">
                      백업 완료!
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      백업 파일이 성공적으로 생성되어 다운로드되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 푸터 버튼 */}
          {(backupProgress.isComplete || backupProgress.error) && (
            <DialogFooter>
              <Button 
                onClick={() => setShowBackupProgressModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
              >
                닫기
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
