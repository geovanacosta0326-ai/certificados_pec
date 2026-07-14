# -*- coding: utf-8 -*-
"""
Converte uma planilha de AVALIADORES (aba única ou Planilha1) para
dados/avaliadores.json.

Como usar:
    1. Instale as dependências:  pip install pandas openpyxl
    2. Coloque a planilha em:    scripts/Avaliadores.xlsx (ou avaliadores.xlsx)
    3. Rode:                     python scripts/converter_avaliadores.py

O script tenta localizar alguns nomes comuns de arquivo; se não encontrar,
coloque o arquivo na pasta `scripts/` com um dos nomes sugeridos.
"""

import json
import re
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).parent
CANDIDATAS = [
    PASTA_SCRIPT / "Avaliadores.xlsx",
    PASTA_SCRIPT / "avaliadores.xlsx",
    PASTA_SCRIPT / "Planilha1.xlsx",
    PASTA_SCRIPT / "planilha_certificados.xlsx",
]
SAIDA = PASTA_SCRIPT.parent / "dados" / "avaliadores.json"

# possíveis nomes de coluna (lowercase)
COLUNAS_NUMERO = ["nº", "no", "numero", "número", "n"]
COLUNAS_NOMES = ["nome", "nomes", "avaliador", "avaliadores", "nome completo"]
COLUNAS_CPF = ["cpf", "cph", "c.p.f."]
COLUNAS_GENERO = ["genero", "gênero", "sexo", "sexo/genero", "sexo/gênero"]


def remover_acentos(texto):
    import unicodedata
    if not isinstance(texto, str):
        return ""
    return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')


def inferir_genero_por_nome(nome_completo):
    """Heurística simples para inferir gênero a partir do primeiro nome.
    Usa listas curtas de nomes comuns e regras finais (terminação em 'a' ou 'o').
    Retorna 'F', 'M' ou '' quando desconhecido."""
    if not nome_completo or not isinstance(nome_completo, str):
        return ""
    primeiro = nome_completo.split()[0]
    p = remover_acentos(primeiro).strip().lower()
    if not p:
        return ""

    femininos = {
        'ana','maria','mariana','juliana','camila','gabriela','isabela','rafaela','daniela',
        'fernanda','patricia','bianca','luiza','eduarda','laura','raquel','marcia','raissa',
        'silvia','sílvia','sandra','claudia','claudia'
    }
    masculinos = {
        'joao','joão','carlos','paulo','marcos','lucas','ricardo','bruno','felipe','gabriel',
        'diego','eduardo','antonio','antônio','rafael','matheus','matheus','leonardo','paulo'
    }

    if p in femininos:
        return 'F'
    if p in masculinos:
        return 'M'

    # regras simples por terminação
    if p.endswith('a'):
        return 'F'
    if p.endswith('o'):
        return 'M'

    return ''

SEPARADORES = re.compile(r"\s*(?:,|;|/|\se\s)\s*", flags=re.IGNORECASE)


def achar_coluna(colunas, candidatos):
    colunas_lower = {c.lower().strip(): c for c in colunas}
    for candidato in candidatos:
        if candidato in colunas_lower:
            return colunas_lower[candidato]
    return None


def dividir_nomes(texto):
    if not isinstance(texto, str) or not texto.strip():
        return []
    partes = SEPARADORES.split(texto.strip())
    return [p.strip() for p in partes if p.strip()]


def limpar_cpf(texto):
    if not isinstance(texto, str):
        return ""
    t = texto.strip()
    if not t or t.lower() == "nan":
        return ""
    return t


def main():
    planilha = None
    for p in CANDIDATAS:
        if p.exists():
            planilha = p
            break

    if planilha is None:
        print("Nenhuma planilha encontrada. Coloque 'Avaliadores.xlsx' em scripts/ e rode novamente.")
        return

    # tenta ler a primeira aba (Planilha1) ou a aba padrão
    try:
        df = pd.read_excel(planilha, sheet_name=0)
    except Exception as e:
        print(f"Erro ao ler a planilha {planilha}: {e}")
        return

    df.columns = [c.strip() for c in df.columns]

    col_numero = achar_coluna(df.columns, COLUNAS_NUMERO)
    col_nomes = achar_coluna(df.columns, COLUNAS_NOMES)
    col_cpf = achar_coluna(df.columns, COLUNAS_CPF)
    col_genero = achar_coluna(df.columns, COLUNAS_GENERO)

    if col_nomes is None:
        print(f"Coluna de nomes não encontrada. Colunas disponíveis: {list(df.columns)}")
        return

    registros = []
    for idx, linha in df.iterrows():
        nomes = dividir_nomes(linha.get(col_nomes, ""))
        if not nomes:
            continue

        numero = int(linha[col_numero]) if col_numero and pd.notna(linha.get(col_numero)) else idx + 1
        cpf = limpar_cpf(linha.get(col_cpf, "")) if col_cpf else ""

        # normaliza gênero quando disponível (F/M)
        genero_val = ""
        if col_genero and pd.notna(linha.get(col_genero)):
            g = str(linha.get(col_genero)).strip().lower()
            if g.startswith("f"):
                genero_val = "F"
            elif g.startswith("m"):
                genero_val = "M"
            else:
                genero_val = g
        else:
            # tenta inferir pelo primeiro nome
            primeiro_nome = nomes[0] if nomes else ""
            genero_val = inferir_genero_por_nome(primeiro_nome)

        registros.append({"numero": numero, "nomes": nomes, "cpf": cpf, "genero": genero_val})

    registros.sort(key=lambda r: r["numero"])

    SAIDA.parent.mkdir(exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)

    print(f"Avaliadores: {len(registros)} registro(s) -> {SAIDA}")


if __name__ == "__main__":
    main()
