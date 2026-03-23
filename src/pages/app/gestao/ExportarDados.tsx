import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, Users, Calendar, FileText, Package, DollarSign, Shield, Loader2, CheckCircle2, Copy, Code2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [schemas, setSchemas] = useState<Record<string, string>>({});
  const [orderedScript, setOrderedScript] = useState<string>("");
  const [tableCount, setTableCount] = useState(0);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [schemasLoaded, setSchemasLoaded] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");

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

  const loadSchemas = async () => {
    setLoadingSchemas(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-table-schemas");
      if (error) throw error;
      if (data?.schemas) {
        setSchemas(data.schemas);
        setSchemasLoaded(true);
        toast.success("Schemas carregados com sucesso!");
      }
    } catch (err: any) {
      console.error("Error loading schemas:", err);
      toast.error(`Erro ao carregar schemas: ${err.message || "erro desconhecido"}`);
    } finally {
      setLoadingSchemas(false);
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label ? `SQL de "${label}" copiado!` : "SQL copiado para a área de transferência!");
  };

  const copyAllSchemas = () => {
    const allSql = Object.entries(schemas)
      .map(([table, sql]) => `-- =====================\n-- Table: ${table}\n-- =====================\n${sql}`)
      .join("\n\n\n");
    copyToClipboard(allSql, "Todas as tabelas");
  };

  const downloadAllSchemas = () => {
    const allSql = Object.entries(schemas)
      .map(([table, sql]) => `-- =====================\n-- Table: ${table}\n-- =====================\n${sql}`)
      .join("\n\n\n");
    const blob = new Blob([allSql], { type: "text/sql;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yesclin-schema-${format(new Date(), "yyyy-MM-dd-HHmm")}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo SQL baixado com sucesso!");
  };

  const categories = [...new Set(EXPORT_TABLES.map((t) => t.category))];
  const sortedSchemaKeys = Object.keys(schemas).sort();
  const filteredSchemaKeys = schemaSearch
    ? sortedSchemaKeys.filter((k) => k.toLowerCase().includes(schemaSearch.toLowerCase()))
    : sortedSchemaKeys;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
        <p className="text-muted-foreground mt-1">
          Exporte dados em CSV ou obtenha o SQL das tabelas para migração.
        </p>
      </div>

      <Tabs defaultValue="csv" className="space-y-4">
        <TabsList>
          <TabsTrigger value="csv" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </TabsTrigger>
          <TabsTrigger value="sql" className="gap-2">
            <Code2 className="h-4 w-4" />
            SQL das Tabelas
          </TabsTrigger>
        </TabsList>

        {/* CSV Export Tab */}
        <TabsContent value="csv" className="space-y-6">
          <div className="flex flex-wrap gap-2">
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

          <Card className="border-accent bg-accent/10">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> A exportação inclui até 10.000 registros por tabela. Os arquivos CSV são codificados em UTF-8 com separador ponto e vírgula (;) para compatibilidade com Excel.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SQL Schema Tab */}
        <TabsContent value="sql" className="space-y-4">
          {!schemasLoaded ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Code2 className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold text-lg">SQL das Tabelas do Sistema</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Gere o SQL (CREATE TABLE) de todas as tabelas para copiar e migrar para outro banco de dados.
                  </p>
                </div>
                <Button onClick={loadSchemas} disabled={loadingSchemas}>
                  {loadingSchemas ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {loadingSchemas ? "Carregando..." : "Gerar SQL das Tabelas"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={copyAllSchemas} size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todo o SQL
                </Button>
                <Button onClick={downloadAllSchemas} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo .sql
                </Button>
                <Button onClick={loadSchemas} variant="ghost" size="sm" disabled={loadingSchemas}>
                  {loadingSchemas ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recarregar"}
                </Button>
                <Badge variant="secondary" className="self-center">
                  {sortedSchemaKeys.length} tabelas
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tabela... ex: clinics, patients, appointments"
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {schemaSearch && (
                <p className="text-sm text-muted-foreground">
                  {filteredSchemaKeys.length} tabela(s) encontrada(s) para "{schemaSearch}"
                </p>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {schemaSearch ? `Tabelas filtradas (${filteredSchemaKeys.length})` : "SQL completo — todas as tabelas"}
                  </CardTitle>
                  <CardDescription>Copie o conteúdo abaixo e cole no seu banco de destino para recriar as tabelas.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => {
                        const sql = filteredSchemaKeys
                          .map((table) => `-- =====================\n-- Table: ${table}\n-- =====================\n${schemas[table]}`)
                          .join("\n\n\n");
                        copyToClipboard(sql, schemaSearch ? `Tabelas filtradas` : "Todas as tabelas");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </Button>
                    <ScrollArea className="h-[500px] w-full rounded-md border bg-muted/50">
                      <pre className="p-4 text-xs font-mono text-foreground whitespace-pre overflow-x-auto">
                        {filteredSchemaKeys
                          .map((table) => `-- =====================\n-- Table: ${table}\n-- =====================\n${schemas[table]}`)
                          .join("\n\n\n")}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
