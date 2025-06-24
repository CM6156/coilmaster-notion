import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  Plus,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Crown,
  Shield,
  Activity,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  PauseCircle,
  StopCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import EmployeeCreateDialog from "./EmployeeCreateDialog";

const EmployeeList = () => {
  const { employees, departments, currentUser, tasks } = useAppContext();
  const { translations, language } = useLanguage();
  const navigate = useNavigate();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 직원별 업무 통계 계산
  const getEmployeeTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employeeId);
    
    const notStarted = employeeTasks.filter(task => task.status === 'not-started' || task.status === 'planned').length;
    const inProgress = employeeTasks.filter(task => task.status === 'in-progress' || task.status === 'active').length;
    const completed = employeeTasks.filter(task => task.status === 'completed' || task.status === 'done').length;
    
    // 만료된 업무 (완료되지 않았지만 마감일이 지난 업무)
    const today = new Date();
    const overdue = employeeTasks.filter(task => {
      if (task.status === 'completed' || task.status === 'done') return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < today;
    }).length;
    
    return { notStarted, inProgress, completed, overdue };
  };

  // 직원 데이터 필터링 - employees 테이블 구조에 맞게 수정
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.english_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 부서 필터링
      const matchesDepartment = selectedDepartment === "all" || 
                               employee.department_id === selectedDepartment;
      
      // employees 테이블에는 role이 없으므로 모든 역할 허용
      const matchesRole = selectedRole === "all";
      
      // employees 테이블에는 is_active가 없으므로 모든 상태 허용
      const matchesStatus = selectedStatus === "all";

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  }, [employees, searchTerm, selectedDepartment, selectedRole, selectedStatus]);

  // 통계 계산 - employees 테이블 구조에 맞게 수정
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.length; // employees 테이블에는 is_active가 없으므로 전체를 활성으로 간주
    const admins = 0; // employees 테이블에는 role이 없음
    const managers = 0; // employees 테이블에는 role이 없음
    
    return { total, active, admins, managers };
  }, [employees]);

  // 부서 이름 가져오기 - employees 테이블 구조에 맞게 수정
  const getDepartmentName = (employee: any) => {
    // department 객체가 있는 경우 (JOIN으로 가져온 데이터)
    if (employee.department && typeof employee.department === 'object' && employee.department.name) {
      return employee.department.name;
    }
    
    // department_id로 departments 배열에서 찾기
    if (employee.department_id) {
      const dept = departments.find(d => d.id === employee.department_id);
      if (dept) {
        return dept.name;
      }
    }
    
    return '-';
  };

  // 역할 한국어 이름
  const getRoleKoreanName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      case 'user': return '사용자';
      default: return role;
    }
  };

  // 직원 상세 보기 - 중앙 콘솔에서 열기
  const handleEmployeeClick = (employee: any) => {
    navigate(`/employees/${employee.id}`);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">직원 관리</h1>
            <p className="text-muted-foreground">직원 정보를 관리하고 조회합니다</p>
          </div>
        </div>
        
        {/* 디버깅 버튼 추가 */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('=== 직원 데이터 디버깅 ===');
              console.log('전체 직원 수:', employees.length);
              employees.forEach((emp, index) => {
                console.log(`직원 ${index + 1}:`, {
                  id: emp.id,
                  name: emp.name,
                  avatar: emp.avatar,
                  hasAvatar: !!emp.avatar
                });
              });
            }}
          >
            🔍 디버그
          </Button>
        
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 직원 등록
                </Button>
              </DialogTrigger>
              <EmployeeCreateDialog 
                open={isCreateDialogOpen} 
                onOpenChange={setIsCreateDialogOpen}
              />
            </Dialog>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 직원</p>
                <p className="text-2xl font-bold">{stats.total}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">활성 직원</p>
                <p className="text-2xl font-bold">{stats.active}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">관리자</p>
                <p className="text-2xl font-bold">{stats.admins}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">매니저</p>
                <p className="text-2xl font-bold">{stats.managers}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="직원 이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="부서 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 부서</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="역할 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
            <SelectItem value="manager">매니저</SelectItem>
            <SelectItem value="user">사용자</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 직원 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredEmployees.length}명의 직원이 있습니다
          </p>
        </div>

        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">직원이 없습니다</h3>
              <p className="text-muted-foreground text-center mb-4">
                검색 조건에 맞는 직원이 없거나 아직 등록된 직원이 없습니다.
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  첫 번째 직원 등록
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard 
                key={employee.id} 
                employee={employee} 
                onEmployeeClick={handleEmployeeClick}
                getDepartmentName={getDepartmentName}
                getRoleKoreanName={getRoleKoreanName}
                taskStats={getEmployeeTaskStats(employee.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 직원 상세 다이얼로그 */}
      {selectedEmployee && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>직원 상세 정보</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedEmployee.avatar} alt="프로필 이미지" />
                  <AvatarFallback className={cn(
                    "text-xl font-bold text-white",
                    selectedEmployee.role === 'admin' ? "bg-red-500" :
                    selectedEmployee.role === 'manager' ? "bg-blue-500" : "bg-green-500"
                  )}>
                    {selectedEmployee.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedEmployee.name}</h2>
                  <p className="text-muted-foreground">{selectedEmployee.email}</p>
                  <Badge className={cn(
                    "mt-1",
                    selectedEmployee.role === 'admin' ? "bg-red-500" :
                    selectedEmployee.role === 'manager' ? "bg-blue-500" : "bg-green-500"
                  )}>
                    {getRoleKoreanName(selectedEmployee.role || 'user')}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">기본 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이메일:</span>
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">전화번호:</span>
                      <span>{selectedEmployee.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">부서:</span>
                      <span>{getDepartmentName(selectedEmployee)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">활동 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">상태:</span>
                      <span className={selectedEmployee.isActive !== false ? "text-green-600" : "text-red-600"}>
                        {selectedEmployee.isActive !== false ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">입사일:</span>
                      <span>
                        {selectedEmployee.created_at 
                          ? format(new Date(selectedEmployee.created_at), 'yyyy.MM.dd', { locale: ko })
                          : '-'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">마지막 로그인:</span>
                      <span>
                        {selectedEmployee.last_seen 
                          ? format(new Date(selectedEmployee.last_seen), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '로그인 기록 없음'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// 직원 카드 컴포넌트 - 업무 상태 추가
const EmployeeCard = ({ 
  employee, 
  onEmployeeClick, 
  getDepartmentName, 
  getRoleKoreanName,
  taskStats
}: {
  employee: any;
  onEmployeeClick: (employee: any) => void;
  getDepartmentName: (employee: any) => string;
  getRoleKoreanName: (role: string) => string;
  taskStats: { notStarted: number; inProgress: number; completed: number; overdue: number; };
}) => {
  const isActive = employee.isActive !== false;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        isActive 
          ? employee.role === 'admin' 
            ? "border-l-red-500 hover:border-l-red-600" 
            : employee.role === 'manager'
            ? "border-l-blue-500 hover:border-l-blue-600"
            : "border-l-green-500 hover:border-l-green-600"
          : "border-l-gray-400 opacity-75"
      )}
      onClick={() => onEmployeeClick(employee)}
    >
      <CardContent className="p-4">
        {/* 프로필 섹션 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={employee.avatar} 
                alt="프로필 이미지"
                onError={() => {
                  console.log('프로필 이미지 로드 실패:', {
                    name: employee.name,
                    avatar: employee.avatar,
                    avatarType: typeof employee.avatar,
                    isBase64: employee.avatar?.startsWith('data:'),
                    length: employee.avatar?.length
                  });
                }}
                onLoad={() => {
                  console.log('프로필 이미지 로드 성공:', {
                    name: employee.name,
                    avatarType: typeof employee.avatar,
                    isBase64: employee.avatar?.startsWith('data:'),
                    length: employee.avatar?.length
                  });
                }}
              />
              <AvatarFallback className="font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500">
                {employee.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{employee.name || '이름 없음'}</h3>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "text-xs",
                employee.role === 'admin' ? "bg-red-500" :
                employee.role === 'manager' ? "bg-blue-500" : "bg-green-500"
              )}
            >
              {getRoleKoreanName(employee.role || 'user')}
            </Badge>
            <div className="flex items-center gap-1">
              {isActive ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-2 mb-4">
          {employee.department && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{getDepartmentName(employee)}</span>
            </div>
          )}
          
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          
          {employee.created_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>입사: {format(new Date(employee.created_at), 'yyyy.MM.dd', { locale: ko })}</span>
            </div>
          )}
        </div>

        {/* 업무 상태 */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            업무 현황
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <StopCircle className="h-3 w-3 text-gray-500" />
                <span className="text-muted-foreground">시작전</span>
              </div>
              <span className="font-medium">{taskStats.notStarted}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3 text-blue-500" />
                <span className="text-muted-foreground">진행중</span>
              </div>
              <span className="font-medium text-blue-600">{taskStats.inProgress}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">완료</span>
              </div>
              <span className="font-medium text-green-600">{taskStats.completed}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-muted-foreground">만료</span>
              </div>
              <span className="font-medium text-red-600">{taskStats.overdue}</span>
            </div>
          </div>
        </div>

        {/* 마지막 로그인 */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>마지막 로그인</span>
            <span>
              {employee.last_seen 
                ? format(new Date(employee.last_seen), 'MM.dd HH:mm')
                : '로그인 기록 없음'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeList; 