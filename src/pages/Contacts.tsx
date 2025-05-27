import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Client, Contact } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { generateId } from "@/utils/journalUtils";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data and functions for contacts until they're properly implemented in AppContext
const useMockContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const addContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
  };
  
  const updateContact = (updatedContact: Contact) => {
    setContacts(prev => 
      prev.map(c => c.id === updatedContact.id ? updatedContact : c)
    );
  };
  
  return { contacts, addContact, updateContact };
};

const Contacts = () => {
  const { clients } = useAppContext();
  const { contacts, addContact, updateContact } = useMockContacts();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    division: "Coilmaster",
    department: "",
    position: "",
    email: "",
    phone: "",
    remark: "",
  });
  const { toast } = useToast();

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.customerName && contact.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Auto-update PIC when customer is selected
  useEffect(() => {
    if (newContact.customerId) {
      const selectedClient = clients.find(c => c.id === newContact.customerId);
      if (selectedClient && selectedClient.salesRepName) {
        setNewContact(prev => ({ 
          ...prev, 
          customerName: selectedClient.name
        }));
      }
    }
  }, [newContact.customerId, clients]);

  const handleCreateContact = () => {
    const contactToCreate: Contact = {
      id: generateId(),
      name: newContact.name || "",
      division: newContact.division || "Coilmaster",
      customerId: newContact.customerId,
      customerName: newContact.customerName,
      department: newContact.department || "",
      position: newContact.position || "",
      email: newContact.email || "",
      phone: newContact.phone || "",
      remark: newContact.remark || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addContact(contactToCreate);
    setNewContact({
      name: "",
      division: "Coilmaster",
      department: "",
      position: "",
      email: "",
      phone: "",
      remark: "",
    });
    setIsCreateDialogOpen(false);
    toast({
      title: "연락처 추가 성공",
      description: `${contactToCreate.name} 연락처가 추가되었습니다.`,
    });
  };

  const handleUpdateContact = () => {
    if (selectedContact) {
      const updatedContact: Contact = {
        ...selectedContact,
        name: selectedContact.name,
        division: selectedContact.division,
        customerId: selectedContact.customerId,
        customerName: selectedContact.customerName,
        department: selectedContact.department,
        position: selectedContact.position,
        email: selectedContact.email,
        phone: selectedContact.phone,
        remark: selectedContact.remark,
        updatedAt: new Date().toISOString(),
      };

      updateContact(updatedContact);
      setIsEditDialogOpen(false);
      toast({
        title: "연락처 정보 업데이트 성공",
        description: `${updatedContact.name} 연락처 정보가 업데이트되었습니다.`,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contact DB</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>연락처 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">연락처 목록</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 회사, 이메일 검색"
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
                <TableHead>Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.division}</TableCell>
                  <TableCell>{contact.customerName}</TableCell>
                  <TableCell>{contact.department}</TableCell>
                  <TableCell>{contact.position}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedContact(contact);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No contacts found. Add your first contact!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>신규 연락처 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="division" className="text-right">
                Division
              </Label>
              <Select 
                value={newContact.division} 
                onValueChange={(value) => setNewContact({ ...newContact, division: value as "Coilmaster" | "Supplier" | "Customers" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coilmaster">Coilmaster</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Customer
              </Label>
              <Select 
                value={newContact.customerId} 
                onValueChange={(value) => {
                  const client = clients.find(c => c.id === value);
                  setNewContact({ 
                    ...newContact, 
                    customerId: value,
                    customerName: client?.name
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={newContact.department}
                onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Input
                id="position"
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remark" className="text-right">
                Remark
              </Label>
              <Input
                id="remark"
                value={newContact.remark}
                onChange={(e) => setNewContact({ ...newContact, remark: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateContact}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>연락처 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                이름
              </Label>
              <Input
                id="edit-name"
                value={selectedContact?.name || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-division" className="text-right">
                Division
              </Label>
              <Select 
                value={selectedContact?.division} 
                onValueChange={(value) => selectedContact && setSelectedContact({ ...selectedContact, division: value as "Coilmaster" | "Supplier" | "Customers" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coilmaster">Coilmaster</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-customer" className="text-right">
                Customer
              </Label>
              <Select 
                value={selectedContact?.customerId} 
                onValueChange={(value) => {
                  if (selectedContact) {
                    const client = clients.find(c => c.id === value);
                    setSelectedContact({ 
                      ...selectedContact, 
                      customerId: value,
                      customerName: client?.name
                    });
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">
                Department
              </Label>
              <Input
                id="edit-department"
                value={selectedContact?.department || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-position" className="text-right">
                Position
              </Label>
              <Input
                id="edit-position"
                value={selectedContact?.position || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={selectedContact?.email || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={selectedContact?.phone || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-remark" className="text-right">
                Remark
              </Label>
              <Input
                id="edit-remark"
                value={selectedContact?.remark || ""}
                onChange={(e) => selectedContact && setSelectedContact({ ...selectedContact, remark: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateContact}>업데이트</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
