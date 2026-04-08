# NearMe — Stack e Telas do MVP

## Objetivo do produto

O **NearMe** é um app de descoberta de pessoas próximas com foco em **cartão de visita digital**, **presença intencional** e **conexão com consentimento mútuo**.

A proposta do MVP é simples:

- o usuário cria um cartão digital rápido
- ativa o modo **Visível agora**
- vê pessoas próximas que também estão visíveis
- envia pedido de conexão
- os links de contato só são liberados após aceite mútuo

---

## Direção de produto escolhida para o MVP

Para o primeiro MVP, a aposta é em:

- **presença intencional**, e não rastreamento passivo o tempo todo
- **baixo atrito para cadastro**
- **privacidade forte**
- **tempo real**
- base técnica reaproveitando a lógica que já faz sentido no seu ecossistema atual

O coração do MVP não é “mostrar todo mundo que passou por você”, e sim:

> **descobrir pessoas próximas no momento em que ambas estão disponíveis para conexão**

---

# Stack recomendada para o NearMe

## Visão geral

A stack escolhida para este projeto é:

### Mobile
- **React Native**
- **Expo**
- **TypeScript**
- **Expo Router** ou React Navigation
- **expo-auth-session** para login com Google no MVP
- **expo-notifications** para push notifications
- **expo-location** apenas para recursos auxiliares e permissões contextuais
- **expo-task-manager** para comportamentos controlados em background, quando necessário
- **@react-native-async-storage/async-storage** para persistência local não sensível
- **socket.io-client** para presença e eventos em tempo real
- **react-hook-form** + **zod** para formulários e validações
- **axios** para consumo de API
- **expo-secure-store** para tokens sensíveis
- **react-native-ble-plx** para proximidade via Bluetooth Low Energy
- **@expo/vector-icons** para ícones

### Backend
- **Node.js**
- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **JWT**
- **bcryptjs**
- **Socket.IO com NestJS Gateway**
- **google-auth-library** para validar login Google
- **Resend** para e-mails transacionais
- **class-validator** e **class-transformer**
- **BullMQ** opcional para filas futuras

### Infraestrutura inicial
- **PostgreSQL** como banco principal
- **Redis** para presença online, cache e TTL de sessões visíveis
- Deploy sugerido:
  - **Railway**, **Render** ou **Fly.io** para MVP
  - storage de imagens via **Cloudinary** ou **S3**
  - monitoramento inicial com logs estruturados

---

## Por que essa stack foi escolhida

### 1. Faz sentido com o que você já usa
Você já trabalha com uma arquitetura muito próxima disso. Isso reduz:

- tempo de decisão
- curva de aprendizado
- risco técnico
- retrabalho

### 2. Entrega rápida para MVP
A combinação de **Expo + NestJS + Prisma + PostgreSQL** acelera muito:

- autenticação
- CRUD de perfil
- tempo real
- notificações
- validações
- evolução do produto

### 3. Tempo real é importante no NearMe
Como o app depende de:

- presença visível
- descoberta de pessoas próximas
- pedidos de conexão
- atualização rápida da interface

o uso de **Socket.IO** encaixa muito bem.

### 4. Redis faz bastante sentido aqui
No NearMe, Redis ajuda em:

- status online
- sessões ativas
- usuários visíveis por um período
- deduplicação de eventos de proximidade
- controle de expiração
- rate limit

---

# Decisão de arquitetura do MVP

## O que vamos usar como base de proximidade

Para o MVP, a recomendação é:

### estratégia principal
- **presença intencional**
- **Bluetooth Low Energy (BLE)** para descoberta próxima
- **sem GPS contínuo como motor principal**

### por que não GPS contínuo no MVP
Porque GPS contínuo traz problemas de:

- bateria
- privacidade
- rejeição em app stores
- complexidade de background

### papel da localização no MVP
A localização pode existir apenas como apoio, por exemplo:

- permissões contextuais exigidas pela plataforma
- recursos futuros
- validações específicas

Mas o core do produto fica em **proximidade e visibilidade ativa**, não em rastreamento constante.

---

# Stack final escolhida

## Mobile final
- React Native
- Expo com **development build**
- TypeScript
- Expo Router
- expo-auth-session
- expo-notifications
- expo-task-manager
- expo-location
- expo-secure-store
- @react-native-async-storage/async-storage
- react-native-ble-plx
- socket.io-client
- axios
- react-hook-form
- zod
- @expo/vector-icons

## Backend final
- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Redis
- JWT
- bcryptjs
- google-auth-library
- Resend
- Socket.IO
- class-validator
- class-transformer

