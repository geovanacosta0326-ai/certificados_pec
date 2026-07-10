# Certificados — Congresso Brasileiro de Agronegócio

Site **100% estático** (sem servidor/backend) para emissão de certificados em três trilhas:
**Participantes**, **Avaliadores** e **Missão Rosa**. Busca por nome com correção de
pequenos erros de digitação, e o PDF do certificado é gerado direto no navegador da pessoa.

## Estrutura

```
certificado_pec/
├── index.html                  # página inicial (3 cards de trilha)
├── busca.html                  # página de busca (genérica, ?trilha=participantes|avaliadores|missao-rosa)
├── assets/
│   ├── style.css                # visual do site
│   ├── busca.js                 # busca fuzzy (mesma lógica do projeto Flask original)
│   └── certificado.js           # geração do PDF (mesmo layout do certificado original)
├── dados/
│   ├── participantes.json
│   ├── avaliadores.json
│   └── missao_rosa.json
└── scripts/
    └── gerar_json.py            # converte sua planilha Excel para os JSON acima
```

## Como atualizar os dados

Cada trilha recebe sua **própria planilha** (não é uma planilha só com 3 abas).

### Participantes
Formato: `Nº | Nome do Trabalho | Segmento | Autor 1 | Autor 2 | Autor 3` (igual ao
projeto Flask original).
1. Salve a planilha como `scripts/trabalhos_agronegocio.xlsx`
2. Rode:
   ```bash
   pip install pandas openpyxl
   python scripts/converter_participantes.py
   ```
Isso atualiza `dados/participantes.json`.

### Avaliadores e Missão Rosa
Ainda não recebemos o formato real dessas planilhas. Por enquanto, `scripts/gerar_json.py`
espera um formato genérico (`Nº | Nomes | Detalhe`, aceitando múltiplos nomes numa
célula separados por vírgula, `;`, `/` ou " e "). Quando a planilha real chegar, é só
mandar pra eu ajustar o script pro formato exato — sem precisar mexer no resto do site.

## Como testar localmente

Como o navegador bloqueia `fetch()` de arquivos abertos direto (`file://`), rode um
servidor simples só pra visualizar:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.

## Como publicar no GitHub Pages (grátis, sem cold start)

```bash
git init
git add .
git commit -m "Site de certificados"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/certificado_pec.git
git push -u origin main
```

Depois, no GitHub:

1. Entre no repositório → **Settings** → **Pages**
2. Em **Source**, selecione a branch `main` e a pasta `/ (root)`
3. Salve. Em alguns minutos o site fica no ar em:
   `https://SEU-USUARIO.github.io/certificado_pec/`

Qualquer atualização (novo `git push`) atualiza o site automaticamente, sem precisar
reconfigurar nada.

## Personalizar textos e cores dos certificados

Tudo isso está no topo do arquivo `assets/certificado.js`:
- `NOME_EVENTO`, `DATA_EVENTO`, `LOCAL_EVENTO`, `ORGANIZACAO`
- `TEXTOS_TRILHA`: o texto de cada certificado
- `CORES_TRILHA`: as cores (RGB) de cada trilha
# certificados_pec
