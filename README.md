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

## Subir o backend

```bash
# Primeira vez: criar o .env a partir do exemplo
cp backend/.env.example backend/.env

docker compose up --build
```

O backend sobe em `http://localhost:8000`.
Confirmação: `curl http://localhost:8000/health`

## Rodar o app mobile

```bash
cd apps/mobile
npm install
npx expo start --android
```

Com Expo Go no celular: execute `npx expo start` e escaneie o QR code.

> O app usa `http://10.0.2.2:8000` para o emulador Android por padrão.
> Para dispositivo físico na mesma rede, defina `EXPO_PUBLIC_API_URL=http://<IP-da-maquina>:8000`.

## Rodar os testes do backend

```bash
cd backend
pip install -r requirements.txt
pytest
```

## Estrutura

```
apps/
  mobile/        App React Native (Expo)
backend/
  app/           Código FastAPI
  tests/         Testes pytest
docker-compose.yml
```