---

# O que entra no MVP

## Funcionalidades principais
- cadastro com e-mail e senha
- login com Google
- confirmação de e-mail
- recuperação de senha
- criação de cartão digital
- edição de perfil
- ativação do modo **Visível agora**
- descoberta de pessoas próximas
- listagem de pessoas detectadas recentemente
- envio de pedido de conexão
- aceite ou recusa de conexão
- liberação de links somente após match
- notificações push para eventos principais
- tela de conexões realizadas
- configurações básicas de privacidade

---

# O que não entra no MVP

## Funcionalidades fora do escopo inicial
- mapa em tempo real
- mostrar localização exata de pessoas
- histórico completo de todos que passaram por você na semana
- feed social
- chat interno completo
- videochamada
- algoritmo de recomendação avançado
- grupos e comunidades
- assinatura paga
- modo evento avançado com analytics
- background agressivo 24/7

---

# Diferencial do NearMe

O diferencial do NearMe no MVP será:

> **Conectar pessoas próximas em tempo real com cartão digital e consentimento mútuo, preservando privacidade.**

Não é só um cartão digital.  
Não é só um “radar de pessoas”.  
É uma mistura de:

- presença intencional
- descoberta local
- conexão controlada
- networking rápido

---

# Estrutura macro do sistema

## Fluxo resumido
1. usuário cria conta
2. monta seu cartão digital
3. ativa o modo visível
4. o app detecta pessoas próximas que também estão visíveis
5. a lista é atualizada em tempo real
6. um usuário envia pedido de conexão
7. o outro aceita
8. os links são liberados

---

# Modelo conceitual de entidades

## Entidades principais

### User
Representa a conta do usuário.

Campos sugeridos:
- id
- name
- email
- passwordHash
- authProvider
- emailVerified
- createdAt
- updatedAt

### Profile
Representa o cartão de visita do usuário.

Campos sugeridos:
- id
- userId
- displayName
- headline
- bio
- photoUrl
- instagramUrl
- linkedInUrl
- professionTag
- city
- isVisible
- createdAt
- updatedAt

### VisibilitySession
Sessão de visibilidade ativa.

Campos sugeridos:
- id
- userId
- startedAt
- endedAt
- isActive
- source

### ProximityEvent
Evento de detecção de proximidade.

Campos sugeridos:
- id
- userId
- nearbyUserId
- detectedAt
- signalStrength
- sessionId

### ConnectionRequest
Pedido de conexão entre usuários.

Campos sugeridos:
- id
- fromUserId
- toUserId
- status
- createdAt
- respondedAt

### Connection
Conexão efetivada.

Campos sugeridos:
- id
- userAId
- userBId
- createdAt

### Notification
Notificação interna/push.

Campos sugeridos:
- id
- userId
- type
- title
- body
- readAt
- createdAt

---

# Regras principais do negócio

## Regra 1 — visibilidade
O usuário só aparece para outras pessoas se estiver com o modo **Visível agora** ativado.

## Regra 2 — descoberta
A descoberta considera apenas usuários:
- ativos
- visíveis
- próximos
- dentro das regras mínimas de privacidade

## Regra 3 — links protegidos
Instagram e LinkedIn só ficam totalmente liberados depois de aceite mútuo.

## Regra 4 — segurança
O usuário pode:
- ficar invisível
- recusar conexão
- bloquear pessoas
- apagar a conta

## Regra 5 — sessão expira
A sessão visível deve expirar automaticamente após determinado tempo se necessário.

---

# Desenho das telas do NearMe

## 1. Splash

### Objetivo
Verificar sessão e carregar o app.

### Elementos
- logo do NearMe
- nome do app
- indicador de carregamento

### Comportamento
- se houver sessão válida, vai para Home
- se não houver sessão, vai para Onboarding ou Login

---

## 2. Onboarding

### Objetivo
Apresentar a proposta do app.

### Tela 1
**Título:** Conheça pessoas próximas  
**Texto:** Descubra perfis ao seu redor quando ambos estiverem disponíveis para conexão.

### Tela 2
**Título:** Você controla sua visibilidade  
**Texto:** Escolha quando aparecer e quando ficar invisível.

### Tela 3
**Título:** Privacidade com consentimento  
**Texto:** Seus links só aparecem depois de uma conexão aceita.

### Ações
- botão **Começar**
- botão **Entrar**

---

## 3. Login

### Objetivo
Permitir acesso rápido ao app.

### Componentes
- botão **Entrar com Google**
- botão **Entrar com e-mail**
- link **Criar conta**
- link **Esqueci minha senha**

