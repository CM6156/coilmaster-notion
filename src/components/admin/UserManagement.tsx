import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Globe, Building, Key, Edit, Plus, RefreshCw, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getDepartmentKoreanName } from "@/utils/departmentUtils";
import { UserEditDialog } from "./UserEditDialog";
import { PasswordResetDialog } from "./PasswordResetDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard } from "@/components/ui/responsive-container";

interface UserManagementProps {
  initialUsers?: any[];
}

interface Department {
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department_id: string;
  departments?: Department;
}

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface PositionInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
}

interface CorporationInfo {
  id: string;
  code: string;
  name: string;
  country: string;
  description: string;
}

interface CountryInfo {
  code: string;
  name: string;
}

interface SyncStatusData {
  user_id: string;
  user_name: string;
  user_email: string;
  user_department_id: string;
  departments: {
    user_department_name: string;
  };
  managers: {
    manager_id: string;
    manager_name: string;
    manager_email: string;
  } | null;
  sync_status: string;
  name_match_status: string;
}

interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  department_id: string;
  departments?: {
    name: string;
  };
}

interface DatabaseManager {
  id: string;
  name: string;
  email: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  department_id?: string;
  department?: string;
  position?: string;
  country?: string;
  corporation?: string;
  is_active?: boolean;
}

const availableRoles = [
  { id: 'admin', name: '관리자', permissions: ['all'] },
  { id: 'manager', name: '매니저', permissions: ['view', 'edit', 'create'] },
  { id: 'user', name: '일반 사용자', permissions: ['view'] }
];

const legalEntities = [
  { id: 'HQ', name: '본사 (HQ)' },
  { id: 'ZQ', name: '조경 (ZQ)' },
  { id: 'WD', name: '문등 (WD)' },
  { id: 'TH', name: '태국 (TH)' }
];

