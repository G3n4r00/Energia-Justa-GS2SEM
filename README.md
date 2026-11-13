# EnergiaJusta

App mobile de planejamento de consumo energético doméstico por orçamento, com restrição de
aparelhos essenciais e comparação de cenários de economia.

FIAP Global Solution 2026/2, turma 4ESOA — tema CitizenTech.

## Integrantes

| Nome | RM |
|---|---|
| Gabriel Genaro Dalaqua | 551986 |
| Henrique Gagliardi Veneroso | 552196 |
| Ronaldo Felipe da Silva Amorim | 96101 |
| Paulo Henrique Figueiredo | 98205 |
| Gabriel Felipe Montoni dos Santos | 552271 |

## Requisitos

- Docker e Docker Compose v2+
- Node.js 20+
- Android Studio com AVD (emulador Android) **ou** Expo Go instalado no celular

## Configuração inicial

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd Energia-Justa-GS2SEM

# Criar o .env do backend a partir do exemplo
cp backend/.env.example backend/.env
# Edite backend/.env e preencha GEMINI_API_KEY com sua chave do Google AI Studio
```

## Subir o backend e o dashboard

```bash
docker compose up --build
```

| Serviço | URL |
|---|---|
| Backend API | http://localhost:8000 |
| Documentação interativa | http://localhost:8000/docs |
| Dashboard analítico | http://localhost:5173 |

Confirme que o backend está no ar: `curl http://localhost:8000/health`

## Rodar o app mobile

```bash
cd apps/mobile
npm install
npx expo start --android
```

Com Expo Go no celular: execute `npx expo start` e escaneie o QR code.

> O app usa `http://10.0.2.2:8000` para alcançar o backend no emulador Android.
> Para dispositivo físico na mesma rede: `EXPO_PUBLIC_API_URL=http://<IP-da-maquina>:8000 npx expo start`

## Rodar os testes do backend

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

## Estrutura do projeto

```
apps/
  mobile/        App React Native (Expo) — 4 telas
  dashboard/     Dashboard analítico React + Vite + Recharts
backend/
  app/           Código FastAPI
  scripts/       ETL de tarifas ANEEL (CKAN API)
  tests/         32 testes pytest
docker-compose.yml
```