---

## 4. Cadastro

### Objetivo
Criar conta manual.

### Campos
- nome
- e-mail
- senha
- confirmar senha

### Ações
- checkbox de aceite de termos
- botão **Criar conta**

---

## 5. Confirmação de e-mail

### Objetivo
Informar que o usuário precisa validar a conta.

### Componentes
- texto explicativo
- botão **Reenviar e-mail**
- botão **Já confirmei**

---

## 6. Recuperação de senha

### Objetivo
Permitir redefinição de senha por e-mail.

### Campos
- e-mail

### Ações
- botão **Enviar link**
- feedback de sucesso

---

## 7. Permissões iniciais

### Objetivo
Explicar permissões importantes antes do uso.

### Etapas
- permissão de Bluetooth
- permissão de notificações
- permissão de localização, se exigida pela plataforma para BLE/contexto

### Mensagem
“Usamos essas permissões para detectar pessoas próximas e avisar sobre conexões.”

---

## 8. Criar cartão

### Objetivo
Montar o cartão digital do usuário.

### Campos
- foto
- nome exibido
- headline
- bio curta
- Instagram
- LinkedIn
- tag profissional
- cidade opcional

### Ações
- botão **Salvar e continuar**

### Regra de UX
Esse fluxo deve levar menos de 1 minuto.

---

## 9. Home

### Objetivo
Ser o centro da experiência do usuário.

### Blocos principais
- saudação com avatar
- card de status da visibilidade
- contador de pessoas próximas
- atalhos para pessoas e conexões

### Conteúdo sugerido
- status atual: **Invisível** ou **Visível agora**
- botão toggle grande
- número de pessoas próximas detectadas
- botão **Ver pessoas**
- botão **Minhas conexões**

### Wireframe textual
```txt
[Avatar] Olá, Matheus

[ VISÍVEL AGORA ]
Toggle: ON

3 pessoas detectadas por perto

[ Ver pessoas ]
[ Minhas conexões ]
```

---

## 10. Pessoas próximas

### Objetivo
Mostrar quem está por perto e disponível.

### Estrutura da lista
Cada card deve mostrar:
- foto
- nome
- headline
- status de proximidade
- botão **Ver cartão**
- botão **Conectar**

### Exemplo
```txt
[Foto] Ana Silva
UX Designer | Freelancer
Próximo agora
[Ver cartão] [Conectar]

[Foto] João Pedro
Dev Backend | NestJS
Detectado há 2 min
[Ver cartão] [Conectar]
```

### Filtros simples
No MVP, no máximo:
- todos
- recentes
- mesma área

---

## 11. Detalhe do cartão

### Objetivo
Exibir o cartão digital da pessoa.

### Elementos
- foto grande
- nome
- headline
- bio
- tags profissionais
- botão **Enviar conexão**

### Regras
Antes do match:
- links ficam ocultos ou bloqueados

Depois do match:
- links ficam disponíveis

### Exemplo textual
```txt
[Foto]

Ana Silva
UX Designer | Freelancer

"Ajudo marcas a criar experiências mais simples e bonitas."

Tags: UX / Produto / Branding

[ Enviar conexão ]
```

---

## 12. Solicitações

### Objetivo
Gerenciar pedidos enviados e recebidos.

### Abas
- Recebidas
- Enviadas

### Recebidas
Cada item mostra:
- foto
- nome
- headline
- botão **Aceitar**
- botão **Recusar**

### Enviadas
Cada item mostra:
- status pendente
- opção de cancelar

---

## 13. Tela de match

### Objetivo
Marcar o momento de valor do produto.

### Elementos
- mensagem de sucesso
- nome da pessoa
- botões para abrir os links liberados

### Exemplo
```txt
🎉 Conexão realizada com Ana Silva

[LinkedIn]
[Instagram]
[Voltar para pessoas]
```

---

## 14. Minhas conexões

### Objetivo
Listar todas as conexões realizadas.

### Cada item
- foto
- nome
- headline
- data da conexão
- botão **Ver perfil**

### Extras
- campo de busca por nome

---

## 15. Notificações

### Objetivo
Centralizar eventos importantes.

### Tipos de notificação
- alguém enviou conexão
- alguém aceitou sua conexão
- lembrete de atividade recente

---

## 16. Perfil

### Objetivo
Permitir edição do cartão e visualização do próprio perfil.

### Elementos
- foto
- nome
- headline
- bio
- links
- botão **Editar perfil**

---

## 17. Configurações e privacidade

