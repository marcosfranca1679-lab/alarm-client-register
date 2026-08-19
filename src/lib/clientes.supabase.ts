import type { Cliente, NovoCliente, Produto } from "./clientes.types";

export const SUPABASE_URL = "https://adyauaubmitdkfbutgix.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ugmm5Baa21OQAqPF4wB_9A_EdqzF0gx";

const TABLE = "clientes";
const SYSTEM_PROD_CPF = "000.000.000-00";
const SYSTEM_PROD_NOME = "__CATALOGO_PRODUTOS__";
const SYSTEM_TEMP_CPF = "999.999.999-99";
const SYSTEM_TEMP_NOME = "__TEMP_DOWNLOAD__";

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

    // Filtra registros especiais do sistema (catálogo e downloads temporários)
    const clientesReais = data.filter(
      (item: any) =>
        item.cpf !== SYSTEM_PROD_CPF &&
        item.nome !== SYSTEM_PROD_NOME &&
        item.cpf !== SYSTEM_TEMP_CPF &&
        item.nome !== SYSTEM_TEMP_NOME
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

/**
 * Salva um arquivo temporário no Supabase para download seguro em WebView/navegador.
 * O arquivo é configurado para ser excluído automaticamente do Supabase após 60 segundos (1 minuto).
 */
export async function criarDownloadTemporarioSupabase(
  nomeArquivo: string,
  conteudo: string
): Promise<string | null> {
  try {
    const payload = {
      nome: SYSTEM_TEMP_NOME,
      endereco: "DOWNLOAD_TEMPORARIO",
      cpf: SYSTEM_TEMP_CPF,
      telefone: "00000000000",
      mac_central: "000000000000",
      modelo_central: nomeArquivo,
      observacoes: conteudo,
      status: "temp_download",
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...baseHeaders, Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const item = Array.isArray(data) ? data[0] : data;
    const id = item?.id;

    // Agenda auto-exclusão após 60 segundos (1 minuto)
    if (id) {
      setTimeout(async () => {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
            method: "DELETE",
            headers: baseHeaders,
          });
          console.log(`[Supabase] Arquivo temporário ${id} auto-excluído após 1 minuto.`);
        } catch (e) {
          console.warn("Falha ao auto-excluir download temporário:", e);
        }
      }, 60_000);
    }

    return id ?? null;
  } catch (err) {
    console.warn("Erro ao criar download temporário:", err);
    return null;
  }
}

export async function buscarDownloadTemporarioSupabase(
  id: string
): Promise<{ nomeArquivo: string; conteudo: string } | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}&select=*`,
      { method: "GET", headers: baseHeaders }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    return {
      nomeArquivo: item.modelo_central || "backup.json",
      conteudo: item.observacoes || "",
    };
  } catch (err) {
    console.warn("Erro ao buscar download temporário:", err);
    return null;
  }
}

/**
 * Executa o download direto do arquivo com suporte total a Android WebView e navegadores:
 * 1. No app Android nativo: salva direto na pasta Downloads via MediaStore
 * 2. Em navegadores web: faz download nativo
 */
export function dispararDownloadArquivo(
  nomeArquivo: string,
  conteudo: string,
  mimeType = "application/json"
): void {
  if (typeof window !== "undefined" && (window as any).AndroidApp?.baixarArquivo) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(conteudo)));
      (window as any).AndroidApp.baixarArquivo(nomeArquivo, base64, mimeType);
      return;
    } catch (err) {
      console.warn("Falha no AndroidApp bridge, tentando fallback:", err);
    }
  }

  try {
    const base64 = btoa(unescape(encodeURIComponent(conteudo)));
    const dataUri = `data:${mimeType};charset=utf-8;base64,${base64}`;
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
  } catch {
    const blob = new Blob([conteudo], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }
}


/**
 * Dispara o download de um arquivo já em formato base64 binário (ex: PDF gerado por jsPDF).
 * - Android WebView: salva direto via AndroidApp.baixarArquivo (MediaStore)
 * - Navegadores web: converte base64 em Blob e força download
 */
export function dispararDownloadBase64(
  nomeArquivo: string,
  base64: string,
  mimeType = "application/pdf"
): void {
  if (typeof window !== "undefined" && (window as any).AndroidApp?.baixarArquivo) {
    try {
      (window as any).AndroidApp.baixarArquivo(nomeArquivo, base64, mimeType);
      return;
    } catch (err) {
      console.warn("Falha no AndroidApp bridge, usando fallback web:", err);
    }
  }
  // Web: converte base64 em Blob e força download
  try {
    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.warn("Erro ao disparar download base64:", err);
  }
}
