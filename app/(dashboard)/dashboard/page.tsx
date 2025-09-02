'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  UserPlus,
  CalendarPlus,
  Activity,
  DollarSign
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/use-auth';
import { Appointment, Patient } from '@/lib/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    monthlyPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (firebaseUser) {
      fetchDashboardData();
    }
  }, [firebaseUser]);

  const fetchDashboardData = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);

      // Fetch total patients
      const patientsRef = collection(db, `users/${firebaseUser.uid}/patients`);
      const patientsSnapshot = await getDocs(patientsRef);
      const totalPatients = patientsSnapshot.size;

      // Fetch recent patients
      const recentPatientsQuery = query(
        patientsRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentPatientsSnapshot = await getDocs(recentPatientsQuery);
      const recentPatientsList = recentPatientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));

      // Fetch monthly new patients
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthlyPatientsQuery = query(
        patientsRef,
        where('createdAt', '>=', Timestamp.fromDate(monthStart)),
        where('createdAt', '<=', Timestamp.fromDate(monthEnd))
      );
      const monthlyPatientsSnapshot = await getDocs(monthlyPatientsQuery);
      const monthlyPatients = monthlyPatientsSnapshot.size;

      // Fetch upcoming appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('nutritionistId', '==', firebaseUser.uid),
        where('date', '>=', Timestamp.now()),
        where('status', '==', 'scheduled'),
        orderBy('date', 'asc'),
        limit(5)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));

      // Count today's appointments
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayAppointments = appointmentsList.filter(apt => {
        const aptDate = apt.date instanceof Timestamp ? apt.date.toDate() : apt.date;
        return aptDate >= todayStart && aptDate <= todayEnd;
      }).length;

      // Generate chart data (mock for now)
      const chartData = [
        { name: 'Jan', pacientes: 4 },
        { name: 'Fev', pacientes: 6 },
        { name: 'Mar', pacientes: 8 },
        { name: 'Abr', pacientes: 12 },
        { name: 'Mai', pacientes: 15 },
        { name: 'Jun', pacientes: 18 },
      ];

      setStats({
        totalPatients,
        monthlyPatients,
        todayAppointments,
        monthlyRevenue: 0, // TODO: Calculate from financial records
      });
      setUpcomingAppointments(appointmentsList);
      setRecentPatients(recentPatientsList);
      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/patients/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </Link>
          <Link href="/schedule">
            <Button variant="outline">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Agendar Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyPatients} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consultas Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments.length} agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Crescimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              Comparado ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Evolução de Pacientes</CardTitle>
            <CardDescription>
              Número de novos pacientes nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pacientes"
                  stroke="#10b981"
                  fill="#10b98120"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
            <CardDescription>
              Suas próximas consultas agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma consulta agendada
                </p>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {appointment.patientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.date instanceof Timestamp
                          ? format(appointment.date.toDate(), "dd/MM 'às' HH:mm", { locale: ptBR })
                          : format(appointment.date, "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        appointment.type === 'online' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {appointment.type === 'online' ? 'Online' : 'Presencial'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Recentes</CardTitle>
          <CardDescription>
            Últimos pacientes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum paciente cadastrado ainda
              </p>
            ) : (
              recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {patient.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {patient.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Link href={`/patients/${patient.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import Avatar components locally for this file
const Avatar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
    {children}
  </div>
);