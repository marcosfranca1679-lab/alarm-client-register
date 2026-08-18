import type { Cliente, NovoCliente } from "./clientes.types";

export const SUPABASE_URL = "https://adyauaubmitdkfbutgix.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ugmm5Baa21OQAqPF4wB_9A_EdqzF0gx";

const TABLE_NAME = "clientes";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export async function buscarClientesSupabase(): Promise<Cliente[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=criado_em.desc`, {
      method: "GET",
      headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: any) => ({
      id: item.id,
      nome: item.nome || "",
      endereco: item.endereco || "",
      cpf: item.cpf || "",
      telefone: item.telefone || "",
      macCentral: item.mac_central || item.macCentral || "",
      modeloCentral: item.modelo_central || item.modeloCentral || "",
      observacoes: item.observacoes || "",
      status: item.status || "ativo",
      criadoEm: item.criado_em || item.criadoEm || new Date().toISOString(),
      manutencoes: Array.isArray(item.manutencoes) ? item.manutencoes : [],
    }));
  } catch (err) {
    console.warn("Erro ao buscar no Supabase:", err);
    return null;
  }
}

export async function salvarClienteSupabase(dados: NovoCliente): Promise<Cliente | null> {
  try {
    const payload = {
      nome: dados.nome,
      endereco: dados.endereco,
      cpf: dados.cpf,
      telefone: dados.telefone,
      mac_central: dados.macCentral,
      modelo_central: dados.modeloCentral,
      observacoes: dados.observacoes || "",
      status: "ativo",
      manutencoes: [],
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Falha no POST Supabase status:", res.status);
      return null;
    }

    const created = await res.json();
    const item = Array.isArray(created) ? created[0] : created;

    if (!item) return null;

    return {
      id: item.id,
      nome: item.nome,
      endereco: item.endereco,
      cpf: item.cpf,
      telefone: item.telefone,
      macCentral: item.mac_central || item.macCentral,
      modeloCentral: item.modelo_central || item.modeloCentral,
      observacoes: item.observacoes || "",
      status: item.status || "ativo",
      criadoEm: item.criado_em || item.criadoEm || new Date().toISOString(),
      manutencoes: Array.isArray(item.manutencoes) ? item.manutencoes : [],
    };
  } catch (err) {
    console.warn("Erro ao salvar no Supabase:", err);
    return null;
  }
}

export async function atualizarManutencoesSupabase(clienteId: string, manutencoes: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${clienteId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ manutencoes }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Erro ao atualizar manutenções no Supabase:", err);
    return false;
  }
}

export async function removerClienteSupabase(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch (err) {
    console.warn("Erro ao remover no Supabase:", err);
    return false;
  }
}
