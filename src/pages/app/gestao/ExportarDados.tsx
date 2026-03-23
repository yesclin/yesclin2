import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, Users, Calendar, FileText, Package, DollarSign, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ExportTable {
  key: string;
  label: string;
  description: string;
  icon: typeof Database;
  category: string;
  tableName: string;
}

const EXPORT_TABLES: ExportTable[] = [
  // Pacientes e Clínica
  { key: "patients", label: "Pacientes", description: "Dados cadastrais de todos os pacientes", icon: Users, category: "Clínica", tableName: "patients" },
  { key: "profiles", label: "Perfis de Usuários", description: "Perfis dos usuários do sistema", icon: Users, category: "Clínica", tableName: "profiles" },
  { key: "professionals", label: "Profissionais", description: "Cadastro de profissionais", icon: Users, category: "Clínica", tableName: "professionals" },
  { key: "clinics", label: "Clínica", description: "Dados da clínica", icon: Database, category: "Clínica", tableName: "clinics" },
  
  // Agendamentos
  { key: "appointments", label: "Agendamentos", description: "Todos os agendamentos", icon: Calendar, category: "Agendamentos", tableName: "appointments" },
  { key: "appointment_types", label: "Tipos de Agendamento", description: "Tipos de agendamento configurados", icon: Calendar, category: "Agendamentos", tableName: "appointment_types" },
  { key: "appointment_statuses", label: "Status de Agendamento", description: "Status de agendamento configurados", icon: Calendar, category: "Agendamentos", tableName: "appointment_statuses" },
  
  // Prontuário
  { key: "clinical_evolutions", label: "Evoluções Clínicas", description: "Registros de evolução clínica", icon: FileText, category: "Prontuário", tableName: "clinical_evolutions" },
  { key: "anamnesis_records", label: "Registros de Anamnese", description: "Anamneses preenchidas", icon: FileText, category: "Prontuário", tableName: "anamnesis_records" },
  { key: "anamnesis_templates", label: "Modelos de Anamnese", description: "Templates de anamnese", icon: FileText, category: "Prontuário", tableName: "anamnesis_templates" },
  { key: "clinical_documents", label: "Documentos Clínicos", description: "Documentos emitidos", icon: FileText, category: "Prontuário", tableName: "clinical_documents" },
  { key: "clinical_alerts", label: "Alertas Clínicos", description: "Alertas de pacientes", icon: Shield, category: "Prontuário", tableName: "clinical_alerts" },
  
  // Procedimentos e Produtos
  { key: "procedures", label: "Procedimentos", description: "Cadastro de procedimentos", icon: Package, category: "Procedimentos", tableName: "procedures" },
  { key: "products", label: "Produtos", description: "Cadastro de produtos", icon: Package, category: "Procedimentos", tableName: "products" },
  { key: "stock_movements", label: "Movimentações de Estoque", description: "Entradas e saídas de estoque", icon: Package, category: "Procedimentos", tableName: "stock_movements" },
  { key: "material_consumption", label: "Consumo de Materiais", description: "Consumo vinculado a atendimentos", icon: Package, category: "Procedimentos", tableName: "material_consumption" },
  
  // Financeiro
  { key: "financial_transactions", label: "Transações Financeiras", description: "Movimentações financeiras", icon: DollarSign, category: "Financeiro", tableName: "financial_transactions" },
  { key: "insurances", label: "Convênios", description: "Convênios cadastrados", icon: DollarSign, category: "Financeiro", tableName: "insurances" },
  
  // Logs e Auditoria
  { key: "audit_logs", label: "Logs de Auditoria", description: "Registros de auditoria do sistema", icon: Shield, category: "Logs", tableName: "audit_logs" },
  { key: "access_logs", label: "Logs de Acesso", description: "Registros de acesso ao sistema", icon: Shield, category: "Logs", tableName: "access_logs" },
  
  // Configurações
  { key: "specialties", label: "Especialidades", description: "Especialidades habilitadas", icon: Database, category: "Configurações", tableName: "specialties" },
  { key: "rooms", label: "Salas", description: "Salas configuradas", icon: Database, category: "Configurações", tableName: "rooms" },
  { key: "user_roles", label: "Papéis de Usuário", description: "Papéis e permissões", icon: Shield, category: "Configurações", tableName: "user_roles" },
  { key: "module_permissions", label: "Permissões por Módulo", description: "Configuração de permissões", icon: Shield, category: "Configurações", tableName: "module_permissions" },
];

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const BOM = "\uFEFF";
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(";")
  );
  return BOM + [headers.join(";"), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportarDados() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState<Set<string>>(new Set());

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === EXPORT_TABLES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(EXPORT_TABLES.map((t) => t.key)));
    }
  };

  const exportSingle = async (table: ExportTable) => {
    setExporting((prev) => new Set(prev).add(table.key));
    try {
      // Use type assertion for dynamic table access
      const { data, error } = await (supabase.from(table.tableName as any) as any).select("*").limit(10000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(`${table.label}: nenhum dado encontrado`);
        return;
      }
      const csv = convertToCSV(data as Record<string, unknown>[]);
      const filename = `${table.tableName}-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      setExported((prev) => new Set(prev).add(table.key));
      toast.success(`${table.label} exportado com sucesso! (${data.length} registros)`);
    } catch (err: any) {
      console.error(`Export error for ${table.tableName}:`, err);
      toast.error(`Erro ao exportar ${table.label}: ${err.message || "erro desconhecido"}`);
    } finally {
      setExporting((prev) => {
        const next = new Set(prev);
        next.delete(table.key);
        return next;
      });
    }
  };

  const exportSelected = async () => {
    if (selected.size === 0) {
      toast.warning("Selecione pelo menos uma tabela para exportar");
      return;
    }
    const tables = EXPORT_TABLES.filter((t) => selected.has(t.key));
    for (const table of tables) {
      await exportSingle(table);
    }
    toast.success("Exportação concluída!");
  };

  const categories = [...new Set(EXPORT_TABLES.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
          <p className="text-muted-foreground mt-1">
            Exporte os dados do sistema em formato CSV para backup ou análise externa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAll} size="sm">
            {selected.size === EXPORT_TABLES.length ? "Desmarcar Todos" : "Selecionar Todos"}
          </Button>
          <Button
            onClick={exportSelected}
            disabled={selected.size === 0 || exporting.size > 0}
            size="sm"
          >
            {exporting.size > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar Selecionados ({selected.size})
          </Button>
        </div>
      </div>

      {/* Tables by Category */}
      {categories.map((category) => {
        const tables = EXPORT_TABLES.filter((t) => t.category === category);
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>{tables.length} tabelas disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {tables.map((table) => {
                  const isExporting = exporting.has(table.key);
                  const isExported = exported.has(table.key);
                  const isSelected = selected.has(table.key);

                  return (
                    <div
                      key={table.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSelect(table.key)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(table.key)}
                      />
                      <table.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{table.label}</span>
                          {isExported && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{table.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isExporting}
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSingle(table);
                        }}
                      >
                        {isExporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> A exportação inclui até 10.000 registros por tabela. Os arquivos CSV são codificados em UTF-8 com separador ponto e vírgula (;) para compatibilidade com Excel. Dados sensíveis como senhas e tokens não são exportados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
