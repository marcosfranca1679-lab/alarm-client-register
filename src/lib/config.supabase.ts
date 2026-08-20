import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./clientes.supabase";
import type { ConfigValores } from "./clientes.types";

const TABLE = "configuracoes";
const CHAVE = "valores";

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export async function buscarConfigValoresSupabase(): Promise<ConfigValores | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?chave=eq.${CHAVE}&select=valor`,
      { method: "GET", headers: baseHeaders }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const valor = data[0]?.valor;
    if (!valor) return null;
    return typeof valor === "string" ? JSON.parse(valor) : (valor as ConfigValores);
  } catch (err) {
    console.warn("Erro ao buscar configurações:", err);
    return null;
  }
}

export async function salvarConfigValoresSupabase(cfg: ConfigValores): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=chave`, {
      method: "POST",
      headers: {
        ...baseHeaders,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ chave: CHAVE, valor: cfg }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Erro ao salvar configurações:", err);
    return false;
  }
}
