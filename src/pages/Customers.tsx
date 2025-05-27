
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { generateId } from "@/utils/journalUtils";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

const Customers = () => {
  const { clients, addClient, updateClient } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    salesRepName: "",
    flag: "",
    remark: "",
  });
  const { toast } = useToast();
  const { translations } = useLanguage();
  const t = translations;

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.salesRepName && client.salesRepName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateClient = () => {
    const clientToCreate: Client = {
      id: generateId(),
      name: newClient.name || "",
      company: newClient.company || "",
      email: newClient.email || "",
      phone: newClient.phone || "",
      salesRepName: newClient.salesRepName || "",
      flag: newClient.flag || "",
      remark: newClient.remark || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addClient(clientToCreate);
    setNewClient({
      name: "",
      company: "",
      email: "",
      phone: "",
      salesRepName: "",
      flag: "",
      remark: "",
    });
    setIsCreateDialogOpen(false);
    toast({
      title: t?.clients?.clientAddSuccess || "고객 추가 성공",
      description: `${clientToCreate.name} ${t?.clients?.clientAddedDescription || "고객이 추가되었습니다."}`
    });
  };

  const handleUpdateClient = () => {
    if (selectedClient) {
      const updatedClient: Client = {
        ...selectedClient,
        name: selectedClient.name,
        company: selectedClient.company || "",
        email: selectedClient.email || "",
        phone: selectedClient.phone || "",
        salesRepName: selectedClient.salesRepName,
        flag: selectedClient.flag,
        remark: selectedClient.remark,
        updatedAt: new Date().toISOString(),
      };

      updateClient(updatedClient);
      setIsEditDialogOpen(false);
      toast({
        title: t?.clients?.clientUpdateSuccess || "고객 정보 업데이트 성공",
        description: `${updatedClient.name} ${t?.clients?.clientUpdatedDescription || "고객 정보가 업데이트되었습니다."}`
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t?.clients?.clientDB || "고객 DB"}</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>{t?.clients?.addClient || "고객 추가"}</Button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t?.clients?.clientList || "고객 목록"}</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t?.clients?.searchClientOrRep || "고객명 또는 담당자 검색"}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t?.clients?.name || "고객명"}</TableHead>
                <TableHead>{t?.clients?.salesRep || "영업담당자(PIC)"}</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>{t?.global?.actions || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.salesRepName}</TableCell>
                  <TableCell>{client.flag}</TableCell>
                  <TableCell>{client.remark}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      {t?.global?.edit || "Edit"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t?.clients?.noCustomersFound || "No customers found. Add your first customer!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t?.clients?.addNewClient || "신규 고객 추가"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t?.clients?.name || "고객명"}
              </Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salesRepName" className="text-right">
                {t?.clients?.salesRep || "영업담당자"}
              </Label>
              <Input
                id="salesRepName"
                value={newClient.salesRepName}
                onChange={(e) => setNewClient({ ...newClient, salesRepName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="flag" className="text-right">
                Flag
              </Label>
              <Input
                id="flag"
                value={newClient.flag}
                onChange={(e) => setNewClient({ ...newClient, flag: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remark" className="text-right">
                Remark
              </Label>
              <Input
                id="remark"
                value={newClient.remark}
                onChange={(e) => setNewClient({ ...newClient, remark: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateClient}>{t?.global?.save || "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t?.clients?.editClientInfo || "고객 정보 수정"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                {t?.clients?.name || "고객명"}
              </Label>
              <Input
                id="edit-name"
                value={selectedClient?.name || ""}
                onChange={(e) => selectedClient && setSelectedClient({ ...selectedClient, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-salesRepName" className="text-right">
                {t?.clients?.salesRep || "영업담당자"}
              </Label>
              <Input
                id="edit-salesRepName"
                value={selectedClient?.salesRepName || ""}
                onChange={(e) => selectedClient && setSelectedClient({ ...selectedClient, salesRepName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-flag" className="text-right">
                Flag
              </Label>
              <Input
                id="edit-flag"
                value={selectedClient?.flag || ""}
                onChange={(e) => selectedClient && setSelectedClient({ ...selectedClient, flag: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-remark" className="text-right">
                Remark
              </Label>
              <Input
                id="edit-remark"
                value={selectedClient?.remark || ""}
                onChange={(e) => selectedClient && setSelectedClient({ ...selectedClient, remark: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateClient}>{t?.global?.update || "업데이트"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
