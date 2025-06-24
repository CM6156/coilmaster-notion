import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Search, 
  Users, 
  UserCheck, 
  Shield, 
  Briefcase,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Grid3x3,
  List,
  Filter,
  Building2,
  User,
  Settings,
  TrendingUp,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import EmployeeCreateDialog from '../components/EmployeeCreateDialog';
import ManagersGrid from '../components/managers/ManagersGrid';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { employees, departments, corporations, positions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [corporationFilter, setCorporationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 현재 경로가 /managers인지 확인
  const isManagersRoute = location.pathname === '/managers';

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 부서명 가져오기 함수
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '미지정';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || '미지정';
  };

  // 법인명 가져오기 함수
  const getCorporationName = (corporationId?: string) => {
    if (!corporationId) return '미지정';
    const corporation = corporations.find(c => c.id === corporationId);
    return corporation?.name || '미지정';
  };

  // 직책명 가져오기 함수
  const getPositionName = (positionId?: string) => {
    if (!positionId) return '미지정';
    const position = positions.find(p => p.id === positionId);
    return position?.name || '미지정';
  };

  // 필터링된 직원 목록
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.english_name && employee.english_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || employee.department_id === departmentFilter;
      const matchesCorporation = corporationFilter === 'all' || employee.corporation_id === corporationFilter;
      
      return matchesSearch && matchesDepartment && matchesCorporation;
    });
  }, [employees, searchTerm, departmentFilter, corporationFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const departmentCounts = departments.map(dept => ({
      ...dept,
      count: employees.filter(emp => emp.department_id === dept.id).length
    }));
    const corporationCounts = corporations.map(corp => ({
      ...corp,
      count: employees.filter(emp => emp.corporation_id === corp.id).length
    }));

    return {
      total: totalEmployees,
      departments: departmentCounts,
      corporations: corporationCounts,
      filtered: filteredEmployees.length
    };
  }, [employees, departments, corporations, filteredEmployees]);

  const handleEmployeeClick = (id: string) => {
    // 경로에 따라 다른 URL로 이동
    if (isManagersRoute) {
      navigate(`/managers/${id}`);
    } else {
      navigate(`/employees/${id}`);
    }
  };

  // 직원 카드 컴포넌트
  const EmployeeCard = ({ employee }: { employee: any }) => (
    <Card 
      className="group cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-white dark:bg-gray-800"
      onClick={() => handleEmployeeClick(employee.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 shadow-lg ring-2 ring-gray-200 dark:ring-gray-700">
            <AvatarImage
              src={employee.avatar || employee.profile_image}
              alt={employee.name}
              className="object-cover"
            />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {employee.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {employee.name}
              </h3>
            </div>
            
            {employee.english_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{employee.english_name}</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Building2 className="w-4 h-4 mr-2 text-blue-500" />
                <span>{getDepartmentName(employee.department_id)}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                <span>{getPositionName(employee.position_id)}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4 mr-2 text-green-500" />
                <span>{employee.employee_number}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(employee.created_at)}</span>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {getCorporationName(employee.corporation_id)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 리스트 뷰 컴포넌트
  const EmployeeListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                직원
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                부서
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                직책
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                법인
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                입사일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmployees.map((employee) => (
              <tr 
                key={employee.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-4">
                      <AvatarImage src={employee.avatar || employee.profile_image} alt={employee.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {employee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {employee.english_name || employee.employee_number}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getDepartmentName(employee.department_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getPositionName(employee.position_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="text-xs">
                    {getCorporationName(employee.corporation_id)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(employee.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isManagersRoute ? '담당자 목록' : '직원 관리'}
        </h1>
        
        {!isManagersRoute && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            직원 추가
          </Button>
        )}
      </div>

      {isManagersRoute ? (
        // 담당자 페이지에서는 ManagersGrid 컴포넌트 사용
        <ManagersGrid />
      ) : (
        // 직원 관리 페이지에서는 기존 UI 유지
        <>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 좌측 필터 카드 */}
            <Card className="lg:w-1/4 shrink-0 shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="font-medium text-lg flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    필터
                  </h2>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">부서</p>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 부서</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({stats.departments.find(d => d.id === dept.id)?.count || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">법인</p>
                    <Select value={corporationFilter} onValueChange={setCorporationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="법인 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 법인</SelectItem>
                        {corporations.map((corp) => (
                          <SelectItem key={corp.id} value={corp.id}>
                            {corp.name} ({stats.corporations.find(c => c.id === corp.id)?.count || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">직원 통계</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">전체 직원</span>
                      </div>
                      <Badge variant="secondary">{stats.total}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-green-500" />
                        <span className="font-medium">필터링됨</span>
                      </div>
                      <Badge variant="secondary">{stats.filtered}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 우측 직원 목록 */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="이름, 영문명, 사번으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* 직원 목록 또는 그리드 */}
              {filteredEmployees.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredEmployees.map((employee) => (
                      <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                  </div>
                ) : (
                  <EmployeeListView />
                )
              ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <User className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">검색 결과가 없습니다</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">다른 검색어를 입력하거나 필터를 조정해보세요.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm('');
                      setDepartmentFilter('all');
                      setCorporationFilter('all');
                    }}
                  >
                    필터 초기화
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 직원/담당자 생성 다이얼로그 */}
      <EmployeeCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isManager={isManagersRoute}
      />
    </div>
  );
};

export default EmployeeList; 