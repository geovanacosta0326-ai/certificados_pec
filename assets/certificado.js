/* ===========================================================
   Geração do certificado em PDF e PNG, direto no navegador.
   Fundo: fun01.jpeg (A4 paisagem, texto centralizado na folha)
   =========================================================== */

const NOME_EVENTO = "SEMINÁRIO BRASILEIRO DO AGRO - PECBRASIL 2026";
const DATA_EVENTO = "no período de 25 a 27 de junho de 2026";
const LOCAL_EVENTO = "Centro de Eventos do Ceará, em Fortaleza, Ceará";
const CIDADE_ASSINATURA = "Fortaleza-CE";
const ORGANIZACAO = "Comissão Organizadora do Evento";
const ARQUIVO_FUNDO = "fun01.jpeg";

// Área "segura" para o texto, em proporção da folha (0 a 1)
// Deslocada mais pra esquerda pra não ficar em cima do desenho decorativo
// do lado direito do fundo.
const ZONA_TEXTO = { topo: 0.29, base: 0.75, esquerda: 0.09, direita: 0.91 };

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataPorExtensoHoje() {
  const hoje = new Date();
  return `${CIDADE_ASSINATURA}, ${hoje.getDate()} de ${MESES_PT[hoje.getMonth()]} de ${hoje.getFullYear()}.`;
}

const CORES_TRILHA = {
  "participantes": { principal: [0, 0, 0],     dourado: [201, 154, 62] },
  "avaliadores":   { principal: [27, 58, 75],  dourado: [201, 154, 62] },
  "missao-rosa":   { principal: [0, 0, 0],     dourado: [201, 154, 62] },
};

// Trilhas cujo texto deve sair com alinhamento justificado (bordas
// esquerda e direita retas, como no modelo oficial do certificado)
const TRILHAS_JUSTIFICADAS = new Set(["missao-rosa", "participantes", "avaliadores"]);

function juntarNomesPtBr(nomes) {
  if (!nomes || !nomes.length) return "";

  // Remove duplicados (ignorando espaços extras e diferenças de maiúsculas/minúsculas),
  // mantendo a primeira ocorrência e a grafia original.
  const vistos = new Set();
  const unicos = nomes.filter(nome => {
    const chave = nome.trim().toLowerCase().replace(/\s+/g, " ");
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  if (unicos.length === 1) return unicos[0];
  if (unicos.length === 2) return `${unicos[0]} e ${unicos[1]}`;
  return `${unicos.slice(0, -1).join("; ")} e ${unicos[unicos.length - 1]}`;
}

// Retorna uma lista de objetos com texto e se é negrito
function montarPartesTexto(trilha, registro) {
  const nomes = juntarNomesPtBr(registro.nomes);
  const tituloTrabalho = registro.titulo ? registro.titulo.toUpperCase() : "";
  const segmento = registro.segmento ? registro.segmento : "";
  const detalhe = registro.detalhe ? ` na área de ${registro.detalhe}` : "";

  if (trilha === "avaliadores") {
    // determina forma correta (Avaliador / Avaliadora) com base no campo 'genero'
    const generoCampo = registro.genero ? String(registro.genero).trim().toLowerCase() : "";
    // fallback: inferir a partir do primeiro nome se genero não informado
    function inferirGeneroPorNome(nome) {
      if (!nome) return "";
      const primeiro = nome.split(" ")[0] || "";
      const p = primeiro.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      const femininos = new Set(["ana","maria","mariana","juliana","camila","gabriela","isabela","rafaela","daniela","fernanda","patricia","bianca","luiza","eduarda","laura"]);
      const masculinos = new Set(["joao","joão","carlos","paulo","marcos","lucas","ricardo","bruno","felipe","gabriel","diego","eduardo","antonio","rafael","matheus","leonardo"]);
      if (femininos.has(p)) return "f";
      if (masculinos.has(p)) return "m";
      if (p.endsWith("a")) return "f";
      if (p.endsWith("o")) return "m";
      return "";
    }
    let generoInf = generoCampo;
    if (!generoInf) generoInf = inferirGeneroPorNome(nomes);
    let papel = "Avaliador(a)";
    if (generoInf && generoInf.startsWith("f")) papel = "Avaliadora";
    else if (generoInf && generoInf.startsWith("m")) papel = "Avaliador";

    // pluraliza se houver múltiplos nomes
    let papelFinal = papel;
    if (registro.nomes && registro.nomes.length > 1) {
      if (papel.includes("(a)")) papelFinal = papel + "s"; // Avaliador(a)s
      else if (papel.endsWith("or")) papelFinal = papel + "es"; // Avaliador -> Avaliadores
      else papelFinal = papel + "s";
    }

    return [
      { t: `Certificamos que`, b: false },
      { quebra: 1.3 },
      { t: nomes, b: true },
      { quebra: 1.3 },
      { t: `participou como ${papelFinal} da VII Mostra de Trabalhos Científicos, contribuindo para a avaliação técnico-científica dos trabalhos apresentados nos segmentos Agroindústria, Apicultura/Meliponicultura, Aquicultura e Pesca, Avicultura Caipira, Avicultura Industrial, Bovinocultura de Corte, Bovinocultura de Leite, Cajucultura, Caprinocultura, Equinocultura, Floricultura, Inovação Tecnológica, Meio Ambiente, Pet e Suinocultura, durante o ${NOME_EVENTO}, realizado ${DATA_EVENTO}, no ${LOCAL_EVENTO}.`, b: false }
    ];
  } else if (trilha === "missao-rosa") {
    const colocacao = registro.colocacao ? `${registro.colocacao} lugar` : "";
    return [
      { t: `Certificamos que o trabalho científico intitulado`, b: false },
      { quebra: 1.3 },
      { t: tituloTrabalho, b: true },
      { quebra: 1.3 },
      { t: `de autoria de `, b: false },
      { t: nomes, b: true },
      { t: `, foi agraciado com Menção Honrosa, conquistando o `, b: false },
      { t: colocacao, b: true },
      { t: segmento ? ` no segmento ` : ``, b: false },
      { t: segmento, b: true },
      { t: `, durante a VII Mostra de Trabalhos Científicos, realizada no ${NOME_EVENTO}, ${DATA_EVENTO}, no ${LOCAL_EVENTO}, em reconhecimento à relevância científica, à qualidade técnica e à contribuição do estudo para o desenvolvimento do agronegócio.`, b: false }
    ];
  } else {
    return [
      { t: `Certificamos que o trabalho científico intitulado`, b: false },
      { quebra: 2 },
      { t: tituloTrabalho, b: true },
      { quebra: 2 },
      { t: `de autoria de `, b: false },
      { t: nomes, b: true },
      { t: `, foi apresentado na VII Mostra de Trabalhos Científicos`, b: false },
      { t: segmento ? ` no segmento ` : ``, b: false },
      { t: segmento, b: true },
      { t: `, durante o ${NOME_EVENTO}, realizado ${DATA_EVENTO}, no ${LOCAL_EVENTO}.`, b: false }
    ];
  }
}

function carregarImagemFundo() {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.crossOrigin = "anonymous";
    imagem.src = ARQUIVO_FUNDO;
    if (imagem.complete && imagem.naturalWidth) {
      resolve(imagem);
      return;
    }
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error(`Falha ao carregar ${ARQUIVO_FUNDO}`));
  });
}

