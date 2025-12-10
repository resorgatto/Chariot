# Processo do projeto

## Visao geral
- SaaS de gestao de rotas e frota: backend Django 5 + DRF/PostGIS/Celery e frontend React/Vite/Tailwind/TypeScript.
- Autenticacao JWT (SimpleJWT) com documentacao Swagger via drf-spectacular, orquestrado pelo `docker-compose.yml` (PostGIS, Redis, web, Celery e frontend).
- Objetivo: permitir cadastro e controle de veiculos, motoristas, ordens de entrega, areas de cobertura e agenda visual para operacao.

## Backend (Django + PostGIS + Celery)
- Configuracao: variaveis em `.env.example` (chaves JWT, DB, CORS, broker do Celery). `entrypoint.sh` aguarda o banco e aplica `migrate`; `config/settings.py` usa PostGIS por padrao e cai para SQLite local se variaveis de DB nao estiverem definidas.
- Apps e modelos (`apps/logistics/models.py`): Vehicle (imagem e `last_location` geoespacial), Driver, DeliveryOrder (pontos de coleta/entrega), Garage, DeliveryArea (poligono), Route. Choices de status garantem consistencia.
- API e permissoes (`config/urls.py`, `apps/logistics/views.py`, `apps/accounts/views.py`): viewsets com CRUD autenticado; admins podem escrever, demais usuarios leem. `DeliveryOrderViewSet` permite motoristas alterarem apenas o status das ordens atribuidas. Endpoints extras `/api/coverage-check/` (cobertura), `/api/dashboard-summary/` (contadores), `/api/me/` (perfil).
- Geocodificacao/CEP: `CepLookupView` consulta ViaCEP e tenta geocodificar no Nominatim para preencher endereco e coordenadas (frontend usa para CEP -> lat/lon).
- Areas de cobertura: `DeliveryAreaSerializer` aceita centro+raio e gera poligono circular; serializa centroides e raio estimado para exibir no mapa.
- Celery e sinais: `apps/logistics/signals.py` dispara `send_delivery_status_email` quando uma ordem muda para `in_transit`; task em `apps/logistics/tasks.py`. Comando `python manage.py simulate_traffic` simula movimento atualizando `last_location` de veiculos.
- Documentacao/testes: schema Swagger em `/api/schema/swagger-ui/`; testes em `apps/logistics/tests.py` validam permissoes, GeoJSON, checagem de cobertura, contadores e disparo de notificacao. Usuario padrao pode ser criado via `DEFAULT_SUPERUSER_USERNAME/PASSWORD` configurados em `apps/accounts/apps.py`.

## Frontend (React + Vite + Tailwind)
- Setup: `frontend/.env.example` define `VITE_API_URL`; cliente em `frontend/src/lib/api.ts` guarda tokens no localStorage, renova access token e centraliza chamadas (incluindo upload de imagem e lookup de CEP).
- Rotas/protecao (`frontend/src/App.tsx`): login em `/login`; `PrivateRoute` protege rotas. Admin ve dashboard, fleet, map, garages, users, drivers, orders, coverage e service-board; motoristas veem `/my-orders`.
- Paginas principais:
  - Dashboard (`frontend/src/pages/Dashboard.tsx`): cards de resumo, ultimas entregas e mapa Leaflet com garagens/veiculos.
  - Fleet (`frontend/src/pages/FleetPage.tsx`): CRUD de veiculos com upload de imagem, alteracao de status/posicao (lat/lon ou CEP) e troca de garagem.
  - Garages (`frontend/src/pages/GaragesPage.tsx`): cria/edita/exclui garagens com preenchimento automatico via CEP e armazenamento de coordenadas.
  - Delivery Orders (`frontend/src/pages/DeliveryOrdersPage.tsx`): cria ordens com CEP->coordenada, atribui motorista/veiculo/garagem, edita status e atualiza garagem do veiculo.
  - Map (`frontend/src/pages/MapPage.tsx`): mapa quase em tempo real (polling com react-query) mostrando ultima posicao de veiculos e garagens.
  - Coverage (`frontend/src/pages/CoverageCheckPage.tsx`): cria areas circulares no mapa e checa se um ponto (lat/lon ou CEP) esta coberto.
  - Users (`frontend/src/pages/UsersPage.tsx`): CRUD administrativo de contas e papeis (driver/admin).
  - Driver area (`frontend/src/pages/DriverOrdersPage.tsx`): lista ordens atribuidas ao motorista autenticado e permite atualizar status.
  - Service board (`frontend/src/pages/ServiceBoardPage.tsx`): agenda drag-and-drop por motorista/dia, com filtros, ajuste de duracao e edicao rapida de ordens.

## Como rodar e validar
- Backend: `cp .env.example .env`, preencher variaveis (inclusive credencial padrao para superusuario opcional), depois `docker-compose up --build`. Django em `http://localhost:8000`, Swagger em `/api/schema/swagger-ui/`, admin opcional em `/admin` quando `ENABLE_ADMIN=true`.
- Frontend: `cd frontend && cp .env.example .env`, ajustar `VITE_API_URL` e rodar `npm install && npm run dev -- --host --port 5173` (ou subir o servico `frontend` do compose).
- Celery: worker sobe via servico `celery` no compose; tasks sao disparadas pelos sinais. Comando util: `docker-compose exec web python manage.py simulate_traffic`.
- Testes: requer PostGIS. Execute `docker-compose run --rm web python manage.py test` para validar permissoes, APIs e logica geoespacial.
