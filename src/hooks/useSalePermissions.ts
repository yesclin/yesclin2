import { useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useLgpdEnforcement } from "@/hooks/lgpd/useLgpdEnforcement";

export interface SalePermissionResult {
  canCreateSale: boolean;
  canCreateLinkedSale: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  isLoading: boolean;
  lgpdStatus: {
    hasValidConsent: boolean;
    isEnforcementEnabled: boolean;
    needsConsent: boolean;
  };
}

/**
 * Hook to validate permissions for creating sales linked to patients/appointments
 * Respects LGPD rules and role-based permissions
 */
export function useSalePermissions(patientId: string | null): SalePermissionResult {
  const { can, isAdmin, isLoading: permissionsLoading } = usePermissions();
  const lgpdEnforcement = useLgpdEnforcement(patientId);

  const result = useMemo((): SalePermissionResult => {
    // Base permission check: can user create financial transactions?
    const canAccessFinanceiro = can("financeiro", "create");
    const canAccessEstoque = can("estoque", "view");
    
    // Check if user has permission to view patient data (required for linked sales)
    const canAccessPacientes = can("pacientes", "view");
    
    // Calculate base sale permission
    const canCreateSale = canAccessFinanceiro && canAccessEstoque;
    
    // For linked sales, user must also have patient access
    const canCreateLinkedSale = canCreateSale && canAccessPacientes;

    // LGPD status
    const lgpdStatus = {
      hasValidConsent: lgpdEnforcement.hasValidConsent,
      isEnforcementEnabled: lgpdEnforcement.isEnforcementEnabled,
      needsConsent: lgpdEnforcement.isEnforcementEnabled && !lgpdEnforcement.hasValidConsent,
    };

    // Determine if action is blocked and why
    let isBlocked = false;
    let blockReason: string | null = null;

    // Check permission blocking first
    if (!canCreateSale) {
      isBlocked = true;
      blockReason = "Você não tem permissão para registrar vendas. Entre em contato com o administrador da clínica.";
    } else if (patientId && !canAccessPacientes) {
      isBlocked = true;
      blockReason = "Você não tem permissão para acessar dados de pacientes. Não é possível vincular vendas a atendimentos.";
    }
    // Then check LGPD blocking (only if patient is involved)
    else if (patientId && lgpdStatus.needsConsent) {
      isBlocked = true;
      blockReason = "Este paciente não possui consentimento LGPD válido. Colete o consentimento antes de registrar vendas vinculadas.";
    }

    return {
      canCreateSale,
      canCreateLinkedSale,
      isBlocked,
      blockReason,
      isLoading: permissionsLoading || lgpdEnforcement.loading,
      lgpdStatus,
    };
  }, [
    can,
    isAdmin,
    permissionsLoading,
    patientId,
    lgpdEnforcement.hasValidConsent,
    lgpdEnforcement.isEnforcementEnabled,
    lgpdEnforcement.loading,
  ]);

  return result;
}
