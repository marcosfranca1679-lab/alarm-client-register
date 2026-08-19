import type { Cliente, NovoCliente, Produto } from "./clientes.types";

export const SUPABASE_URL = "https://adyauaubmitdkfbutgix.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ugmm5Baa21OQAqPF4wB_9A_EdqzF0gx";

const TABLE = "clientes";
const SYSTEM_PROD_CPF = "000.000.000-00";
const SYSTEM_PROD_NOME = "__CATALOGO_PRODUTOS__";

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export async function buscarClientesSupabase(): Promise<Cliente[] | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=criado_em.desc`,
      { method: "GET", headers: baseHeaders }
    );
    if (!res.ok) {
      console.warn("Supabase GET falhou:", res.status);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    // Filtra o registro especial de catálogo de produtos do sistema
    const clientesReais = data.filter(
      (item: any) =>
        item.cpf !== SYSTEM_PROD_CPF && item.nome !== SYSTEM_PROD_NOME
    );

    return clientesReais.map((item: any) => ({
      id: item.id,
      nome: item.nome ?? "",
      endereco: item.endereco ?? "",
      cpf: item.cpf ?? "",
      telefone: item.telefone ?? "",
      macCentral: item.mac_central ?? "",
      modeloCentral: item.modelo_central ?? "",
      observacoes: item.observacoes ?? "",
      status: item.status ?? "ativo",
      criadoEm: item.criado_em ?? new Date().toISOString(),
      manutencoes: [], // coluna ainda não existe na tabela
    }));
  } catch (err) {
    console.warn("Erro ao buscar clientes:", err);
    return null;
  }
}

export async function buscarProdutosSupabase(): Promise<Produto[] | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?cpf=eq.${SYSTEM_PROD_CPF}&select=*`,
      { method: "GET", headers: baseHeaders }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const raw = data[0]?.observacoes;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Erro ao buscar produtos no Supabase:", err);
    return null;
  }
}

export async function salvarProdutosSupabase(produtos: Produto[]): Promise<boolean> {
  try {
    const resGet = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?cpf=eq.${SYSTEM_PROD_CPF}&select=id`,
      { method: "GET", headers: baseHeaders }
    );
    const data = resGet.ok ? await resGet.json() : [];
    const payload = {
      nome: SYSTEM_PROD_NOME,
      endereco: "SISTEMA",
      cpf: SYSTEM_PROD_CPF,
      telefone: "00000000000",
      mac_central: "000000000000",
      modelo_central: "SISTEMA",
      observacoes: JSON.stringify(produtos),
      status: "sistema",
    };

    if (Array.isArray(data) && data.length > 0) {
      const id = data[0].id;
      const resUpdate = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
        method: "PATCH",
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });
      return resUpdate.ok;
    } else {
      const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });
      return resInsert.ok;
    }
  } catch (err) {
    console.warn("Erro ao salvar produtos no Supabase:", err);
    return false;
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
    observacoes: dados.observacoes ?? "",
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
  if (!item) throw new Error("Supabase não retornou o registro.");

  return {
    id: item.id,
    nome: item.nome ?? "",
    endereco: item.endereco ?? "",
    cpf: item.cpf ?? "",
    telefone: item.telefone ?? "",
    macCentral: item.mac_central ?? "",
    modeloCentral: item.modelo_central ?? "",
    observacoes: item.observacoes ?? "",
    status: item.status ?? "ativo",
    criadoEm: item.criado_em ?? new Date().toISOString(),
    manutencoes: [],
  };
}

export async function atualizarManutencoesSupabase(
  clienteId: string,
  manutencoes: any[]
): Promise<boolean> {
  try {
    // Salva no localStorage (por device) enquanto coluna não existe no banco
    if (typeof window !== "undefined") {
      localStorage.setItem(`manut_${clienteId}`, JSON.stringify(manutencoes));
    }
    return true;
  } catch {
    return false;
  }
}

export function lerManutencoesLocais(clienteId: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`manut_${clienteId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removerClienteSupabase(id: string): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`manut_${id}`);
    }
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