export const UserManagement = ({ initialUsers = [] }: UserManagementProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [corporations, setCorporations] = useState<CorporationInfo[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [legalEntityFilter, setLegalEntityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    corporation: "",
    country: "",
    role: "user",
    password: "",
    confirmPassword: "",
  });

  const [passwordResetMode, setPasswordResetMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  const countries: CountryInfo[] = [
    { code: "KR", name: "한국" },
    { code: "TH", name: "태국" },
    { code: "CN", name: "중국" }
  ];

  const filteredUsers = users.filter(user => {
    if (departmentFilter !== "all" && user.department !== departmentFilter) {
      return false;
    }
    
    if (countryFilter !== "all" && user.country !== countryFilter) {
      return false;
    }
    
    if (legalEntityFilter !== "all" && user.corporation !== legalEntityFilter) {
      return false;
    }
    
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchPositions();
    fetchCorporations();
    fetchSyncStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          department:departments(id, name, code),
          corporation:corporations(id, name, code),
          position:positions(id, name, code, level)
        `)
        .order('name');

      if (error) throw error;

      console.log('Fetched users with relations:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "사용자 목록 조회 실패",
        description: "사용자 목록을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;
      console.log("Fetched departments data:", data);
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "에러",
        description: "부서 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("level");

      if (error) throw error;
      console.log("Fetched positions data:", data);
      setPositions(data || []);
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast({
        title: "에러",
        description: "직책 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const fetchCorporations = async () => {
    try {
      const { data, error } = await supabase
        .from("corporations")
        .select("*")
        .order("name");

      if (error) throw error;
      console.log("Fetched corporations data:", data);
      setCorporations(data || []);
    } catch (error) {
      console.error("Error fetching corporations:", error);
      toast({
        title: "에러",
        description: "법인 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const fetchSyncStatus = async () => {
    try {
      // 먼저 사용자 목록을 가져옵니다
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          department_id,
          departments (
            name
          )
        `)
        .order('email');

      if (usersError) throw usersError;

      // 담당자 목록을 가져옵니다
      const { data: managers, error: managersError } = await supabase
        .from('managers')
        .select(`
          id,
          name,
          email
        `)
        .order('email');

      if (managersError) throw managersError;

      // 데이터 가공
      const processedData: SyncStatusData[] = ((users || []) as any[]).map((user: any) => {
        const matchedManager = ((managers || []) as any[]).find((m: any) => m.email === user.email);
        
        return {
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_department_id: user.department_id,
          departments: {
            user_department_name: user.departments?.name || ''
          },
          managers: matchedManager ? {
            manager_id: matchedManager.id,
            manager_name: matchedManager.name,
            manager_email: matchedManager.email
          } : null,
          sync_status: matchedManager ? '연동됨' : '담당자 없음',
          name_match_status: matchedManager ? 
            (user.name === matchedManager.name ? '일치' : '불일치') : 
            '확인 불가'
        };
      });
      
      console.log("Fetched sync status data:", processedData);
      setSyncStatus(processedData);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      toast({
        title: "연동 상태 조회 실패",
        description: "사용자와 담당자 연동 상태를 조회하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setSyncStatus([]);
    }
  };

  const syncUsersManagers = async () => {
    try {
      // RPC 함수가 존재하는지 확인하고 호출
      const { data, error } = await supabase
        .rpc('sync_existing_users_managers');

      if (error) {
        // RPC 함수가 존재하지 않는 경우
        if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('does not exist')) {
          toast({
            title: "동기화 기능 준비 중",
            description: "동기화 기능이 아직 설정되지 않았습니다. 데이터베이스 설정을 완료해주세요.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      toast({
        title: "동기화 완료",
        description: data || "사용자와 담당자 정보가 동기화되었습니다.",
      });
      
      // 데이터 새로고침
      await fetchUsers();
      await fetchSyncStatus();
    } catch (error) {
      console.error("Error syncing users and managers:", error);
      toast({
        title: "동기화 실패",
        description: "사용자와 담당자 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "성공",
        description: "비밀번호 재설정 이메일이 발송되었습니다.",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "에러",
        description: "비밀번호 재설정 이메일 발송에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && formData.password !== formData.confirmPassword) {
      toast({
        title: "에러",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && selectedUser) {
        // 부서, 법인, 직책 ID 찾기
        const departmentId = departments.find(d => d.code === formData.department)?.id;
        const corporationId = corporations.find(c => c.code === formData.corporation)?.id;
        const positionId = positions.find(p => p.code === formData.position)?.id;

        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department_id: departmentId || null,
            corporation_id: corporationId || null,
            position_id: positionId || null,
            country: formData.country || null,
          })
          .eq("id", selectedUser.id);

        if (error) throw error;

        toast({
          title: "성공",
          description: "사용자 정보가 수정되었습니다.",
        });
      } else {
        // 새 사용자 등록
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;

        // 부서, 법인, 직책 ID 찾기
        const departmentId = departments.find(d => d.code === formData.department)?.id;
        const corporationId = corporations.find(c => c.code === formData.corporation)?.id;
        const positionId = positions.find(p => p.code === formData.position)?.id;

        const { error: profileError } = await supabase
          .from("users")
          .insert([{
            id: authData.user?.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department_id: departmentId || null,
            corporation_id: corporationId || null,
            position_id: positionId || null,
            country: formData.country || null,
          }]);

        if (profileError) throw profileError;

        toast({
          title: "성공",
          description: "새로운 사용자가 등록되었습니다.",
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "에러",
        description: "사용자 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      department: user.department?.code || user.department || "",
      position: user.position?.code || user.position || "",
      corporation: user.corporation?.code || user.corporation || "",
      country: user.country || "",
      role: user.role || "user",
      password: "",
      confirmPassword: "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "사용자가 삭제되었습니다.",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "에러",
        description: "사용자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      department: "",
      position: "",
      corporation: "",
      country: "",
      role: "user",
      password: "",
      confirmPassword: "",
    });
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleModalOpen = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const getRolePermissions = (role: string) => {
    const foundRole = availableRoles.find(r => r.id === role);
    return foundRole ? foundRole.permissions : [];
  };

  return (
    <ResponsiveContainer>
      <ResponsiveCard hover={false} className="@container">
        <CardHeader>
          <div className="flex flex-col @lg:flex-row @lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg @sm:text-xl @lg:text-2xl">사용자 관리</CardTitle>
              <CardDescription className="mt-1 text-sm @sm:text-base">
                시스템 사용자 계정을 생성하고 관리합니다. 이메일 기준으로 담당자와 자동 연동됩니다.
              </CardDescription>
            </div>
            <div className="flex flex-col @sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSyncDialog(true)}
                className="touch-optimized flex items-center justify-center gap-2 w-full @sm:w-auto
                          hover:scale-105 active:scale-95 transition-transform duration-150
                          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden @sm:inline">담당자 연동 상태</span>
                <span className="@sm:hidden">연동 상태</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={syncUsersManagers}
                className="touch-optimized flex items-center justify-center gap-2 w-full @sm:w-auto
                          hover:scale-105 active:scale-95 transition-transform duration-150
                          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>동기화</span>
              </Button>
              <Button 
                size="sm" 
                onClick={handleModalOpen} 
                className="touch-optimized w-full @sm:w-auto
                          hover:scale-105 active:scale-95 transition-transform duration-150
                          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>새 사용자</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              <div className="col-span-1 sm:col-span-2 md:col-span-1">
                <Label htmlFor="search" className="text-xs font-medium">검색</Label>
                <Input 
                  id="search" 
                  placeholder="사용자 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="department" className="text-xs font-medium">부서</Label>
                <Select 
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger id="department" className="mt-1">
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 부서</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="country" className="text-xs">국가</Label>
                <Select
                  value={countryFilter}
                  onValueChange={setCountryFilter}
                >
                  <SelectTrigger id="country" className="flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="국가 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 국가</SelectItem>
                    <SelectItem value="KR">한국</SelectItem>
                    <SelectItem value="TH">태국</SelectItem>
                    <SelectItem value="CN">중국</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="corporation" className="text-xs">법인</Label>
                <Select
                  value={legalEntityFilter}
                  onValueChange={setLegalEntityFilter}
                >
                  <SelectTrigger id="corporation" className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="법인 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 법인</SelectItem>
                    {corporations.map((corp) => (
                      <SelectItem key={corp.id} value={corp.code}>
                        {corp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">사용자 이름</TableHead>
                      <TableHead className="min-w-[200px]">이메일</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">부서</TableHead>
                      <TableHead className="min-w-[100px] hidden md:table-cell">법인</TableHead>
                      <TableHead className="min-w-[120px] hidden lg:table-cell">담당자 연동</TableHead>
                      <TableHead className="min-w-[80px] hidden sm:table-cell">역할</TableHead>
                      <TableHead className="text-right min-w-[80px]">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user: any) => {
                      const userSyncStatus = syncStatus.find(s => s.user_email === user.email);
                      
                      // 역할 한국어 변환
                      const getRoleText = (role: string) => {
                        switch (role) {
                          case 'admin':
                            return '관리자';
                          case 'manager':
                            return '매니저';
                          case 'user':
                          default:
                            return '사용자';
                        }
                      };
                      
                      // 역할 색상 클래스
                      const getRoleBadgeClass = (role: string) => {
                        switch (role) {
                          case 'admin':
                            return 'bg-red-100 text-red-800 border border-red-200';
                          case 'manager':
                            return 'bg-blue-100 text-blue-800 border border-blue-200';
                          case 'user':
                          default:
                            return 'bg-green-100 text-green-800 border border-green-200';
                        }
                      };
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {user.department?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.corporation?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              {userSyncStatus ? (
                                <>
                                  {userSyncStatus.sync_status === '연동됨' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : userSyncStatus.sync_status === '담당자 없음' ? (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm">{userSyncStatus.sync_status}</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-muted-foreground">확인 중</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role || 'user')}`}>
                              {getRoleText(user.role || 'user')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="btn-mobile">
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">편집</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        검색 결과가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </ResponsiveCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEditMode ? "사용자 정보 수정" : "새 사용자 등록"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditMode 
                ? "사용자의 정보를 수정합니다. 비밀번호는 재설정 이메일을 통해 변경할 수 있습니다."
                : "새로운 사용자 계정을 생성합니다. 필수 정보를 입력해주세요."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {!isEditMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호 *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="department">부서</Label>
                <Select 
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">직책</Label>
                <Select 
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="직책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.code}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corporation">법인</Label>
                <Select 
                  value={formData.corporation}
                  onValueChange={(value) => setFormData({ ...formData, corporation: value })}
                >
                  <SelectTrigger id="corporation">
                    <SelectValue placeholder="법인 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {corporations.map((corp) => (
                      <SelectItem key={corp.id} value={corp.code}>
                        {corp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">국가</Label>
                <Select 
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="국가 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>역할</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center space-x-2 p-2 rounded border"
                  >
                    <Checkbox
                      checked={formData.role === role.id}
                      onCheckedChange={() => setFormData({ ...formData, role: role.id })}
                    />
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-sm text-gray-500">
                        권한: {role.permissions.map(p => 
                          p === 'all' ? '모든 권한' :
                          p === 'view' ? '조회' :
                          p === 'edit' ? '수정' :
                          p === 'create' ? '생성' : p
                        ).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordReset}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  비밀번호 재설정 이메일 발송
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button type="submit">
                {isEditMode ? "수정" : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 동기화 상태 다이얼로그 */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자-담당자 연동 상태
            </DialogTitle>
            <DialogDescription>
              이메일 기준으로 사용자와 담당자의 연동 상태를 확인하고 관리할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                이메일 기준으로 사용자와 담당자 연동 상태를 확인할 수 있습니다.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchSyncStatus}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이메일</TableHead>
                    <TableHead>사용자 이름</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>담당자 이름</TableHead>
                    <TableHead>연동 상태</TableHead>
                    <TableHead>이름 일치</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        <div className="flex flex-col items-center justify-center text-sm">
                          <Users className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">연동 상태 데이터가 없습니다.</p>
                          <p className="text-muted-foreground">새로고침을 클릭하여 데이터를 가져오세요.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    syncStatus.map((status) => (
                      <TableRow key={status.user_id}>
                        <TableCell>{status.user_email}</TableCell>
                        <TableCell>{status.user_name}</TableCell>
                        <TableCell>{status.departments.user_department_name}</TableCell>
                        <TableCell>
                          {status.managers?.manager_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={status.sync_status === '연동됨' ? 'default' : 'secondary'}
                          >
                            {status.sync_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              status.name_match_status === '일치' ? 'default' :
                              status.name_match_status === '불일치' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {status.name_match_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveContainer>
  );
};
