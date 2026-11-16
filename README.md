# EnergiaJusta

App mobile de planejamento de consumo energético doméstico por orçamento. Você define quanto quer gastar por mês em energia, cadastra os aparelhos da casa e o sistema calcula quais hábitos mudar para caber no orçamento, sem cortar o que você marcou como essencial.

FIAP Global Solution 2026/2, turma 4ESOA, tema CitizenTech.

## Integrantes

| Nome | RM |
|---|---|
| Gabriel Genaro Dalaqua | 551986 |
| Henrique Gagliardi Veneroso | 552196 |
| Ronaldo Felipe da Silva Amorim | 96101 |
| Paulo Henrique Figueiredo | 98205 |
| Gabriel Felipe Montoni dos Santos | 552271 |

---

## O que está implementado

### App mobile (4 telas)

**Home:** resumo do consumo atual, custo estimado do ciclo, diferença em relação à meta e tarifa ANEEL ativa.

**Aparelhos:** cadastro de aparelhos via catálogo de 61 modelos com potência pré-preenchida (dados PROCEL/Eletrobras) ou entrada manual. Cada aparelho tem horas de uso por dia e um flag "essencial" que protege o aparelho do recomendador.

**Simulador:** duas abas.
- *Hábitos:* seleciona um aparelho, ajusta as horas de uso com controle de ±30 min e vê na hora o impacto no custo mensal, sem chamar o backend.
- *Sensores IoT:* envia tensão (V), corrente (A) e fator de potência; o backend calcula a potência ativa (P = V × I × FP) e persiste a leitura com `simulated=true`.

**Plano:** define uma meta em R$, gera o plano de corte de horas e exibe:
- Resumo: consumo atual, projetado e economia estimada.
- Comparação de metas: três colunas lado a lado (meta mais agressiva, sua meta, meta mais folgada), mostrando para cada uma se é atingível, quanto falta e quantas sugestões de corte existem.
- Sugestões: lista de aparelhos com horários atuais vs. sugeridos e economia individual.
- Explicação com IA: Gemini 2.0 Flash explica o plano em linguagem simples, com orientações práticas de hábito.

### Backend (FastAPI)

- Motor de cálculo determinístico: kWh, custo e cenários comparativos.
- Recomendador: ordena cortes por economia, respeita aparelhos essenciais e informa inviabilidade quando a meta não é alcançável.
- ETL ANEEL idempotente: ingere tarifa real (Enel SP B1 convencional) com SHA-256, log de execução e fallback demonstrativo rotulado.
- Adaptador Gemini com fallback: sem chave, retorna texto determinístico; com chave, chama a API real.
- Catálogo de 61 aparelhos residenciais com valores PROCEL.
- 32 testes pytest (unitários, de regra, de API e de persistência).

### Dashboard analítico (React + Vite)

- KPIs: consumo total estimado, custo estimado e economia potencial do último plano.
- Gráfico de consumo por aparelho (barras) e série de leituras de potência dos sensores (linha).
- Filtros de período e categoria.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|---|---|---|
| Docker + Docker Compose v2 | qualquer atual | Para o backend e o dashboard |
| Node.js | 20 | Para o app mobile |
| Android Studio (AVD) ou Expo Go no celular | qualquer | Para rodar o app |
| Python 3.12 | apenas se for rodar os testes localmente | |

**Usuário Podman (laptop corporativo sem Docker):** use `python -m podman_compose` no lugar de `docker compose` em todos os comandos. O `docker-compose.yml` não muda.

---

## Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/G3n4r00/Energia-Justa-GS2SEM.git
cd Energia-Justa-GS2SEM
```

### 2. Criar o `.env` do backend

```bash
cp backend/.env.example backend/.env
```

Abra `backend/.env` e preencha:

```env
GEMINI_API_KEY=sua_chave_aqui
```

A chave é obtida gratuitamente no [Google AI Studio](https://aistudio.google.com/app/apikey). Se deixar em branco, tudo funciona normalmente, exceto o botão "Explicar plano com IA", que retorna uma resposta de fallback sem chamar a API.

### 3. Subir o backend e o dashboard

```bash
docker compose up --build
```

Aguarde `Application startup complete` nos logs. Serviços:

| Serviço | URL |
|---|---|
| API REST | http://localhost:8000 |
| Swagger (documentação interativa) | http://localhost:8000/docs |
| Dashboard analítico | http://localhost:5173 |

Verificação rápida:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Se o container já estiver rodando com imagem desatualizada, force a recriação:

```bash
docker compose down && docker compose up --build
```

### 4. Rodar o app mobile

**Emulador Android:**

```bash
cd apps/mobile
npm install
npx expo start --android
```

**Celular físico com Expo Go (mesma rede Wi-Fi da máquina):**

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://<IP-da-sua-maquina>:8000 npx expo start
```

Escaneie o QR code com o Expo Go. Para descobrir o IP da máquina: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac), interface Wi-Fi.

---

## Roteiro de demonstração

O roteiro abaixo cobre todos os fluxos avaliáveis:

### Fluxo principal (orçamento + plano)

1. Na tela **Home**, toque no ícone de engrenagem. Defina orçamento de R$ 150 e ciclo de 30 dias.

