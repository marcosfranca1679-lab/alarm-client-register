import type { Cliente, NovoCliente } from "./clientes.types";

export const SUPABASE_URL = "https://adyauaubmitdkfbutgix.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ugmm5Baa21OQAqPF4wB_9A_EdqzF0gx";

const TABLE = "clientes";

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// Lê as manutencoes do localStorage por cliente (fallback enquanto coluna não existe no Supabase)
function lerManutencoes(clienteId: string) {
  try {
    const raw = localStorage.getItem(`manut_${clienteId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function salvarManutencoes(clienteId: string, manuts: any[]) {
  try {
    localStorage.setItem(`manut_${clienteId}`, JSON.stringify(manuts));
  } catch {}
}

export async function buscarClientesSupabase(): Promise<Cliente[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=criado_em.desc`, {
      method: "GET",
      headers: baseHeaders,
    });
    if (!res.ok) {
      console.warn("Supabase GET falhou:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: any) => ({
      id: item.id,
      nome: item.nome || "",
      endereco: item.endereco || "",
      cpf: item.cpf || "",
      telefone: item.telefone || "",
      macCentral: item.mac_central || "",
      modeloCentral: item.modelo_central || "",
      observacoes: item.observacoes || "",
      status: item.status || "ativo",
      criadoEm: item.criado_em || new Date().toISOString(),
      // Manutencoes ficam no localStorage por enquanto (coluna ainda não existe na tabela)
      manutencoes: lerManutencoes(item.id),
    }));
  } catch (err) {
    console.warn("Erro ao buscar clientes:", err);
    return null;
  }
}

export async function salvarClienteSupabase(dados: NovoCliente): Promise<Cliente> {
  const payload = {
    nome: dados.nome,
    endereco: dados.endereco,
    cpf: dados.cpf,
    telefone: dados.telefone,
    mac_central: dados.macCentral,
    modelo_central: dados.modeloCentral,
    observacoes: dados.observacoes || "",
    status: "ativo",
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha ao salvar (${res.status}): ${errText}`);
  }

  const created = await res.json();
  const item = Array.isArray(created) ? created[0] : created;

  if (!item) throw new Error("Supabase não retornou o registro criado.");

  return {
    id: item.id,
    nome: item.nome,
    endereco: item.endereco,
    cpf: item.cpf,
    telefone: item.telefone,
    macCentral: item.mac_central || "",
    modeloCentral: item.modelo_central || "",
    observacoes: item.observacoes || "",
    status: item.status || "ativo",
    criadoEm: item.criado_em || new Date().toISOString(),
    manutencoes: [],
  };
}

export async function atualizarManutencoesSupabase(clienteId: string, manutencoes: any[]): Promise<boolean> {
  // Salva no localStorage (coluna manutencoes ainda não existe na tabela do Supabase)
  salvarManutencoes(clienteId, manutencoes);
  return true;
}

export async function removerClienteSupabase(id: string): Promise<boolean> {
  try {
    // Remove manutencoes locais também
    localStorage.removeItem(`manut_${id}`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: "DELETE",
      headers: baseHeaders,
    });
    return res.ok;
  } catch (err) {
    console.warn("Erro ao remover cliente:", err);
    return false;
  }
}