### Objetivo
Dar controle total ao usuário.

### Opções
- perfil visível por padrão
- permitir descoberta apenas com app aberto
- notificações on/off
- editar cartão
- sair
- bloquear usuários
- ocultar cartão temporariamente
- excluir conta

---

# Navegação sugerida

## Tabs principais
- Home
- Pessoas
- Conexões
- Perfil

## Stacks
- AuthStack
- OnboardingStack
- MainStack
- Modais para permissões e match

---

# Fluxo ideal do primeiro uso

1. Splash
2. Onboarding
3. Login ou cadastro
4. Confirmação de e-mail
5. Permissões
6. Criar cartão
7. Home
8. Ativar modo visível
9. Ver pessoas próximas
10. Enviar conexão
11. Receber match
12. Acessar conexões

---

# Fluxo principal do produto

## Fluxo A — novo usuário
- cria conta
- monta perfil
- ativa visibilidade
- encontra pessoas próximas

## Fluxo B — pedido de conexão
- usuário A encontra usuário B
- usuário A envia conexão
- usuário B aceita
- sistema cria a conexão
- links são liberados

## Fluxo C — privacidade
- usuário desliga visibilidade
- deixa de aparecer para outros
- continua podendo ver suas conexões anteriores

---

# Componentes visuais sugeridos

## Componentes principais
- `AppHeader`
- `PrimaryButton`
- `SecondaryButton`
- `VisibilityToggleCard`
- `NearbyUserCard`
- `ProfileCard`
- `ConnectionRequestCard`
- `NotificationCard`
- `PermissionCard`
- `EmptyState`
- `AvatarUploader`

---

# Estrutura de pastas sugerida

## Mobile
```txt
src/
  app/
  components/
  features/
    auth/
    onboarding/
    permissions/
    profile/
    visibility/
    nearby/
    connections/
    notifications/
    settings/
  services/
  hooks/
  store/
  utils/
  types/
```

## Backend
```txt
src/
  modules/
    auth/
    users/
    profiles/
    visibility/
    proximity/
    connections/
    notifications/
    health/
  common/
  config/
  prisma/
  gateways/
  jobs/
```

---

# Endpoints e canais principais do MVP

## REST
### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`

### Profile
- `GET /profile/me`
- `PUT /profile/me`
- `POST /profile/photo`

### Visibility
- `POST /visibility/start`
- `POST /visibility/stop`
- `GET /visibility/status`

### Nearby
- `GET /nearby/users`

### Connections
- `POST /connections/request`
- `POST /connections/:id/accept`
- `POST /connections/:id/reject`
- `GET /connections`
- `GET /connections/requests`

### Notifications
- `GET /notifications`
- `POST /notifications/read`

## Socket events
### Client -> Server
- `presence:join`
- `presence:leave`
- `nearby:update`
- `connection:request`

### Server -> Client
- `nearby:list`
- `connection:received`
- `connection:accepted`
- `notification:new`

---

# Regras de privacidade do MVP

## Obrigatórias
- usuário invisível não aparece para outros
- links só são liberados após match
- nada de localização exata na interface
- usuário pode bloquear outro usuário
- usuário pode remover visibilidade a qualquer momento

## Recomendadas
- texto claro de consentimento
- opção de apagar conta
- possibilidade de limitar o uso apenas com app aberto no início

---

# Roadmap após MVP

## V2
- modo evento
- filtros por profissão/interesse
- histórico curto de detecção
- melhorias em ranking de proximidade

## V3
- analytics para eventos
- plano premium
- sugestão inteligente de conexões
- QR code de cartão
- importação/exportação de contato

---

# Resumo executivo

## Nome
**NearMe**

## Tese do produto
Descoberta de pessoas próximas com cartão digital e conexão com consentimento.

## Stack escolhida
- React Native + Expo + TypeScript
- NestJS + Prisma + PostgreSQL + Redis
- Socket.IO
- JWT
- Google Auth
- Resend
- BLE para proximidade

## Foco do MVP
- perfil simples
- visibilidade intencional
- pessoas próximas
- pedido de conexão
- match
- links liberados após aceite

## Diferencial
Networking local, rápido e controlado, com privacidade forte.

---

# Próximo passo recomendado

O próximo artefato ideal depois deste arquivo é um destes:

1. **documento de requisitos funcionais e não funcionais**
2. **modelagem do banco com Prisma**
3. **arquitetura de pastas do app mobile e backend com módulos reais**
4. **wireframes em nível de tela/fluxo**
5. **backlog do MVP dividido por sprint**
