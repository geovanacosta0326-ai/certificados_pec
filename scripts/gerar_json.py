# -*- coding: utf-8 -*-
"""
Converte a planilha Excel (com abas Participantes, Avaliadores e Missao Rosa)
para os arquivos JSON usados pelo site estático.

Como usar:
    1. Instale as dependências:  pip install pandas openpyxl
    2. Coloque sua planilha em:  scripts/planilha_certificados.xlsx
    3. Rode:                     python scripts/gerar_json.py
    4. Os arquivos .json serão gerados/atualizados em ../dados/

Formato esperado de cada aba (nomes de coluna flexíveis, veja COLUNAS abaixo):
    Nº | Nomes                                  | Detalhe (opcional)
    1  | João Pedro Alves, Maria Souza           | Título do trabalho / área / observação
    2  | Ana Paula Lima e Carlos Eduardo Nunes    |

Uma célula "Nomes" pode ter mais de uma pessoa junto — separe por vírgula,
" e ", ";" ou "/". O script quebra tudo automaticamente em uma lista.
"""

import json
import re
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).parent
PLANILHA = PASTA_SCRIPT / "planilha_certificados.xlsx"
PASTA_DADOS = PASTA_SCRIPT.parent / "dados"

# aba na planilha -> arquivo json de saída
ABAS = {
    "Participantes": "participantes.json",
    "Avaliadores": "avaliadores.json",
    "Missao Rosa": "missao_rosa.json",
}

# nomes de coluna aceitos (case-insensitive), na ordem de prioridade
COLUNAS_NUMERO = ["nº", "no", "numero", "número", "n"]
COLUNAS_NOMES = ["nomes", "nome", "participante", "participantes"]
COLUNAS_DETALHE = ["detalhe", "trabalho", "titulo", "título", "observação", "observacao", "área", "area"]

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


def converter_aba(df, nome_aba):
    colunas = list(df.columns)
    col_numero = achar_coluna(colunas, COLUNAS_NUMERO)
    col_nomes = achar_coluna(colunas, COLUNAS_NOMES)
    col_detalhe = achar_coluna(colunas, COLUNAS_DETALHE)

    if col_nomes is None:
        raise ValueError(
            f"Aba '{nome_aba}': não encontrei uma coluna de nomes. "
            f"Colunas disponíveis: {colunas}"
        )

    registros = []
    for indice, linha in df.iterrows():
        nomes = dividir_nomes(linha.get(col_nomes, ""))
        if not nomes:
            continue

        numero = int(linha[col_numero]) if col_numero and pd.notna(linha.get(col_numero)) else indice + 1
        detalhe = str(linha.get(col_detalhe, "")).strip() if col_detalhe else ""
        if detalhe.lower() == "nan":
            detalhe = ""

        registros.append({"numero": numero, "nomes": nomes, "detalhe": detalhe})

    return registros


def main():
    if not PLANILHA.exists():
        print(f"Planilha não encontrada em: {PLANILHA}")
        print("Coloque o arquivo 'planilha_certificados.xlsx' nesta pasta e rode novamente.")
        return

    PASTA_DADOS.mkdir(exist_ok=True)
    abas_disponiveis = pd.ExcelFile(PLANILHA).sheet_names

    for nome_aba, arquivo_saida in ABAS.items():
        if nome_aba not in abas_disponiveis:
            print(f"[aviso] Aba '{nome_aba}' não encontrada na planilha. Pulando.")
            continue

        df = pd.read_excel(PLANILHA, sheet_name=nome_aba)
        registros = converter_aba(df, nome_aba)

        caminho_saida = PASTA_DADOS / arquivo_saida
        with open(caminho_saida, "w", encoding="utf-8") as f:
            json.dump(registros, f, ensure_ascii=False, indent=2)

        print(f"{nome_aba}: {len(registros)} registro(s) -> {caminho_saida}")


if __name__ == "__main__":
    main()
