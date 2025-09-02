'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/pt-br';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/use-auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Appointment, Patient } from '@/lib/types';
import { Plus, Calendar as CalendarIcon, Clock, User, Video, MapPin } from 'lucide-react';
import { toast } from 'sonner';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

export default function SchedulePage() {
  const { firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    date: new Date(),
    duration: 60,
    type: 'presencial',
    status: 'scheduled'
  });

  useEffect(() => {
    if (firebaseUser) {
      fetchPatients();
      subscribeToAppointments();
    }
  }, [firebaseUser]);

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
      toast.error('Erro ao carregar pacientes');
    }
  };

  const subscribeToAppointments = () => {
    if (!firebaseUser) return;

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('nutritionistId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));

      setAppointments(appointmentsList);

      // Convert to calendar events
      const calendarEvents = appointmentsList.map(appointment => ({
        id: appointment.id,
        title: appointment.patientName,
        start: appointment.date instanceof Date ? appointment.date : appointment.date.toDate(),
        end: appointment.date instanceof Date 
          ? new Date(appointment.date.getTime() + appointment.duration * 60000)
          : new Date(appointment.date.toDate().getTime() + appointment.duration * 60000),
        resource: appointment
      }));

      setEvents(calendarEvents);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreateAppointment = async () => {
    if (!firebaseUser || !newAppointment.patientId || !newAppointment.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const patient = patients.find(p => p.id === newAppointment.patientId);
      const appointmentData = {
        ...newAppointment,
        nutritionistId: firebaseUser.uid,
        patientName: patient?.name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      toast.success('Consulta agendada com sucesso!');
      setIsNewAppointmentOpen(false);
      setNewAppointment({
        date: new Date(),
        duration: 60,
        type: 'presencial',
        status: 'scheduled'
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao agendar consulta');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment?.id) return;

    try {
      const appointmentRef = doc(db, 'appointments', selectedAppointment.id);
      await updateDoc(appointmentRef, {
        ...selectedAppointment,
        updatedAt: new Date()
      });
      toast.success('Consulta atualizada com sucesso!');
      setIsEditAppointmentOpen(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar consulta');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      toast.success('Consulta cancelada com sucesso!');
      setIsEditAppointmentOpen(false);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Erro ao cancelar consulta');
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedAppointment(event.resource as Appointment);
    setIsEditAppointmentOpen(true);
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
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="patient">Paciente</Label>
                <Select value={newAppointment.patientId} onValueChange={(value) => 
                  setNewAppointment({...newAppointment, patientId: value})
                }>
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

              <div className="grid gap-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={moment(newAppointment.date).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setNewAppointment({
                    ...newAppointment, 
                    date: new Date(e.target.value)
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  type="number"
                  value={newAppointment.duration}
                  onChange={(e) => setNewAppointment({
                    ...newAppointment,
                    duration: parseInt(e.target.value)
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newAppointment.type} onValueChange={(value: 'online' | 'presencial') => 
                  setNewAppointment({...newAppointment, type: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAppointment.type === 'online' && (
                <div className="grid gap-2">
                  <Label htmlFor="link">Link da Teleconsulta</Label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={newAppointment.teleconsultationLink || ''}
                    onChange={(e) => setNewAppointment({
                      ...newAppointment,
                      teleconsultationLink: e.target.value
                    })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  placeholder="Observações sobre a consulta..."
                  value={newAppointment.notes || ''}
                  onChange={(e) => setNewAppointment({
                    ...newAppointment,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário de Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há consultas neste período.',
                showMore: (total) => `+ ${total} mais`,
              }}
              culture="pt-BR"
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditAppointmentOpen} onOpenChange={setIsEditAppointmentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{selectedAppointment.patientName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {moment(selectedAppointment.date instanceof Date ? selectedAppointment.date : selectedAppointment.date.toDate())
                    .format('DD/MM/YYYY [às] HH:mm')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedAppointment.type === 'online' ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span>{selectedAppointment.type === 'online' ? 'Online' : 'Presencial'}</span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={selectedAppointment.status} 
                  onValueChange={(value: 'scheduled' | 'completed' | 'canceled' | 'no-show') => 
                    setSelectedAppointment({...selectedAppointment, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                    <SelectItem value="no-show">Faltou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAppointment.notes && (
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={selectedAppointment.notes}
                    onChange={(e) => setSelectedAppointment({
                      ...selectedAppointment,
                      notes: e.target.value
                    })}
                  />
                </div>
              )}

              {selectedAppointment.type === 'online' && selectedAppointment.teleconsultationLink && (
                <div className="grid gap-2">
                  <Label>Link da Teleconsulta</Label>
                  <Input
                    value={selectedAppointment.teleconsultationLink}
                    onChange={(e) => setSelectedAppointment({
                      ...selectedAppointment,
                      teleconsultationLink: e.target.value
                    })}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedAppointment?.id && handleDeleteAppointment(selectedAppointment.id)}
            >
              Cancelar Consulta
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
                Fechar
              </Button>
              <Button onClick={handleUpdateAppointment}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}