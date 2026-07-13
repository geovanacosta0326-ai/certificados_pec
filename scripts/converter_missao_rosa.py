# -*- coding: utf-8 -*-
"""
Converte a planilha de MENÇÃO HONROSA (formato: Nº, Nome do Trabalho, Segmento,
Autor 1, Colocação — com todos os autores juntos na mesma célula, separados
por vírgula, e a Colocação no formato "1º", "2º" ou "3º")
para dados/missao-rosa.json.

Como usar:
    1. Instale as dependências:  pip install pandas openpyxl
    2. Coloque a planilha em:    scripts/trabalhos_mencao_honrosa.xlsx
    3. Rode:                     python scripts/converter_missao_rosa.py
"""

import json
import re
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).parent
PLANILHA = PASTA_SCRIPT / "trabalhos_mencao_honrosa.xlsx"
SAIDA = PASTA_SCRIPT.parent / "dados" / "missao-rosa.json"

# separa por vírgula, ponto e vírgula, "/" ou " e "
SEPARADORES = re.compile(r"\s*(?:,|;|/|\se\s)\s*", flags=re.IGNORECASE)


def dividir_autores(texto):
    if not isinstance(texto, str) or not texto.strip():
        return []
    partes = SEPARADORES.split(texto.strip())
    return [p.strip() for p in partes if p.strip()]


def main():
    if not PLANILHA.exists():
        print(f"Planilha não encontrada em: {PLANILHA}")
        print("Coloque o arquivo 'trabalhos_mencao_honrosa.xlsx' nesta pasta e rode novamente.")
        return

    df = pd.read_excel(PLANILHA)
    df.columns = [c.strip() for c in df.columns]

    registros = []
    for _, linha in df.iterrows():
        nomes = dividir_autores(linha.get("Autor 1", ""))
        if not nomes:
            continue
        colocacao = linha.get("Colocação", "")
        registros.append(
            {
                "numero": int(linha["Nº"]),
                "nomes": nomes,
                "titulo": str(linha["Nome do Trabalho"]).strip(),
                "segmento": str(linha["Segmento"]).strip(),
                "colocacao": str(colocacao).strip() if pd.notna(colocacao) else "",
            }
        )

    registros.sort(key=lambda r: r["numero"])

    SAIDA.parent.mkdir(exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)

    print(f"Menção Honrosa: {len(registros)} registro(s) -> {SAIDA}")


if __name__ == "__main__":
    main()
