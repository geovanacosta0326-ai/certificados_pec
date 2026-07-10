# -*- coding: utf-8 -*-
"""
Converte a planilha de PARTICIPANTES (formato: Nº, Nome do Trabalho, Segmento,
Autor 1, Autor 2, Autor 3) para dados/participantes.json.

Como usar:
    1. Instale as dependências:  pip install pandas openpyxl
    2. Coloque a planilha em:    scripts/trabalhos_agronegocio.xlsx
    3. Rode:                     python scripts/converter_participantes.py
"""

import json
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).parent
PLANILHA = PASTA_SCRIPT / "trabalhos_agronegocio.xlsx"
SAIDA = PASTA_SCRIPT.parent / "dados" / "participantes.json"


def montar_lista_autores(linha):
    autores = []
    for col in ["Autor 1", "Autor 2", "Autor 3"]:
        valor = linha.get(col, "")
        if isinstance(valor, str) and valor.strip():
            autores.append(valor.strip())
    return autores


def main():
    if not PLANILHA.exists():
        print(f"Planilha não encontrada em: {PLANILHA}")
        print("Coloque o arquivo 'trabalhos_agronegocio.xlsx' nesta pasta e rode novamente.")
        return

    df = pd.read_excel(PLANILHA)
    df.columns = [c.strip() for c in df.columns]

    registros = []
    for _, linha in df.iterrows():
        nomes = montar_lista_autores(linha)
        if not nomes:
            continue
        registros.append(
            {
                "numero": int(linha["Nº"]),
                "nomes": nomes,
                "titulo": str(linha["Nome do Trabalho"]).strip(),
                "segmento": str(linha["Segmento"]).strip(),
            }
        )

    registros.sort(key=lambda r: r["numero"])

    SAIDA.parent.mkdir(exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)

    print(f"Participantes: {len(registros)} registro(s) -> {SAIDA}")


if __name__ == "__main__":
    main()
