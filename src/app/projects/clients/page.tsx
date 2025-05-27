'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateClientDialog from "@/components/projects/dialogs/CreateClientDialog";

export default function ClientsPage() {
  const { clients } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.manager?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.flag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.remark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.homepage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">고객사 목록</h1>
          <p className="text-muted-foreground">현재 {clients.length}개의 고객사가 등록되어 있습니다.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          신규 고객 등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>고객사 관리</CardTitle>
            <Input
              placeholder="고객사 검색..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객사명</TableHead>
                  <TableHead>담당자(PIC)</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>홈페이지</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.manager?.name || '-'}</TableCell>
                      <TableCell>{client.flag || '-'}</TableCell>
                      <TableCell>{client.remark || '-'}</TableCell>
                      <TableCell>
                        {client.homepage ? (
                          <a 
                            href={client.homepage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            링크
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{client.projects?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            수정
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 