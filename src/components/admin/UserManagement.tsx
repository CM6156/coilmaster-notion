import { useState, useEffect } from "react";
import { User, Department } from "@/types";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface UserManagementProps {
  initialUsers?: User[];
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
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [corporations, setCorporations] = useState<CorporationInfo[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [legalEntityFilter, setLegalEntityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
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
        .from("users")
        .select(`
          *,
          departments!department_id(id, name, code),
          corporations!corporation_id(id, name, code),
          positions!position_id(id, name, code)
        `)
        .order("name");

      if (error) throw error;
      console.log("Fetched users data:", data);
      
      // 조인된 데이터를 적절한 형태로 변환
      const processedUsers = data?.map(user => ({
        ...user,
        department: user.departments,
        corporation: user.corporations,
        position: user.positions
      })) || [];
      
      setUsers(processedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "에러",
        description: "사용자 목록을 불러오는데 실패했습니다.",
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
      const { data, error } = await supabase
        .from("user_manager_sync_status")
        .select("*")
        .order("user_email");

      if (error) throw error;
      console.log("Fetched sync status data:", data);
      setSyncStatus(data || []);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      // 뷰가 없을 수 있으므로 에러를 무시
    }
  };

  const syncUsersManagers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('sync_existing_users_managers');

      if (error) throw error;
      
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>사용자 관리</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSyncDialog(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                담당자 연동 상태
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={syncUsersManagers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                동기화
              </Button>
              <Button size="sm" onClick={handleModalOpen}>
                <Plus className="mr-2 h-4 w-4" />
                새 사용자
              </Button>
            </div>
          </div>
          <CardDescription>
            시스템 사용자 계정을 생성하고 관리합니다. 이메일 기준으로 담당자와 자동 연동됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <Label htmlFor="search" className="text-xs">검색</Label>
                <Input 
                  id="search" 
                  placeholder="사용자 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="department" className="text-xs">부서</Label>
                <Select 
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger id="department">
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
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자 이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>법인</TableHead>
                    <TableHead>담당자 연동</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user: any) => {
                      const userSyncStatus = syncStatus.find(s => s.user_email === user.email);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            {user.department?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {user.corporation?.name || "-"}
                          </TableCell>
                          <TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4" />
                                편집
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        검색 결과가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "사용자 정보 수정" : "새 사용자 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자 이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>사용자 부서</TableHead>
                    <TableHead>담당자 이름</TableHead>
                    <TableHead>연동 상태</TableHead>
                    <TableHead>이름 일치</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatus.length > 0 ? (
                    syncStatus.map((status, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {status.user_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {status.user_email || status.manager_email}
                        </TableCell>
                        <TableCell>
                          {status.user_department_name || '-'}
                        </TableCell>
                        <TableCell>
                          {status.manager_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status.sync_status === '연동됨' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : status.sync_status === '담당자 없음' ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            ) : status.sync_status === '사용자 없음' ? (
                              <XCircle className="h-4 w-4 text-blue-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{status.sync_status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status.name_match_status === '일치' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : status.name_match_status === '불일치' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">{status.name_match_status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        동기화 상태 정보가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">연동됨</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">담당자 없음</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">사용자 없음</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">연동 불가</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={syncUsersManagers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              전체 동기화 실행
            </Button>
            <Button onClick={() => setShowSyncDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
