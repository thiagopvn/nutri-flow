'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  startOfMonth,
  endOfMonth 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FinancialRecord, Patient } from '@/lib/types';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth as startMonth, endOfMonth as endMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'bank_transfer', label: 'Transferência', icon: Building2 }
];

const CATEGORIES = [
  { value: 'consultation', label: 'Consultas', type: 'income' },
  { value: 'followup', label: 'Retorno', type: 'income' },
  { value: 'subscription', label: 'Assinatura', type: 'expense' },
  { value: 'equipment', label: 'Equipamentos', type: 'expense' },
  { value: 'marketing', label: 'Marketing', type: 'expense' },
  { value: 'office', label: 'Escritório', type: 'expense' },
  { value: 'other', label: 'Outros', type: 'both' }
];

export default function FinancialPage() {
  const { firebaseUser } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({
    type: 'income',
    date: new Date(),
    status: 'paid'
  });

  useEffect(() => {
    if (firebaseUser) {
      fetchPatients();
      subscribeToRecords();
    }
  }, [firebaseUser, selectedMonth]);

  const fetchPatients = async () => {
    if (!firebaseUser) return;

    try {
      const patientsQuery = query(
        collection(db, `users/${firebaseUser.uid}/patients`)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      setPatients(patientsList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const subscribeToRecords = () => {
    if (!firebaseUser) return;

    const monthStart = startMonth(selectedMonth);
    const monthEnd = endMonth(selectedMonth);

    const recordsQuery = query(
      collection(db, `users/${firebaseUser.uid}/financial`),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FinancialRecord));
      
      setRecords(recordsList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreateRecord = async () => {
    if (!firebaseUser || !newRecord.description || !newRecord.value || !newRecord.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const recordData = {
        ...newRecord,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, `users/${firebaseUser.uid}/financial`), recordData);
      toast.success('Registro criado com sucesso!');
      setIsNewRecordOpen(false);
      setNewRecord({
        type: 'income',
        date: new Date(),
        status: 'paid'
      });
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Erro ao criar registro');
    }
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord?.id) return;

    try {
      const recordRef = doc(db, `users/${firebaseUser?.uid}/financial`, selectedRecord.id);
      await updateDoc(recordRef, {
        ...selectedRecord,
        updatedAt: new Date()
      });
      toast.success('Registro atualizado com sucesso!');
      setIsEditRecordOpen(false);
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Erro ao atualizar registro');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, `users/${firebaseUser?.uid}/financial`, recordId));
      toast.success('Registro excluído com sucesso!');
      setIsEditRecordOpen(false);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  const calculateStats = () => {
    const totalIncome = records
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.value, 0);
    
    const totalExpenses = records
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.value, 0);
    
    const pendingIncome = records
      .filter(r => r.type === 'income' && r.status === 'pending')
      .reduce((sum, r) => sum + r.value, 0);
    
    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, pendingIncome, balance };
  };

  const getChartData = () => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    records.forEach(record => {
      const month = format(record.date instanceof Date ? record.date : record.date.toDate(), 'MMM', { locale: ptBR });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (record.status === 'paid') {
        if (record.type === 'income') {
          monthlyData[month].income += record.value;
        } else {
          monthlyData[month].expenses += record.value;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      receitas: data.income,
      despesas: data.expenses,
      lucro: data.income - data.expenses
    }));
  };

  const getCategoriesData = () => {
    const categoryData: { [key: string]: number } = {};
    
    records
      .filter(r => r.status === 'paid')
      .forEach(record => {
        const category = record.category || 'other';
        categoryData[category] = (categoryData[category] || 0) + record.value;
      });

    return Object.entries(categoryData).map(([category, value], index) => ({
      name: CATEGORIES.find(c => c.value === category)?.label || category,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getPaymentMethodIcon = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(pm => pm.value === method);
    return paymentMethod?.icon || DollarSign;
  };

  const stats = calculateStats();
  const chartData = getChartData();
  const categoriesData = getCategoriesData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="w-40"
          />
          <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Registro Financeiro</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={newRecord.type} 
                    onValueChange={(value: 'income' | 'expense') => 
                      setNewRecord({...newRecord, type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    placeholder="Descrição do registro..."
                    value={newRecord.description || ''}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      description: e.target.value
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newRecord.value || ''}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      value: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    type="date"
                    value={format(newRecord.date || new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      date: new Date(e.target.value)
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newRecord.category} 
                    onValueChange={(value) => 
                      setNewRecord({...newRecord, category: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES
                        .filter(cat => cat.type === newRecord.type || cat.type === 'both')
                        .map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {newRecord.type === 'income' && (
                  <div className="grid gap-2">
                    <Label htmlFor="patient">Paciente (opcional)</Label>
                    <Select 
                      value={newRecord.patientId} 
                      onValueChange={(value) => {
                        const patient = patients.find(p => p.id === value);
                        setNewRecord({
                          ...newRecord, 
                          patientId: value,
                          patientName: patient?.name
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id!}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Select 
                    value={newRecord.paymentMethod} 
                    onValueChange={(value) => 
                      setNewRecord({...newRecord, paymentMethod: value as any})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newRecord.status} 
                    onValueChange={(value: 'pending' | 'paid' | 'canceled') => 
                      setNewRecord({...newRecord, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewRecordOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRecord}>
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {stats.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              A Receber
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {stats.pendingIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="records">Registros</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                    <Bar dataKey="receitas" fill="#10b981" />
                    <Bar dataKey="despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoriesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records.map((record) => {
                  const Icon = getPaymentMethodIcon(record.paymentMethod || 'cash');
                  
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedRecord(record);
                        setIsEditRecordOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          record.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            record.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>
                              {format(
                                record.date instanceof Date ? record.date : record.date.toDate(), 
                                'dd/MM/yyyy', 
                                { locale: ptBR }
                              )}
                            </span>
                            {record.patientName && (
                              <>
                                <span>•</span>
                                <span>{record.patientName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          record.status === 'paid' ? 'default' : 
                          record.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {record.status === 'paid' ? 'Pago' : 
                           record.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                        <p className={`font-semibold ${
                          record.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.type === 'income' ? '+' : '-'}R$ {record.value.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Line 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Record Dialog */}
      <Dialog open={isEditRecordOpen} onOpenChange={setIsEditRecordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  value={selectedRecord.description}
                  onChange={(e) => setSelectedRecord({
                    ...selectedRecord,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedRecord.value}
                  onChange={(e) => setSelectedRecord({
                    ...selectedRecord,
                    value: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={selectedRecord.status} 
                  onValueChange={(value: 'pending' | 'paid' | 'canceled') => 
                    setSelectedRecord({...selectedRecord, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedRecord?.id && handleDeleteRecord(selectedRecord.id)}
            >
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditRecordOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRecord}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}