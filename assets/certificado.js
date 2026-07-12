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
const ZONA_TEXTO = { topo: 0.30, base: 0.75, esquerda: 0.09, direita: 0.72 };

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataPorExtensoHoje() {
  const hoje = new Date();
  return `${CIDADE_ASSINATURA}, ${hoje.getDate()} de ${MESES_PT[hoje.getMonth()]} de ${hoje.getFullYear()}.`;
}

const CORES_TRILHA = {
  "participantes": { principal: [21, 87, 44], dourado: [201, 154, 62] },
  "avaliadores":   { principal: [27, 58, 75],  dourado: [201, 154, 62] },
  "missao-rosa":   { principal: [140, 47, 75], dourado: [201, 154, 62] },
};

function juntarNomesPtBr(nomes) {
  if (!nomes || !nomes.length) return "";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes.slice(0, -1).join("; ")} e ${nomes[nomes.length - 1]}`;
}

// Retorna uma lista de objetos com texto e se é negrito
function montarPartesTexto(trilha, registro) {
  const nomes = juntarNomesPtBr(registro.nomes);
  const tituloTrabalho = registro.titulo ? `“${registro.titulo}”` : "";
  const segmento = registro.segmento ? ` no segmento ${registro.segmento}` : "";
  const detalhe = registro.detalhe ? ` na área de ${registro.detalhe}` : "";

  if (trilha === "avaliadores") {
    return [
      { t: `Certificamos que `, b: false },
      { t: nomes, b: true },
      { t: ` atuou(aram) como avaliador(a) dos trabalhos científicos${detalhe} apresentados no ${NOME_EVENTO}, realizado ${DATA_EVENTO}, no ${LOCAL_EVENTO}.`, b: false }
    ];
  } else if (trilha === "missao-rosa") {
    return [
      { t: `Certificamos que o trabalho científico intitulado `, b: false },
      { t: tituloTrabalho, b: true },
      { t: `, de autoria de `, b: false },
      { t: nomes, b: true },
      { t: `, recebeu Menção Honrosa na VII Mostra de Trabalhos Científicos${segmento}, durante o ${NOME_EVENTO}, realizado ${DATA_EVENTO}, no ${LOCAL_EVENTO}.`, b: false }
    ];
  } else {
    return [
      { t: `Certificamos que o trabalho científico intitulado `, b: false },
      { t: tituloTrabalho, b: true },
      { t: `, de autoria de `, b: false },
      { t: nomes, b: true },
      { t: `, foi apresentado na VII Mostra de Trabalhos Científicos${segmento}, durante o ${NOME_EVENTO}, realizado ${DATA_EVENTO}, no ${LOCAL_EVENTO}.`, b: false }
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
  let y = (altura * ZONA_TEXTO.topo) + ((altura * (ZONA_TEXTO.base - ZONA_TEXTO.topo)) - totalHeight) / 2;

  linhas.forEach(l => {
    let x = centroX - (l.w / 2);
    l.p.forEach(segmento => {
      doc.setFont("times", segmento.b ? "bold" : "normal");
      doc.text(segmento.t, x, y);
      x += doc.getTextWidth(segmento.t);
    });
    y += lineHeight;
  });

  // Data
  doc.setFont("times", "italic");
  doc.setFontSize(tamanhoFonte - 1);
  doc.text(dataRodape, centroX, y + 1.0, { align: "center" });

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
  
  let y = (canvas.height * ZONA_TEXTO.topo) + ((canvas.height * (ZONA_TEXTO.base - ZONA_TEXTO.topo)) - totalHeight) / 2;

  ctx.fillStyle = `rgb(${cor.principal.join(",")})`;
  ctx.textBaseline = "top";

  linhas.forEach(l => {
    let x = centroX - (l.width / 2);
    l.words.forEach(w => {
      ctx.font = `${w.b ? 'bold' : 'normal'} ${tamanhoFonte}px ${fontName}`;
      ctx.fillText(w.t, x, y);
      x += ctx.measureText(w.t).width;
    });
    y += lineHeight;
  });

  // Rodapé
  ctx.font = `italic ${tamanhoFonte - 6}px ${fontName}`;
  ctx.textAlign = "center";
  ctx.fillText(dataRodape, centroX, y + 80);

  const link = document.createElement("a");
  link.download = `certificado_${registro.numero}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}