/**
 * GERAÇÃO PDF CORRIGIDA
 * Para negrito parcial no jsPDF, usamos o método 'text' com a opção de estilo por caractere/palavra
 * ou dividimos manualmente. Aqui usaremos uma abordagem de "texto rico" simplificada.
 */
async function gerarCertificadoPDF(trilha, registro) {
  const { jsPDF } = window.jspdf;
  // Usando 'Times' como base elegante que suporta Bold nativo no jsPDF
  const doc = new jsPDF({ orientation: "landscape", unit: "cm", format: "a4" });

  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const cor = CORES_TRILHA[trilha] || CORES_TRILHA["participantes"];

  let imagemFundo = null;
  try { imagemFundo = await carregarImagemFundo(); } catch (e) {}
  if (imagemFundo) {
    try { doc.addImage(imagemFundo, "JPEG", 0, 0, largura, altura); } catch (e) {}
  }

  const zonaEsquerda = largura * ZONA_TEXTO.esquerda;
  const zonaDireita = largura * ZONA_TEXTO.direita;
  const larguraTexto = zonaDireita - zonaEsquerda;
  const centroX = (zonaEsquerda + zonaDireita) / 2;

  const partes = montarPartesTexto(trilha, registro);
  const dataRodape = dataPorExtensoHoje();

  let tamanhoFonte = 15;
  doc.setFont("times", "normal");
  doc.setFontSize(tamanhoFonte);
  doc.setTextColor(...cor.principal);

  // Lógica de quebra de linha manual para suportar negrito parcial
  const linhas = [];
  let linhaAtual = [];
  let larguraAcumulada = 0;

  partes.forEach(p => {
    if (p.quebra) {
      linhas.push({ p: linhaAtual, w: larguraAcumulada, forcada: true });
      for (let i = 1; i < p.quebra; i++) {
        linhas.push({ p: [], w: 0, forcada: true });
      }
      linhaAtual = [];
      larguraAcumulada = 0;
      return;
    }
    const palavras = p.t.split(/(?=\s)|(?<=\s)/);
    palavras.forEach(palavra => {
      doc.setFont("times", p.b ? "bold" : "normal");
      const w = doc.getTextWidth(palavra);
      if (larguraAcumulada + w > larguraTexto && linhaAtual.length > 0) {
        linhas.push({ p: linhaAtual, w: larguraAcumulada });
        linhaAtual = [{ t: palavra, b: p.b }];
        larguraAcumulada = w;
      } else {
        linhaAtual.push({ t: palavra, b: p.b });
        larguraAcumulada += w;
      }
    });
  });
  linhas.push({ p: linhaAtual, w: larguraAcumulada });

  const lineHeight = (tamanhoFonte * 1.4) / 72 * 2.54;
  const totalHeight = linhas.length * lineHeight;
  let y = altura * ZONA_TEXTO.topo;

  const justificar = TRILHAS_JUSTIFICADAS.has(trilha);
  const ultimaLinha = linhas.length - 1;

  linhas.forEach((l, idx) => {
    const numEspacos = l.p.filter(seg => /^\s+$/.test(seg.t)).length;
    const podeJustificar = justificar && idx !== ultimaLinha && numEspacos > 0 && !l.forcada;
    const extraPorEspaco = podeJustificar ? (larguraTexto - l.w) / numEspacos : 0;

    let x = podeJustificar ? zonaEsquerda : centroX - (l.w / 2);
    l.p.forEach(segmento => {
      doc.setFont("times", segmento.b ? "bold" : "normal");
      doc.text(segmento.t, x, y);
      x += doc.getTextWidth(segmento.t);
      if (podeJustificar && /^\s+$/.test(segmento.t)) x += extraPorEspaco;
    });
    y += lineHeight;
  });

  // Data
  doc.setFont("times", "italic");
  doc.setFontSize(tamanhoFonte - 1);
  doc.text(dataRodape, centroX, y + 0.3, { align: "center" });

  doc.save(`certificado_${registro.numero}.pdf`);
}

