import { useState } from 'react';
import { X, User, Phone, MapPin, Building2, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PatientFormData, Patient } from '@/types/pacientes';
import { brazilianStates, relationshipOptions } from '@/types/pacientes';
import { toast } from 'sonner';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  insurances: { id: string; name: string }[];
  onSave: (data: PatientFormData) => void;
}

const initialFormData: PatientFormData = {
  full_name: '',
  birth_date: '',
  gender: '',
  cpf: '',
  phone: '',
  email: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  notes: '',
  payment_type: 'particular',
  insurance_id: '',
  card_number: '',
  valid_until: '',
  plan_name: '',
  has_guardian: false,
  guardian_name: '',
  guardian_relationship: '',
  guardian_cpf: '',
  guardian_phone: '',
  guardian_email: '',
  allergies: '',
  chronic_diseases: '',
  current_medications: '',
  clinical_restrictions: '',
};

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  insurances,
  onSave,
}: PatientFormDialogProps) {
  const [formData, setFormData] = useState<PatientFormData>(() => {
    if (patient) {
      return {
        ...initialFormData,
        full_name: patient.full_name,
        birth_date: patient.birth_date || '',
        gender: patient.gender || '',
        cpf: patient.cpf || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address_street: patient.address_street || '',
        address_number: patient.address_number || '',
        address_complement: patient.address_complement || '',
        address_neighborhood: patient.address_neighborhood || '',
        address_city: patient.address_city || '',
        address_state: patient.address_state || '',
        address_zip: patient.address_zip || '',
        notes: patient.notes || '',
        payment_type: patient.insurance ? 'insurance' : 'particular',
        insurance_id: patient.insurance?.insurance_id || '',
        card_number: patient.insurance?.card_number || '',
        valid_until: patient.insurance?.valid_until || '',
        plan_name: patient.insurance?.plan_name || '',
        has_guardian: !!patient.guardian,
        guardian_name: patient.guardian?.full_name || '',
        guardian_relationship: patient.guardian?.relationship || '',
        guardian_cpf: patient.guardian?.cpf || '',
        guardian_phone: patient.guardian?.phone || '',
        guardian_email: patient.guardian?.email || '',
        allergies: patient.clinical_data?.allergies.join(', ') || '',
        chronic_diseases: patient.clinical_data?.chronic_diseases.join(', ') || '',
        current_medications: patient.clinical_data?.current_medications.join(', ') || '',
        clinical_restrictions: patient.clinical_data?.clinical_restrictions || '',
      };
    }
    return initialFormData;
  });

  const [activeTab, setActiveTab] = useState('identification');

  const handleChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.full_name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    onSave(formData);
    onOpenChange(false);
    toast.success(patient ? 'Paciente atualizado!' : 'Paciente cadastrado!');
  };

  const isEditing = !!patient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identification" className="text-xs sm:text-sm">
                <User className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Identificação
              </TabsTrigger>
              <TabsTrigger value="address" className="text-xs sm:text-sm">
                <MapPin className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs sm:text-sm">
                <Building2 className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Convênio
              </TabsTrigger>
              <TabsTrigger value="clinical" className="text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Clínico
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="p-6 pt-4">
              {/* Identification Tab */}
              <TabsContent value="identification" className="m-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Guardian Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Label>Responsável Legal</Label>
                    </div>
                    <Switch
                      checked={formData.has_guardian}
                      onCheckedChange={(checked) => handleChange('has_guardian', checked)}
                    />
                  </div>

                  {formData.has_guardian && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="md:col-span-2">
                        <Label htmlFor="guardian_name">Nome do Responsável</Label>
                        <Input
                          id="guardian_name"
                          value={formData.guardian_name}
                          onChange={(e) => handleChange('guardian_name', e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_relationship">Parentesco</Label>
                        <Select
                          value={formData.guardian_relationship}
                          onValueChange={(value) => handleChange('guardian_relationship', value)}
                        >
                          <SelectTrigger id="guardian_relationship">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipOptions.map((rel) => (
                              <SelectItem key={rel} value={rel}>
                                {rel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="guardian_cpf">CPF do Responsável</Label>
                        <Input
                          id="guardian_cpf"
                          value={formData.guardian_cpf}
                          onChange={(e) => handleChange('guardian_cpf', e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_phone">Telefone</Label>
                        <Input
                          id="guardian_phone"
                          value={formData.guardian_phone}
                          onChange={(e) => handleChange('guardian_phone', e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_email">E-mail</Label>
                        <Input
                          id="guardian_email"
                          type="email"
                          value={formData.guardian_email}
                          onChange={(e) => handleChange('guardian_email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Address Tab */}
              <TabsContent value="address" className="m-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address_zip">CEP</Label>
                    <Input
                      id="address_zip"
                      value={formData.address_zip}
                      onChange={(e) => handleChange('address_zip', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="address_street">Rua / Logradouro</Label>
                    <Input
                      id="address_street"
                      value={formData.address_street}
                      onChange={(e) => handleChange('address_street', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      value={formData.address_number}
                      onChange={(e) => handleChange('address_number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={formData.address_complement}
                      onChange={(e) => handleChange('address_complement', e.target.value)}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_neighborhood">Bairro</Label>
                    <Input
                      id="address_neighborhood"
                      value={formData.address_neighborhood}
                      onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address_city">Cidade</Label>
                    <Input
                      id="address_city"
                      value={formData.address_city}
                      onChange={(e) => handleChange('address_city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_state">Estado</Label>
                    <Select
                      value={formData.address_state}
                      onValueChange={(value) => handleChange('address_state', value)}
                    >
                      <SelectTrigger id="address_state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="m-0 space-y-4">
                <div>
                  <Label>Tipo de Atendimento</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={formData.payment_type === 'particular' ? 'default' : 'outline'}
                      onClick={() => handleChange('payment_type', 'particular')}
                      className="flex-1"
                    >
                      Particular
                    </Button>
                    <Button
                      type="button"
                      variant={formData.payment_type === 'insurance' ? 'default' : 'outline'}
                      onClick={() => handleChange('payment_type', 'insurance')}
                      className="flex-1"
                    >
                      Convênio
                    </Button>
                  </div>
                </div>

                {formData.payment_type === 'insurance' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div>
                      <Label htmlFor="insurance_id">Convênio</Label>
                      <Select
                        value={formData.insurance_id}
                        onValueChange={(value) => handleChange('insurance_id', value)}
                      >
                        <SelectTrigger id="insurance_id">
                          <SelectValue placeholder="Selecione o convênio" />
                        </SelectTrigger>
                        <SelectContent>
                          {insurances.map((ins) => (
                            <SelectItem key={ins.id} value={ins.id}>
                              {ins.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card_number">Número da Carteirinha</Label>
                        <Input
                          id="card_number"
                          value={formData.card_number}
                          onChange={(e) => handleChange('card_number', e.target.value)}
                          placeholder="Número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valid_until">Validade</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={formData.valid_until}
                          onChange={(e) => handleChange('valid_until', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="plan_name">Nome do Plano</Label>
                      <Input
                        id="plan_name"
                        value={formData.plan_name}
                        onChange={(e) => handleChange('plan_name', e.target.value)}
                        placeholder="Ex: Plano Ouro, Executivo, etc."
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Observações Administrativas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Observações gerais sobre o paciente..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Clinical Tab */}
              <TabsContent value="clinical" className="m-0 space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Estes dados alimentam os <strong>Alertas Clínicos</strong> exibidos no Prontuário e na Agenda.
                  </p>
                </div>

                <div>
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    placeholder="Liste as alergias separadas por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="chronic_diseases">Doenças Pré-existentes</Label>
                  <Textarea
                    id="chronic_diseases"
                    value={formData.chronic_diseases}
                    onChange={(e) => handleChange('chronic_diseases', e.target.value)}
                    placeholder="Liste as doenças crônicas separadas por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="current_medications">Medicamentos em Uso</Label>
                  <Textarea
                    id="current_medications"
                    value={formData.current_medications}
                    onChange={(e) => handleChange('current_medications', e.target.value)}
                    placeholder="Liste os medicamentos separados por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="clinical_restrictions">Restrições Clínicas Importantes</Label>
                  <Textarea
                    id="clinical_restrictions"
                    value={formData.clinical_restrictions}
                    onChange={(e) => handleChange('clinical_restrictions', e.target.value)}
                    placeholder="Outras restrições ou observações clínicas relevantes..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 p-6 pt-0 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
