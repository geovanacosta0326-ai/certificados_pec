/* ===========================================================
   Busca fuzzy 100% no navegador — mesma lógica do certificados_logic.py
   (compara palavra por palavra e usa o PIOR caso entre elas)
   =========================================================== */

const LIMIAR_SIMILARIDADE = 85;

function normalizar(texto) {
  if (!texto) return "";
  return texto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Distância de Levenshtein simples
function distanciaLevenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const linha = new Array(n + 1);
  for (let j = 0; j <= n; j++) linha[j] = j;

  for (let i = 1; i <= m; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = linha[j];
      if (a[i - 1] === b[j - 1]) {
        linha[j] = anterior;
      } else {
        linha[j] = 1 + Math.min(anterior, linha[j], linha[j - 1]);
      }
      anterior = temp;
    }
  }
  return linha[n];
}

// Similaridade estilo rapidfuzz.ratio (0-100)
function razaoSimilaridade(a, b) {
  if (!a.length && !b.length) return 100;
  const dist = distanciaLevenshtein(a, b);
  const maxLen = a.length + b.length;
  return ((maxLen - dist) / maxLen) * 100;
}

function pontuacaoCorrespondencia(termoTokens, textoCandidato) {
  const candidatoTokens = normalizar(textoCandidato).split(" ").filter(Boolean);
  if (!candidatoTokens.length || !termoTokens.length) return 0;

  const pioresCasos = termoTokens.map((termoToken) => {
    let melhor = 0;
    for (const candidatoToken of candidatoTokens) {
      // Evita que palavras diferentes com terminação parecida (ex: "participação"
      // x "classificação") sejam confundidas com erro de digitação: exige que
      // comecem com a mesma letra, já que typos raramente mudam o início da palavra.
      if (termoToken[0] !== candidatoToken[0]) continue;
      const s = razaoSimilaridade(termoToken, candidatoToken);
      if (s > melhor) melhor = s;
    }
    return melhor;
  });

  return Math.min(...pioresCasos);
}

/**
 * Busca registros cujo(s) nome(s) ou detalhe batam com o termo digitado.
 * @param {Array} registros - lista de {numero, nomes: [], detalhe}
 * @param {string} termoBusca
 * @returns {Array|Object} resultados ordenados ou objeto de erro
 */
function buscarRegistros(registros, termoBusca) {
  const termoNorm = normalizar(termoBusca);
  const termoTokens = termoNorm.split(" ").filter(Boolean);
  const temDigito = /\d/.test(termoBusca);

  // Busca por CPF (quando o termo contém dígitos)
  if (temDigito) {
    const digitos = termoBusca.replace(/\D/g, "");
    if (digitos.length === 0) return [];
    if (digitos.length < 3) {
      return { erro: "cpf_curto", mensagem: "Digite pelo menos 3 dígitos do CPF para pesquisar." };
    }

    const resultados = [];
    for (const registro of registros) {
      const cpf = (registro.cpf || "").replace(/\D/g, "");
      if (!cpf) continue;
      // aceita substring ou alta similaridade
      if (cpf.includes(digitos) || razaoSimilaridade(cpf, digitos) * 1 >= 90) {
        resultados.push({ ...registro, placar: 100 });
      }
    }
    return resultados;
  }

  // Busca por nome/título/detalhe (exige pelo menos dois tokens)
  if (termoTokens.length > 0 && termoTokens.length < 2) {
    return { erro: "min_nomes", mensagem: "Digite pelo menos dois nomes para realizar a pesquisa." };
  }
  if (termoTokens.length === 0) return [];

  const resultados = [];
  for (const registro of registros) {
    const candidatos = [...(registro.nomes || [])];
    if (registro.titulo) {
      candidatos.push(registro.titulo);
    } else if (registro.detalhe) {
      candidatos.push(registro.detalhe);
    }
    let melhorPlacar = 0;
    for (const candidato of candidatos) {
      const p = pontuacaoCorrespondencia(termoTokens, candidato);
      if (p > melhorPlacar) melhorPlacar = p;
    }
    if (melhorPlacar >= LIMIAR_SIMILARIDADE) {
      resultados.push({ ...registro, placar: Math.round(melhorPlacar * 10) / 10 });
    }
  }

  resultados.sort((a, b) => b.placar - a.placar);
  return resultados;
}

function juntarNomes(nomes) {
  if (!nomes || !nomes.length) return "";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
