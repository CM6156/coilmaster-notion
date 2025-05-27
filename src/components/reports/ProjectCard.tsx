import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Building, Clock, DollarSign, Percent } from "lucide-react";
import { Project } from "@/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useAppContext } from "@/context/AppContext";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { calculateProjectProgress } = useAppContext();
  
  // 실제 진행률 계산
  const actualProgress = calculateProjectProgress(project.id);

  // Get progress color based on the percentage
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Format the annual amount as currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date properly
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

  // Get badge color based on promotion status
  const getPromotionStatusColor = (status?: string) => {
    switch(status) {
      case 'Promotion': return 'bg-blue-500 hover:bg-blue-600';
      case 'Sample/견적제출': return 'bg-yellow-500 hover:bg-yellow-600';
      case '1차 특성검토': return 'bg-orange-500 hover:bg-orange-600';
      case '설계검증': return 'bg-purple-500 hover:bg-purple-600';
      case 'Set 검증': return 'bg-indigo-500 hover:bg-indigo-600';
      case '승인': return 'bg-green-500 hover:bg-green-600';
      case '수주': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'Drop': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card key={project.id} className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Building className="h-4 w-4" />
          {project.name}
          {project.completed && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              완료
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-2 text-sm text-gray-500 flex items-center justify-between">
          <span>{project.clientName}</span>
          {project.promotionStatus && (
            <Badge className={getPromotionStatusColor(project.promotionStatus)}>
              {project.promotionStatus}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">진행률</span>
          <span className="font-semibold">{actualProgress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full rounded-full ${getProgressColor(actualProgress)}`}
            style={{ width: `${actualProgress}%` }} 
          />
        </div>
        
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />시작일
            </span>
            <span>{formatDate(project.requestDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />목표일
            </span>
            <span>{formatDate(project.targetSOPDate)}</span>
          </div>
          {project.competitor && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center">
                경쟁사
              </span>
              <span>{project.competitor}</span>
            </div>
          )}
          {project.annualAmount ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />금액
              </span>
              <span>{formatCurrency(project.annualAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />단계
            </span>
            <span>{project.currentPhase || "계획"}</span>
          </div>
          {project.annualQuantity ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center">
                <Percent className="h-3 w-3 mr-1" />수량
              </span>
              <span>{project.annualQuantity.toLocaleString()}</span>
            </div>
          ) : null}
        </div>
        
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" className="w-full text-xs h-8">
            <FileText className="h-3 w-3 mr-1" /> 상세 보기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