2. Vá para **Aparelhos**, toque em "+". Escolha "Ar-condicionado 12000 BTU" no catálogo; potência já vem preenchida com 1200 W. Defina 8 h/dia. Repita com "Geladeira Frost Free 260–300L" (24 h/dia) e marque como essencial.

3. Vá para **Plano**. Confirme a meta de R$ 150 e toque em "Gerar plano". O app exibe:
   - O status (atingível ou não atingível).
   - A seção "Comparação de metas" com três colunas: uma meta mais agressiva (~R$ 95), sua meta (R$ 150) e uma meta mais folgada (~R$ 225).
   - As sugestões de corte por aparelho.

4. Toque em "Explicar plano com IA" para ver a orientação gerada pelo Gemini. Requer `GEMINI_API_KEY` no `.env`.

### Simulador de hábito

5. Vá para **Simulador**, aba "Hábitos". Selecione "Ar-condicionado 12000 BTU". Use os botões +/- para ajustar as horas e veja o impacto no custo em tempo real, sem gerar um plano completo.

### Sensores IoT simulados

6. Na aba "Sensores IoT" do Simulador, informe tensão 220 V, corrente 5,5 A e fator de potência 0,92. Toque em "Registrar". O backend calcula 1117,6 W e persiste a leitura.

### Dashboard

7. Acesse http://localhost:5173. Os KPIs e gráficos refletem os dados persistidos pela API. Use os filtros de período e categoria para ver como os indicadores mudam.

---

## ETL de tarifas ANEEL

O ETL busca a tarifa da Enel SP (B1 residencial convencional) diretamente via API CKAN dos dados abertos ANEEL. Ele roda automaticamente na inicialização do container. Para rodar manualmente:

```bash
docker compose exec api python -m scripts.ingest_tariffs
```

Para checar o log da última execução:

```bash
curl http://localhost:8000/tariffs/active
```

O ETL é idempotente: rodar duas vezes não duplica tarifas. Se a API ANEEL estiver offline, o seed carrega automaticamente uma tarifa demonstrativa rotulada (`is_demo=true`).

---

## Testes

Para rodar os 32 testes do backend localmente:

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Cobertura dos testes:

| ID | Caso |
|---|---|
| T01 | 100 W × 4 h/dia × 30 dias = 12 kWh/ciclo |
| T02 | 127 V × 2 A × 0,9 FP = 228,6 W |
| T04 | Redução de 4 h para 3 h reduz custo corretamente |
| T05 | Aparelho essencial/protegido não aparece nas sugestões |
| T06 | Meta alcançável retorna `status=reached` |
| T07 | Meta inalcançável retorna `status=not_reached` com mensagem |
| T08 | Entradas inválidas (25 h/dia, FP=0, tensão negativa) retornam 422 |
| T09 | Leitura de sensor persiste e é recuperável |
| T10 | ETL ANEEL normaliza tarifa com metadados |
| T11 | Segunda execução do ETL não duplica registros |

---

## Estrutura do projeto

```
apps/
  mobile/              App React Native + Expo (4 telas)
    src/
      screens/         HomeScreen, AppliancesScreen, SimuladorScreen, PlanoScreen
      services/api.ts  Cliente HTTP (axios) para a API
      ui/tokens.ts     Design tokens (cores, tipografia, espaçamentos)
  dashboard/           Dashboard React + Vite + Recharts
    src/
      components/      KpiCard, ApplianceChart, SeriesChart
backend/
  app/
    routers/           Endpoints: appliances, plans, sensors, tariffs, analytics, config
    models.py          SQLAlchemy (Appliance, Plan, SensorReading, Tariff, HouseholdConfig)
    recommender.py     Motor determinístico de recomendação
    catalog.py         61 aparelhos com potência PROCEL
    seed.py            Seed de demonstração reproduzível
    prompts/           Prompt versionado para o Gemini
  scripts/
    ingest_tariffs.py  ETL ANEEL (CKAN API, SHA-256, log de execução)
  tests/               32 testes pytest
docker-compose.yml
backend/.env.example   Variáveis de ambiente sem segredos
```

---

## Troubleshooting

**App mobile não conecta à API:**
- Emulador Android: use `http://10.0.2.2:8000` como `EXPO_PUBLIC_API_URL`.
- Celular físico: verifique que está na mesma rede Wi-Fi e que o firewall da máquina permite conexões na porta 8000.
- Confirme que o container está rodando: `docker compose ps`.

**Container não reflete mudanças de código:**
- `docker compose up --build` só reconstrói a imagem; se o container já existe, ele não é recriado.
- Solução: `docker compose down && docker compose up --build`.

**Banco corrompido ou em estado inconsistente:**
- Delete o volume: `docker compose down -v && docker compose up --build`.
- O seed recria os dados de demonstração automaticamente.

**`GEMINI_API_KEY` inválida:**
- O app continua funcionando. O botão "Explicar plano com IA" retorna uma resposta de fallback e registra o erro no log do container.

**Porta 8000 ou 5173 já em uso:**
- Altere `ports` no `docker-compose.yml` para portas livres e ajuste `EXPO_PUBLIC_API_URL` correspondentemente.
