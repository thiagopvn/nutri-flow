'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { User } from '@/lib/types';
import { 
  Settings,
  User as UserIcon,
  Bell,
  Shield,
  Palette,
  CreditCard,
  HelpCircle,
  Camera,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    crn: '',
    whatsappNumber: '',
    logoUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    marketingEmails: false,
    weeklyReports: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    dataSharing: false,
    analyticsTracking: true
  });

  useEffect(() => {
    if (firebaseUser) {
      fetchUserProfile();
    }
  }, [firebaseUser]);

  const fetchUserProfile = async () => {
    if (!firebaseUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
        setProfileData({
          name: userData.name || firebaseUser.displayName || '',
          email: userData.email || firebaseUser.email || '',
          crn: userData.crn || '',
          whatsappNumber: userData.whatsappNumber || '',
          logoUrl: userData.logoUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: profileData.name
      });

      // Update Firestore document
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        crn: profileData.crn,
        whatsappNumber: profileData.whatsappNumber,
        updatedAt: new Date()
      });

      toast.success('Perfil atualizado com sucesso!');
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!firebaseUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(firebaseUser, passwordData.newPassword);
      toast.success('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Por segurança, faça login novamente antes de alterar a senha');
      } else {
        toast.error('Erro ao atualizar senha');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firebaseUser) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    setSaving(true);
    try {
      const imageRef = ref(storage, `avatars/${firebaseUser.uid}/${Date.now()}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update profile photo URL
      await updateProfile(firebaseUser, {
        photoURL: downloadURL
      });

      // Update Firestore document
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        logoUrl: downloadURL,
        updatedAt: new Date()
      });

      setProfileData({ ...profileData, logoUrl: downloadURL });
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (setting: string, value: boolean) => {
    if (!firebaseUser) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        [`notificationSettings.${setting}`]: value,
        updatedAt: new Date()
      });

      setNotificationSettings(prev => ({
        ...prev,
        [setting]: value
      }));

      toast.success('Configuração de notificação atualizada!');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Erro ao atualizar configurações');
    }
  };

  const handlePrivacyUpdate = async (setting: string, value: boolean) => {
    if (!firebaseUser) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        [`privacySettings.${setting}`]: value,
        updatedAt: new Date()
      });

      setPrivacySettings(prev => ({
        ...prev,
        [setting]: value
      }));

      toast.success('Configuração de privacidade atualizada!');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Erro ao atualizar configurações');
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
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="mr-2 h-4 w-4" />
            Privacidade
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.logoUrl || firebaseUser?.photoURL || ''} />
                    <AvatarFallback className="text-lg">
                      {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profileData.name || 'Usuário'}</h3>
                  <p className="text-gray-500">{profileData.email}</p>
                  <Badge variant="outline" className="mt-2">
                    {userProfile?.subscription?.type || 'Free'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      name: e.target.value
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="crn">CRN (Opcional)</Label>
                  <Input
                    id="crn"
                    value={profileData.crn}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      crn: e.target.value
                    })}
                    placeholder="Ex: CRN-1 12345"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp (Opcional)</Label>
                  <Input
                    id="whatsapp"
                    value={profileData.whatsappNumber}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      whatsappNumber: e.target.value
                    })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handlePasswordUpdate} 
                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {saving ? 'Atualizando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base font-medium">
                      Notificações por Email
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(value) => handleNotificationUpdate('emailNotifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications" className="text-base font-medium">
                      Notificações Push
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receba notificações no navegador
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(value) => handleNotificationUpdate('pushNotifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="appointmentReminders" className="text-base font-medium">
                      Lembretes de Consulta
                    </Label>
                    <p className="text-sm text-gray-500">
                      Seja lembrado antes das suas consultas
                    </p>
                  </div>
                  <Switch
                    id="appointmentReminders"
                    checked={notificationSettings.appointmentReminders}
                    onCheckedChange={(value) => handleNotificationUpdate('appointmentReminders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails" className="text-base font-medium">
                      Emails de Marketing
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receba dicas e novidades sobre nutrição
                    </p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(value) => handleNotificationUpdate('marketingEmails', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports" className="text-base font-medium">
                      Relatórios Semanais
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receba um resumo semanal das suas atividades
                    </p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(value) => handleNotificationUpdate('weeklyReports', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profileVisibility" className="text-base font-medium">
                      Visibilidade do Perfil
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permita que outros usuários vejam seu perfil
                    </p>
                  </div>
                  <Switch
                    id="profileVisibility"
                    checked={privacySettings.profileVisibility}
                    onCheckedChange={(value) => handlePrivacyUpdate('profileVisibility', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dataSharing" className="text-base font-medium">
                      Compartilhamento de Dados
                    </Label>
                    <p className="text-sm text-gray-500">
                      Compartilhe dados anonimizados para melhorar o serviço
                    </p>
                  </div>
                  <Switch
                    id="dataSharing"
                    checked={privacySettings.dataSharing}
                    onCheckedChange={(value) => handlePrivacyUpdate('dataSharing', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsTracking" className="text-base font-medium">
                      Rastreamento de Analytics
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permite coleta de dados de uso para melhorias
                    </p>
                  </div>
                  <Switch
                    id="analyticsTracking"
                    checked={privacySettings.analyticsTracking}
                    onCheckedChange={(value) => handlePrivacyUpdate('analyticsTracking', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano de Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="text-lg font-medium">
                    Plano {userProfile?.subscription?.type || 'Free'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Status: {userProfile?.subscription?.status || 'Ativo'}
                  </p>
                </div>
                <Badge variant={userProfile?.subscription?.type === 'premium' ? 'default' : 'secondary'}>
                  {userProfile?.subscription?.type === 'premium' ? 'Premium' : 'Gratuito'}
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recursos do seu plano:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    ✅ Dashboard completo
                  </li>
                  <li className="flex items-center gap-2">
                    ✅ Gerenciamento de pacientes
                  </li>
                  <li className="flex items-center gap-2">
                    ✅ Agendamento de consultas
                  </li>
                  <li className="flex items-center gap-2">
                    {userProfile?.subscription?.type === 'premium' ? '✅' : '❌'} Chat ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    {userProfile?.subscription?.type === 'premium' ? '✅' : '❌'} Relatórios avançados
                  </li>
                  <li className="flex items-center gap-2">
                    {userProfile?.subscription?.type === 'premium' ? '✅' : '❌'} Planos alimentares ilimitados
                  </li>
                </ul>
              </div>

              {userProfile?.subscription?.type !== 'premium' && (
                <Button className="w-full">
                  Fazer Upgrade para Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}