export type StatusCliente = "ativo" | "inativo";

export type Manutencao = {
  id: string;
  dataHora: string;
  descricao: string;
};

export type TipoCobrancaGarantia = "mensal" | "total";

export type TermoGarantia = {
  validade: string;
  coberturas: string[];
  valorServico?: string;
  formaPagamento?: string;
  tipoCobrancaGarantia?: TipoCobrancaGarantia;
  valorItemGarantia?: number;
  valorMensalGarantia?: number;
  valorTotalGarantia?: number;
  valorTotalGeral?: string;
};

export type Cliente = {
  id: string;
  nome: string;
  endereco: string;
  cpf: string;
  telefone: string;
  macCentral: string;
  modeloCentral: string;
  observacoes: string;
  status: StatusCliente;
  criadoEm: string;
  manutencoes?: Manutencao[];
  garantia?: TermoGarantia;
};

export type NovoCliente = Omit<Cliente, "id" | "criadoEm" | "status" | "manutencoes" | "garantia">;

export const MODELOS_CENTRAL = [
  "Intelbras AMT 8000",
  "Intelbras AMT 4010 Smart",
  "Intelbras AMT 2018 E",
  "Intelbras AMT 1016 NET",
  "JFL Active 20 Ultra",
  "JFL Active 8 Ultra",
  "JFL SmartCloud 18",
  "Positivo Casa Inteligente",
  "Compatec Onix 8",
  "Outro modelo",
];

export const FORMAS_PAGAMENTO = [
  "PIX",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Boleto Bancário",
  "Transferência Bancária",
  "A Combinar",
];

export const OPCOES_GARANTIA_PADRAO = [
  "Falhas relacionadas ao serviço de manutenção realizado",
  "Troca de pilhas e baterias, quando incluída na contratação",
  "Defeitos de fabricação dos componentes substituídos, conforme avaliação técnica",
  "Danos causados por fenômenos atmosféricos, incluindo raios e surtos elétricos",
];

export const PERIODOS_VALIDADE_GARANTIA = [
  "90 dias (CDC) + 3 meses estendida (Total: 6 meses)",
  "90 dias (CDC) + 6 meses estendida (Total: 9 meses)",
  "90 dias (CDC) + 9 meses estendida (Total: 1 ano)",
  "90 dias (CDC) + 1 ano estendida (Total: 1 ano e 3 meses)",
  "90 dias (Apenas Garantia Legal CDC)",
  "Conforme contrato de manutenção",
];

export function calcularPrecoItemGarantia(validade: string): number {
  if (
    validade.includes("6 meses") ||
    validade.includes("9 meses") ||
    validade.includes("1 ano")
  ) {
    return 9.99;
  }
  return 12.60;
}

export function obterMesesEstendidos(validade: string): number {
  if (validade.includes("+ 1 ano estendida") || validade.includes("+ 12 meses")) return 12;
  if (validade.includes("+ 9 meses estendida")) return 9;
  if (validade.includes("+ 6 meses estendida")) return 6;
  if (validade.includes("+ 3 meses estendida")) return 3;

  if (validade.includes("1 ano e 3 meses")) return 12;
  if (validade.includes("1 ano") || validade.includes("12 meses")) return 12;
  if (validade.includes("9 meses")) return 9;
  if (validade.includes("6 meses")) return 6;
  if (validade.includes("3 meses")) return 3;
  return 3;
}

