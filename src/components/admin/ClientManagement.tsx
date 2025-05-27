
import { useState } from "react";
import { Client, Project } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus } from "lucide-react";

interface ClientManagementProps {
  clients: Client[];
  projects: Project[];
}

export const ClientManagement = ({ clients, projects }: ClientManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter(client =>
    searchQuery === "" || client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>고객사 관리</CardTitle>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            새 고객사
          </Button>
        </div>
        <CardDescription>
          고객사 정보를 생성하고 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input 
            placeholder="고객사 검색..." 
            className="max-w-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객사명</TableHead>
                  <TableHead>국가</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>프로젝트 수</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.country}</TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell>
                      {projects.filter(p => p.clientId === client.id).length}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        편집
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