/**
 * GERAÇÃO PNG CORRIGIDA
 */
async function gerarCertificadoPNG(trilha, registro) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 2480;
  canvas.height = 1754;

  const imagemFundo = await carregarImagemFundo().catch(() => null);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (imagemFundo) ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);

  const cor = CORES_TRILHA[trilha] || CORES_TRILHA["participantes"];
  const partes = montarPartesTexto(trilha, registro);
  const dataRodape = dataPorExtensoHoje();

  const zonaEsquerdaPx = canvas.width * ZONA_TEXTO.esquerda;
  const zonaDireitaPx = canvas.width * ZONA_TEXTO.direita;
  const centroX = (zonaEsquerdaPx + zonaDireitaPx) / 2;
  const larguraMax = zonaDireitaPx - zonaEsquerdaPx;
  
  let tamanhoFonte = 48;
  const fontName = "'Georgia', serif"; // Fonte elegante disponível no navegador

  function calcularLinhas() {
    const lines = [];
    let currentLine = [];
    let currentWidth = 0;

    partes.forEach(p => {
      if (p.quebra) {
        lines.push({ words: currentLine, width: currentWidth, forcada: true });
        for (let i = 1; i < p.quebra; i++) {
          lines.push({ words: [], width: 0, forcada: true });
        }
        currentLine = [];
        currentWidth = 0;
        return;
      }
      const words = p.t.split(/(?=\s)|(?<=\s)/);
      words.forEach(w => {
        ctx.font = `${p.b ? 'bold' : 'normal'} ${tamanhoFonte}px ${fontName}`;
        const wordWidth = ctx.measureText(w).width;
        if (currentWidth + wordWidth > larguraMax && currentLine.length > 0) {
          lines.push({ words: currentLine, width: currentWidth });
          currentLine = [{ t: w, b: p.b }];
          currentWidth = wordWidth;
        } else {
          currentLine.push({ t: w, b: p.b });
          currentWidth += wordWidth;
        }
      });
    });
    lines.push({ words: currentLine, width: currentWidth });
    return lines;
  }

  const linhas = calcularLinhas();
  const lineHeight = tamanhoFonte * 1.5;
  const totalHeight = linhas.length * lineHeight;
  
  let y = canvas.height * ZONA_TEXTO.topo;

  ctx.fillStyle = `rgb(${cor.principal.join(",")})`;
  ctx.textBaseline = "top";

  const justificar = TRILHAS_JUSTIFICADAS.has(trilha);
  const ultimaLinha = linhas.length - 1;

  linhas.forEach((l, idx) => {
    const numEspacos = l.words.filter(w => /^\s+$/.test(w.t)).length;
    const podeJustificar = justificar && idx !== ultimaLinha && numEspacos > 0 && !l.forcada;
    const extraPorEspaco = podeJustificar ? (larguraMax - l.width) / numEspacos : 0;

    let x = podeJustificar ? zonaEsquerdaPx : centroX - (l.width / 2);
    l.words.forEach(w => {
      ctx.font = `${w.b ? 'bold' : 'normal'} ${tamanhoFonte}px ${fontName}`;
      ctx.fillText(w.t, x, y);
      x += ctx.measureText(w.t).width;
      if (podeJustificar && /^\s+$/.test(w.t)) x += extraPorEspaco;
    });
    y += lineHeight;
  });

  // Rodapé
  ctx.font = `italic ${tamanhoFonte - 6}px ${fontName}`;
  ctx.textAlign = "center";
  ctx.fillText(dataRodape, centroX, y + 15);

  const link = document.createElement("a");
  link.download = `certificado_${registro.numero}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}