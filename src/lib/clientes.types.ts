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

export type TipoInstalacao =
  | "camera"
  | "sensor"
  | "central"
  | "smart"
  | "nenhuma";

export type OpcaoInstalacao = {
  id: TipoInstalacao;
  nome: string;
  valor: number;
  valorFormatado: string;
  descricao: string;
};

export const OPCOES_INSTALACAO: Record<TipoInstalacao, OpcaoInstalacao> = {
  camera: {
    id: "camera",
    nome: "Instalação câmera IP + configuração",
    valor: 79.99,
    valorFormatado: "R$ 79,99",
    descricao: "Fixação, conexão na rede Wi-Fi/cabeada, configuração no app e ajuste de ângulo",
  },
  sensor: {
    id: "sensor",
    nome: "Instalação sensores alarme",
    valor: 29.99,
    valorFormatado: "R$ 29,99",
    descricao: "Fixação e alinhamento de sensor perimetral ou interno, endereçamento na central e testes",
  },
  central: {
    id: "central",
    nome: "Instalação central + sirene + bateria",
    valor: 329.99,
    valorFormatado: "R$ 329,99",
    descricao: "Montagem da central, fixação da sirene, ligação da bateria, testes e configuração do app",
  },
  smart: {
    id: "smart",
    nome: "Instalação dispositivos smart",
    valor: 49.99,
    valorFormatado: "R$ 49,99",
    descricao: "Instalação física, pareamento na rede inteligente e integração com assistentes virtuais",
  },
  nenhuma: {
    id: "nenhuma",
    nome: "Sem instalação (somente equipamento)",
    valor: 0,
    valorFormatado: "R$ 0,00",
    descricao: "Apenas fornecimento do equipamento",
  },
};

export function obterInstalacaoDoProduto(prod?: Partial<Produto>): OpcaoInstalacao {
  if (!prod) return OPCOES_INSTALACAO.nenhuma;
  if (prod.tipoInstalacao && OPCOES_INSTALACAO[prod.tipoInstalacao]) {
    return OPCOES_INSTALACAO[prod.tipoInstalacao];
  }

  const nome = (prod.nome || "").toLowerCase();
  const cat = (prod.categoria || "").toLowerCase();

  // 1. Câmeras
  if (cat.includes("câmera") || cat.includes("camera") || cat.includes("cftv") || nome.includes("câmera") || nome.includes("camera") || nome.includes("mibo") || nome.includes("dvr") || nome.includes("ip")) {
    return OPCOES_INSTALACAO.camera;
  }

  // 2. Sensores
  if (cat.includes("sensor") || cat.includes("barreira") || nome.includes("sensor") || nome.includes("barreira") || nome.includes("feixe") || nome.includes("abertura") || nome.includes("presença") || nome.includes("presenca") || nome.includes("iva") || nome.includes("infravermelh")) {
    return OPCOES_INSTALACAO.sensor;
  }

  // 3. Dispositivos Smart
  if (cat.includes("smart") || cat.includes("automação") || cat.includes("automacao") || nome.includes("smart") || nome.includes("lâmpada") || nome.includes("lampada") || nome.includes("tomada") || nome.includes("interruptor") || nome.includes("alexa") || nome.includes("fechadura")) {
    return OPCOES_INSTALACAO.smart;
  }

  // 4. Centrais & Baterias / Kits
  if (cat.includes("central") || cat.includes("bateria") || nome.includes("central") || nome.includes("amt") || nome.includes("active") || nome.includes("kit alarme") || nome.includes("sirene")) {
    return OPCOES_INSTALACAO.central;
  }

  return OPCOES_INSTALACAO.central;
}

