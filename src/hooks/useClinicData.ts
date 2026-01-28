import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicData {
  id: string;
  name: string;
  logo_url: string | null;
  cnpj: string | null;
  cpf: string | null;
  fiscal_type: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

export function useClinicData() {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("clinic_id")
          .maybeSingle();

        if (!profile?.clinic_id) {
          setIsLoading(false);
          return;
        }

        const { data: clinicData } = await supabase
          .from("clinics")
          .select(`
            id,
            name,
            logo_url,
            cnpj,
            cpf,
            fiscal_type,
            inscricao_estadual,
            inscricao_municipal,
            phone,
            email,
            address_street,
            address_number,
            address_complement,
            address_neighborhood,
            address_city,
            address_state,
            address_zip
          `)
          .eq("id", profile.clinic_id)
          .maybeSingle();

        if (clinicData) {
          setClinic(clinicData);
        }
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  const getFormattedAddress = () => {
    if (!clinic) return null;
    
    const parts = [
      clinic.address_street,
      clinic.address_number,
      clinic.address_complement,
      clinic.address_neighborhood,
    ].filter(Boolean);

    const cityState = [clinic.address_city, clinic.address_state]
      .filter(Boolean)
      .join(" - ");

    if (parts.length === 0 && !cityState) return null;

    return `${parts.join(", ")}${cityState ? ` • ${cityState}` : ""}${clinic.address_zip ? ` • CEP: ${clinic.address_zip}` : ""}`;
  };

  const getFiscalDocument = () => {
    if (!clinic) return null;
    if (clinic.fiscal_type === "pj" && clinic.cnpj) {
      return { type: "CNPJ", value: clinic.cnpj };
    }
    if (clinic.fiscal_type === "pf" && clinic.cpf) {
      return { type: "CPF", value: clinic.cpf };
    }
    return null;
  };

  return {
    clinic,
    isLoading,
    getFormattedAddress,
    getFiscalDocument,
  };
}
