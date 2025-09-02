'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DietPlan, Patient, Meal, FoodItem } from '@/lib/types';
import { 
  Plus, 
  FileText, 
  Clock, 
  Calendar,
  Users,
  Edit,
  Trash2,
  Copy,
  Download,
  Utensils,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

export default function DietPlansPage() {
  const { firebaseUser } = useAuth();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isViewPlanOpen, setIsViewPlanOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newPlan, setNewPlan] = useState<Partial<DietPlan>>({
    title: '',
    objective: '',
    totalCalories: 0,
    macros: {
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    },
    meals: [],
    recommendations: []
  });

  const [newMeal, setNewMeal] = useState<Meal>({
    name: '',
    time: '',
    calories: 0,
    items: []
  });

  const [newFoodItem, setNewFoodItem] = useState<FoodItem>({
    food: '',
    quantity: '',
    unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    if (firebaseUser) {
      fetchPatients();
      subscribeToDietPlans();
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
    }
  };

  const subscribeToDietPlans = () => {
    if (!firebaseUser) return;

    const plansQuery = query(
      collection(db, `users/${firebaseUser.uid}/dietPlans`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DietPlan));
      
      setDietPlans(plansList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreatePlan = async () => {
    if (!firebaseUser || !newPlan.title) {
      toast.error('Preencha pelo menos o título do plano');
      return;
    }

    try {
      const planData = {
        ...newPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, `users/${firebaseUser.uid}/dietPlans`), planData);
      toast.success('Plano alimentar criado com sucesso!');
      setIsNewPlanOpen(false);
      resetNewPlan();
    } catch (error) {
      console.error('Error creating diet plan:', error);
      toast.error('Erro ao criar plano alimentar');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan?.id) return;

    try {
      const planRef = doc(db, `users/${firebaseUser?.uid}/dietPlans`, selectedPlan.id);
      await updateDoc(planRef, {
        ...selectedPlan,
        updatedAt: new Date()
      });
      toast.success('Plano atualizado com sucesso!');
      setIsEditPlanOpen(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, `users/${firebaseUser?.uid}/dietPlans`, planId));
      toast.success('Plano excluído com sucesso!');
      setIsEditPlanOpen(false);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const handleCopyPlan = async (plan: DietPlan) => {
    try {
      const copiedPlan = {
        ...plan,
        title: `${plan.title} - Cópia`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      delete copiedPlan.id;

      await addDoc(collection(db, `users/${firebaseUser?.uid}/dietPlans`), copiedPlan);
      toast.success('Plano copiado com sucesso!');
    } catch (error) {
      console.error('Error copying plan:', error);
      toast.error('Erro ao copiar plano');
    }
  };

  const generatePDF = (plan: DietPlan) => {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Plano Alimentar', 20, 30);
    
    pdf.setFontSize(16);
    pdf.text(plan.title, 20, 45);
    
    pdf.setFontSize(12);
    pdf.text(`Objetivo: ${plan.objective || 'Não especificado'}`, 20, 60);
    pdf.text(`Calorias totais: ${plan.totalCalories || 0} kcal`, 20, 70);
    
    if (plan.macros) {
      pdf.text(`Proteínas: ${plan.macros.protein}g | Carboidratos: ${plan.macros.carbs}g | Gorduras: ${plan.macros.fat}g`, 20, 80);
    }
    
    let yPosition = 100;
    
    // Meals
    plan.meals.forEach((meal, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text(`${meal.name} (${meal.time})`, 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      meal.items.forEach((item) => {
        pdf.text(`• ${item.food} - ${item.quantity} ${item.unit || ''} (${item.calories || 0} kcal)`, 30, yPosition);
        yPosition += 8;
      });
      
      yPosition += 5;
    });
    
    // Recommendations
    if (plan.recommendations && plan.recommendations.length > 0) {
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text('Recomendações:', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      plan.recommendations.forEach((rec) => {
        pdf.text(`• ${rec}`, 30, yPosition);
        yPosition += 10;
      });
    }
    
    pdf.save(`${plan.title}.pdf`);
  };

  const addMealToPlan = () => {
    if (!newMeal.name || !newMeal.time) {
      toast.error('Preencha nome e horário da refeição');
      return;
    }

    setNewPlan({
      ...newPlan,
      meals: [...(newPlan.meals || []), newMeal]
    });

    setNewMeal({
      name: '',
      time: '',
      calories: 0,
      items: []
    });
  };

  const addFoodItemToMeal = () => {
    if (!newFoodItem.food || !newFoodItem.quantity) {
      toast.error('Preencha alimento e quantidade');
      return;
    }

    setNewMeal({
      ...newMeal,
      items: [...newMeal.items, newFoodItem],
      calories: (newMeal.calories || 0) + (newFoodItem.calories || 0)
    });

    setNewFoodItem({
      food: '',
      quantity: '',
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  };

  const resetNewPlan = () => {
    setNewPlan({
      title: '',
      objective: '',
      totalCalories: 0,
      macros: {
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      meals: [],
      recommendations: []
    });
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
        <h1 className="text-3xl font-bold">Planos Alimentares</h1>
        <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano Alimentar</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Plano</Label>
                <Input
                  placeholder="Ex: Plano de Emagrecimento - João"
                  value={newPlan.title || ''}
                  onChange={(e) => setNewPlan({
                    ...newPlan,
                    title: e.target.value
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="objective">Objetivo</Label>
                <Textarea
                  placeholder="Descreva o objetivo do plano alimentar..."
                  value={newPlan.objective || ''}
                  onChange={(e) => setNewPlan({
                    ...newPlan,
                    objective: e.target.value
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="calories">Calorias Totais</Label>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={newPlan.totalCalories || ''}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      totalCalories: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fiber">Fibras (g)</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={newPlan.macros?.fiber || ''}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      macros: {
                        ...newPlan.macros!,
                        fiber: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="protein">Proteínas (g)</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={newPlan.macros?.protein || ''}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      macros: {
                        ...newPlan.macros!,
                        protein: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="carbs">Carboidratos (g)</Label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={newPlan.macros?.carbs || ''}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      macros: {
                        ...newPlan.macros!,
                        carbs: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fat">Gorduras (g)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={newPlan.macros?.fat || ''}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      macros: {
                        ...newPlan.macros!,
                        fat: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Refeições</Label>
                
                {/* Current Meals */}
                {newPlan.meals && newPlan.meals.length > 0 && (
                  <div className="space-y-2">
                    {newPlan.meals.map((meal, index) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{meal.name}</p>
                              <p className="text-sm text-gray-500">{meal.time} - {meal.calories} kcal</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedMeals = newPlan.meals!.filter((_, i) => i !== index);
                                setNewPlan({...newPlan, meals: updatedMeals});
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add New Meal */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Adicionar Refeição</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="mealName">Nome da Refeição</Label>
                          <Input
                            placeholder="Ex: Café da Manhã"
                            value={newMeal.name}
                            onChange={(e) => setNewMeal({
                              ...newMeal,
                              name: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="mealTime">Horário</Label>
                          <Input
                            placeholder="Ex: 08:00"
                            value={newMeal.time}
                            onChange={(e) => setNewMeal({
                              ...newMeal,
                              time: e.target.value
                            })}
                          />
                        </div>
                      </div>

                      {/* Food Items in Current Meal */}
                      {newMeal.items.length > 0 && (
                        <div className="space-y-2">
                          <Label>Alimentos:</Label>
                          {newMeal.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{item.food} - {item.quantity} {item.unit}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updatedItems = newMeal.items.filter((_, i) => i !== index);
                                  setNewMeal({
                                    ...newMeal,
                                    items: updatedItems,
                                    calories: updatedItems.reduce((sum, i) => sum + (i.calories || 0), 0)
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Food Item */}
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Alimento"
                          value={newFoodItem.food}
                          onChange={(e) => setNewFoodItem({
                            ...newFoodItem,
                            food: e.target.value
                          })}
                        />
                        <Input
                          placeholder="Qtd"
                          value={newFoodItem.quantity}
                          onChange={(e) => setNewFoodItem({
                            ...newFoodItem,
                            quantity: e.target.value
                          })}
                        />
                        <Input
                          placeholder="Unidade"
                          value={newFoodItem.unit}
                          onChange={(e) => setNewFoodItem({
                            ...newFoodItem,
                            unit: e.target.value
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Kcal"
                          value={newFoodItem.calories || ''}
                          onChange={(e) => setNewFoodItem({
                            ...newFoodItem,
                            calories: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={addFoodItemToMeal}>
                          Adicionar Alimento
                        </Button>
                        <Button type="button" onClick={addMealToPlan}>
                          Salvar Refeição
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewPlanOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePlan}>
                Criar Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dietPlans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(plan.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsViewPlanOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyPlan(plan)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => generatePDF(plan)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{plan.objective || 'Sem objetivo especificado'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{plan.totalCalories || 0} kcal</span>
                </div>

                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{plan.meals?.length || 0} refeições</span>
                </div>

                {plan.macros && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="font-medium text-blue-800">{plan.macros.protein}g</p>
                      <p className="text-blue-600">Proteína</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="font-medium text-green-800">{plan.macros.carbs}g</p>
                      <p className="text-green-600">Carbo</p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded text-center">
                      <p className="font-medium text-orange-800">{plan.macros.fat}g</p>
                      <p className="text-orange-600">Gordura</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsEditPlanOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => plan.id && handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dietPlans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum plano alimentar criado
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Crie seu primeiro plano alimentar para começar a organizar as dietas dos seus pacientes.
            </p>
            <Button onClick={() => setIsNewPlanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Plan Dialog */}
      <Dialog open={isViewPlanOpen} onOpenChange={setIsViewPlanOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">Objetivo</h4>
                  <p className="text-sm text-gray-600">{selectedPlan.objective || 'Não especificado'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações Nutricionais</h4>
                    <div className="space-y-2 text-sm">
                      <p>Calorias: {selectedPlan.totalCalories || 0} kcal</p>
                      {selectedPlan.macros && (
                        <>
                          <p>Proteínas: {selectedPlan.macros.protein}g</p>
                          <p>Carboidratos: {selectedPlan.macros.carbs}g</p>
                          <p>Gorduras: {selectedPlan.macros.fat}g</p>
                          <p>Fibras: {selectedPlan.macros.fiber}g</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Refeições</h4>
                  <Accordion type="single" collapsible className="w-full">
                    {selectedPlan.meals?.map((meal, index) => (
                      <AccordionItem key={index} value={`meal-${index}`}>
                        <AccordionTrigger>
                          <div className="flex justify-between w-full mr-4">
                            <span>{meal.name}</span>
                            <span className="text-sm text-gray-500">{meal.time} - {meal.calories || 0} kcal</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {meal.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{item.food}</span>
                                <span className="text-sm text-gray-600">
                                  {item.quantity} {item.unit} - {item.calories || 0} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {selectedPlan.recommendations && selectedPlan.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recomendações</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {selectedPlan.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => generatePDF(selectedPlan!)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={() => setIsViewPlanOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}