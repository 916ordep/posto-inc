
(() => {
  "use strict";

  // =========================================================
  // Configurações e dados fictícios
  // =========================================================
  const KM_POR_UNIDADE = 0.02;      // 1 unidade do mapa = 20 metros
  const VELOCIDADE_MEDIA = 40;      // km/h usada no tempo estimado
  const KM_POR_SEGUNDO_ANIMACAO = 1.1;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CHAVE_ARMAZENAMENTO = "postoinc-demo-v3";

  const pontos = {
    A: { x: 460, y: 80, nome: "Ponto A", rx: 0, ry: -28 },
    B: { x: 90, y: 920, nome: "Ponto B", rx: 0, ry: 44 },
    C: { x: 510, y: 500, nome: "Ponto C", rx: 0, ry: 44 },
    D: { x: 90, y: 140, nome: "Ponto D", rx: 0, ry: -28 },
    E: { x: 470, y: 900, nome: "Ponto E", rx: 0, ry: 44 },
    F: { x: 280, y: 520, nome: "Ponto F", rx: 66, ry: 8 },
    n1: { x: 310, y: 300 },
    n2: { x: 140, y: 320 },
    n3: { x: 190, y: 700 },
    n4: { x: 390, y: 720 },
    n5: { x: 490, y: 290 }
  };

  const estradas = [
    ["A", "n1"], ["A", "n5"], ["n5", "C"], ["n1", "n5"], ["n1", "F"], ["n1", "n2"],
    ["D", "n2"], ["n2", "F"], ["n2", "n3"], ["F", "n3"], ["F", "n4"], ["C", "n4"],
    ["n3", "B"], ["n4", "E"], ["E", "B"], ["n4", "n3"]
  ].map(([u, v]) => ({ u, v, comprimento: dist(pontos[u], pontos[v]) }));

  const postos = [
    { nome: "Posto Avenida", u: "A", v: "n1", t: 0.50, variacao: 0.06, nota: 4.2, avaliacoes: 318, carregador: null },
    { nome: "Posto Rota Sul", u: "A", v: "n5", t: 0.50, variacao: -0.12, nota: 3.8, avaliacoes: 142, carregador: 22 },
    { nome: "Posto Ipê", u: "n5", v: "C", t: 0.45, variacao: -0.21, nota: 4.0, avaliacoes: 97, carregador: null },
    { nome: "Posto Parada Certa", u: "n1", v: "n5", t: 0.50, variacao: 0.14, nota: 4.5, avaliacoes: 203, carregador: 50 },
    { nome: "Auto Posto Central", u: "n1", v: "F", t: 0.55, variacao: 0.18, nota: 4.8, avaliacoes: 611, carregador: 150 },
    { nome: "Posto Estrela", u: "n1", v: "n2", t: 0.50, variacao: -0.08, nota: 4.4, avaliacoes: 254, carregador: null },
    { nome: "Posto Primavera", u: "D", v: "n2", t: 0.50, variacao: -0.03, nota: 3.6, avaliacoes: 88, carregador: null },
    { nome: "Posto Cidade Nova", u: "n2", v: "F", t: 0.50, variacao: 0.09, nota: 4.1, avaliacoes: 176, carregador: 22 },
    { nome: "Posto Horizonte", u: "n2", v: "n3", t: 0.45, variacao: 0.02, nota: 4.9, avaliacoes: 432, carregador: 60 },
    { nome: "Posto Trevo", u: "F", v: "n3", t: 0.50, variacao: -0.27, nota: 4.6, avaliacoes: 389, carregador: null },
    { nome: "Posto Vale Verde", u: "F", v: "n4", t: 0.50, variacao: -0.15, nota: 3.9, avaliacoes: 121, carregador: 50 },
    { nome: "Posto Girassol", u: "C", v: "n4", t: 0.55, variacao: -0.05, nota: 4.3, avaliacoes: 165, carregador: null },
    { nome: "Posto Serra Azul", u: "n3", v: "B", t: 0.50, variacao: 0.20, nota: 4.1, avaliacoes: 204, carregador: null },
    { nome: "Posto Boa Viagem", u: "n4", v: "E", t: 0.50, variacao: -0.18, nota: 4.7, avaliacoes: 277, carregador: 120 },
    { nome: "Posto Litoral", u: "E", v: "B", t: 0.50, variacao: 0.04, nota: 3.7, avaliacoes: 64, carregador: 22 },
    { nome: "Posto Bom Caminho", u: "n4", v: "n3", t: 0.50, variacao: -0.10, nota: 4.4, avaliacoes: 158, carregador: null }
  ].map((p, id) => ({
    ...p, id,
    precoKwh: p.carregador ? Math.round((1.89 + (id % 5) * 0.12) * 100) / 100 : null,
    servicos: {
      conveniencia: id % 3 !== 0,
      calibrador: id % 4 !== 1,
      banheiro: id % 5 !== 2,
      lavagem: id % 2 === 0
    }
  }));

  const combustiveis = {
    comum: { nome: "Gasolina comum", curto: "Comum", base: 5.89, indice: 0, unidade: "L" },
    aditivada: { nome: "Gasolina aditivada", curto: "Aditivada", base: 6.09, indice: 1, unidade: "L" },
    etanol: { nome: "Etanol", curto: "Etanol", base: 3.99, indice: 2, unidade: "L" },
    diesel: { nome: "Diesel", curto: "Diesel", base: 6.29, indice: 3, unidade: "L" },
    eletrico: { nome: "Recarga elétrica", curto: "Elétrico", base: 0, indice: 4, unidade: "kWh" }
  };

  const tiposCarro = {
    flex: { nome: "Flex", combustiveis: ["comum", "aditivada", "etanol"] },
    gasolina: { nome: "Gasolina", combustiveis: ["comum", "aditivada"] },
    etanol: { nome: "Etanol", combustiveis: ["etanol"] },
    diesel: { nome: "Diesel", combustiveis: ["diesel"] },
    hibrido: { nome: "Híbrido", combustiveis: ["comum", "aditivada"] },
    eletrico: { nome: "Elétrico", combustiveis: ["eletrico"] }
  };

  const MARCADORES = [
    "Preço confere com o app", "Bom atendimento", "Banheiro limpo", "Combustível de qualidade",
    "Carregador funcionando", "Loja de conveniência boa", "Preço diferente do app", "Fila demorada", "Carregador com defeito"
  ];
  const MARCADORES_NEGATIVOS = ["Preço diferente do app", "Fila demorada", "Carregador com defeito"];

  const NOMES = ["Mariana S.", "Carlos R.", "Juliana P.", "Rafael M.", "Beatriz L.", "Thiago A.",
    "Fernanda C.", "Lucas O.", "Patrícia N.", "Gustavo F.", "Camila T.", "Eduardo V."];
  const COMENTARIOS = {
    5: ["Preço exatamente igual ao do app e atendimento rápido. Virou meu posto fixo no caminho do trabalho.",
      "Muito organizado, banheiro limpo e frentistas atenciosos.",
      "Melhor custo-benefício da região. Recomendo."],
    4: ["Bom posto e o preço confere. Só no horário de pico costuma ter fila.",
      "Atendimento cordial e pista bem sinalizada.",
      "Gostei, o combustível rende bem. A loja poderia ter mais opções."],
    3: ["Preço correto, mas o atendimento foi demorado.",
      "Posto razoável. O banheiro precisava de mais cuidado.",
      "Cumpre o que promete, nada além disso."],
    2: ["O preço na bomba estava diferente do informado no app.",
      "Fila grande e só uma bomba funcionando."]
  };

  // ---------- Denúncias e alertas de adulteração (dados fictícios) ----------
  const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
    "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  // Ocorrências oficiais por posto. "grave" = autuação ou interdição por combustível fora das especificações.
  const OCORRENCIAS = {
    9: [
      { fonte: "ANP", tipo: "Gasolina fora das especificações", detalhe: "Amostra coletada pela fiscalização com teor de etanol anidro acima do limite permitido.", status: "Autuado", dias: 46, grave: true },
      { fonte: "ANP", tipo: "Interdição de bico de abastecimento", detalhe: "Bico de gasolina comum interditado até a regularização do produto.", status: "Regularizado", dias: 41, grave: true },
      { fonte: "Procon", tipo: "Reclamações de consumidores", detalhe: "Reclamações de falhas no motor logo após o abastecimento.", status: "Em apuração", dias: 17 }
    ],
    2: [
      { fonte: "ANP", tipo: "Etanol fora das especificações", detalhe: "Teor alcoólico e massa específica fora da faixa permitida na amostra analisada.", status: "Autuado", dias: 78, grave: true }
    ],
    1: [
      { fonte: "Procon", tipo: "Suspeita de bomba medidora irregular", detalhe: "Consumidores relatam volume abastecido menor que o cobrado.", status: "Em apuração", dias: 9 }
    ],
    12: [
      { fonte: "Procon", tipo: "Preço diferente do anunciado", detalhe: "Reclamações de cobrança acima do preço exibido na placa do posto.", status: "Em apuração", dias: 21 }
    ],
    14: [
      { fonte: "ANP", tipo: "Denúncia sobre a qualidade da gasolina", detalhe: "Denúncia registrada; aguardando coleta de amostra pela fiscalização.", status: "Em apuração", dias: 6 }
    ]
  };

  // Indicadores de reclamações dos últimos 12 meses (total, % respondidas, % resolvidas, % voltariam a abastecer)
  const BASE_RECLAMACOES = {
    9: { total: 37, resp: 62, resol: 28, volt: 21 },
    2: { total: 19, resp: 74, resol: 42, volt: 38 },
    1: { total: 14, resp: 88, resol: 57, volt: 55 },
    12: { total: 11, resp: 91, resol: 64, volt: 60 },
    14: { total: 6, resp: 100, resol: 83, volt: 78 }
  };

  const TIPOS_RECLAMACAO = {
    adulteracao: "Suspeita de combustível adulterado",
    bomba: "Bomba marcando a mais",
    preco: "Preço diferente do anunciado",
    cobranca: "Cobrança indevida",
    atendimento: "Atendimento",
    outro: "Outro"
  };
  const SINTOMAS = ["Motor falhando", "Consumo aumentou", "Luz da injeção acesa", "Dificuldade para dar partida", "Cheiro diferente no combustível"];

  const MODELOS_RECLAMACAO = {
    adulteracao: [
      { titulo: "Carro começou a falhar logo depois de abastecer", relato: "Abasteci com gasolina comum e, poucos quilômetros depois, o motor passou a engasgar e a luz da injeção acendeu. O mecânico suspeitou de combustível adulterado.", sintomas: ["Motor falhando", "Luz da injeção acesa"] },
      { titulo: "Consumo aumentou muito com o combustível daqui", relato: "Meu carro sempre fez cerca de 12 km/L. Depois de dois abastecimentos neste posto, caiu para menos de 9 km/L.", sintomas: ["Consumo aumentou"] },
      { titulo: "Pedi o teste da proveta e não fizeram", relato: "Desconfiei da gasolina e pedi o teste da proveta, mas disseram que o kit estava quebrado e não fizeram o teste.", sintomas: [] }
    ],
    bomba: [{ titulo: "Bomba marcou mais litros do que cabe no tanque", relato: "O tanque do meu carro tem 47 litros e estava na reserva, mas a bomba marcou 52 litros.", sintomas: [] }],
    preco: [{ titulo: "Cobraram acima do preço da placa", relato: "A placa anunciava um preço, mas na hora de pagar cobraram 20 centavos a mais por litro.", sintomas: [] }],
    atendimento: [{ titulo: "Demora no atendimento no horário de pico", relato: "Esperei mais de 15 minutos na fila com apenas um frentista atendendo.", sintomas: [] }]
  };
  const STATUS_RECLAMACAO = ["Respondida", "Aguardando resposta", "Resolvida", "Não resolvida"];
  const RESPOSTAS = {
    adulteracao: "Lamentamos o ocorrido. O combustível é analisado a cada recebimento e estamos à disposição para realizar o teste da proveta. Pedimos que procure a gerência com o comprovante.",
    bomba: "Refizemos a aferição da bomba e entramos em contato com o cliente para devolver a diferença.",
    preco: "A placa foi corrigida e o valor cobrado a mais foi devolvido ao cliente.",
    atendimento: "Agradecemos o retorno. Reforçamos a equipe nos horários de maior movimento."
  };

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function precoDe(posto, tipo) {
    if (tipo === "eletrico") return posto.precoKwh;
    const c = combustiveis[tipo];
    const ajuste = (((posto.id * 7 + c.indice * 3) % 5) - 2) * 0.02;
    const fator = tipo === "etanol" ? 0.7 : 1;
    return Math.round((c.base + (posto.variacao + ajuste) * fator) * 100) / 100;
  }

  // =========================================================
  // Formatação (padrão brasileiro)
  // =========================================================
  const fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmt1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

  const fmtDistancia = (km) => km < 1 ? `${Math.max(0, Math.round(km * 100) * 10)} m` : `${fmt1.format(km)} km`;
  function fmtTempo(km) {
    const min = Math.max(1, Math.round((km / VELOCIDADE_MEDIA) * 60));
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
  }
  function fmtRelativo(dias) {
    if (dias <= 0) return "hoje";
    if (dias === 1) return "ontem";
    if (dias < 14) return `há ${dias} dias`;
    if (dias < 30) return `há ${Math.floor(dias / 7)} semanas`;
    const meses = Math.floor(dias / 30);
    return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
  }
  const diasDesde = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const iniciais = (nome) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  // Avatar com a foto do perfil, ou com as iniciais quando não há foto
  const avatar = (nome, foto, classe = "") => foto
    ? `<span class="avatar avatar--foto ${classe}"><img src="${esc(foto)}" alt=""></span>`
    : `<span class="avatar ${classe}">${iniciais(nome || "?")}</span>`;

  const ic = (nome, classe = "") => `<svg class="ic ${classe}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;
  function estrelas(nota) {
    const cheias = Math.round(nota);
    let h = '<span class="estrelas-mini" aria-label="Nota ' + fmt1.format(nota) + ' de 5">';
    for (let i = 1; i <= 5; i++) h += `<svg class="ic ${i <= cheias ? "cheia" : ""}" aria-hidden="true"><use href="#i-estrela"/></svg>`;
    return h + "</span>";
  }

  // =========================================================
  // Armazenamento local (perfil, carro, favoritos, avaliações...)
  // =========================================================
  function dadosIniciais() {
    return {
      perfil: { nome: "Usuário", foto: "", cidade: "Cidade Exemplo", uf: "RJ", membroDesde: "março de 2026" },
      carro: { modelo: "Hatch 1.0 Flex", ano: 2022, tipo: "flex", tanque: 47, consumoCidade: 12.1, consumoEstrada: 14.3 },
      favoritos: [8, 4],
      reclamacoes: [],
      config: {
        tema: "claro", texto: "padrao", idioma: "pt",
        evitarAlerta: false, foraRota: true,
        notifPreco: true, notifAlerta: true, lembreteAvaliar: true,
        valeAPena: true, // [vale-a-pena]
        nomePublico: true, localizacao: true
      },
      rotas: [
        { id: "r1", nome: "Casa → Trabalho", origem: "A", destino: "B" },
        { id: "r2", nome: "Academia", origem: "D", destino: "E" }
      ],
      avaliacoes: [],
      uteis: {},
      abastecimentos: [
        { id: "a1", data: diasAtras(34), postoId: 8, combustivel: "comum", litros: 35.2, preco: 5.89, hodometro: 41250, economia: 2.10 },
        { id: "a2", data: diasAtras(23), postoId: 5, combustivel: "comum", litros: 34.0, preco: 5.79, hodometro: 41680, economia: 3.06 },
        { id: "a3", data: diasAtras(12), postoId: 4, combustivel: "comum", litros: 36.5, preco: 6.05, hodometro: 42135, economia: 0.00 },
        { id: "a4", data: diasAtras(3), postoId: 13, combustivel: "comum", litros: 33.1, preco: 5.71, hodometro: 42550, economia: 4.30 }
      ]
    };
  }

  function carregar() {
    const base = dadosIniciais();
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || "null");
      // Quem já usou a demonstração com o nome antigo passa a ver "Usuário"
      if (salvo && salvo.perfil && salvo.perfil.nome === "Alex Souza") salvo.perfil.nome = "Usuário";
      if (salvo && typeof salvo === "object") return { ...base, ...salvo, perfil: { ...base.perfil, ...salvo.perfil }, carro: { ...base.carro, ...salvo.carro }, config: { ...base.config, ...salvo.config } };
    } catch (e) { /* armazenamento indisponível */ }
    return base;
  }
  function salvar() {
    try { localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dados)); } catch (e) { /* armazenamento indisponível */ }
  }
  let dados = carregar();

  // =========================================================
  // Avaliações da comunidade
  // =========================================================
  function avaliacoesSemente(p) {
    const ajustes = [0.4, -0.7, 0.1];
    return ajustes.map((aj, k) => {
      const idx = (p.id * 3 + k * 5) % NOMES.length;
      const nota = Math.max(2, Math.min(5, Math.round(p.nota + aj)));
      const pool = COMENTARIOS[nota];
      const marcadores = nota >= 4
        ? [MARCADORES[(p.id + k) % 4], ...(p.carregador && k === 0 ? ["Carregador funcionando"] : [])]
        : [nota === 2 ? "Preço diferente do app" : "Fila demorada"];
      return {
        id: `s-${p.id}-${k}`, postoId: p.id, autor: NOMES[idx],
        nivel: 1 + ((idx + p.id) % 5), totalAutor: 4 + ((idx * 7 + p.id) % 60),
        nota, comentario: pool[(p.id + k) % pool.length], marcadores: [...new Set(marcadores)],
        dias: ((p.id * 7 + k * 11) % 40) + 1, uteis: (p.id * 13 + k * 7) % 25
      };
    });
  }

  function avaliacoesDoPosto(p) {
    const minhas = dados.avaliacoes.filter((a) => a.postoId === p.id).map((a) => ({
      ...a, autor: dados.config.nomePublico ? dados.perfil.nome : "Motorista anônimo", voce: true, nivel: nivelUsuario().nivel,
      totalAutor: totalAvaliacoesUsuario(), dias: diasDesde(a.data), uteis: 0
    }));
    return [...minhas, ...avaliacoesSemente(p)].sort((a, b) => a.dias - b.dias);
  }

  function notaPosto(p) {
    const minhas = dados.avaliacoes.filter((a) => a.postoId === p.id);
    const total = p.avaliacoes + minhas.length;
    const media = (p.nota * p.avaliacoes + minhas.reduce((s, a) => s + a.nota, 0)) / total;
    return { media: Math.round(media * 10) / 10, total };
  }

  const totalAvaliacoesUsuario = () => 14 + dados.avaliacoes.length;
  function nivelUsuario() {
    const pontos = 180 + dados.avaliacoes.length * 15 + Object.keys(dados.uteis).length * 2;
    const nivel = Math.floor(pontos / 100) + 1;
    return { nivel, pontos, progresso: pontos % 100 };
  }

  // =========================================================
  // Alertas de adulteração, reputação e reclamações
  // =========================================================
  const procon = () => `Procon-${dados.perfil.uf || "RJ"}`;
  const fonteRotulo = (o) => o.fonte === "Procon" ? procon() : "ANP";
  const ocorrenciasDe = (p) => OCORRENCIAS[p.id] || [];

  function nivelAlerta(p) {
    const oc = ocorrenciasDe(p);
    if (oc.some((o) => o.grave && o.dias <= 365)) return "grave";
    if (oc.length || dados.reclamacoes.some((r) => r.postoId === p.id && r.tipo === "adulteracao")) return "atencao";
    return null;
  }

  function baseReclamacoes(p) {
    return BASE_RECLAMACOES[p.id] || { total: (p.id * 3) % 5, resp: 90 + (p.id % 10), resol: 75 + ((p.id * 7) % 20), volt: 80 + ((p.id * 3) % 18) };
  }

  function reputacao(p) {
    const b = baseReclamacoes(p);
    const total = b.total + dados.reclamacoes.filter((r) => r.postoId === p.id).length;
    let nota = (0.2 * b.resp + 0.4 * b.resol + 0.4 * b.volt) / 10;
    if (nivelAlerta(p) === "grave") nota -= 2.5;
    nota = Math.max(0, Math.min(10, Math.round(nota * 10) / 10));
    let rotulo, classe;
    if (total < 3) { rotulo = "Sem índice"; classe = ""; }
    else if (nota >= 8) { rotulo = "Ótimo"; classe = "verde"; }
    else if (nota >= 7) { rotulo = "Bom"; classe = "verde"; }
    else if (nota >= 6) { rotulo = "Regular"; classe = "ouro"; }
    else if (nota >= 4) { rotulo = "Ruim"; classe = "vermelho"; }
    else { rotulo = "Não recomendado"; classe = "vermelho"; }
    return { ...b, total, nota, rotulo, classe };
  }

  function reclamacoesSemente(p) {
    const b = baseReclamacoes(p);
    const tipos = [9, 2, 14].includes(p.id) ? ["adulteracao"] : p.id === 1 ? ["bomba", "adulteracao"] : p.id === 12 ? ["preco"] : ["atendimento", "preco"];
    const qtd = Math.min(3, b.total);
    const lista = [];
    for (let k = 0; k < qtd; k++) {
      const tipo = tipos[k % tipos.length];
      const modelos = MODELOS_RECLAMACAO[tipo];
      const m = modelos[(p.id + k) % modelos.length];
      const status = STATUS_RECLAMACAO[(p.id + k) % STATUS_RECLAMACAO.length];
      lista.push({
        id: `rs-${p.id}-${k}`, postoId: p.id, autor: NOMES[(p.id * 5 + k * 3) % NOMES.length], tipo,
        combustivel: tipo === "adulteracao" && p.id === 2 ? "etanol" : "comum",
        titulo: m.titulo, relato: m.relato, sintomas: m.sintomas, status,
        resposta: status === "Aguardando resposta" ? "" : RESPOSTAS[tipo],
        dias: ((p.id * 11 + k * 9) % 60) + 2, encaminhar: tipo === "adulteracao"
      });
    }
    return lista;
  }

  function reclamacoesDoPosto(p) {
    const minhas = dados.reclamacoes.filter((r) => r.postoId === p.id)
      .map((r) => ({ ...r, autor: dados.perfil.nome, voce: true, dias: diasDesde(r.data) }));
    return [...minhas, ...reclamacoesSemente(p)].sort((a, b) => a.dias - b.dias);
  }

  function seloAlerta(nivel) {
    if (nivel === "grave") return `<span class="selo-app selo-app--alerta">${ic("alerta")}Alerta de adulteração</span>`;
    if (nivel === "atencao") return `<span class="selo-app selo-app--atencao">${ic("alerta")}Denúncia em apuração</span>`;
    return "";
  }

  function cartaoAlerta(p, comBotao = true) {
    const nivel = nivelAlerta(p);
    if (!nivel) return "";
    const oc = ocorrenciasDe(p);
    const o = nivel === "grave" ? oc.find((x) => x.grave) : oc[0];
    const titulo = nivel === "grave" ? "Histórico de combustível adulterado" : "Denúncia em apuração";
    const texto = o ? esc(o.detalhe) : "Há reclamações da comunidade sobre a qualidade do combustível deste posto, ainda em análise.";
    const rodape = o
      ? `Fonte: ${fonteRotulo(o)} · ${esc(o.status)} ${fmtRelativo(o.dias)}${nivel === "atencao" ? " · ainda sem conclusão da fiscalização" : ""}`
      : "Fonte: comunidade Posto Inc.";
    return `<div class="alerta-card alerta-card--${nivel}">
      <span class="alerta-card__icone">${ic("alerta")}</span>
      <div>
        <b>${titulo}</b>
        <p>${texto}</p>
        <small>${rodape}</small>
        ${comBotao ? `<button type="button" data-acao="abrir-reputacao" data-id="${p.id}">Ver ocorrências e reclamações ${ic("direita")}</button>` : ""}
      </div>
    </div>`;
  }

  // =========================================================
  // Estado da aplicação
  // =========================================================
  const estado = {
    origem: "A",
    destino: "B",
    combustivel: tiposCarro[dados.carro.tipo].combustiveis[0],
    litros: 40,
    rota: [],
    caminho: [],
    totalKm: 0,
    postosRota: [],
    percorridoKm: 0,
    emViagem: false,
    ultimoQuadro: 0,
    ultimaLista: 0,
    ordem: "rota",
    selecionado: null,
    paradaAlvo: null,
    viewBox: null,
    pilha: [],
    form: {}
  };

  // =========================================================
  // Grafo e menor caminho (algoritmo de Dijkstra)
  // =========================================================
  const vizinhos = {};
  Object.keys(pontos).forEach((k) => (vizinhos[k] = []));
  estradas.forEach((e) => {
    vizinhos[e.u].push({ no: e.v, peso: e.comprimento });
    vizinhos[e.v].push({ no: e.u, peso: e.comprimento });
  });

  function menorCaminho(origem, destino) {
    const d = {}, anterior = {}, visitados = new Set();
    Object.keys(pontos).forEach((k) => (d[k] = Infinity));
    d[origem] = 0;
    for (; ;) {
      let atual = null;
      for (const k in d) if (!visitados.has(k) && (atual === null || d[k] < d[atual])) atual = k;
      if (atual === null || d[atual] === Infinity || atual === destino) break;
      visitados.add(atual);
      for (const { no, peso } of vizinhos[atual]) {
        if (d[atual] + peso < d[no]) { d[no] = d[atual] + peso; anterior[no] = atual; }
      }
    }
    const caminho = [destino];
    while (caminho[0] !== origem) {
      const ant = anterior[caminho[0]];
      if (!ant) return [];
      caminho.unshift(ant);
    }
    return caminho;
  }

  // =========================================================
  // Elementos
  // =========================================================
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const app = $("#app");
  const svg = $("#mapa");
  const folha = $("#folha");
  const listaPostos = $("#lista-postos");
  const painel = $("#painel-app");
  const btnViagem = $("#btn-viagem");
  const filtroEletrico = $("#filtro-eletrico");

  // =========================================================
  // Mapa (SVG)
  // =========================================================
  function el(tag, attrs = {}, pai = svg) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(n);
    return n;
  }

  const camadas = {};
  const marcadoresPostos = [];
  const marcadoresPontos = {};
  let carro;

  function posicaoPosto(p) {
    const a = pontos[p.u], b = pontos[p.v];
    return { x: a.x + (b.x - a.x) * p.t, y: a.y + (b.y - a.y) * p.t };
  }

  function montarMapa() {
    el("rect", { x: -1200, y: -1200, width: 3200, height: 3600, class: "m-fundo" });
    const quadras = el("g");
    for (let x = -420; x < 1040; x += 92) {
      for (let y = -400; y < 1440; y += 84) {
        const s = Math.abs((x * 31 + y * 17) % 7);
        if (s === 0) continue;
        el("rect", { x: x + 8, y: y + 8, width: 62 + (s % 3) * 6, height: 56 + (s % 2) * 8, rx: 8, class: s === 6 ? "m-parque" : "m-quadra" }, quadras);
      }
    }

    const gEstradas = el("g");
    ["m-estrada-borda", "m-estrada"].forEach((classe) => {
      estradas.forEach((e) => {
        const a = pontos[e.u], b = pontos[e.v];
        el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: classe }, gEstradas);
      });
      Object.values(pontos).forEach((p) => el("circle", { cx: p.x, cy: p.y, r: classe === "m-estrada" ? 10 : 13, class: classe === "m-estrada" ? "m-no" : "m-no m-no--borda" }, gEstradas));
    });

    camadas.rotaBorda = el("path", { class: "m-rota-borda", d: "" });
    camadas.rota = el("path", { class: "m-rota", d: "" });
    camadas.percorrida = el("path", { class: "m-percorrida", d: "" });

    const gPostos = el("g");
    postos.forEach((p) => {
      const { x, y } = posicaoPosto(p);
      const g = el("g", { class: "m-posto m-posto--fora", transform: `translate(${x} ${y})`, tabindex: 0, role: "button" }, gPostos);
      const titulo = el("title", {}, g);
      const corpo = el("circle", { r: 17, class: "m-posto__corpo" }, g);
      const num = el("text", { class: "m-posto__num" }, g);
      let raio = null, fav = null;
      if (p.carregador) {
        raio = el("g", { class: "m-posto__raio", transform: "translate(14 -14)" }, g);
        el("circle", { r: 9 }, raio);
        el("path", { d: "M1 -6 L-4 1 H0 L-1 6 L4 -1 H0 Z" }, raio);
      }
      fav = el("circle", { r: 6, cx: -14, cy: -14, class: "m-posto__fav" }, g);
      const alerta = el("g", { class: "m-posto__alerta", transform: "translate(14 15)" }, g);
      el("path", { d: "M0 -11 L11 8 H-11 Z", class: "m-alerta__fundo" }, alerta);
      el("path", { d: "M0 -4 V1.5", class: "m-alerta__sinal" }, alerta);
      el("circle", { cx: 0, cy: 4.6, r: 1.4, class: "m-alerta__ponto" }, alerta);
      g.addEventListener("click", () => abrirPainel(painelPosto(p.id)));
      g.addEventListener("keydown", (ev) => { if (ev.key === "Enter") abrirPainel(painelPosto(p.id)); });
      marcadoresPostos[p.id] = { g, num, titulo, corpo, raio, fav, alerta };
    });

    const gPontos = el("g");
    Object.entries(pontos).forEach(([k, p]) => {
      if (!p.nome) return;
      const g = el("g", { class: "m-ponto", transform: `translate(${p.x} ${p.y})` }, gPontos);
      el("circle", { r: 13, class: "m-ponto__marca" }, g);
      el("circle", { r: 5, class: "m-ponto__miolo miolo-o" }, g);
      el("rect", { x: -5, y: -5, width: 10, height: 10, class: "m-ponto__miolo miolo-d" }, g);
      el("text", { x: p.rx, y: p.ry, "text-anchor": "middle" }, g).textContent = p.nome;
      marcadoresPontos[k] = g;
    });

    carro = el("g", { class: "m-carro" });
    el("circle", { r: 18 }, carro);
    camadas.seta = el("path", { d: "M-7 -7 L9 0 L-7 7 L-3 0 Z" }, carro);
  }

  function ajustarVisao(animar = true) {
    const xs = estado.caminho.map((k) => pontos[k].x), ys = estado.caminho.map((k) => pontos[k].y);
    let x0 = Math.min(...xs) - 90, x1 = Math.max(...xs) + 90;
    let y0 = Math.min(...ys) - 150, y1 = Math.max(...ys) + 70;
    if (x1 - x0 < 420) { const c = (x0 + x1) / 2; x0 = c - 210; x1 = c + 210; }
    if (y1 - y0 < 420) { const c = (y0 + y1) / 2; y0 = c - 210; y1 = c + 210; }
    const alvo = [x0, y0, x1 - x0, y1 - y0];
    const inicio = estado.viewBox || alvo;
    const t0 = performance.now();
    const passo = (t) => {
      const f = animar && !reduzirMovimento() ? Math.min(1, (t - t0) / 450) : 1;
      const e = 1 - Math.pow(1 - f, 3);
      estado.viewBox = inicio.map((v, i) => v + (alvo[i] - v) * e);
      svg.setAttribute("viewBox", estado.viewBox.map((v) => v.toFixed(1)).join(" "));
      if (f < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  // =========================================================
  // Rota
  // =========================================================
  function calcularRota() {
    const caminho = menorCaminho(estado.origem, estado.destino);
    estado.caminho = caminho;
    estado.rota = [];
    let acumulado = 0;
    for (let i = 0; i < caminho.length - 1; i++) {
      const de = caminho[i], para = caminho[i + 1];
      const comp = dist(pontos[de], pontos[para]);
      estado.rota.push({ de, para, inicio: acumulado, comprimento: comp });
      acumulado += comp;
    }
    estado.totalKm = acumulado * KM_POR_UNIDADE;

    estado.postosRota = [];
    postos.forEach((p) => {
      for (const s of estado.rota) {
        let pos = null;
        if (s.de === p.u && s.para === p.v) pos = s.inicio + p.t * s.comprimento;
        else if (s.de === p.v && s.para === p.u) pos = s.inicio + (1 - p.t) * s.comprimento;
        if (pos !== null) { estado.postosRota.push({ posto: p, km: pos * KM_POR_UNIDADE }); break; }
      }
    });
    estado.postosRota.sort((a, b) => a.km - b.km);

    const d = caminho.map((k, i) => `${i ? "L" : "M"}${pontos[k].x} ${pontos[k].y}`).join(" ");
    camadas.rota.setAttribute("d", d);
    camadas.rotaBorda.setAttribute("d", d);
    Object.entries(marcadoresPontos).forEach(([k, g]) => {
      g.classList.toggle("m-ponto--origem", k === estado.origem);
      g.classList.toggle("m-ponto--destino", k === estado.destino);
    });

    estado.selecionado = null;
    estado.paradaAlvo = null;
    estado.percorridoKm = 0;
    pararViagem();
    ajustarVisao();
    atualizarTudo(true);
  }

  function pontoNaRota(km) {
    const u = km / KM_POR_UNIDADE;
    for (let i = 0; i < estado.rota.length; i++) {
      const s = estado.rota[i];
      if (u <= s.inicio + s.comprimento) {
        const f = (u - s.inicio) / s.comprimento;
        const a = pontos[s.de], b = pontos[s.para];
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, indice: i, angulo: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
      }
    }
    const ult = estado.rota[estado.rota.length - 1];
    const a = pontos[ult.de], b = pontos[ult.para];
    return { x: b.x, y: b.y, indice: estado.rota.length - 1, angulo: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  }

  // =========================================================
  // Dados derivados
  // =========================================================
  function dadosPostos() {
    const lista = estado.postosRota.filter((item) => precoDe(item.posto, estado.combustivel) !== null);
    return lista.map((item, i) => {
      const anterior = lista[i - 1];
      return {
        ...item,
        ordem: i + 1,
        preco: precoDe(item.posto, estado.combustivel),
        nota: notaPosto(item.posto),
        restante: item.km - estado.percorridoKm,
        doAnterior: anterior ? item.km - anterior.km : null,
        passou: item.km < estado.percorridoKm - 0.001,
        favorito: dados.favoritos.includes(item.posto.id),
        alerta: nivelAlerta(item.posto)
      };
    });
  }

  function analisar() {
    const lista = dadosPostos();
    const aFrente = lista.filter((d) => !d.passou);
    const porPreco = [...aFrente].sort((a, b) => a.preco - b.preco || a.restante - b.restante);
    const maisBaratoGeral = porPreco[0];
    // A recomendação de "mais barato" ignora postos com alerta grave de adulteração
    const maisBarato = porPreco.find((d) => d.alerta !== "grave");
    const graves = aFrente.filter((d) => d.alerta === "grave");
    const melhor = [...aFrente].sort((a, b) => b.nota.media - a.nota.media || a.restante - b.restante)[0];
    const maisCaro = [...aFrente].sort((a, b) => b.preco - a.preco)[0];
    const carregador = aFrente.filter((d) => d.posto.carregador).sort((a, b) => a.restante - b.restante)[0];
    return { lista, aFrente, maisBarato, maisBaratoGeral, graves, melhor, maisCaro, carregador };
  }

  const consumoMedio = () => (Number(dados.carro.consumoCidade) + Number(dados.carro.consumoEstrada)) / 2 || 10;
  const unidade = () => combustiveis[estado.combustivel].unidade;

  // =========================================================
  // Atualização da tela inicial
  // =========================================================
  function atualizarTudo(forcar = false) {
    const a = analisar();
    atualizarMapa(a);
    atualizarNavegacao(a);
    const agora = performance.now();
    if (forcar || agora - estado.ultimaLista > 250) {
      estado.ultimaLista = agora;
      atualizarFolha(a);
      atualizarLista(a);
      if (forcar) atualizarMatriz(a.lista);
    }
  }

  function atualizarMapa(a) {
    const naRota = new Map(a.lista.map((d) => [d.posto.id, d]));
    postos.forEach((p) => {
      const m = marcadoresPostos[p.id];
      const d = naRota.get(p.id);
      const classes = ["m-posto"];
      if (!d) classes.push("m-posto--fora");
      else {
        if (d.passou) classes.push("m-posto--passou");
        if (a.maisBarato && d.posto.id === a.maisBarato.posto.id) classes.push("m-posto--barato");
      }
      if (estado.selecionado === p.id) classes.push("m-posto--selecionado");
      m.g.setAttribute("class", classes.join(" "));
      m.corpo.setAttribute("r", d ? 17 : 9);
      m.num.textContent = d ? d.ordem : "";
      if (m.raio) m.raio.style.display = d ? "" : "none";
      m.fav.style.display = d && dados.favoritos.includes(p.id) ? "" : "none";
      const nivel = nivelAlerta(p);
      m.alerta.style.display = d && nivel ? "" : "none";
      m.alerta.setAttribute("class", `m-posto__alerta m-posto__alerta--${nivel || "nenhum"}`);
      m.titulo.textContent = d
        ? `${p.nome} — ${fmtMoeda.format(d.preco)}/${unidade()} · nota ${fmt1.format(d.nota.media)} · ${d.passou ? "já ultrapassado" : fmtDistancia(d.restante) + " de você"}${nivel === "grave" ? " · ALERTA DE ADULTERAÇÃO" : nivel === "atencao" ? " · denúncia em apuração" : ""}`
        : `${p.nome} — fora da rota`;
      m.g.setAttribute("aria-label", m.titulo.textContent);
    });

    const pos = pontoNaRota(estado.percorridoKm);
    carro.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    camadas.seta.setAttribute("transform", `rotate(${pos.angulo})`);
    if (estado.percorridoKm > 0) {
      const pts = [estado.rota[0].de, ...estado.rota.slice(0, pos.indice).map((s) => s.para)];
      camadas.percorrida.setAttribute("d", pts.map((k, i) => `${i ? "L" : "M"}${pontos[k].x} ${pontos[k].y}`).join(" ") + ` L${pos.x} ${pos.y}`);
    } else camadas.percorrida.setAttribute("d", "");
  }

  function atualizarNavegacao(a) {
    const banner = $("#nav-banner");
    const busca = $("#busca");
    const comb = combustiveis[estado.combustivel];
    $("#busca-titulo").textContent = `${pontos[estado.origem].nome} → ${pontos[estado.destino].nome}`;
    $("#busca-sub").textContent = `${comb.nome} · ${fmtDistancia(estado.totalKm)} · ${fmtTempo(estado.totalKm)}`;

    const emCurso = estado.percorridoKm > 0;
    banner.hidden = !emCurso;
    busca.style.visibility = emCurso ? "hidden" : "";
    if (!emCurso) return;
    const restante = Math.max(0, estado.totalKm - estado.percorridoKm);
    const destino = pontos[estado.destino].nome;
    if (restante <= 0.001) {
      banner.innerHTML = `${ic("bandeira")}<div><b>Você chegou ao ${destino}</b><small>Trajeto de ${fmtDistancia(estado.totalKm)} concluído</small></div>`;
      return;
    }
    const alvo = estado.paradaAlvo !== null ? a.aFrente.find((d) => d.posto.id === estado.paradaAlvo) : a.aFrente[0];
    banner.innerHTML = alvo
      ? `${ic("navegar")}<div><b>${fmtDistancia(alvo.restante)} até ${esc(alvo.posto.nome)}</b><small>${estado.paradaAlvo !== null ? "Parada escolhida" : "Próximo posto"} · faltam ${fmtDistancia(restante)} até o ${destino} (${fmtTempo(restante)})</small></div>`
      : `${ic("navegar")}<div><b>${fmtDistancia(restante)} até o ${destino}</b><small>Não há mais postos no caminho · ${fmtTempo(restante)}</small></div>`;
  }

  function atualizarFolha(a) {
    const rotaSalva = dados.rotas.some((r) => r.origem === estado.origem && r.destino === estado.destino);
    let custo = "";
    if (a.maisBarato) {
      const qtd = estado.totalKm / consumoMedio();
      custo = ` · custo estimado <b>${fmtMoeda.format(qtd * a.maisBarato.preco)}</b>`;
    }
    const economia = a.maisBarato && a.maisCaro ? (a.maisCaro.preco - a.maisBarato.preco) * estado.litros : 0;
    $("#folha-cabecalho").innerHTML = `
      <div>
        <h4>${a.lista.length} ${a.lista.length === 1 ? "posto" : "postos"} no seu caminho</h4>
        <p>${fmtDistancia(estado.totalKm)} · ${fmtTempo(estado.totalKm)}${custo}</p>
        ${economia > 0 ? `<p>Economia de <b>${fmtMoeda.format(economia)}</b> abastecendo ${estado.litros} ${unidade()} no mais barato</p>` : ""}
      </div>
      <button type="button" class="botao-icone ${rotaSalva ? "ativo" : ""}" data-acao="alternar-rota-salva" aria-label="${rotaSalva ? "Remover rota dos favoritos" : "Salvar rota nos favoritos"}" title="${rotaSalva ? "Rota salva" : "Salvar rota"}">${ic("marcador")}</button>`;

    $("#faixa-alerta").innerHTML = a.graves.length
      ? `<button type="button" class="faixa-alerta" data-acao="abrir-reputacao" data-id="${a.graves[0].posto.id}">
          ${ic("alerta")}
          <span><b>${a.graves.length === 1 ? `${esc(a.graves[0].posto.nome)} tem alerta de adulteração` : `${a.graves.length} postos no caminho com alerta de adulteração`}</b>
          <small>Fonte: ANP · fora da recomendação de mais barato</small></span>
          ${ic("direita")}
        </button>`
      : "";

    const card = (classe, rotulo, icone, d, valor, info) => d
      ? `<button type="button" class="destaque destaque--${classe}" data-acao="abrir-posto" data-id="${d.posto.id}"><small>${ic(icone)}${rotulo}</small><b>${valor}</b><span>${esc(d.posto.nome)}</span><span>${info}</span></button>`
      : `<div class="destaque destaque--${classe}"><small>${ic(icone)}${rotulo}</small><b>—</b><span>Nenhum à frente</span></div>`;
    $("#destaques").innerHTML = !a.aFrente.length
      ? `<p class="vazio-app" style="grid-column:1/-1">${a.lista.length ? "Todos os postos do trajeto já foram ultrapassados." : "Nenhum posto encontrado para este combustível no trajeto."}</p>`
      : card("verde", "Mais barato", "dinheiro", a.maisBarato, a.maisBarato && fmtMoeda.format(a.maisBarato.preco),
        a.maisBarato && (a.maisBaratoGeral && a.maisBaratoGeral.alerta === "grave" ? "sem alerta de adulteração" : `a ${fmtDistancia(a.maisBarato.restante)}`)) +
      card("ouro", "Mais bem avaliado", "estrela", a.melhor, a.melhor && fmt1.format(a.melhor.nota.media), a.melhor && `a ${fmtDistancia(a.melhor.restante)}`) +
      card("azul", "Carregador", "raio", a.carregador, a.carregador && `${a.carregador.posto.carregador} kW`, a.carregador && `a ${fmtDistancia(a.carregador.restante)}`);
    renderValeAPenaFolha(); // [vale-a-pena]
  }

  function atualizarLista(a) {
    let lista = filtroEletrico.checked ? a.lista.filter((d) => d.posto.carregador) : [...a.lista];
    if ($("#filtro-alerta").checked) lista = lista.filter((d) => d.alerta !== "grave");
    const frente = (x, y) => x.passou - y.passou;
    switch (estado.ordem) {
      case "preco": lista.sort((x, y) => frente(x, y) || x.preco - y.preco || x.restante - y.restante); break;
      case "avaliacao": lista.sort((x, y) => frente(x, y) || y.nota.media - x.nota.media); break;
      case "distancia": lista.sort((x, y) => frente(x, y) || x.restante - y.restante); break;
      default: lista.sort((x, y) => x.km - y.km);
    }
    if (!lista.length) {
      listaPostos.innerHTML = `<p class="vazio-app">${filtroEletrico.checked ? "Nenhum posto com carregador elétrico neste trajeto." : "Nenhum posto encontrado neste trajeto."}</p>`;
      return;
    }
    const precos = a.aFrente.map((d) => d.preco);
    const precoMax = Math.max(...precos);
    listaPostos.innerHTML = lista.map((d) => {
      const barato = !d.passou && a.maisBarato && d.preco === a.maisBarato.preco;
      const selos = [];
      if (d.alerta) selos.push(seloAlerta(d.alerta));
      if (d.passou) selos.push('<span class="selo-app">Ultrapassado</span>');
      else {
        if (barato) selos.push('<span class="selo-app selo-app--verde">Mais barato</span>');
        if (a.melhor && d.nota.media === a.melhor.nota.media) selos.push(`<span class="selo-app selo-app--ouro">${ic("estrela")}Mais bem avaliado</span>`);
        if (precos.length > 1 && d.preco === precoMax) selos.push('<span class="selo-app selo-app--vermelho">Mais caro</span>');
      }
      if (d.posto.carregador) selos.push(`<span class="selo-app selo-app--azul">${ic("raio")}${d.posto.carregador} kW</span>`);
      const classes = ["item-posto", d.passou && "passou", barato && "mais-barato", d.alerta === "grave" && "item-posto--alerta", estado.selecionado === d.posto.id && "selecionado"].filter(Boolean).join(" ");
      return `<div class="${classes}" data-acao="abrir-posto" data-id="${d.posto.id}" role="button" tabindex="0">
        <span class="item-posto__num">${d.ordem}</span>
        <div>
          <div class="item-posto__nome">${esc(d.posto.nome)}${d.favorito ? ic("coracao") : ""}</div>
          <div class="item-posto__info">${estrelas(d.nota.media)} <b>${fmt1.format(d.nota.media)}</b> (${d.nota.total})</div>
          <div class="item-posto__info">${d.passou ? `Ficou ${fmtDistancia(-d.restante)} para trás` : `<b>${fmtDistancia(d.restante)}</b> de você · ${fmtTempo(d.restante)}`} · ${d.doAnterior === null ? "primeiro da rota" : `${fmtDistancia(d.doAnterior)} do anterior`}</div>
          <div class="item-posto__selos">${selos.join("")}</div>
        </div>
        <div class="item-posto__preco"><b>${fmtMoeda.format(d.preco)}</b><small>por ${unidade()}</small></div>
      </div>`;
    }).join("");
  }

  function atualizarMatriz(lista) {
    const caixa = $("#distancias");
    if (lista.length < 2) { caixa.innerHTML = ""; return; }
    const cab = `<thead><tr><th></th>${lista.map((d) => `<th title="${esc(d.posto.nome)}">${d.ordem}</th>`).join("")}</tr></thead>`;
    const corpo = lista.map((x) => `<tr><th title="${esc(x.posto.nome)}">${x.ordem}</th>${lista.map((y) => x === y ? '<td class="diag">—</td>' : `<td>${fmt1.format(Math.abs(x.km - y.km))}</td>`).join("")
      }</tr>`).join("");
    caixa.innerHTML = `<h5>Distância entre os postos (km)</h5><div class="tabela-rolagem"><table class="matriz">${cab}<tbody>${corpo}</tbody></table></div>`;
  }

  // =========================================================
  // Viagem simulada
  // =========================================================
  function quadro(t) {
    if (!estado.emViagem) return;
    const dt = estado.ultimoQuadro ? Math.min(0.1, (t - estado.ultimoQuadro) / 1000) : 0;
    estado.ultimoQuadro = t;
    estado.percorridoKm = Math.min(estado.totalKm, estado.percorridoKm + dt * KM_POR_SEGUNDO_ANIMACAO);

    if (estado.paradaAlvo !== null) {
      const alvo = estado.postosRota.find((d) => d.posto.id === estado.paradaAlvo);
      if (alvo && estado.percorridoKm >= alvo.km) {
        estado.percorridoKm = alvo.km;
        const id = estado.paradaAlvo;
        estado.paradaAlvo = null;
        pararViagem();
        atualizarTudo(true);
        mostrarToast(`Você chegou ao ${postos[id].nome}. Conte para a comunidade como foi!`);
        if (dados.config.lembreteAvaliar) setTimeout(() => abrirPainel(painelAvaliar(id)), 900);
        return;
      }
    }
    if (estado.percorridoKm >= estado.totalKm) { pararViagem(); atualizarTudo(true); return; }
    atualizarTudo();
    requestAnimationFrame(quadro);
  }

  function iniciarViagem() {
    if (estado.percorridoKm >= estado.totalKm) estado.percorridoKm = 0;
    estado.emViagem = true;
    estado.ultimoQuadro = 0;
    folha.classList.remove("expandida");
    atualizarBotaoViagem();
    requestAnimationFrame(quadro);
  }
  function pararViagem() {
    estado.emViagem = false;
    atualizarBotaoViagem();
  }
  function atualizarBotaoViagem() {
    btnViagem.innerHTML = ic(estado.emViagem ? "pausa" : "play", "ic--cheio");
    btnViagem.setAttribute("aria-label", estado.emViagem ? "Pausar viagem" : "Iniciar viagem");
  }

  // =========================================================
  // Navegação do aplicativo
  // =========================================================
  function mostrarVista(nome) {
    fecharPainel(true);
    $$(".vista", app).forEach((v) => v.classList.toggle("ativa", v.dataset.vista === nome));
    $$(".app__aba", app).forEach((b) => {
      b.classList.toggle("ativa", b.dataset.ir === nome);
      if (b.dataset.ir === nome) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (nome === "favoritos") renderFavoritos();
    if (nome === "alertas") renderAlertas();
    if (nome === "atividade") renderAtividade();
    if (nome === "conta") renderConta();
  }

  function abrirPainel(def) {
    estado.pilha.push(def);
    renderPainel();
    painel.classList.add("aberto");
    // Leva o foco do teclado para a tela que acabou de abrir
    setTimeout(() => { try { $("#painel-voltar").focus({ preventScroll: true }); } catch (e) { /* ignorado */ } }, 60);
    painel.setAttribute("aria-hidden", "false");
  }
  function voltarPainel() {
    estado.pilha.pop();
    if (estado.pilha.length) renderPainel();
    else fecharPainel();
  }
  function fecharPainel(semAnimacao = false) {
    estado.pilha = [];
    estado.form = {};
    painel.classList.remove("aberto");
    painel.setAttribute("aria-hidden", "true");
    if (semAnimacao) { painel.style.transition = "none"; requestAnimationFrame(() => (painel.style.transition = "")); }
    if (estado.selecionado !== null) { estado.selecionado = null; atualizarTudo(true); }
  }
  function renderPainel() {
    const def = estado.pilha[estado.pilha.length - 1];
    if (!def) return;
    const r = def.render();
    $("#painel-titulo").textContent = def.titulo;
    $("#painel-acao").innerHTML = r.acao || "";
    const conteudo = $("#painel-conteudo");
    const rolagem = def._renderizado ? conteudo.scrollTop : 0;
    conteudo.innerHTML = r.html;
    conteudo.scrollTop = rolagem;
    $("#painel-rodape").innerHTML = r.rodape || "";
    def._renderizado = true;
    if (def.aoMontar) def.aoMontar(conteudo);
  }
  function atualizarPainelAtual() { if (estado.pilha.length) renderPainel(); }

  let temporizadorToast;
  function mostrarToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("visivel");
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => t.classList.remove("visivel"), 3200);
  }

  // =========================================================
  // Painel: planejar rota
  // =========================================================
  function painelPlanejar() {
    estado.form = { origem: estado.origem, destino: estado.destino, combustivel: estado.combustivel, litros: estado.litros };
    return {
      titulo: "Planejar trajeto",
      render() {
        const f = estado.form;
        const opcoes = (sel) => Object.entries(pontos).filter(([, p]) => p.nome)
          .map(([k, p]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${p.nome}</option>`).join("");
        const tipo = tiposCarro[dados.carro.tipo];
        const rotas = dados.rotas.length
          ? `<div class="segmentado" style="margin-bottom:18px">${dados.rotas.map((r) => `<button type="button" data-acao="carregar-rota" data-id="${r.id}">${ic("marcador")} ${esc(r.nome)}</button>`).join("")}</div>`
          : "";
        let dicaFlex = "";
        if (dados.carro.tipo === "flex") {
          const caminhoTmp = menorCaminho(f.origem, f.destino);
          const ids = postosNoCaminho(caminhoTmp);
          if (ids.length) {
            const media = (t) => ids.reduce((s, id) => s + precoDe(postos[id], t), 0) / ids.length;
            const razao = media("etanol") / media("comum");
            dicaFlex = `<div class="dica">${ic("info")}<span>Nesta rota, o etanol custa em média <b>${Math.round(razao * 100)}%</b> do preço da gasolina comum. ${razao <= 0.7 ? "Para o seu carro flex, <b>o etanol compensa</b>." : "Para o seu carro flex, <b>a gasolina compensa</b> (o etanol vale a pena até cerca de 70%)."}</span></div>`;
          }
        }
        return {
          html: `
            ${dados.rotas.length ? '<div class="a-secao" style="margin-top:4px">Rotas frequentes</div>' : ""}
            ${rotas}
            <div class="a-campo"><label for="pl-origem">Partida</label><select id="pl-origem" data-campo="origem">${opcoes(f.origem)}</select></div>
            <button type="button" class="a-botao a-botao--claro" data-acao="inverter-rota" style="width:100%;margin:-4px 0 10px">${ic("inverter")} Inverter partida e destino</button>
            <div class="a-campo"><label for="pl-destino">Destino</label><select id="pl-destino" data-campo="destino">${opcoes(f.destino)}</select></div>
            <div class="a-campo"><span>Combustível · ${esc(dados.carro.modelo)} (${tipo.nome})</span>
              <div class="segmentado">${tipo.combustiveis.map((c) => `<button type="button" class="${c === f.combustivel ? "ativo" : ""}" data-acao="form-combustivel" data-valor="${c}">${combustiveis[c].nome}</button>`).join("")}</div>
            </div>
            ${dicaFlex}
            <div class="a-campo"><label for="pl-litros">Quanto pretende abastecer: <b id="pl-litros-valor">${f.litros}</b> ${combustiveis[f.combustivel].unidade}</label>
              <input type="range" id="pl-litros" min="5" max="100" step="5" value="${f.litros}">
            </div>`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="tracar">${ic("navegar")} Ver postos no caminho</button>`
        };
      },
      aoMontar(raiz) {
        $$("select[data-campo]", raiz).forEach((s) => s.addEventListener("change", () => {
          estado.form[s.dataset.campo] = s.value;
          if (estado.form.origem === estado.form.destino) {
            const outro = s.dataset.campo === "origem" ? "destino" : "origem";
            estado.form[outro] = Object.keys(pontos).find((k) => pontos[k].nome && k !== s.value);
          }
          atualizarPainelAtual();
        }));
        const r = $("#pl-litros", raiz);
        r.addEventListener("input", () => { estado.form.litros = Number(r.value); $("#pl-litros-valor").textContent = r.value; });
      }
    };
  }

  function postosNoCaminho(caminho) {
    const arestas = new Set();
    for (let i = 0; i < caminho.length - 1; i++) { arestas.add(caminho[i] + "|" + caminho[i + 1]); arestas.add(caminho[i + 1] + "|" + caminho[i]); }
    return postos.filter((p) => arestas.has(p.u + "|" + p.v)).map((p) => p.id);
  }

  function aplicarRota(origem, destino) {
    estado.origem = origem;
    estado.destino = destino;
    calcularRota();
  }

  // =========================================================
  // Painel: detalhe do posto
  // =========================================================
  function painelPosto(id) {
    const p = postos[id];
    estado.selecionado = id;
    atualizarTudo(true);
    return {
      titulo: p.nome,
      render() {
        const nota = notaPosto(p);
        const naRota = dadosPostos().find((d) => d.posto.id === id);
        const fav = dados.favoritos.includes(id);
        const avs = avaliacoesDoPosto(p);
        const contagem = {};
        avs.forEach((a) => a.marcadores.forEach((m) => (contagem[m] = (contagem[m] || 0) + 1)));
        const topMarcadores = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const tiposPreco = ["comum", "aditivada", "etanol", "diesel", "eletrico"];
        const serv = (ok, nome, icone) => `<span class="${ok ? "" : "nao"}">${ic(ok ? icone : "fechar")}${nome}</span>`;

        return {
          acao: `<button type="button" class="botao-icone ${fav ? "ativo" : ""}" data-acao="favoritar" data-id="${id}" aria-label="${fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}">${ic("coracao")}</button>`,
          html: `
            <div class="posto-capa">
              <span class="posto-capa__logo">${ic("bomba")}</span>
              <div>
                <h4>${esc(p.nome)}</h4>
                <p>${naRota ? (naRota.passou ? "No trajeto · já ultrapassado" : `No seu trajeto · a ${fmtDistancia(naRota.restante)} (${fmtTempo(naRota.restante)})`) : "Fora do trajeto atual"}</p>
              </div>
            </div>
            ${cartaoAlerta(p)}
            <div class="metricas">
              <div><b>${fmt1.format(nota.media)} ${ic("estrela")}</b><small>${nota.total} avaliações</small></div>
              <div><b>${naRota ? fmtDistancia(Math.max(0, naRota.restante)) : "—"}</b><small>de você</small></div>
              <div><b>${p.carregador ? `${p.carregador} kW` : "Não"}</b><small>carregador</small></div>
            </div>

            <div class="a-secao">Preços <span class="a-texto-suave">atualizado ${fmtRelativo((id % 3))} pela comunidade</span></div>
            <div class="precos">${tiposPreco.map((t) => {
            const v = precoDe(p, t);
            return `<div class="preco-item ${t === estado.combustivel ? "atual" : ""} ${v === null ? "preco-item--vazio" : ""}"><small>${combustiveis[t].nome}</small><b>${v === null ? "Indisponível" : fmtMoeda.format(v)}</b>${v === null ? "" : `<small>por ${combustiveis[t].unidade}</small>`}</div>`;
          }).join("")}</div>

            ${secaoValeAPena(id) /* [vale-a-pena] */}

            <div class="a-secao">Serviços</div>
            <div class="servicos">
              ${serv(!!p.carregador, p.carregador ? `Carregador ${p.carregador} kW` : "Carregador elétrico", "raio")}
              ${serv(p.servicos.conveniencia, "Loja de conveniência", "check")}
              ${serv(p.servicos.calibrador, "Calibrador", "check")}
              ${serv(p.servicos.banheiro, "Banheiro", "check")}
              ${serv(p.servicos.lavagem, "Lavagem", "check")}
            </div>

            <div class="a-secao">Reputação e denúncias <button type="button" data-acao="abrir-reputacao" data-id="${id}">Ver tudo</button></div>
            ${(() => {
              const r = reputacao(p);
              return `<div class="reputacao-mini" data-acao="abrir-reputacao" data-id="${id}" role="button" tabindex="0">
                <span class="nota-rep nota-rep--${r.classe || "neutra"}">${r.total < 3 ? "—" : fmt1.format(r.nota)}</span>
                <div><span class="selo-app ${r.classe ? `selo-app--${r.classe}` : ""}">${r.rotulo}</span><small>${r.total} reclamações em 12 meses · ${r.resol}% resolvidas · ${ocorrenciasDe(p).length} ocorrências na ANP/${procon()}</small></div>
                ${ic("direita")}
              </div>`;
            })()}

            <div class="a-secao">O que a comunidade diz</div>
            <div class="marcadores-resumo">${topMarcadores.map(([m, n]) => `<span class="selo-app ${MARCADORES_NEGATIVOS.includes(m) ? "selo-app--vermelho" : "selo-app--verde"}">${esc(m)} · ${n}</span>`).join("")}</div>

            <div class="a-secao">Avaliações de motoristas <button type="button" data-acao="avaliar" data-id="${id}">Avaliar</button></div>
            ${avs.map(renderAvaliacao).join("")}
            <p class="a-texto-suave" style="margin-top:12px">As avaliações são feitas por usuários do Posto Inc. para outros usuários. Mostrando as mais recentes.</p>`,
          rodape: `<div class="a-botoes">
              <button type="button" class="a-botao a-botao--claro" data-acao="avaliar" data-id="${id}">${ic("estrela")} Avaliar</button>
              <button type="button" class="a-botao" data-acao="ir-posto" data-id="${id}" ${naRota && !naRota.passou ? "" : "disabled"}>${ic("navegar")} Ir até o posto</button>
            </div>`
        };
      }
    };
  }

  // =========================================================
  // Painéis: reputação do posto e reclamações
  // =========================================================
  function renderReclamacao(r, comPosto = false) {
    const classeStatus = { "Aguardando resposta": "ouro", "Respondida": "azul", "Resolvida": "verde", "Não resolvida": "vermelho" }[r.status] || "";
    return `<article class="reclamacao">
      <div class="reclamacao__topo">
        <span class="selo-app selo-app--${classeStatus}">${esc(r.status)}</span>
        <small>${fmtRelativo(r.dias)}</small>
      </div>
      ${comPosto ? `<button type="button" class="reclamacao__posto" data-acao="abrir-reputacao" data-id="${r.postoId}">${ic("bomba")}${esc(postos[r.postoId].nome)}</button>` : ""}
      <b class="reclamacao__titulo">${esc(r.titulo)}</b>
      <small class="reclamacao__autor">${esc(r.autor)}${r.voce ? " (você)" : ""} · ${TIPOS_RECLAMACAO[r.tipo]} · ${combustiveis[r.combustivel] ? combustiveis[r.combustivel].nome : ""}</small>
      <p>${esc(r.relato)}</p>
      ${r.sintomas && r.sintomas.length ? `<div class="avaliacao__marcadores">${r.sintomas.map((s) => `<span class="selo-app">${esc(s)}</span>`).join("")}</div>` : ""}
      ${r.encaminhar ? `<small class="reclamacao__encaminhada">${ic("documento")}Denúncia também registrada na ANP e no ${procon()}</small>` : ""}
      ${r.resposta ? `<div class="resposta"><b>Resposta do posto</b><p>${esc(r.resposta)}</p></div>` : ""}
      ${r.voce ? `<button type="button" class="botao-util" data-acao="remover-reclamacao" data-id="${r.id}">${ic("lixeira")} Excluir reclamação</button>` : ""}
    </article>`;
  }

  function painelReputacao(id) {
    const p = postos[id];
    return {
      titulo: "Reputação do posto",
      render() {
        const r = reputacao(p);
        const oc = ocorrenciasDe(p);
        const recl = reclamacoesDoPosto(p);
        return {
          html: `
            <div class="posto-capa">
              <span class="posto-capa__logo">${ic("bomba")}</span>
              <div><h4>${esc(p.nome)}</h4><p>Ocorrências oficiais e reclamações de motoristas</p></div>
            </div>
            <div class="rep-painel">
              <span class="nota-rep nota-rep--grande nota-rep--${r.classe || "neutra"}">${r.total < 3 ? "—" : fmt1.format(r.nota)}<small>/10</small></span>
              <div>
                <span class="selo-app ${r.classe ? `selo-app--${r.classe}` : ""}">${r.rotulo}</span>
                <p>${r.total < 3 ? "Poucas reclamações para calcular o índice." : `Índice calculado com ${r.total} reclamações dos últimos 12 meses.`}</p>
              </div>
            </div>
            <div class="indicadores">
              <div><b>${r.total}</b><small>reclamações</small></div>
              <div><b>${r.resp}%</b><small>respondidas</small></div>
              <div><b>${r.resol}%</b><small>resolvidas</small></div>
              <div><b>${r.volt}%</b><small>voltariam a abastecer</small></div>
            </div>
            ${cartaoAlerta(p, false)}

            <div class="a-secao">Ocorrências oficiais</div>
            <p class="a-texto-suave" style="margin-top:-6px">Registros de fiscalização da ANP e de reclamações no ${procon()}, órgão do seu estado.</p>
            ${oc.length ? `<ol class="ocorrencias">${oc.map((o) => `
              <li class="${o.grave ? "grave" : ""}">
                <div class="ocorrencias__topo"><span class="selo-app ${o.fonte === "ANP" ? "selo-app--escuro" : "selo-app--azul"}">${fonteRotulo(o)}</span><small>${fmtRelativo(o.dias)}</small></div>
                <b>${esc(o.tipo)}</b>
                <p>${esc(o.detalhe)}</p>
                <span class="selo-app ${o.status === "Autuado" ? "selo-app--vermelho" : o.status === "Em apuração" ? "selo-app--ouro" : "selo-app--verde"}">${esc(o.status)}</span>
              </li>`).join("")}</ol>`
              : `<div class="vazio-app">Nenhuma ocorrência registrada na ANP ou no ${procon()} nos últimos 12 meses.</div>`}

            <div class="a-secao">Reclamações de motoristas</div>
            ${recl.length ? recl.map((x) => renderReclamacao(x)).join("") : '<div class="vazio-app">Nenhuma reclamação registrada.</div>'}`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="nova-reclamacao" data-id="${id}">${ic("megafone")} Registrar reclamação</button>`
        };
      }
    };
  }

  function painelReclamacao(postoId) {
    const combs = tiposCarro[dados.carro.tipo].combustiveis;
    estado.form = {
      postoId: postoId !== undefined ? Number(postoId) : (estado.postosRota[0] ? estado.postosRota[0].posto.id : 0),
      tipo: "adulteracao", combustivel: combs[0], titulo: "", relato: "", sintomas: [], encaminhar: true
    };
    const valido = () => estado.form.titulo.trim().length >= 5 && estado.form.relato.trim().length >= 20;
    return {
      titulo: "Nova reclamação",
      render() {
        const f = estado.form;
        const ordenados = [...postos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        return {
          html: `
            <div class="a-campo"><label for="rc-posto">Posto</label><select id="rc-posto" data-campo="postoId">${ordenados.map((p) => `<option value="${p.id}" ${p.id === Number(f.postoId) ? "selected" : ""}>${esc(p.nome)}</option>`).join("")}</select></div>
            <div class="a-campo"><span>Qual foi o problema?</span>
              <div class="segmentado">${Object.entries(TIPOS_RECLAMACAO).map(([k, t]) => `<button type="button" class="${k === f.tipo ? "ativo" : ""}" data-acao="form-tipo-reclamacao" data-valor="${k}">${t}</button>`).join("")}</div>
            </div>
            <div class="a-campo"><label for="rc-comb">Combustível</label><select id="rc-comb" data-campo="combustivel">${Object.entries(combustiveis).map(([k, c]) => `<option value="${k}" ${k === f.combustivel ? "selected" : ""}>${c.nome}</option>`).join("")}</select></div>
            ${f.tipo === "adulteracao" ? `
              <div class="a-campo"><span>O que você percebeu no carro?</span>
                <div class="marcadores">${SINTOMAS.map((s) => `<button type="button" class="${f.sintomas.includes(s) ? "ativo" : ""}" data-acao="sintoma" data-valor="${esc(s)}">${ic("check")}${esc(s)}</button>`).join("")}</div>
              </div>
              <div class="dica">${ic("info")}<span>Desconfiou da gasolina? Peça ao posto o <b>teste da proveta</b>, que mede o teor de etanol, e guarde a nota fiscal do abastecimento.</span></div>` : ""}
            <div class="a-campo"><label for="rc-titulo">Título</label><input id="rc-titulo" data-campo="titulo" maxlength="70" placeholder="Resuma o problema em uma frase" value="${esc(f.titulo)}"></div>
            <div class="a-campo"><label for="rc-relato">Relato</label><textarea id="rc-relato" data-campo="relato" maxlength="600" placeholder="Conte o que aconteceu, quando e como foi o atendimento.">${esc(f.relato)}</textarea><small id="rc-contador">${f.relato.length}/600 caracteres · mínimo de 20</small></div>
            <label class="confirmacao"><input type="checkbox" id="rc-encaminhar" ${f.encaminhar ? "checked" : ""}><span>Encaminhar também como denúncia à <b>ANP</b> e ao <b>${procon()}</b>.</span></label>`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" id="rc-enviar" data-acao="salvar-reclamacao" ${valido() ? "" : "disabled"}>Publicar reclamação</button>`
        };
      },
      aoMontar(raiz) {
        $$("[data-campo]", raiz).forEach((i) => i.addEventListener("input", () => {
          estado.form[i.dataset.campo] = i.value;
          if (i.dataset.campo === "relato") $("#rc-contador").textContent = `${i.value.length}/600 caracteres · mínimo de 20`;
          $("#rc-enviar").disabled = !valido();
        }));
        $("#rc-encaminhar", raiz).addEventListener("change", (ev) => (estado.form.encaminhar = ev.target.checked));
      }
    };
  }

  function painelMinhasReclamacoes() {
    return {
      titulo: "Minhas reclamações",
      render() {
        const lista = [...dados.reclamacoes].sort((a, b) => new Date(b.data) - new Date(a.data))
          .map((r) => ({ ...r, autor: dados.perfil.nome, voce: true, dias: diasDesde(r.data) }));
        return {
          html: lista.length ? lista.map((r) => renderReclamacao(r, true)).join("")
            : '<div class="vazio-app">Você ainda não registrou reclamações.<br>Use a aba Alertas para registrar uma.</div>',
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="nova-reclamacao">${ic("megafone")} Registrar reclamação</button>`
        };
      }
    };
  }

  // =========================================================
  // Vista: alertas e denúncias
  // =========================================================
  function renderAlertas() {
    const todos = postos.map((p) => ({ p, nivel: nivelAlerta(p), rep: reputacao(p) }));
    const graves = todos.filter((x) => x.nivel === "grave").length;
    const atencao = todos.filter((x) => x.nivel === "atencao").length;
    const totalRecl = todos.reduce((s, x) => s + x.rep.total, 0);
    const recentes = postos.flatMap((p) => reclamacoesDoPosto(p)).sort((a, b) => a.dias - b.dias).slice(0, 4);
    $("#vista-alertas").innerHTML = `
      <h2 class="a-titulo">Alertas</h2>
      <p class="a-texto-suave" style="margin-top:-10px">Ocorrências da ANP e do ${procon()} e reclamações de motoristas da comunidade Posto Inc.</p>
      <label class="busca-campo">${ic("busca")}<input id="busca-alertas" type="search" placeholder="Buscar posto pelo nome" autocomplete="off"></label>
      <div class="estatisticas estatisticas--3">
        <div class="estatistica estatistica--alerta"><small>${ic("alerta")}Alerta grave</small><b>${graves}</b><span>adulteração</span></div>
        <div class="estatistica estatistica--atencao"><small>${ic("alerta")}Em apuração</small><b>${atencao}</b><span>denúncias</span></div>
        <div class="estatistica"><small>${ic("megafone")}Reclamações</small><b>${totalRecl}</b><span>em 12 meses</span></div>
      </div>
      <button type="button" class="a-botao a-botao--bloco" data-acao="nova-reclamacao">${ic("megafone")} Registrar reclamação</button>
      <div class="a-secao" id="titulo-lista-alertas">Postos com alerta</div>
      <div id="lista-alertas"></div>
      <div class="a-secao">Reclamações recentes</div>
      ${recentes.map((r) => renderReclamacao(r, true)).join("")}
      <div class="dica" style="margin-top:16px">${ic("escudo")}<span>Além de registrar aqui, faça a denúncia nos canais oficiais da <b>ANP</b> e do <b>${procon()}</b>. O app mostra a fonte, a data e a situação de cada ocorrência e só usa “adulteração” quando há autuação da fiscalização.</span></div>`;
    renderListaAlertas("");
    $("#busca-alertas").addEventListener("input", (ev) => renderListaAlertas(ev.target.value));
  }

  function renderListaAlertas(termo) {
    const t = termo.trim().toLowerCase();
    const lista = postos.map((p) => ({ p, nivel: nivelAlerta(p), rep: reputacao(p) }))
      .filter((x) => t ? x.p.nome.toLowerCase().includes(t) : x.nivel)
      .sort((a, b) => (a.nivel === "grave" ? 0 : a.nivel ? 1 : 2) - (b.nivel === "grave" ? 0 : b.nivel ? 1 : 2) || a.rep.nota - b.rep.nota);
    $("#titulo-lista-alertas").textContent = t ? "Resultado da busca" : "Postos com alerta";
    $("#lista-alertas").innerHTML = lista.length ? lista.map(({ p, nivel, rep }) => {
      const oc = ocorrenciasDe(p);
      const o = oc.find((x) => x.grave) || oc[0];
      return `<div class="posto-alerta ${nivel ? `posto-alerta--${nivel}` : ""}" data-acao="abrir-reputacao" data-id="${p.id}" role="button" tabindex="0">
        <div class="posto-alerta__topo"><b>${esc(p.nome)}</b>${seloAlerta(nivel) || '<span class="selo-app selo-app--verde">Sem alertas</span>'}</div>
        <small>${o ? `${fonteRotulo(o)} · ${esc(o.tipo)} · ${esc(o.status)} ${fmtRelativo(o.dias)}` : nivel ? "Reclamação da comunidade em análise" : "Nenhuma ocorrência oficial registrada"}</small>
        <div class="posto-alerta__rodape"><span>Reputação <b>${rep.total < 3 ? "—" : fmt1.format(rep.nota)}</b>${rep.total < 3 ? "" : "/10"} · ${rep.rotulo}</span><span>${rep.total} reclamações</span></div>
      </div>`;
    }).join("") : '<div class="vazio-app">Nenhum posto encontrado.</div>';
  }

  // =========================================================
  // Diálogo de confirmação
  // =========================================================
  let focoAntesDoDialogo = null;
  function mostrarDialogo(html) {
    focoAntesDoDialogo = document.activeElement;
    $("#dialogo-conteudo").innerHTML = html;
    $("#dialogo").hidden = false;
    const primeiro = $("#dialogo-conteudo button");
    if (primeiro) setTimeout(() => primeiro.focus({ preventScroll: true }), 30);
  }
  function fecharDialogo() {
    if ($("#dialogo").hidden) return;
    $("#dialogo").hidden = true;
    if (focoAntesDoDialogo && document.contains(focoAntesDoDialogo)) focoAntesDoDialogo.focus({ preventScroll: true });
  }
  // Mantém o foco dentro do diálogo (Tab) e fecha com Esc
  function tecladoDialogo(ev) {
    if ($("#dialogo").hidden) return false;
    if (ev.key === "Escape") { fecharDialogo(); return true; }
    if (ev.key === "Tab") {
      const botoes = $$("#dialogo-conteudo button");
      if (!botoes.length) return false;
      const primeiro = botoes[0], ultimo = botoes[botoes.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
      return true;
    }
    return false;
  }
  const reduzirMovimento = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function renderAvaliacao(a) {
    const util = a.voce ? null : !!dados.uteis[a.id];
    return `<article class="avaliacao">
      <div class="avaliacao__topo">
        ${avatar(a.autor, a.voce && dados.config.nomePublico ? dados.perfil.foto : "", a.voce ? "avatar--voce" : "")}
        <div class="avaliacao__autor"><b>${esc(a.autor)}${a.voce ? " (você)" : ""}</b><small>Avaliador nível ${a.nivel} · ${a.totalAutor} avaliações</small></div>
        ${a.voce ? `<button type="button" class="botao-icone" data-acao="remover-avaliacao" data-id="${a.id}" aria-label="Excluir minha avaliação">${ic("lixeira")}</button>` : ""}
      </div>
      <div class="avaliacao__nota">${estrelas(a.nota)} <span>${fmtRelativo(a.dias)}</span>${a.precoConfirmado ? ` · <span class="selo-app selo-app--verde">${ic("check")}Preço confirmado</span>` : ""}</div>
      ${a.comentario ? `<p>${esc(a.comentario)}</p>` : ""}
      ${a.marcadores.length ? `<div class="avaliacao__marcadores">${a.marcadores.map((m) => `<span class="selo-app ${MARCADORES_NEGATIVOS.includes(m) ? "selo-app--vermelho" : ""}">${esc(m)}</span>`).join("")}</div>` : ""}
      ${a.voce ? "" : `<button type="button" class="botao-util ${util ? "ativo" : ""}" data-acao="util" data-id="${a.id}">${ic("curtir")} Útil · ${a.uteis + (util ? 1 : 0)}</button>`}
    </article>`;
  }

  // =========================================================
  // Painel: avaliar posto
  // =========================================================
  const LEGENDAS_NOTA = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"];
  function painelAvaliar(id) {
    const p = postos[id];
    estado.form = { nota: 0, marcadores: [], comentario: "", precoConfirmado: false };
    return {
      titulo: "Avaliar posto",
      render() {
        const f = estado.form;
        const preco = precoDe(p, estado.combustivel);
        return {
          html: `
            <div class="posto-capa">
              <span class="posto-capa__logo">${ic("bomba")}</span>
              <div><h4>${esc(p.nome)}</h4><p>Sua avaliação ajuda outros motoristas da comunidade</p></div>
            </div>
            <div class="estrelas-entrada" role="radiogroup" aria-label="Nota">
              ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= f.nota ? "ativa" : ""}" data-acao="nota" data-valor="${n}" aria-label="${n} estrela${n > 1 ? "s" : ""}">${ic("estrela")}</button>`).join("")}
            </div>
            <div class="estrelas-legenda">${f.nota ? LEGENDAS_NOTA[f.nota] : "Toque nas estrelas para dar sua nota"}</div>

            <div class="a-campo"><span>O que se destacou?</span>
              <div class="marcadores">${MARCADORES.filter((m) => p.carregador || !m.includes("Carregador")).map((m) => `<button type="button" class="${f.marcadores.includes(m) ? "ativo" : ""}" data-acao="marcador" data-valor="${esc(m)}">${ic("check")}${esc(m)}</button>`).join("")}</div>
            </div>
            <div class="a-campo"><label for="av-comentario">Comentário (opcional)</label>
              <textarea id="av-comentario" maxlength="280" placeholder="Conte como foi o atendimento, a limpeza, a fila...">${esc(f.comentario)}</textarea>
              <small id="av-contador">${f.comentario.length}/280 caracteres</small>
            </div>
            ${preco !== null ? `<label class="confirmacao"><input type="checkbox" id="av-preco" ${f.precoConfirmado ? "checked" : ""}><span>Confirmo que o preço da ${combustiveis[estado.combustivel].nome.toLowerCase()} estava <b>${fmtMoeda.format(preco)}</b>, como mostra o app.</span></label>` : ""}`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="publicar-avaliacao" data-id="${id}" ${f.nota ? "" : "disabled"}>Publicar avaliação</button>`
        };
      },
      aoMontar(raiz) {
        const t = $("#av-comentario", raiz);
        t.addEventListener("input", () => { estado.form.comentario = t.value; $("#av-contador").textContent = `${t.value.length}/280 caracteres`; });
        const c = $("#av-preco", raiz);
        if (c) c.addEventListener("change", () => (estado.form.precoConfirmado = c.checked));
      }
    };
  }

  // =========================================================
  // Painéis da conta: carro, perfil, avaliações, abastecimento, sobre
  // =========================================================
  function painelCarro() {
    estado.form = { ...dados.carro };
    return {
      titulo: "Meu carro",
      render() {
        const f = estado.form;
        const eletrico = f.tipo === "eletrico";
        const autonomia = Number(f.tanque) * ((Number(f.consumoCidade) + Number(f.consumoEstrada)) / 2);
        return {
          html: `
            <div class="cartao-carro">${ic("carro")}<div><b>${esc(f.modelo || "Seu carro")}</b><small>${tiposCarro[f.tipo].nome} · ${esc(f.ano)} · autonomia estimada de ${Number.isFinite(autonomia) ? Math.round(autonomia) : "—"} km</small></div></div>
            <div class="a-linha a-linha--modelo">
              <div class="a-campo"><label for="c-modelo">Modelo</label><input id="c-modelo" data-campo="modelo" value="${esc(f.modelo)}" maxlength="40"></div>
              <div class="a-campo"><label for="c-ano">Ano</label><input id="c-ano" data-campo="ano" type="number" min="1980" max="2027" value="${esc(f.ano)}"></div>
            </div>
            <div class="a-campo"><span>Tipo de combustível</span>
              <div class="segmentado">${Object.entries(tiposCarro).map(([k, t]) => `<button type="button" class="${k === f.tipo ? "ativo" : ""}" data-acao="form-tipo-carro" data-valor="${k}">${t.nome}</button>`).join("")}</div>
            </div>
            <div class="a-campo"><label for="c-tanque">${eletrico ? "Capacidade da bateria (kWh)" : "Capacidade do tanque (L)"}</label><input id="c-tanque" data-campo="tanque" type="number" min="1" max="200" value="${esc(f.tanque)}"></div>
            <div class="a-linha">
              <div class="a-campo"><label for="c-cidade">Consumo na cidade</label><input id="c-cidade" data-campo="consumoCidade" type="number" step="0.1" min="1" value="${esc(f.consumoCidade)}"><small>${eletrico ? "km/kWh" : "km/L"}</small></div>
              <div class="a-campo"><label for="c-estrada">Consumo na estrada</label><input id="c-estrada" data-campo="consumoEstrada" type="number" step="0.1" min="1" value="${esc(f.consumoEstrada)}"><small>${eletrico ? "km/kWh" : "km/L"}</small></div>
            </div>
            <div class="dica">${ic("info")}<span>O consumo é usado para estimar o custo de cada viagem e para escolher os combustíveis exibidos na comparação.</span></div>`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="salvar-carro">Salvar carro</button>`
        };
      },
      aoMontar(raiz) {
        $$("input[data-campo]", raiz).forEach((i) => i.addEventListener("input", () => (estado.form[i.dataset.campo] = i.value)));
        $$("input[data-campo]", raiz).forEach((i) => i.addEventListener("change", atualizarPainelAtual));
      }
    };
  }

  // Recorta a foto em quadrado e reduz para 256 px, para caber no armazenamento do navegador
  function reduzirFoto(arquivo) {
    return new Promise((resolver, rejeitar) => {
      const leitor = new FileReader();
      leitor.onerror = rejeitar;
      leitor.onload = () => {
        const img = new Image();
        img.onerror = rejeitar;
        img.onload = () => {
          const lado = Math.min(img.width, img.height);
          const tela = document.createElement("canvas");
          tela.width = tela.height = 256;
          tela.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
          resolver(tela.toDataURL("image/jpeg", 0.85));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  function painelPerfil() {
    estado.form = { ...dados.perfil };
    return {
      titulo: "Editar perfil",
      render() {
        const f = estado.form;
        return {
          html: `
            <div class="foto-perfil">
              ${avatar(f.nome, f.foto, "avatar--grande avatar--editar")}
              <input type="file" id="p-foto" accept="image/*" class="oculto" tabindex="-1" aria-hidden="true">
              <div class="foto-perfil__botoes">
                <button type="button" class="a-botao a-botao--claro" data-acao="escolher-foto">${ic("usuario")} ${f.foto ? "Trocar foto" : "Escolher foto"}</button>
                ${f.foto ? `<button type="button" class="a-botao a-botao--perigo" data-acao="remover-foto">${ic("lixeira")} Remover foto</button>` : ""}
              </div>
            </div>
            <div class="a-campo"><label for="p-nome">Nome</label><input id="p-nome" data-campo="nome" value="${esc(f.nome)}" maxlength="40"></div>
            <div class="a-linha">
              <div class="a-campo"><label for="p-cidade">Cidade</label><input id="p-cidade" data-campo="cidade" value="${esc(f.cidade)}" maxlength="40"></div>
              <div class="a-campo"><label for="p-uf">Estado (UF)</label><select id="p-uf" data-campo="uf">${UFS.map((u) => `<option value="${u}" ${u === f.uf ? "selected" : ""}>${u}</option>`).join("")}</select></div>
            </div>
            <p class="a-texto-suave">Seu nome aparece nas avaliações e reclamações que você publica. O estado define qual Procon é consultado nos alertas dos postos.</p>`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="salvar-perfil">Salvar</button>`
        };
      },
      aoMontar(raiz) {
        $$("[data-campo]", raiz).forEach((i) => i.addEventListener("input", () => (estado.form[i.dataset.campo] = i.value)));
        $("#p-foto", raiz).addEventListener("change", (ev) => {
          const arquivo = ev.target.files && ev.target.files[0];
          if (!arquivo) return;
          if (!arquivo.type.startsWith("image/")) { mostrarToast("Escolha um arquivo de imagem (JPG ou PNG)."); return; }
          reduzirFoto(arquivo)
            .then((url) => { estado.form.foto = url; atualizarPainelAtual(); })
            .catch(() => mostrarToast("Não foi possível abrir essa imagem. Tente outra."));
        });
      }
    };
  }

  function painelMinhasAvaliacoes() {
    return {
      titulo: "Minhas avaliações",
      render() {
        const lista = [...dados.avaliacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        return {
          html: lista.length
            ? lista.map((a) => `<div style="margin-top:8px"><button type="button" class="selo-app" data-acao="abrir-posto" data-id="${a.postoId}">${ic("bomba")}${esc(postos[a.postoId].nome)}</button>${renderAvaliacao({ ...a, autor: dados.perfil.nome, voce: true, nivel: nivelUsuario().nivel, totalAutor: totalAvaliacoesUsuario(), dias: diasDesde(a.data) })}</div>`).join("")
            : `<div class="vazio-app">Você ainda não publicou avaliações neste aparelho.<br>Abra um posto e toque em “Avaliar”.</div>`
        };
      }
    };
  }

  function painelAbastecimento() {
    const ult = [...dados.abastecimentos].sort((a, b) => b.hodometro - a.hodometro)[0];
    const combs = tiposCarro[dados.carro.tipo].combustiveis;
    const postoInicial = estado.postosRota[0] ? estado.postosRota[0].posto.id : 0;
    estado.form = {
      postoId: postoInicial, combustivel: combs[0], litros: 35,
      preco: precoDe(postos[postoInicial], combs[0]) || 0,
      hodometro: ult ? ult.hodometro + 400 : 10000, data: new Date().toISOString().slice(0, 10)
    };
    return {
      titulo: "Registrar abastecimento",
      render() {
        const f = estado.form;
        const disponiveis = postos.filter((p) => precoDe(p, f.combustivel) !== null).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        const un = combustiveis[f.combustivel].unidade;
        return {
          html: `
            <div class="a-campo"><label for="ab-posto">Posto</label><select id="ab-posto" data-campo="postoId">${disponiveis.map((p) => `<option value="${p.id}" ${p.id === Number(f.postoId) ? "selected" : ""}>${esc(p.nome)}</option>`).join("")}</select></div>
            <div class="a-campo"><span>Combustível</span>
              <div class="segmentado">${combs.map((c) => `<button type="button" class="${c === f.combustivel ? "ativo" : ""}" data-acao="form-comb-abastecimento" data-valor="${c}">${combustiveis[c].nome}</button>`).join("")}</div>
            </div>
            <div class="a-linha">
              <div class="a-campo"><label for="ab-litros">Quantidade (${un})</label><input id="ab-litros" data-campo="litros" type="number" step="0.1" min="0.1" value="${esc(f.litros)}"></div>
              <div class="a-campo"><label for="ab-preco">Preço por ${un} (R$)</label><input id="ab-preco" data-campo="preco" type="number" step="0.01" min="0.01" value="${esc(f.preco)}"></div>
            </div>
            <div class="a-linha">
              <div class="a-campo"><label for="ab-hodometro">Hodômetro (km)</label><input id="ab-hodometro" data-campo="hodometro" type="number" min="0" value="${esc(f.hodometro)}"></div>
              <div class="a-campo"><label for="ab-data">Data</label><input id="ab-data" data-campo="data" type="date" value="${esc(f.data)}"></div>
            </div>
            <div class="estatistica estatistica--escura"><small>${ic("dinheiro")}Total do abastecimento</small><b id="ab-total">${fmtMoeda.format((Number(f.litros) || 0) * (Number(f.preco) || 0))}</b><span>Tanque cheio: informe sempre o hodômetro para calcular o consumo real.</span></div>`,
          rodape: `<button type="button" class="a-botao a-botao--bloco" data-acao="salvar-abastecimento">Salvar abastecimento</button>`
        };
      },
      aoMontar(raiz) {
        $$("[data-campo]", raiz).forEach((i) => i.addEventListener("input", () => {
          estado.form[i.dataset.campo] = i.value;
          if (i.dataset.campo === "postoId") { estado.form.preco = precoDe(postos[Number(i.value)], estado.form.combustivel); atualizarPainelAtual(); return; }
          $("#ab-total").textContent = fmtMoeda.format((Number(estado.form.litros) || 0) * (Number(estado.form.preco) || 0));
        }));
      }
    };
  }

  // =========================================================
  // Configurações do aplicativo
  // =========================================================
  // =========================================================
  // [vale-a-pena] RECURSO "VALE A PENA IR?" — CUSTO REAL DO ABASTECIMENTO
  // Para retirar: apague este bloco inteiro e as linhas marcadas com [vale-a-pena]
  // (script.js, index.html e o bloco correspondente no style.css).
  //
  // Custo real = (quantidade × preço) + combustível gasto no desvio de ida e volta.
  // Postos no caminho não têm desvio: o trecho até eles já faz parte da viagem.
  // =========================================================

  // Distância pelo mapa, em unidades, de vários pontos de partida até todos os pontos
  function distanciasNoMapa(partidas) {
    const d = {}, visitados = new Set();
    Object.keys(pontos).forEach((k) => (d[k] = Infinity));
    partidas.forEach((k) => (d[k] = 0));
    for (;;) {
      let atual = null;
      for (const k in d) if (!visitados.has(k) && (atual === null || d[k] < d[atual])) atual = k;
      if (atual === null || d[atual] === Infinity) break;
      visitados.add(atual);
      for (const { no, peso } of vizinhos[atual]) if (d[atual] + peso < d[no]) d[no] = d[atual] + peso;
    }
    return d;
  }

  function custosReais() {
    if (!estado.rota.length) return [];
    const consumo = consumoMedio();
    const qtd = estado.litros;
    // O desvio começa nos pontos da rota que ainda estão à frente do carro
    const pos = pontoNaRota(estado.percorridoKm);
    const partidas = estado.rota.slice(pos.indice).map((s) => s.para);
    if (estado.percorridoKm <= 0) partidas.push(estado.rota[0].de);
    const dist = distanciasNoMapa(partidas);
    const noCaminho = new Map(estado.postosRota.map((item) => [item.posto.id, item]));

    return postos.map((p) => {
      const preco = precoDe(p, estado.combustivel);
      if (preco === null) return null;
      const item = noCaminho.get(p.id);
      let desvioKm = 0, restante = null;
      if (item) {
        restante = item.km - estado.percorridoKm;
        if (restante < -0.001) return null; // posto já ultrapassado
      } else {
        const e = estradas.find((x) => (x.u === p.u && x.v === p.v) || (x.u === p.v && x.v === p.u));
        const ate = Math.min(dist[p.u] + p.t * e.comprimento, dist[p.v] + (1 - p.t) * e.comprimento);
        desvioKm = 2 * ate * KM_POR_UNIDADE;
      }
      const abastecimento = qtd * preco;
      const custoDesvio = (desvioKm / consumo) * preco;
      return { posto: p, preco, naRota: !!item, restante, desvioKm, abastecimento, custoDesvio, total: abastecimento + custoDesvio, alerta: nivelAlerta(p) };
    }).filter(Boolean).sort((x, y) => x.total - y.total);
  }

  function resumoValeAPena() {
    const lista = custosReais();
    const confiaveis = lista.filter((c) => c.alerta !== "grave");
    const melhor = confiaveis[0];
    if (!melhor) return null;
    const maisBaratoLitro = [...confiaveis].sort((x, y) => x.preco - y.preco || x.total - y.total)[0];
    const melhorNaRota = confiaveis.find((c) => c.naRota);
    let mensagem;
    if (maisBaratoLitro.posto.id !== melhor.posto.id) {
      mensagem = `O ${esc(maisBaratoLitro.posto.nome)} tem o litro ${fmtMoeda.format(melhor.preco - maisBaratoLitro.preco)} mais barato, mas o desvio de ${fmtDistancia(maisBaratoLitro.desvioKm)} custa ${fmtMoeda.format(maisBaratoLitro.custoDesvio)}. <b>Não compensa.</b>`;
    } else if (!melhor.naRota && melhorNaRota) {
      mensagem = `<b>Compensa</b> desviar ${fmtDistancia(melhor.desvioKm)}: economia de ${fmtMoeda.format(melhorNaRota.total - melhor.total)} em relação ao ${esc(melhorNaRota.posto.nome)}, já contando o combustível do desvio.`;
    } else {
      mensagem = `O ${esc(melhor.posto.nome)} já é a opção mais econômica, sem sair do caminho.`;
    }
    return { lista, melhor, mensagem };
  }

  function renderValeAPenaFolha() {
    const caixa = $("#vale-a-pena");
    if (!caixa) return;
    const r = dados.config.valeAPena ? resumoValeAPena() : null;
    if (!r) { caixa.innerHTML = ""; return; }
    caixa.innerHTML = `
      <button type="button" class="vale-a-pena" data-acao="abrir-vale-a-pena">
        <span class="vale-a-pena__topo">${ic("dinheiro")}<b>Vale a pena ir?</b>${ic("direita")}</span>
        <span class="vale-a-pena__melhor">Melhor custo real: <b>${esc(r.melhor.posto.nome)}</b> · <b>${fmtMoeda.format(r.melhor.total)}</b> por ${estado.litros} ${unidade()}</span>
        <span class="vale-a-pena__texto">${r.mensagem}</span>
      </button>`;
  }

  function linhaCusto(c, melhor) {
    const diferenca = c.total - melhor.total;
    const selos = [
      c.naRota ? '<span class="selo-app selo-app--verde">Na rota</span>' : `<span class="selo-app">Desvio de ${fmtDistancia(c.desvioKm)} ida e volta</span>`,
      c === melhor ? '<span class="selo-app selo-app--ouro">Mais econômico</span>' : "",
      seloAlerta(c.alerta)
    ].join("");
    return `<div class="custo-real ${c === melhor ? "custo-real--melhor" : ""}" data-acao="abrir-posto" data-id="${c.posto.id}" role="button" tabindex="0">
      <div class="custo-real__topo"><b>${esc(c.posto.nome)}</b><span class="custo-real__total">${fmtMoeda.format(c.total)}</span></div>
      <div class="item-posto__selos">${selos}</div>
      <small>Abastecimento ${fmtMoeda.format(c.abastecimento)} (${fmtMoeda.format(c.preco)}/${unidade()}) + desvio ${fmtMoeda.format(c.custoDesvio)}${c === melhor ? "" : ` · ${fmtMoeda.format(diferenca)} a mais`}</small>
    </div>`;
  }

  function painelValeAPena() {
    return {
      titulo: "Vale a pena ir?",
      render() {
        const r = resumoValeAPena();
        if (!r) return { html: '<div class="vazio-app">Nenhum posto disponível para este combustível no trajeto.</div>' };
        const unidadeConsumo = dados.carro.tipo === "eletrico" ? "km/kWh" : "km/L";
        return {
          html: `
            <p class="a-texto-suave" style="margin-top:0">Um posto mais barato, mas fora do caminho, pode sair mais caro por causa do combustível gasto para chegar até ele. Aqui está o <b>custo real</b> de abastecer ${estado.litros} ${unidade()} de ${combustiveis[estado.combustivel].nome.toLowerCase()} em cada posto.</p>
            <div class="vale-a-pena vale-a-pena--estatico"><span class="vale-a-pena__texto">${r.mensagem}</span></div>
            <div class="a-secao">Custo real por posto</div>
            ${r.lista.slice(0, 10).map((c) => linhaCusto(c, r.melhor)).join("")}
            <p class="a-texto-suave" style="margin-top:14px">Custo real = abastecimento + combustível gasto no desvio de ida e volta. O trecho até os postos que já estão no seu caminho não entra na conta, porque você vai rodar esse caminho de qualquer forma. Consumo usado: ${fmt1.format(consumoMedio())} ${unidadeConsumo} (Meu carro).</p>`
        };
      }
    };
  }

  function secaoValeAPena(id) {
    if (!dados.config.valeAPena) return "";
    const r = resumoValeAPena();
    if (!r) return "";
    const c = r.lista.find((x) => x.posto.id === id);
    if (!c) return "";
    const melhor = r.melhor;
    const veredito = c.posto.id === melhor.posto.id
      ? `<span class="selo-app selo-app--verde">${ic("check")}Melhor custo real da sua rota</span>`
      : `<span class="selo-app selo-app--vermelho">${fmtMoeda.format(c.total - melhor.total)} a mais que o ${esc(melhor.posto.nome)}</span>`;
    return `
      <div class="a-secao">Vale a pena ir? <button type="button" data-acao="abrir-vale-a-pena">Ver comparação</button></div>
      <dl class="conta-custo">
        <div><dt>Abastecimento (${estado.litros} ${unidade()})</dt><dd>${fmtMoeda.format(c.abastecimento)}</dd></div>
        <div><dt>Desvio${c.naRota ? " (no seu caminho)" : ` de ${fmtDistancia(c.desvioKm)} ida e volta`}</dt><dd>${fmtMoeda.format(c.custoDesvio)}</dd></div>
        <div class="conta-custo__total"><dt>Custo real</dt><dd>${fmtMoeda.format(c.total)}</dd></div>
      </dl>
      ${veredito}`;
  }
  // [vale-a-pena] fim do recurso

  function painelConfig() {
    return {
      titulo: "Configurações",
      render() {
        const c = dados.config;
        const seg = (chave, opcoes) => `<div class="segmentado">${opcoes.map(([v, r]) =>
          `<button type="button" class="${c[chave] === v ? "ativo" : ""}" data-acao="config" data-id="${chave}" data-valor="${v}">${r}</button>`).join("")}</div>`;
        const alt = (chave, rotulo) => `<label class="alternador"><span>${rotulo}</span><input type="checkbox" data-config="${chave}" ${c[chave] ? "checked" : ""}><i></i></label>`;
        return {
          html: `
            <section class="config-grupo">
              <h4>${ic("lua")}Aparência</h4>
              <div class="a-campo"><span>Tema</span>${seg("tema", [["claro", "Claro"], ["escuro", "Escuro"], ["auto", "Automático"]])}</div>
              <div class="a-campo"><span>Tamanho do texto</span>${seg("texto", [["padrao", "Padrão"], ["grande", "Grande"]])}</div>
            </section>
            <section class="config-grupo">
              <h4>${ic("globo")}Idioma</h4>
              ${seg("idioma", [["pt", "Português (Brasil)"], ["en", "English"], ["es", "Español"]])}
              <p class="a-texto-suave">Avaliações e reclamações de outros motoristas aparecem no idioma original.</p>
            </section>
            <section class="config-grupo">
              <h4>${ic("navegar")}Navegação</h4>
              ${alt("evitarAlerta", "Evitar postos com alerta de adulteração")}
              ${alt("foraRota", "Mostrar postos fora da rota no mapa")}
              ${alt("valeAPena", "Comparar o custo real (Vale a pena ir?)") /* [vale-a-pena] */}
            </section>
            <section class="config-grupo">
              <h4>${ic("alerta")}Notificações</h4>
              ${alt("notifPreco", "Queda de preço nos postos favoritos")}
              ${alt("notifAlerta", "Novos alertas de adulteração na minha rota")}
              ${alt("lembreteAvaliar", "Pedir avaliação ao chegar no posto")}
            </section>
            <section class="config-grupo">
              <h4>${ic("escudo")}Privacidade</h4>
              ${alt("nomePublico", "Mostrar meu nome nas avaliações")}
              ${alt("localizacao", "Compartilhar localização durante a viagem")}
            </section>
            <p class="a-texto-suave">Versão 1.0 · Posto Inc.</p>`
        };
      },
      aoMontar(raiz) {
        $$("[data-config]", raiz).forEach((i) => i.addEventListener("change", () => {
          dados.config[i.dataset.config] = i.checked;
          salvar(); aplicarConfig();
        }));
      }
    };
  }

  const mqEscuro = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function aplicarConfig() {
    const c = dados.config;
    const escuro = c.tema === "escuro" || (c.tema === "auto" && !!mqEscuro && mqEscuro.matches);
    app.classList.toggle("tema-escuro", escuro);
    app.classList.toggle("texto-grande", c.texto === "grande");
    svg.classList.toggle("sem-fora-rota", !c.foraRota);
    $("#filtro-alerta").checked = !!c.evitarAlerta;
    app.setAttribute("lang", { pt: "pt-BR", en: "en", es: "es" }[c.idioma] || "pt-BR");
    if (estado.rota.length) atualizarTudo(true);
    atualizarVistaAtiva();
    traduzirAgora();
  }
  if (mqEscuro && mqEscuro.addEventListener) mqEscuro.addEventListener("change", () => { if (dados.config.tema === "auto") aplicarConfig(); });

  // =========================================================
  // Tradução da interface do app (português, inglês e espanhol)
  // =========================================================
  const TRADUCOES = [
    ["Início", "Home", "Inicio"], ["Favoritos", "Favorites", "Favoritos"], ["Alertas", "Alerts", "Alertas"],
    ["Consumo", "Fuel log", "Consumo"], ["Conta", "Account", "Cuenta"],
    ["postos no seu caminho", "stations on your route", "gasolineras en tu ruta"],
    ["posto no seu caminho", "station on your route", "gasolinera en tu ruta"],
    ["custo estimado", "estimated cost", "costo estimado"],
    ["Economia de", "Save", "Ahorra"], ["abastecendo", "by filling up", "cargando"], ["no mais barato", "at the cheapest", "en la más barata"],
    ["Mais barato", "Cheapest", "Más barata"], ["Mais baratos", "Cheapest", "Más baratas"],
    ["Mais bem avaliado", "Top rated", "Mejor valorada"], ["Mais bem avaliados", "Top rated", "Mejor valoradas"],
    ["Mais próximos", "Nearest", "Más cercanas"], ["Mais caro", "Most expensive", "Más cara"], ["Na rota", "On route", "En la ruta"],
    ["Carregador", "Charger", "Cargador"], ["carregador", "charger", "cargador"],
    ["Nenhum à frente", "None ahead", "Ninguna adelante"],
    ["sem alerta de adulteração", "no adulteration alert", "sin alerta de adulteración"],
    ["Somente com carregador elétrico", "Only with EV charger", "Solo con cargador eléctrico"],
    ["Ocultar postos com alerta de adulteração", "Hide stations with adulteration alerts", "Ocultar gasolineras con alerta de adulteración"],
    ["de você", "from you", "de ti"], ["do anterior", "from previous", "de la anterior"],
    ["primeiro da rota", "first on route", "primera de la ruta"], ["por L", "per L", "por L"], ["por kWh", "per kWh", "por kWh"],
    ["Ultrapassado", "Passed", "Superada"], ["ultrapassado", "passed", "superada"],
    ["Ficou", "", "Quedó"], ["para trás", "behind", "atrás"],
    ["Alerta de adulteração", "Adulteration alert", "Alerta de adulteración"],
    ["Denúncia em apuração", "Complaint under investigation", "Denuncia en investigación"],
    ["tem alerta de adulteração", "has an adulteration alert", "tiene alerta de adulteración"],
    ["postos no caminho com alerta de adulteração", "stations on route with adulteration alerts", "gasolineras en la ruta con alerta de adulteración"],
    ["Fonte:", "Source:", "Fuente:"],
    ["fora da recomendação de mais barato", "left out of the cheapest pick", "fuera de la recomendación más barata"],
    ["Distância entre os postos (km)", "Distance between stations (km)", "Distancia entre gasolineras (km)"],
    ["Próximo posto", "Next station", "Próxima gasolinera"], ["Parada escolhida", "Chosen stop", "Parada elegida"],
    ["faltam", "remaining:", "faltan"], ["até o", "to", "hasta el"], ["até", "to", "hasta"],
    ["Você chegou ao", "You arrived at", "Llegaste a"], ["Trajeto de", "Trip of", "Trayecto de"], ["concluído", "completed", "completado"],
    ["Não há mais postos no caminho", "No more stations on the route", "No hay más gasolineras en la ruta"],
    ["Gasolina comum", "Regular gasoline", "Gasolina regular"], ["Gasolina aditivada", "Premium gasoline", "Gasolina premium"],
    ["Etanol", "Ethanol", "Etanol"], ["Recarga elétrica", "EV charging", "Recarga eléctrica"],
    ["Rotas frequentes", "Frequent routes", "Rutas frecuentes"], ["Salvar rota atual", "Save current route", "Guardar ruta actual"],
    ["Postos favoritos", "Favorite stations", "Gasolineras favoritas"], ["No trajeto atual", "On current route", "En el trayecto actual"],
    ["Fora do trajeto atual", "Off current route", "Fuera del trayecto actual"], ["postos no caminho", "stations on route", "gasolineras en la ruta"],
    ["Consumo real", "Real consumption", "Consumo real"], ["Gasto em 30 dias", "Spent in 30 days", "Gasto en 30 días"],
    ["Economia com o app", "Saved with the app", "Ahorro con la app"], ["Autonomia", "Range", "Autonomía"],
    ["Registrar abastecimento", "Log refueling", "Registrar carga"], ["Histórico", "History", "Historial"],
    ["com o tanque cheio", "with a full tank", "con el tanque lleno"],
    ["comparado à média da região", "vs. area average", "comparado con el promedio de la zona"], ["abastecidos", "filled", "cargados"],
    ["Meu carro", "My car", "Mi auto"], ["Editar perfil", "Edit profile", "Editar perfil"],
    ["Minhas avaliações", "My reviews", "Mis reseñas"], ["Minhas reclamações", "My complaints", "Mis reclamos"],
    ["Configurações", "Settings", "Configuración"], ["Sobre o Posto Inc.", "About Posto Inc.", "Acerca de Posto Inc."],
    ["Restaurar dados da demonstração", "Reset demo data", "Restablecer datos de demostración"],
    ["Reputação na comunidade", "Community reputation", "Reputación en la comunidad"],
    ["votos úteis", "helpful votes", "votos útiles"], ["avaliações", "reviews", "reseñas"], ["favoritos", "favorites", "favoritos"],
    ["Avaliador nível", "Reviewer level", "Evaluador nivel"], ["Membro desde", "Member since", "Miembro desde"],
    ["Nome e cidade", "Name and city", "Nombre y ciudad"],
    ["Tema, idioma, notificações e privacidade", "Theme, language, notifications and privacy", "Tema, idioma, notificaciones y privacidad"],
    ["Faltam", "Only", "Faltan"], ["pontos para o nível", "points to reach level", "puntos para el nivel"], ["pontos", "points", "puntos"],
    ["Cada avaliação vale 15 pontos.", "Each review is worth 15 points.", "Cada reseña vale 15 puntos."],
    ["Registrar reclamação", "File a complaint", "Registrar reclamo"], ["Postos com alerta", "Stations with alerts", "Gasolineras con alerta"],
    ["Reclamações recentes", "Recent complaints", "Reclamos recientes"], ["Alerta grave", "Serious alert", "Alerta grave"],
    ["Em apuração", "Under investigation", "En investigación"], ["Reclamações", "Complaints", "Reclamos"],
    ["reclamações", "complaints", "reclamos"], ["em 12 meses", "in 12 months", "en 12 meses"],
    ["Buscar posto pelo nome", "Search station by name", "Buscar gasolinera por nombre"],
    ["Reputação", "Reputation", "Reputación"], ["Sem alertas", "No alerts", "Sin alertas"],
    ["adulteração", "adulteration", "adulteración"], ["denúncias", "complaints", "denuncias"],
    ["Preços", "Prices", "Precios"], ["Serviços", "Services", "Servicios"],
    ["O que a comunidade diz", "What the community says", "Lo que dice la comunidad"],
    ["Avaliações de motoristas", "Driver reviews", "Reseñas de conductores"],
    ["Reputação e denúncias", "Reputation and complaints", "Reputación y denuncias"], ["Ver tudo", "See all", "Ver todo"],
    ["Avaliar", "Rate", "Calificar"], ["Ir até o posto", "Go to station", "Ir a la gasolinera"],
    ["Loja de conveniência", "Convenience store", "Tienda de conveniencia"], ["Calibrador", "Tire inflator", "Calibrador"],
    ["Banheiro", "Restroom", "Baño"], ["Lavagem", "Car wash", "Lavado"], ["No seu trajeto", "On your route", "En tu ruta"],
    ["Útil", "Helpful", "Útil"], ["Indisponível", "Unavailable", "No disponible"],
    ["atualizado", "updated", "actualizado"], ["pela comunidade", "by the community", "por la comunidad"],
    ["hoje", "today", "hoy"], ["ontem", "yesterday", "ayer"],
    ["Histórico de combustível adulterado", "History of adulterated fuel", "Historial de combustible adulterado"],
    ["Ver ocorrências e reclamações", "See records and complaints", "Ver registros y reclamos"],
    ["Planejar trajeto", "Plan trip", "Planificar trayecto"], ["Avaliar posto", "Rate station", "Calificar gasolinera"],
    ["Reputação do posto", "Station reputation", "Reputación de la gasolinera"], ["Nova reclamação", "New complaint", "Nuevo reclamo"],
    ["Ver postos no caminho", "See stations on route", "Ver gasolineras en la ruta"],
    ["Partida", "Start", "Salida"], ["Destino", "Destination", "Destino"], ["Combustível", "Fuel", "Combustible"],
    ["Inverter partida e destino", "Swap start and destination", "Invertir salida y destino"],
    ["Publicar avaliação", "Post review", "Publicar reseña"], ["Publicar reclamação", "Post complaint", "Publicar reclamo"],
    ["Salvar carro", "Save car", "Guardar auto"], ["Salvar", "Save", "Guardar"],
    ["Aparência", "Appearance", "Apariencia"], ["Tema", "Theme", "Tema"], ["Claro", "Light", "Claro"], ["Escuro", "Dark", "Oscuro"],
    ["Automático", "Automatic", "Automático"], ["Tamanho do texto", "Text size", "Tamaño del texto"],
    ["Padrão", "Default", "Predeterminado"], ["Grande", "Large", "Grande"], ["Idioma", "Language", "Idioma"],
    ["Navegação", "Navigation", "Navegación"],
    ["Evitar postos com alerta de adulteração", "Avoid stations with adulteration alerts", "Evitar gasolineras con alerta de adulteración"],
    ["Mostrar postos fora da rota no mapa", "Show off-route stations on the map", "Mostrar gasolineras fuera de la ruta en el mapa"],
    ["Notificações", "Notifications", "Notificaciones"],
    ["Queda de preço nos postos favoritos", "Price drops at favorite stations", "Bajadas de precio en gasolineras favoritas"],
    ["Novos alertas de adulteração na minha rota", "New adulteration alerts on my route", "Nuevas alertas de adulteración en mi ruta"],
    ["Pedir avaliação ao chegar no posto", "Ask for a review when I reach a station", "Pedir reseña al llegar a la gasolinera"],
    ["Privacidade", "Privacy", "Privacidad"], ["Mostrar meu nome nas avaliações", "Show my name on reviews", "Mostrar mi nombre en las reseñas"],
    ["Compartilhar localização durante a viagem", "Share location during trips", "Compartir ubicación durante el viaje"],
    ["Avaliações e reclamações de outros motoristas aparecem no idioma original.", "Reviews and complaints from other drivers appear in their original language.", "Las reseñas y reclamos de otros conductores aparecen en su idioma original."],
    ["Versão", "Version", "Versión"],
    // [vale-a-pena]
    ["Vale a pena ir?", "Is it worth it?", "¿Vale la pena ir?"], ["Melhor custo real", "Best real cost", "Mejor costo real"],
    ["Custo real", "Real cost", "Costo real"], ["custo real", "real cost", "costo real"], ["Não compensa", "Not worth it", "No compensa"],
    ["Compensa", "Worth it", "Compensa"], ["Ver comparação", "See comparison", "Ver comparación"],
    ["Abastecimento", "Refueling", "Carga"], ["Desvio", "Detour", "Desvío"], ["ida e volta", "round trip", "ida y vuelta"],
    ["Comparar o custo real (Vale a pena ir?)", "Compare the real cost (Is it worth it?)", "Comparar el costo real (¿Vale la pena ir?)"],
    ["Escolher foto", "Choose photo", "Elegir foto"], ["Trocar foto", "Change photo", "Cambiar foto"],
    ["Remover foto", "Remove photo", "Quitar foto"], ["Motorista anônimo", "Anonymous driver", "Conductor anónimo"],
    ["Preço confere com o app", "Price matches the app", "El precio coincide con la app"], ["Bom atendimento", "Good service", "Buena atención"],
    ["Banheiro limpo", "Clean restroom", "Baño limpio"], ["Combustível de qualidade", "Quality fuel", "Combustible de calidad"],
    ["Carregador funcionando", "Charger working", "Cargador funcionando"], ["Loja de conveniência boa", "Good convenience store", "Buena tienda de conveniencia"],
    ["Preço diferente do app", "Price differs from the app", "Precio distinto al de la app"], ["Fila demorada", "Long line", "Fila larga"],
    ["Carregador com defeito", "Charger out of order", "Cargador averiado"]
  ];
  const DATAS_RELATIVAS = [
    [/há (\d+) dias/g, "$1 days ago", "hace $1 días"],
    [/há (\d+) semanas/g, "$1 weeks ago", "hace $1 semanas"],
    [/há (\d+) meses/g, "$1 months ago", "hace $1 meses"],
    [/há 1 mês/g, "1 month ago", "hace 1 mes"]
  ];
  const mapasTraducao = { en: new Map(), es: new Map() };
  let regexTraducao = null;
  const textosOriginais = new WeakMap();
  let observadorTraducao = null;
  let traducaoAplicada = false;

  function prepararTraducoes() {
    TRADUCOES.sort((a, b) => b[0].length - a[0].length);
    TRADUCOES.forEach(([pt, en, es]) => { mapasTraducao.en.set(pt, en); mapasTraducao.es.set(pt, es); });
    const alternativas = TRADUCOES.map((t) => t[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    regexTraducao = new RegExp(`(?<![\\p{L}])(${alternativas})(?![\\p{L}])`, "gu");
  }

  function traduzirTexto(texto, idioma) {
    let r = texto;
    DATAS_RELATIVAS.forEach(([re, en, es]) => { r = r.replace(re, idioma === "en" ? en : es); });
    const mapa = mapasTraducao[idioma];
    return r.replace(regexTraducao, (m) => (mapa.has(m) ? mapa.get(m) : m));
  }

  function traduzirAgora() {
    if (!regexTraducao) return;
    const idioma = dados.config.idioma;
    // Em português, só percorre a tela uma vez depois de sair de outro idioma (para restaurar os textos)
    if (idioma === "pt" && !traducaoAplicada) return;
    traducaoAplicada = idioma !== "pt";
    if (observadorTraducao) observadorTraducao.disconnect();
    const caminhante = document.createTreeWalker(app, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentNode && n.parentNode.closest && n.parentNode.closest("textarea, script, style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    let n;
    while ((n = caminhante.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      let original = textosOriginais.get(n);
      if (original === undefined) { original = n.nodeValue; textosOriginais.set(n, original); }
      const novo = idioma === "pt" ? original : traduzirTexto(original, idioma);
      if (n.nodeValue !== novo) n.nodeValue = novo;
    }
    app.querySelectorAll("[placeholder]").forEach((e) => {
      if (!e.dataset.phOriginal) e.dataset.phOriginal = e.placeholder;
      e.placeholder = idioma === "pt" ? e.dataset.phOriginal : traduzirTexto(e.dataset.phOriginal, idioma);
    });
    if (observadorTraducao) observadorTraducao.observe(app, { childList: true, subtree: true, characterData: true });
  }

  function iniciarTraducao() {
    prepararTraducoes();
    observadorTraducao = new MutationObserver(traduzirAgora);
    observadorTraducao.observe(app, { childList: true, subtree: true, characterData: true });
  }

  function painelSobre() {
    return {
      titulo: "Sobre o Posto Inc.",
      render() {
        return {
          html: `
            <img src="img/logo-posto-inc.png" alt="Posto Inc." style="display:block;width:100%;border-radius:16px;margin:6px 0 18px">
            <p>O Posto Inc. traça o seu trajeto, encontra os postos no caminho e compara preços, avaliações da comunidade e carregadores elétricos.</p>
            <p class="a-texto-suave">Versão 1.0 (protótipo acadêmico). Locais, postos, preços, usuários e avaliações são fictícios.</p>`
        };
      }
    };
  }

  // =========================================================
  // Vistas principais: favoritos, consumo e conta
  // =========================================================
  function renderFavoritos() {
    const caixa = $("#vista-favoritos");
    const formRota = estado.form.salvandoRota;
    const rotas = dados.rotas.map((r) => {
      const ids = postosNoCaminho(menorCaminho(r.origem, r.destino));
      const km = rotaKm(r.origem, r.destino);
      const favs = ids.filter((id) => dados.favoritos.includes(id)).length;
      return `<div class="cartao-rota">${ic("rota")}
        <div class="cartao-rota__texto" data-acao="carregar-rota" data-id="${r.id}" role="button" tabindex="0">
          <b>${esc(r.nome)}</b><small>${pontos[r.origem].nome} → ${pontos[r.destino].nome} · ${fmtDistancia(km)}</small>
          <small>${ids.length} postos no caminho${favs ? ` · ${favs} favorito${favs > 1 ? "s" : ""}` : ""}</small>
        </div>
        <button type="button" class="botao-icone" data-acao="remover-rota" data-id="${r.id}" aria-label="Remover rota">${ic("lixeira")}</button>
      </div>`;
    }).join("");

    const naRota = new Map(dadosPostos().map((d) => [d.posto.id, d]));
    const postosFav = dados.favoritos.map((id) => {
      const p = postos[id];
      const d = naRota.get(id);
      const preco = precoDe(p, estado.combustivel);
      const nota = notaPosto(p);
      return `<div class="item-posto" data-acao="abrir-posto" data-id="${id}" role="button" tabindex="0">
        <span class="item-posto__num" style="background:#000;color:#d4ab2c">${ic("bomba")}</span>
        <div>
          <div class="item-posto__nome">${esc(p.nome)}</div>
          <div class="item-posto__info">${estrelas(nota.media)} <b>${fmt1.format(nota.media)}</b> (${nota.total})</div>
          <div class="item-posto__selos">${d ? `<span class="selo-app selo-app--verde">${ic("check")}No trajeto atual · ${d.passou ? "ultrapassado" : fmtDistancia(d.restante)}</span>` : '<span class="selo-app">Fora do trajeto atual</span>'}${p.carregador ? `<span class="selo-app selo-app--azul">${ic("raio")}${p.carregador} kW</span>` : ""}</div>
        </div>
        <div class="item-posto__preco"><b>${preco === null ? "—" : fmtMoeda.format(preco)}</b><small>${combustiveis[estado.combustivel].curto}</small></div>
      </div>`;
    }).join("");

    caixa.innerHTML = `
      <h2 class="a-titulo">Favoritos</h2>
      <div class="a-secao">Rotas frequentes <button type="button" data-acao="nova-rota">${ic("mais")} Salvar rota atual</button></div>
      ${formRota ? `<div class="form-inline"><input id="nome-rota" maxlength="30" placeholder="Nome da rota (ex.: Casa → Faculdade)" value="${pontos[estado.origem].nome} → ${pontos[estado.destino].nome}"><button type="button" class="a-botao" data-acao="confirmar-rota">Salvar</button></div>` : ""}
      ${rotas || '<div class="vazio-app">Nenhuma rota salva. Salve o trajeto que você faz com frequência.</div>'}
      <div class="a-secao">Postos favoritos</div>
      ${postosFav || '<div class="vazio-app">Toque no coração na página de um posto para salvá-lo aqui.</div>'}
      <p class="a-texto-suave" style="margin-top:14px">Os favoritos aparecem destacados no mapa e na lista quando estão no seu caminho.</p>`;
    if (formRota) { const i = $("#nome-rota"); i.focus(); i.select(); }
  }

  function rotaKm(o, d) {
    const c = menorCaminho(o, d);
    let s = 0;
    for (let i = 0; i < c.length - 1; i++) s += dist(pontos[c[i]], pontos[c[i + 1]]);
    return s * KM_POR_UNIDADE;
  }

  function estatisticasConsumo() {
    const lista = [...dados.abastecimentos].sort((a, b) => a.hodometro - b.hodometro);
    let km = 0, litros = 0;
    const trechos = {};
    lista.forEach((a, i) => {
      if (i === 0) return;
      const k = a.hodometro - lista[i - 1].hodometro;
      if (k > 0 && a.litros > 0) { km += k; litros += Number(a.litros); trechos[a.id] = k / a.litros; }
    });
    const recentes = lista.filter((a) => diasDesde(a.data) <= 30);
    return {
      medio: litros ? km / litros : null,
      trechos,
      gasto30: recentes.reduce((s, a) => s + a.litros * a.preco, 0),
      litros30: recentes.reduce((s, a) => s + Number(a.litros), 0),
      economia: lista.reduce((s, a) => s + (Number(a.economia) || 0), 0)
    };
  }

  function renderAtividade() {
    const est = estatisticasConsumo();
    const un = dados.carro.tipo === "eletrico" ? "kWh" : "L";
    const lista = [...dados.abastecimentos].sort((a, b) => new Date(b.data) - new Date(a.data));
    const referencia = Number(dados.carro.consumoCidade);
    $("#vista-atividade").innerHTML = `
      <h2 class="a-titulo">Consumo</h2>
      <div class="cartao-carro" data-acao="abrir-carro" role="button" tabindex="0" style="cursor:pointer">${ic("carro")}<div style="flex:1"><b>${esc(dados.carro.modelo)}</b><small>${tiposCarro[dados.carro.tipo].nome} · consumo informado de ${fmt1.format(referencia)} km/${un} na cidade</small></div>${ic("direita")}</div>
      <div class="estatisticas">
        <div class="estatistica estatistica--escura"><small>${ic("gota")}Consumo real</small><b>${est.medio ? `${fmt1.format(est.medio)} km/${un}` : "—"}</b><span>${est.medio && referencia ? (est.medio >= referencia ? "acima do informado" : "abaixo do informado") : "registre ao menos 2 abastecimentos"}</span></div>
        <div class="estatistica"><small>${ic("dinheiro")}Gasto em 30 dias</small><b>${fmtMoeda.format(est.gasto30)}</b><span>${fmt1.format(est.litros30)} ${un} abastecidos</span></div>
        <div class="estatistica"><small>${ic("queda")}Economia com o app</small><b>${fmtMoeda.format(est.economia)}</b><span>comparado à média da região</span></div>
        <div class="estatistica"><small>${ic("regua")}Autonomia</small><b>${Math.round(Number(dados.carro.tanque) * (est.medio || consumoMedio()))} km</b><span>com o tanque cheio</span></div>
      </div>
      <button type="button" class="a-botao a-botao--bloco" data-acao="novo-abastecimento">${ic("mais")} Registrar abastecimento</button>
      <div class="a-secao">Histórico</div>
      ${lista.length ? lista.map((a) => `<div class="abastecimento">
          <span class="abastecimento__icone">${ic("bomba")}</span>
          <div><b>${esc(postos[a.postoId].nome)}</b><small>${fmtData.format(new Date(a.data))} · ${fmt1.format(a.litros)} ${combustiveis[a.combustivel].unidade} de ${combustiveis[a.combustivel].nome.toLowerCase()} · ${fmtMoeda.format(a.preco)}/${combustiveis[a.combustivel].unidade}</small><small>${new Intl.NumberFormat("pt-BR").format(a.hodometro)} km${est.trechos[a.id] ? ` · ${fmt1.format(est.trechos[a.id])} km/${un} no trecho` : ""}</small></div>
          <div class="abastecimento__valor"><b>${fmtMoeda.format(a.litros * a.preco)}</b><button type="button" class="selo-app" data-acao="remover-abastecimento" data-id="${a.id}" style="border:0;margin-top:4px">Excluir</button></div>
        </div>`).join("") : '<div class="vazio-app">Nenhum abastecimento registrado.</div>'}`;
  }

  function renderConta() {
    const n = nivelUsuario();
    $("#vista-conta").innerHTML = `
      <div class="perfil-topo">
        <div><h2>${esc(dados.perfil.nome)}</h2><p>${ic("estrela")} Avaliador nível ${n.nivel} · ${esc(dados.perfil.cidade)} - ${esc(dados.perfil.uf)}</p></div>
        ${avatar(dados.perfil.nome, dados.perfil.foto, "avatar--grande")}
      </div>
      <div class="atalhos">
        <button type="button" data-acao="abrir-carro">${ic("carro")}Meu carro</button>
        <button type="button" data-acao="ir-favoritos">${ic("coracao")}Favoritos</button>
        <button type="button" data-acao="abrir-config">${ic("ajustes")}Configurações</button>
      </div>
      <div class="reputacao">
        <div class="reputacao__topo"><b>Reputação na comunidade</b><span>${n.pontos} pontos</span></div>
        <div class="barra"><span style="width:${n.progresso}%"></span></div>
        <small>Faltam ${100 - n.progresso} pontos para o nível ${n.nivel + 1}. Cada avaliação vale 15 pontos.</small>
      </div>
      <div class="numeros-perfil">
        <div><b>${totalAvaliacoesUsuario()}</b><small>avaliações</small></div>
        <div><b>${37 + Object.keys(dados.uteis).length}</b><small>votos úteis</small></div>
        <div><b>${dados.favoritos.length}</b><small>favoritos</small></div>
      </div>
      <ul class="menu-lista">
        <li><button type="button" data-acao="abrir-perfil">${ic("usuario")}<span>Editar perfil<small>Nome e cidade</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="abrir-carro">${ic("carro")}<span>Meu carro<small>${esc(dados.carro.modelo)} · ${tiposCarro[dados.carro.tipo].nome}</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="abrir-minhas">${ic("mensagem")}<span>Minhas avaliações<small>${dados.avaliacoes.length} publicadas neste aparelho</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="abrir-minhas-reclamacoes">${ic("megafone")}<span>Minhas reclamações<small>${dados.reclamacoes.length} registradas · denúncias à ANP e ao ${procon()}</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="ir-favoritos">${ic("marcador")}<span>Rotas frequentes<small>${dados.rotas.length} salvas</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="abrir-config">${ic("ajustes")}<span>Configurações<small>Tema, idioma, notificações e privacidade</small></span>${ic("direita")}</button></li>
        <li><button type="button" data-acao="abrir-sobre">${ic("info")}<span>Sobre o Posto Inc.</span>${ic("direita")}</button></li>
        <li class="perigo"><button type="button" data-acao="restaurar">${ic("reiniciar")}<span>Restaurar dados da demonstração</span></button></li>
      </ul>
      <p class="a-texto-suave" style="margin-top:14px">Membro desde ${esc(dados.perfil.membroDesde)}.</p>`;
  }

  function atualizarVistaAtiva() {
    const ativa = $(".vista.ativa", app).dataset.vista;
    if (ativa === "favoritos") renderFavoritos();
    if (ativa === "alertas") renderAlertas();
    if (ativa === "atividade") renderAtividade();
    if (ativa === "conta") renderConta();
  }

  // =========================================================
  // Ações (delegação de cliques dentro do app)
  // =========================================================
  const acoes = {
    "abrir-posto": (id) => abrirPainel(painelPosto(Number(id))),
    "abrir-planejar": () => abrirPainel(painelPlanejar()),
    "abrir-carro": () => abrirPainel(painelCarro()),
    "abrir-perfil": () => abrirPainel(painelPerfil()),
    "abrir-minhas": () => abrirPainel(painelMinhasAvaliacoes()),
    "abrir-sobre": () => abrirPainel(painelSobre()),
    "novo-abastecimento": () => abrirPainel(painelAbastecimento()),
    "ir-favoritos": () => mostrarVista("favoritos"),
    "ir-atividade": () => mostrarVista("atividade"),
    "avaliar": (id) => abrirPainel(painelAvaliar(Number(id))),

    "favoritar": (id) => {
      id = Number(id);
      const i = dados.favoritos.indexOf(id);
      if (i >= 0) dados.favoritos.splice(i, 1); else dados.favoritos.push(id);
      salvar();
      mostrarToast(i >= 0 ? "Posto removido dos favoritos." : "Posto adicionado aos favoritos.");
      atualizarPainelAtual(); atualizarTudo(true); atualizarVistaAtiva();
    },
    "ir-posto": (id, v) => {
      id = Number(id);
      fecharDialogo();
      if (nivelAlerta(postos[id]) === "grave" && v !== "confirmado") {
        const alt = analisar().maisBarato;
        mostrarDialogo(`
          <span class="dialogo__icone">${ic("alerta")}</span>
          <h4 id="dialogo-titulo">Este posto tem alerta de adulteração</h4>
          <p>O <b>${esc(postos[id].nome)}</b> foi autuado pela ANP por combustível fora das especificações. Abastecer aqui pode causar falhas e danos ao motor.</p>
          <div class="dialogo__botoes">
            ${alt ? `<button type="button" class="a-botao" data-acao="abrir-posto-dialogo" data-id="${alt.posto.id}">Ver ${esc(alt.posto.nome)} (${fmtMoeda.format(alt.preco)})</button>` : ""}
            <button type="button" class="a-botao a-botao--claro" data-acao="ir-posto" data-id="${id}" data-valor="confirmado">Ir mesmo assim</button>
            <button type="button" class="a-botao a-botao--claro" data-acao="fechar-dialogo">Cancelar</button>
          </div>`);
        return;
      }
      fecharPainel();
      mostrarVista("inicio");
      estado.selecionado = id;
      estado.paradaAlvo = id;
      mostrarToast(`Navegando até ${postos[id].nome}.`);
      iniciarViagem();
    },
    "fechar-dialogo": () => fecharDialogo(),
    "abrir-posto-dialogo": (id) => { fecharDialogo(); abrirPainel(painelPosto(Number(id))); },
    "abrir-reputacao": (id) => abrirPainel(painelReputacao(Number(id))),
    "abrir-minhas-reclamacoes": () => abrirPainel(painelMinhasReclamacoes()),
    "nova-reclamacao": (id) => abrirPainel(painelReclamacao(id)),
    "form-tipo-reclamacao": (_, v) => { estado.form.tipo = v; atualizarPainelAtual(); },
    "sintoma": (_, v) => {
      const s = estado.form.sintomas, i = s.indexOf(v);
      if (i >= 0) s.splice(i, 1); else s.push(v);
      atualizarPainelAtual();
    },
    "salvar-reclamacao": () => {
      const f = estado.form;
      if (f.titulo.trim().length < 5 || f.relato.trim().length < 20) return;
      const postoId = Number(f.postoId);
      dados.reclamacoes.push({
        id: "rc" + Date.now(), postoId, tipo: f.tipo, combustivel: f.combustivel,
        titulo: f.titulo.trim(), relato: f.relato.trim(), sintomas: f.tipo === "adulteracao" ? [...f.sintomas] : [],
        encaminhar: f.encaminhar, status: "Aguardando resposta", data: new Date().toISOString()
      });
      salvar();
      estado.pilha.pop();
      abrirPainel(painelReputacao(postoId));
      atualizarTudo(true); atualizarVistaAtiva();
      mostrarToast(f.encaminhar ? `Reclamação publicada e encaminhada à ANP e ao ${procon()}.` : "Reclamação publicada para a comunidade.");
    },
    "remover-reclamacao": (id) => {
      dados.reclamacoes = dados.reclamacoes.filter((r) => r.id !== id);
      salvar(); atualizarPainelAtual(); atualizarTudo(true); atualizarVistaAtiva();
      mostrarToast("Reclamação excluída.");
    },

    "abrir-config": () => abrirPainel(painelConfig()),
    "abrir-vale-a-pena": () => abrirPainel(painelValeAPena()), // [vale-a-pena]
    "config": (chave, valor) => {
      dados.config[chave] = valor;
      salvar(); aplicarConfig(); atualizarPainelAtual();
    },

    "util": (id) => {
      if (dados.uteis[id]) delete dados.uteis[id]; else dados.uteis[id] = true;
      salvar(); atualizarPainelAtual();
    },

    "inverter-rota": () => { const f = estado.form;[f.origem, f.destino] = [f.destino, f.origem]; atualizarPainelAtual(); },
    "form-combustivel": (_, v) => { estado.form.combustivel = v; atualizarPainelAtual(); },
    "tracar": () => {
      const f = estado.form;
      estado.combustivel = f.combustivel;
      estado.litros = f.litros;
      fecharPainel();
      aplicarRota(f.origem, f.destino);
    },
    "carregar-rota": (id) => {
      const r = dados.rotas.find((x) => x.id === id);
      if (!r) return;
      mostrarVista("inicio");
      aplicarRota(r.origem, r.destino);
      mostrarToast(`Rota “${r.nome}” carregada.`);
    },
    "remover-rota": (id) => { dados.rotas = dados.rotas.filter((r) => r.id !== id); salvar(); renderFavoritos(); atualizarTudo(true); },
    "nova-rota": () => { estado.form.salvandoRota = !estado.form.salvandoRota; renderFavoritos(); },
    "confirmar-rota": () => {
      const nome = ($("#nome-rota").value || "").trim() || `${pontos[estado.origem].nome} → ${pontos[estado.destino].nome}`;
      dados.rotas.push({ id: "r" + Date.now(), nome, origem: estado.origem, destino: estado.destino });
      estado.form.salvandoRota = false;
      salvar(); renderFavoritos(); atualizarTudo(true);
      mostrarToast("Rota salva nos favoritos.");
    },
    "alternar-rota-salva": () => {
      const r = dados.rotas.find((x) => x.origem === estado.origem && x.destino === estado.destino);
      if (r) { dados.rotas = dados.rotas.filter((x) => x !== r); mostrarToast("Rota removida dos favoritos."); }
      else { dados.rotas.push({ id: "r" + Date.now(), nome: `${pontos[estado.origem].nome} → ${pontos[estado.destino].nome}`, origem: estado.origem, destino: estado.destino }); mostrarToast("Rota salva em Favoritos."); }
      salvar(); atualizarTudo(true);
    },

    "nota": (_, v) => { estado.form.nota = Number(v); atualizarPainelAtual(); },
    "marcador": (_, v) => {
      const m = estado.form.marcadores, i = m.indexOf(v);
      if (i >= 0) m.splice(i, 1); else m.push(v);
      atualizarPainelAtual();
    },
    "publicar-avaliacao": (id) => {
      const f = estado.form;
      if (!f.nota) return;
      dados.avaliacoes.push({ id: "u" + Date.now(), postoId: Number(id), nota: f.nota, marcadores: [...f.marcadores], comentario: f.comentario.trim(), precoConfirmado: f.precoConfirmado, data: new Date().toISOString() });
      salvar();
      estado.pilha.pop();
      mostrarToast("Avaliação publicada. Obrigado por ajudar a comunidade!");
      if (estado.pilha.length) renderPainel(); else abrirPainel(painelPosto(Number(id)));
      atualizarTudo(true);
    },
    "remover-avaliacao": (id) => { dados.avaliacoes = dados.avaliacoes.filter((a) => a.id !== id); salvar(); atualizarPainelAtual(); atualizarTudo(true); mostrarToast("Avaliação excluída."); },

    "form-tipo-carro": (_, v) => { estado.form.tipo = v; atualizarPainelAtual(); },
    "salvar-carro": () => {
      const f = estado.form;
      if (!String(f.modelo).trim()) { mostrarToast("Informe o modelo do carro."); return; }
      const { placa: _placaAntiga, ...carroSemPlaca } = f;
      dados.carro = { ...carroSemPlaca, modelo: String(f.modelo).trim(), ano: Number(f.ano), tanque: Number(f.tanque) || 1, consumoCidade: Number(f.consumoCidade) || 1, consumoEstrada: Number(f.consumoEstrada) || 1 };
      const combs = tiposCarro[dados.carro.tipo].combustiveis;
      if (!combs.includes(estado.combustivel)) estado.combustivel = combs[0];
      filtroEletrico.checked = dados.carro.tipo === "eletrico";
      salvar(); voltarPainel(); atualizarTudo(true); atualizarVistaAtiva();
      mostrarToast("Dados do carro salvos.");
    },
    "escolher-foto": () => { const i = $("#p-foto"); if (i) i.click(); },
    "remover-foto": () => { estado.form.foto = ""; atualizarPainelAtual(); },
    "salvar-perfil": () => {
      const nome = String(estado.form.nome).trim();
      if (!nome) { mostrarToast("Informe o seu nome."); return; }
      dados.perfil = { ...dados.perfil, nome, foto: estado.form.foto || "", cidade: String(estado.form.cidade).trim() || dados.perfil.cidade, uf: estado.form.uf || dados.perfil.uf };
      salvar(); voltarPainel(); atualizarVistaAtiva(); atualizarTudo(true);
      mostrarToast("Perfil atualizado.");
    },
    "form-comb-abastecimento": (_, v) => {
      estado.form.combustivel = v;
      const p = postos[Number(estado.form.postoId)];
      if (precoDe(p, v) === null) estado.form.postoId = postos.find((x) => precoDe(x, v) !== null).id;
      estado.form.preco = precoDe(postos[Number(estado.form.postoId)], v);
      atualizarPainelAtual();
    },
    "salvar-abastecimento": () => {
      const f = estado.form;
      const litros = Number(f.litros), preco = Number(f.preco), hodometro = Number(f.hodometro);
      if (!(litros > 0) || !(preco > 0) || !(hodometro >= 0)) { mostrarToast("Confira a quantidade, o preço e o hodômetro."); return; }
      const mediaRegiao = postos.map((p) => precoDe(p, f.combustivel)).filter((v) => v !== null);
      const media = mediaRegiao.reduce((s, v) => s + v, 0) / mediaRegiao.length;
      dados.abastecimentos.push({ id: "a" + Date.now(), data: new Date(f.data + "T12:00:00").toISOString(), postoId: Number(f.postoId), combustivel: f.combustivel, litros, preco, hodometro, economia: Math.max(0, Math.round((media - preco) * litros * 100) / 100) });
      salvar(); voltarPainel(); renderAtividade();
      mostrarToast("Abastecimento registrado.");
    },
    "remover-abastecimento": (id) => { dados.abastecimentos = dados.abastecimentos.filter((a) => a.id !== id); salvar(); renderAtividade(); },
    "restaurar": () => {
      try { localStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch (e) { /* ignorado */ }
      dados = dadosIniciais();
      estado.combustivel = tiposCarro[dados.carro.tipo].combustiveis[0];
      filtroEletrico.checked = false;
      aplicarConfig();
      renderConta(); calcularRota();
      mostrarToast("Dados da demonstração restaurados.");
    }
  };

  // =========================================================
  // Navegação da apresentação
  // =========================================================
  const slides = $$("main > section");
  const linksMenu = $$(".menu a");

  function slideAtual() {
    const ref = window.innerHeight * 0.35;
    let atual = 0;
    slides.forEach((s, i) => { if (s.getBoundingClientRect().top <= ref) atual = i; });
    return atual;
  }
  const irParaSlide = (i) => slides[Math.max(0, Math.min(slides.length - 1, i))].scrollIntoView({ behavior: reduzirMovimento() ? "auto" : "smooth", block: "start" });

  function atualizarApresentacao() {
    const i = slideAtual();
    $("#slide-contador").textContent = `${i + 1} / ${slides.length}`;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $("#barra-progresso").style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    linksMenu.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === `#${slides[i].id}`));
  }

  function alternarTelaCheia() {
    try {
      const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => { });
    } catch (e) { /* sem suporte */ }
  }

  const celularApp = $("#celular-app");
  function ajustarEscala() {
    const escala = Math.min((window.innerHeight - 40) / celularApp.offsetHeight, (window.innerWidth - 40) / celularApp.offsetWidth, 1.6);
    celularApp.style.setProperty("--escala", escala.toFixed(3));
  }
  function ampliar(ativo) {
    document.body.classList.toggle("ampliado", ativo);
    $("#fundo-ampliado").hidden = !ativo;
    if (ativo) ajustarEscala();
  }

  // =========================================================
  // Eventos
  // =========================================================
  function ligarEventos() {
    app.addEventListener("click", (ev) => {
      const alvo = ev.target.closest("[data-acao]");
      if (!alvo || !app.contains(alvo) || alvo.disabled) return;
      const fn = acoes[alvo.dataset.acao];
      if (fn) { ev.preventDefault(); fn(alvo.dataset.id, alvo.dataset.valor); }
    });
    app.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const alvo = ev.target.closest("[data-acao][role='button']");
      if (alvo) acoes[alvo.dataset.acao]?.(alvo.dataset.id, alvo.dataset.valor);
    });

    $("#busca").addEventListener("click", () => abrirPainel(painelPlanejar()));
    $("#painel-voltar").addEventListener("click", voltarPainel);
    $$(".app__aba", app).forEach((b) => b.addEventListener("click", () => mostrarVista(b.dataset.ir)));

    const alternarFolha = () => {
      const aberta = folha.classList.toggle("expandida");
      $("#folha-alca").setAttribute("aria-expanded", String(aberta));
    };
    $("#folha-alca").addEventListener("click", alternarFolha);
    $("#folha-cabecalho").addEventListener("click", (ev) => { if (!ev.target.closest("[data-acao]")) alternarFolha(); });
    $("#destaques").addEventListener("wheel", () => { }, { passive: true });

    btnViagem.addEventListener("click", () => { if (estado.emViagem) { pararViagem(); atualizarTudo(true); } else iniciarViagem(); });
    $("#btn-reiniciar").addEventListener("click", () => { estado.percorridoKm = 0; estado.paradaAlvo = null; pararViagem(); atualizarTudo(true); });

    $$(".chip", app).forEach((c) => c.addEventListener("click", () => {
      $$(".chip", app).forEach((x) => { x.classList.remove("ativa"); x.setAttribute("aria-pressed", "false"); });
      c.classList.add("ativa");
      c.setAttribute("aria-pressed", "true");
      estado.ordem = c.dataset.ordem;
      atualizarTudo(true);
    }));
    filtroEletrico.addEventListener("change", () => atualizarTudo(true));
    $("#filtro-alerta").addEventListener("change", (ev) => {
      dados.config.evitarAlerta = ev.target.checked;
      salvar(); atualizarTudo(true);
    });

    // Roteiro ao lado do celular
    $$(".roteiro li").forEach((li) => li.addEventListener("click", () => {
      $$(".roteiro li").forEach((x) => x.classList.toggle("ativo", x === li));
      const acao = li.dataset.acao;
      if (acao === "inicio") { mostrarVista("inicio"); folha.classList.remove("expandida"); }
      else if (acao === "posto") { mostrarVista("inicio"); const a = analisar(); const d = a.maisBarato || a.lista[0]; if (d) abrirPainel(painelPosto(d.posto.id)); }
      else if (acao === "carro") { mostrarVista("conta"); abrirPainel(painelCarro()); }
      else if (acao === "config") { mostrarVista("conta"); abrirPainel(painelConfig()); }
      else mostrarVista(acao);
    }));

    // Apresentação
    $("#slide-anterior").addEventListener("click", () => irParaSlide(slideAtual() - 1));
    $("#slide-proximo").addEventListener("click", () => irParaSlide(slideAtual() + 1));
    $("#tela-cheia").addEventListener("click", alternarTelaCheia);
    $("#btn-ampliar").addEventListener("click", () => ampliar(true));
    $("#fechar-ampliado").addEventListener("click", () => ampliar(false));
    $("#fundo-ampliado").addEventListener("click", (ev) => { if (ev.target.id === "fundo-ampliado") ampliar(false); });
    window.addEventListener("scroll", atualizarApresentacao, { passive: true });
    window.addEventListener("resize", () => { atualizarApresentacao(); if (document.body.classList.contains("ampliado")) ajustarEscala(); });
    document.addEventListener("keydown", (ev) => {
      if (tecladoDialogo(ev)) return;
      if (ev.key === "Escape" && document.body.classList.contains("ampliado")) { ampliar(false); return; }
      if (ev.target.closest("input, select, textarea, #app") || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (document.body.classList.contains("ampliado")) return;
      if (["ArrowRight", "PageDown"].includes(ev.key)) { ev.preventDefault(); irParaSlide(slideAtual() + 1); }
      else if (["ArrowLeft", "PageUp"].includes(ev.key)) { ev.preventDefault(); irParaSlide(slideAtual() - 1); }
      else if (ev.key === "Home") { ev.preventDefault(); irParaSlide(0); }
      else if (ev.key === "End") { ev.preventDefault(); irParaSlide(slides.length - 1); }
      else if (ev.key.toLowerCase() === "f") alternarTelaCheia();
    });

    // Menu para celulares
    const botaoMenu = $(".menu-botao");
    const menu = $("#menu");
    botaoMenu.addEventListener("click", () => botaoMenu.setAttribute("aria-expanded", String(menu.classList.toggle("aberto"))));
    linksMenu.forEach((a) => a.addEventListener("click", () => { menu.classList.remove("aberto"); botaoMenu.setAttribute("aria-expanded", "false"); }));
  }

  // =========================================================
  // Inicialização
  // =========================================================
  function atualizarHora() {
    $(".app__hora").textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  $$(".ano-atual").forEach((s) => (s.textContent = new Date().getFullYear()));
  filtroEletrico.checked = dados.carro.tipo === "eletrico";
  // Ícones são decorativos: o texto ou o aria-label do botão já descreve a ação
  $$("svg.ic").forEach((s) => { s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); });
  montarMapa();
  ligarEventos();
  calcularRota();
  iniciarTraducao();
  aplicarConfig();
  atualizarApresentacao();
  atualizarHora();
  setInterval(atualizarHora, 30000);
})();
