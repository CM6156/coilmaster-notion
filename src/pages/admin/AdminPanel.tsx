import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { ClientManagement } from "@/components/admin/ClientManagement";
import CompetitorManagement from "@/components/admin/CompetitorManagement";
import EmployeesManagement from './sections/EmployeesManagement';
import ManagersManagement from './sections/ManagersManagement';
import CorporationsManagement from './sections/CorporationsManagement';
import PositionsManagement from './sections/PositionsManagement';
import DepartmentsManagement from './sections/DepartmentsManagement';
import { DataManagement } from '@/components/admin/DataManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import StatusManagement from '@/components/admin/StatusManagement';
import { useLanguage } from '@/context/LanguageContext';

const AdminPanel = () => {
  const { translations } = useLanguage();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{translations.global?.adminPanel || "관리자 패널"}</h1>
      
      <Tabs defaultValue="users" className="space-y-6">
        <div className="space-y-2">
          {/* 첫 번째 줄 탭들 */}
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
              <TabsTrigger value="users" className="whitespace-nowrap text-sm">{translations.global?.userManagement || "사용자 관리"}</TabsTrigger>
              <TabsTrigger value="employees" className="whitespace-nowrap text-sm">{translations.global?.employeeManagement || "직원 관리"}</TabsTrigger>
              <TabsTrigger value="managers" className="whitespace-nowrap text-sm">{translations.global?.managerManagement || "담당자 관리"}</TabsTrigger>
              <TabsTrigger value="clients" className="whitespace-nowrap text-sm">{translations.global?.clientManagement || "고객사 관리"}</TabsTrigger>
              <TabsTrigger value="corporations" className="whitespace-nowrap text-sm">{translations.global?.corporationManagement || "법인 관리"}</TabsTrigger>
              <TabsTrigger value="positions" className="whitespace-nowrap text-sm">{translations.global?.positionManagement || "직책 관리"}</TabsTrigger>
            </TabsList>
          </div>
          
          {/* 두 번째 줄 탭들 */}
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
              <TabsTrigger value="departments" className="whitespace-nowrap text-sm">{translations.global?.departmentManagement || "부서 관리"}</TabsTrigger>
              <TabsTrigger value="status" className="whitespace-nowrap text-sm">{translations.global?.statusManagement || "상태 관리"}</TabsTrigger>
              <TabsTrigger value="data" className="whitespace-nowrap text-sm">{translations.global?.dataManagement || "데이터 관리"}</TabsTrigger>
              <TabsTrigger value="settings" className="whitespace-nowrap text-sm">{translations.global?.settingsManagement || "설정 관리"}</TabsTrigger>
              <TabsTrigger value="competitors" className="whitespace-nowrap text-sm">{translations.global?.competitorManagement || "경쟁사 관리"}</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="employees">
          <EmployeesManagement />
        </TabsContent>

        <TabsContent value="managers">
          <ManagersManagement />
        </TabsContent>

        <TabsContent value="clients">
          <ClientManagement clients={[]} projects={[]} />
        </TabsContent>

        <TabsContent value="corporations">
          <CorporationsManagement />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManagement />
        </TabsContent>

        <TabsContent value="status">
          <StatusManagement />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsManagement />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel; 