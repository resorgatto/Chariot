# Gestao de Rotas (Django + PostGIS + Celery)

Aplicacao Django com DRF, PostGIS e Celery para gestao de frota, motoristas e ordens de entrega com validacao geoespacial.

## Rodando tudo em 1 comando
1. Crie o arquivo de ambiente: `cp .env.example .env` e ajuste as variaveis.
2. Suba toda a stack (web, db, redis, celery):  
   ```bash
   docker-compose up --build
   ```
   O Django roda em `http://localhost:8000`, Swagger em `http://localhost:8000/api/schema/swagger-ui/` e Admin em `http://localhost:8000/admin/`.

## Endpoints principais
- Auth JWT: `POST /api/token/` e `POST /api/token/refresh/`
- Frota: `/api/vehicles/`
- Motoristas: `/api/drivers/`
- Ordens de entrega: `/api/delivery-orders/`
- Garagens: `/api/garages/`
- Rotas: `/api/routes/`
- Cobertura por coordenada: `POST /api/coverage-check/` (lat/long)
- Resumo para dashboard: `GET /api/dashboard-summary/`
- Usuarios (apenas admin cria/lista): `/api/users/`
- Documentacao: `/api/schema/swagger-ui/`

## Tarefas em background (Celery)
- Worker sobe no servico `celery` do docker-compose.
- Task de exemplo: `apps.logistics.tasks.add(2, 2)`.
- Notificacao: ao mudar um `DeliveryOrder` para `in_transit`, uma task envia email (console).

## Testes e qualidade
- Rodar testes (requer banco com extensao PostGIS):  
  ```bash
  docker-compose run --rm web python manage.py test
  ```
- Lint:  
  ```bash
  flake8
  ```

## Prints para o portifolio
- Adicione capturas em `docs/swagger.png` (Swagger) e `docs/admin-mapa.png` (Admin com mapa OSM). Inclua-as no repositorio ou no README conforme preferir.
