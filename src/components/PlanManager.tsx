import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { AuditLogService } from '@/services/AuditLogService';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, GripVertical, CheckCircle2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export function PlanManager() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    mp_price_id: '',
    stripe_price_id: '',
    description: '',
    features: [''],
    active: true,
    popular: false
  });

  useEffect(() => {
    const q = query(collection(db, 'planos'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'planos');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (plan: any = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        name: plan.name || '',
        price: plan.price || 0,
        mp_price_id: plan.mp_price_id || '',
        stripe_price_id: plan.stripe_price_id || '',
        description: plan.description || '',
        features: plan.features || [''],
        active: plan.active !== false,
        popular: plan.popular || false
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        name: '', price: 0, mp_price_id: '', stripe_price_id: '',
        description: '', features: [''], active: true, popular: false
      });
    }
    setIsModalOpen(true);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated });
  };

  const handleSave = async () => {
    if (!formData.name || formData.price < 0) {
      toast.error('Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      const filteredFeatures = formData.features.filter(f => f.trim() !== '');
      const payload = {
        ...formData,
        features: filteredFeatures
      };

      if (currentPlan) {
        await updateDoc(doc(db, 'planos', currentPlan.id), payload);
        await AuditLogService.logAction({
          action: 'PLAN_UPDATED',
          details: `Atualizou o plano ${formData.name}`,
          metadata: { planId: currentPlan.id, name: formData.name }
        });
        toast.success('Plano atualizado com sucesso!');
      } else {
        const docRef = await addDoc(collection(db, 'planos'), payload);
        await AuditLogService.logAction({
          action: 'PLAN_CREATED',
          details: `Criou novo plano ${formData.name}`,
          metadata: { planId: docRef.id, name: formData.name }
        });
        toast.success('Plano criado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'planos');
    }
  };

  const handleDelete = async (planId: string) => {
    const planToDelete = plans.find(p => p.id === planId);
    if (window.confirm('Tem certeza que deseja excluir este plano? Isso não afetará assinaturas existentes nos gateways.')) {
      try {
        await deleteDoc(doc(db, 'planos', planId));
        await AuditLogService.logAction({
          action: 'PLAN_DELETED',
          details: `Excluiu o plano ${planToDelete?.name || planId}`,
          metadata: { planId, name: planToDelete?.name }
        });
        toast.success('Plano excluído.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'planos');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Planos e Precificação</h2>
          <p className="text-sm text-slate-500">Configure os planos oferecidos pela plataforma.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Plano
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
          <p>Nenhum plano configurado. Crie seu primeiro plano para iniciar as vendas.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={`relative overflow-hidden ${!plan.active ? 'opacity-60 grayscale' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 font-semibold rounded-bl-lg">
                  Popular
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{plan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-2xl font-bold text-slate-800">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                  <span className="text-sm text-slate-500 mb-1">/{plan.interval || 'mês'}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {plan.features?.slice(0, 3).map((f: string, i: number) => (
                    <div key={i} className="flex items-center text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                  {plan.features?.length > 3 && (
                    <div className="text-xs text-slate-400 pl-6">+ {plan.features.length - 3} itens</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    {plan.mp_price_id && <Badge variant="secondary" className="text-xs bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200">MP Configurado</Badge>}
                    {plan.stripe_price_id && <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Stripe Configurado</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plan)}>
                      <Edit className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
            <DialogDescription>
              Ajuste as configurações e links nativos do Mercado Pago / Stripe para habilitá-lo na plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do Plano (Front-end)</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Master" />
            </div>
            
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex items-center space-x-2">
                <Switch checked={formData.active} onCheckedChange={c => setFormData({...formData, active: c})} />
                <Label>Plano Ativo (Visível)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.popular} onCheckedChange={c => setFormData({...formData, popular: c})} />
                <Label>Destacar como Popular</Label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descrição Curta</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center text-cyan-600"><DollarSign className="w-4 h-4 mr-1"/>Mercado Pago ID (Preapproval / Reference)</Label>
              <Input value={formData.mp_price_id} onChange={e => setFormData({...formData, mp_price_id: e.target.value})} placeholder="Opcional. Ex: 2c938084..." />
              <p className="text-xs text-slate-400">Usado se as preferências dinâmicas falharem ou for plano fixo.</p>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center text-indigo-600"><DollarSign className="w-4 h-4 mr-1"/>Stripe Price ID</Label>
              <Input value={formData.stripe_price_id} onChange={e => setFormData({...formData, stripe_price_id: e.target.value})} placeholder="Opcional. Ex: price_1xyz..." />
            </div>

            <div className="space-y-2 md:col-span-2 border-t pt-4">
              <Label className="mb-2 block">Benefícios do Plano (Features)</Label>
              {formData.features.map((feature, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={feature} 
                    onChange={e => handleFeatureChange(i, e.target.value)} 
                    placeholder="Ex: Suporte 24h"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFeature(i)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Benefício
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Confirmar e Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