export function converterValorNumerico(valorStr?: string): number {
  if (!valorStr) return 0;
  const limpo = valorStr.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

export function formatarMoeda(valor: number | string): string {
  if (typeof valor === "string") {
    const num = parseFloat(valor.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", "."));
    if (isNaN(num)) return "0,00";
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof valor === "number" && !isNaN(valor)) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "0,00";
}

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  valor: string;
  categoria: string;
  marca: string;
  imagemUrl: string;
  destaque?: boolean;
  tipoInstalacao?: TipoInstalacao;
};

export const MARCAS_PRODUTO = [
  "Intelbras",
  "JFL Alarmes",
  "Elgin",
  "WS Segurança Eletrônica",
  "Outra Marca",
];

export function obterLogoMarca(marca?: string): string {
  if (!marca) return "";
  if (marca.toLowerCase().includes("intelbras")) return "/intelbras.png";
  if (marca.toLowerCase().includes("jfl")) return "/jfl.png";
  if (marca.toLowerCase().includes("elgin")) return "/elgin.png";
  if (marca.toLowerCase().includes("ws")) return "/logo.jpg";
  return "";
}

export const CATEGORIAS_PRODUTO = [
  "Centrais de Alarme",
  "Câmeras CFTV",
  "Sensores & Barreiras",
  "Dispositivos Smart & Automação",
  "Cerca Elétrica",
  "Baterias & Acessórios",
];

export const PRODUTOS_PADRAO: Produto[] = [
  {
    id: "prod-1",
    nome: "Central de Alarme Intelbras AMT 8000 Sem Fio",
    descricao:
      "Central de alarme 100% sem fio com alcance de até 600m, comunicação em nuvem, controle por aplicativo e bateria de longa duração.",
    valor: "890,00",
    categoria: "Centrais de Alarme",
    marca: "Intelbras",
    imagemUrl: "/intelbras.png",
    destaque: true,
    tipoInstalacao: "central",
  },
  {
    id: "prod-2",
    nome: "Kit Câmeras CFTV Full HD Intelbras 1080p",
    descricao:
      "Kit com câmeras de alta definição com visão noturna infravermelha de 20m, gravação contínua e acesso ao vivo no celular.",
    valor: "750,00",
    categoria: "Câmeras CFTV",
    marca: "Intelbras",
    imagemUrl: "/intelbras.png",
    destaque: true,
    tipoInstalacao: "camera",
  },
  {
    id: "prod-3",
    nome: "Central de Alarme JFL Active 20 Ultra",
    descricao:
      "Central de alta performance com até 20 zonas, módulo Ethernet/Wi-Fi integrado e aplicativo celular dedicado.",
    valor: "680,00",
    categoria: "Centrais de Alarme",
    marca: "JFL Alarmes",
    imagemUrl: "/jfl.png",
    destaque: true,
    tipoInstalacao: "central",
  },
  {
    id: "prod-4",
    nome: "Sensor de Barreira Infravermelha Ativa (Feixe Duplo)",
    descricao:
      "Barreira perimetral para muros e portões com detecção precisa contra invasão e alta resistência a sol e chuva.",
    valor: "240,00",
    categoria: "Sensores & Barreiras",
    marca: "JFL Alarmes",
    imagemUrl: "/jfl.png",
    destaque: true,
    tipoInstalacao: "sensor",
  },
  {
    id: "prod-5",
    nome: "Interruptor / Lâmpada Smart Wi-Fi Intelbras",
    descricao:
      "Dispositivo inteligente para controle de iluminação por aplicativo ou comandos de voz, com agendamento e acionamento remoto.",
    valor: "119,00",
    categoria: "Dispositivos Smart & Automação",
    marca: "Intelbras",
    imagemUrl: "/intelbras.png",
    destaque: true,
    tipoInstalacao: "smart",
  },
  {
    id: "prod-6",
    nome: "Câmera Wi-Fi Intelbras Mibo Full HD 1080p",
    descricao:
      "Câmera de segurança residencial sem fio com visão noturna, áudio bidirecional e inteligência artificial de detecção humana.",
    valor: "220,00",
    categoria: "Câmeras CFTV",
    marca: "Intelbras",
    imagemUrl: "/intelbras.png",
    destaque: true,
    tipoInstalacao: "camera",
  },
  {
    id: "prod-7",
    nome: "Bateria Estacionária 12V 7Ah para Centrais e Nobreaks",
    descricao:
      "Bateria selada de alta durabilidade para manter seu sistema de alarme funcionando mesmo durante quedas de energia.",
    valor: "140,00",
    categoria: "Baterias & Acessórios",
    marca: "WS Segurança Eletrônica",
    imagemUrl: "/intelbras.png",
    destaque: false,
    tipoInstalacao: "central",
  },
];

/**
 * Lê os produtos salvos localmente.
 * Retorna null quando NUNCA houve salvamento local (nunca grava os padrões aqui),
 * para que os padrões jamais sobrescrevam o catálogo real da nuvem.
 */
export function lerProdutosLocais(): Produto[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ws_produtos");
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function salvarProdutosLocais(produtos: Produto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ws_produtos", JSON.stringify(produtos));
  } catch {}
}


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
  if (validade.includes("+ 3 meses estendida") || validade.startsWith("3 meses")) {
    return 12.6;
  }
  if (
    validade.includes("+ 6 meses estendida") ||
    validade.includes("+ 9 meses estendida") ||
    validade.includes("+ 1 ano estendida") ||
    validade.includes("6 meses estendida") ||
    validade.includes("9 meses estendida") ||
    validade.includes("1 ano estendida")
  ) {
    return 9.99;
  }
  return 12.6;
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