export function extrairGarantia(observacoes: string): { obsLimpa: string; garantia: TermoGarantia } {
  const padrao: TermoGarantia = {
    validade: "90 dias (Apenas Garantia Legal CDC)",
    coberturas: [],
    valorServico: "",
    formaPagamento: "PIX",
    tipoCobrancaGarantia: "mensal",
  };

  if (!observacoes) {
    return { obsLimpa: "", garantia: padrao };
  }

  // 1. Tenta formato com delimitador seguro <!--GARANTIA_START-->...<!--GARANTIA_END-->
  const delimitadorMatch = observacoes.match(/<!--GARANTIA_START-->([\s\S]*?)<!--GARANTIA_END-->/);
  if (delimitadorMatch && delimitadorMatch[1]) {
    try {
      const parsed = JSON.parse(delimitadorMatch[1]);
      const obsLimpa = observacoes
        .replace(/<!--GARANTIA_START-->[\s\S]*?<!--GARANTIA_END-->\n?/g, "")
        .replace(/\[GARANTIA_CONFIG:[\s\S]*?\}\]\n?/g, "")
        .trim();
      return {
        obsLimpa,
        garantia: {
          validade: parsed.validade || padrao.validade,
          coberturas: Array.isArray(parsed.coberturas) ? parsed.coberturas : [],
          valorServico: parsed.valorServico || "",
          formaPagamento: parsed.formaPagamento || "PIX",
          tipoCobrancaGarantia: parsed.tipoCobrancaGarantia || "mensal",
          valorItemGarantia: parsed.valorItemGarantia,
          valorMensalGarantia: parsed.valorMensalGarantia,
          valorTotalGarantia: parsed.valorTotalGarantia,
          valorTotalGeral: parsed.valorTotalGeral,
        },
      };
    } catch {}
  }

  // 2. Tenta formato legado [GARANTIA_CONFIG:{...}]
  const startIndex = observacoes.indexOf("[GARANTIA_CONFIG:");
  if (startIndex !== -1) {
    const jsonStart = startIndex + "[GARANTIA_CONFIG:".length;
    const jsonEnd = observacoes.lastIndexOf("}]");
    if (jsonEnd > jsonStart) {
      const jsonStr = observacoes.substring(jsonStart, jsonEnd + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        const fullTag = observacoes.substring(startIndex, jsonEnd + 2);
        const obsLimpa = observacoes.replace(fullTag, "").trim();
        return {
          obsLimpa,
          garantia: {
            validade: parsed.validade || padrao.validade,
            coberturas: Array.isArray(parsed.coberturas) ? parsed.coberturas : [],
            valorServico: parsed.valorServico || "",
            formaPagamento: parsed.formaPagamento || "PIX",
            tipoCobrancaGarantia: parsed.tipoCobrancaGarantia || "mensal",
            valorItemGarantia: parsed.valorItemGarantia,
            valorMensalGarantia: parsed.valorMensalGarantia,
            valorTotalGarantia: parsed.valorTotalGarantia,
            valorTotalGeral: parsed.valorTotalGeral,
          },
        };
      } catch {}
    }
  }

  // Se por qualquer motivo ainda sobrou alguma tag, limpa da observacao visivel
  const obsLimpa = observacoes
    .replace(/\[GARANTIA_CONFIG:[\s\S]*?\}\]/g, "")
    .replace(/\[GARANTIA_CONFIG:[\s\S]*?\]/g, "")
    .replace(/<!--GARANTIA_START-->[\s\S]*?<!--GARANTIA_END-->/g, "")
    .trim();

  return { obsLimpa, garantia: padrao };
}

export function embutirGarantia(obs: string, garantia: TermoGarantia): string {
  const config = JSON.stringify(garantia);
  const tag = `<!--GARANTIA_START-->${config}<!--GARANTIA_END-->`;

  // Limpa configuracoes anteriores da observacao digitada
  const limpa = (obs || "")
    .replace(/<!--GARANTIA_START-->[\s\S]*?<!--GARANTIA_END-->\n?/g, "")
    .replace(/\[GARANTIA_CONFIG:[\s\S]*?\}\]\n?/g, "")
    .replace(/\[GARANTIA_CONFIG:[\s\S]*?\]\n?/g, "")
    .trim();

  return limpa ? `${tag}\n${limpa}` : tag;
}

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function formatarTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function formatarMac(valor: string) {
  const limpo = valor
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .slice(0, 12);
  return limpo.replace(/(.{2})(?=.)/g, "$1:");
}

export function formatarMoeda(valor: number | string): string {
  if (typeof valor === "string") {
    const num = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (isNaN(num)) return "R$ 0,00";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function cpfValido(valor: string) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let dig = ((soma * 10) % 11) % 10;
  if (dig !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  dig = ((soma * 10) % 11) % 10;
  return dig === Number(cpf[10]);
}

export function formatarData(iso: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  } catch {
    return iso;
  }
}

export function gerarId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
