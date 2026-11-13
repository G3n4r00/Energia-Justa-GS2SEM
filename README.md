# EnergiaJusta

App mobile de planejamento de consumo energético doméstico por orçamento. Você define quanto quer gastar por mês em energia, cadastra os aparelhos da casa e o sistema calcula o que pode ser reduzido para caber no orçamento, sem cortar o que você marcou como essencial.

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

## O que já está implementado

- **App mobile (4 telas):** Home com resumo de consumo, Aparelhos, Plano de economia, Simulador de leitura
- **Catálogo de aparelhos:** 35 aparelhos residenciais com potência pré-preenchida (PROCEL/Eletrobras); não precisa saber os watts de cada aparelho
- **Recomendador determinístico:** calcula o plano de corte de horas de uso para caber no orçamento, respeitando aparelhos marcados como essenciais
- **Explicação com IA (Gemini):** gera uma explicação em linguagem simples do plano calculado
- **Dashboard analítico:** gráfico de consumo histórico por período, resumo de custo e economia potencial
- **Tarifa ANEEL:** busca tarifa real via API do CKAN (dados abertos ANEEL); cai em demo se offline
- **API REST:** FastAPI com 32 testes automatizados

---

## Pré-requisitos

- Docker e Docker Compose v2 (para o backend e o dashboard)
- Node.js 20 ou superior
- Android Studio com um AVD configurado **ou** Expo Go instalado no celular físico

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

Abra `backend/.env` e preencha a chave do Gemini:

```
GEMINI_API_KEY=sua_chave_aqui
```

A chave é obtida gratuitamente no [Google AI Studio](https://aistudio.google.com/app/apikey). Se deixar em branco, o app funciona normalmente, mas o botão "Explicar plano com IA" retorna uma resposta padrão sem chamar a API.

### 3. Subir o backend e o dashboard

```bash
docker compose up --build
```

Aguarde até ver `Application startup complete` nos logs. Serviços disponíveis:

| Serviço | URL |
|---|---|
| API | http://localhost:8000 |
| Documentação interativa (Swagger) | http://localhost:8000/docs |
| Dashboard analítico | http://localhost:5173 |

Verificação rápida: `curl http://localhost:8000/health` deve retornar `{"status":"ok"}`.

### 4. Rodar o app mobile

```bash
cd apps/mobile
npm install
npx expo start --android
```

Com Expo Go no celular físico (mesma rede Wi-Fi que a máquina):

```bash
EXPO_PUBLIC_API_URL=http://<IP-da-sua-maquina>:8000 npx expo start
```

Escaneie o QR code com o Expo Go.

---

## O que testar

O roteiro abaixo cobre o fluxo principal do app:

1. **Configurar o orçamento:** na tela Home, toque no ícone de engrenagem. Defina um orçamento mensal (ex: R$ 150) e o ciclo de dias (ex: 30).

2. **Cadastrar aparelhos via catálogo:** vá para a aba Aparelhos, toque no botão "+". Escolha um aparelho do catálogo (ex: "Ar-condicionado 9000 BTU"). Nome e potência vêm pré-preenchidos. Ajuste as horas de uso por dia se quiser. Marque como "essencial" os aparelhos que não podem ter o uso reduzido.

3. **Cadastrar aparelho manual:** no mesmo fluxo, toque em "Cadastrar manualmente" para informar nome e watts sem usar o catálogo.

4. **Gerar o plano:** vá para a aba Plano, toque em "Calcular plano de economia". O sistema mostra aparelho a aparelho quanto reduzir para caber no orçamento.

5. **Explicar com IA:** com o plano gerado, toque em "Explicar plano com IA". Requer `GEMINI_API_KEY` preenchida no `.env`.

6. **Ver o dashboard:** acesse http://localhost:5173 no navegador para ver o gráfico de consumo histórico e o resumo analítico.

7. **Simular leitura de sensor:** na aba Simulador, envie uma leitura de corrente e tensão. Os dados alimentam o gráfico do dashboard.

---

## Rodando os testes do backend

Se quiser executar os testes localmente (sem Docker):

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

32 testes, todos passando.

---

## Estrutura do projeto

```
apps/
  mobile/        App React Native + Expo (4 telas)
  dashboard/     Dashboard analítico React + Vite + Recharts
backend/
  app/           API FastAPI + SQLAlchemy + SQLite
  scripts/       ETL de tarifas ANEEL (CKAN API)
  tests/         32 testes pytest
docker-compose.yml
```

---

## Feedback

Abra uma issue no repositório descrevendo o que testou, o que não funcionou e qualquer sugestão. Quanto mais detalhado o relato (sistema operacional, passo onde travou, mensagem de erro), mais fácil corrigir antes da entrega.
