# Estratégia de revisão final — n8n-nodes-kapso-api

## Objetivo

Encontrar **as últimas lacunas de abstração** nos fluxos de automação para que um usuário n8n consiga operar **sem abrir a doc Kapso/Meta** no caminho feliz. Custom API Call e JSON “expert” ficam **fora do escopo de fix**, mas entram no inventário como escape hatches aceitos.

**Escopo confirmado:** Message, Trigger, Contact, Conversation, Broadcast, Media, Block User.

**Fora de escopo de fix:** webhook CRUD, template admin, Flow admin, logs, business profile — dashboard ou Custom API Call.

**Definição de “done”:** zero findings **P0/P1** no caminho feliz; P2 só se o fix for barato e eliminar rejeição silenciosa da API.

---

## Princípios da revisão

### O que conta como problema

| Sinal | Exemplo no repo | Severidade típica |
|-------|-----------------|-------------------|
| UI promete algo que o builder não envia | enum inválido (`kapso_media`, já corrigido em 0.6.1) | P0 |
| Campo opcional na UI mas **obrigatório** na API/Meta | `flowId`/`flowName` XOR só em runtime ([`routing.ts`](nodes/KapsoApi/actions/routing.ts) ~429) | P1 |
| Usuário precisa saber **nome de campo da API** no caminho feliz | `parameterName`, `rowId`, `messageResponseFields` | P1 se inevitável; P2 se há label claro |
| Builder deixa API rejeitar sem erro local | limites Meta (parcialmente corrigido em [`validation.ts`](nodes/KapsoApi/actions/validation.ts)) | P1 |
| Dropdown/locator incompleto → colar ID manual | conversas/contatos (cursor fix 0.6.1); ainda falta auditar templates/media/message IDs | P1 |
| README/descrição **mentem** sobre o node | linha 156 do [`README.md`](README.md) ainda cita “Kapso Media” | P2 doc |
| JSON override no caminho feliz | `advancedComponentsJson` citado no exemplo de template ([README](README.md) ~140) | P2 se builder cobre 95% dos casos |

### O que **não** é problema (aceitar)

- Custom API Call ([`operations.ts`](nodes/KapsoApi/actions/operations.ts) `CUSTOM_API_CALL`)
- Advanced JSON com label “expert use” ([`shared.fields.ts`](nodes/KapsoApi/properties/shared.fields.ts))
- Admin endpoints sem menu dedicado ([README Limitations](README.md))
- IDs colados **depois** de um GET/list/trigger (expressão `{{ $json.id }}`) — isso é n8n normal

### Rubrica de severidade

- **P0** — payload inválido gerado pela UI; ou operação first-class quebrada
- **P1** — caminho feliz exige doc API, ou erro só na Kapso/Meta sem validação local
- **P2** — polimento: naming, defaults, mensagens, docs, validação defensiva
- **ACCEPT** — escape hatch intencional; registrar no inventário, não fixar

---

## Formato de saída (cada pass)

Criar/atualizar um arquivo de findings por pass (sugestão: `review/PASS-XX-findings.md`). **Um finding = um card atômico:**

```markdown
### [P1] Título curto
- **Pass:** 03
- **Superfície:** Message → Send Flow
- **Arquivos:** properties/messageExtended.fields.ts:388, actions/routing.ts:429
- **Sintoma:** usuário deixa Flow ID vazio → erro genérico ou 400 Meta
- **Evidência:** campo não `required`; validação só em routing
- **Fix proposto:** required condicional na UI + mensagem “Flow ID ou Flow Name”
- **Esforço:** S | M | L
- **Decisão:** FIX | DEFER | ACCEPT
```

**Regra:** no máximo **15 findings por pass**; se passar, subdividir o pass.

---

## Arquitetura de revisão (8 passes)

```mermaid
flowchart LR
  P01[Pass01 MenuCoverage] --> P02[Pass02 MessageSend]
  P02 --> P03[Pass03 TemplateCarousel]
  P03 --> P04[Pass04 PlatformCRUD]
  P04 --> P05[Pass05 MediaPlatformMsg]
  P05 --> P06[Pass06 LoadOptions]
  P06 --> P07[Pass07 TriggerChain]
  P07 --> P08[Pass08 HappyPathMatrix]
  P08 --> Triage[TriageFinal]
```

Passes 01–07 podem rodar **em chats separados** (contexto limpo). Pass 08 consolida e executa jornadas; TriageFinal deduplica e gera backlog único.

---

## Pass 01 — Cobertura do menu vs automação real

**Pergunta:** o menu cobre o que um fluxo típico precisa, ou empurra Custom API cedo demais?

**Arquivos:**
- [`nodes/KapsoApi/actions/operations.ts`](nodes/KapsoApi/actions/operations.ts)
- [`nodes/KapsoApi/actions/routing.ts`](nodes/KapsoApi/actions/routing.ts) (switch de resource/operation)
- [`README.md`](README.md) Implemented + Limitations

**Checklist atômico:**
1. Listar cada resource × operation do menu
2. Para cada op, marcar: **Happy path sem doc?** (Y/N/Partial)
3. Marcar dependências ocultas (phone ID, WABA, template aprovado, catalog ID)
4. Cruzar com jornadas do README (Send Text, Template, Close Conversation, Upload URL)
5. Flagar README desatualizado (ex.: “Kapso Media” → `Meta Resumable Asset`)

**Saída:** matriz `review/PASS-01-coverage-matrix.md` — sem fixes ainda.

**Exit criteria:** 100% das ops first-class classificadas Y/N/Partial.

---

## Pass 02 — Message send (não-template)

**Pergunta:** cada operação de envio esconde o shape Meta/WhatsApp?

**Arquivos (seguir cadeia UI → builder → routing):**
- [`properties/message.fields.ts`](nodes/KapsoApi/properties/message.fields.ts)
- [`properties/messageExtended.fields.ts`](nodes/KapsoApi/properties/messageExtended.fields.ts)
- [`properties/interactiveHeaderOptions.ts`](nodes/KapsoApi/properties/interactiveHeaderOptions.ts)
- [`actions/messagePayloads.ts`](nodes/KapsoApi/actions/messagePayloads.ts)
- [`actions/routing.ts`](nodes/KapsoApi/actions/routing.ts) (`buildMessageRequest`)
- [`actions/validation.ts`](nodes/KapsoApi/actions/validation.ts)
- Testes: [`test/unit/payloads.test.ts`](test/unit/payloads.test.ts), [`test/unit/messageBuilders.test.ts`](test/unit/messageBuilders.test.ts)

**Checklist por operação** (repetir 19× de `sendText` até `markRead`):

| # | Pergunta |
|---|----------|
| 1 | Campos `required` na UI = campos obrigatórios Meta? |
| 2 | Placeholders/descriptions usam linguagem de usuário, não snake_case API? |
| 3 | Valores default seguros (ex.: recipient sem `+`, block user só dígitos)? |
| 4 | Headers interativos consistentes entre buttons/list/cta/product/flow? |
| 5 | Builder valida limites Meta antes do HTTP? |
| 6 | Operação tem teste de payload mínimo + teste de validação? |

**Hotspots já conhecidos (validar se ainda vazam):**
- Flow: `flowId`/`flowName` XOR, `flowScreen` quando `navigate`
- Catalog/product: `catalogId`, `productRetailerId` sem loadOptions
- Reaction/markRead/get: IDs manuais — aceitável se vierem de trigger/list?
- `messageResponseFields` / `fields` query — expert-only?

**Exit criteria:** cada send* classificado; findings só onde Partial/N + caminho feliz.

---

## Pass 03 — Template + Carousel + Broadcast components

**Pergunta:** o builder cobre templates comuns sem Advanced JSON?

**Arquivos:**
- [`properties/templateShared.fields.ts`](nodes/KapsoApi/properties/templateShared.fields.ts)
- [`properties/message.fields.ts`](nodes/KapsoApi/properties/message.fields.ts) (carousel)
- [`properties/resource.fields.ts`](nodes/KapsoApi/properties/resource.fields.ts) (broadcast recipients)
- [`actions/templateComponents.ts`](nodes/KapsoApi/actions/templateComponents.ts)
- [`actions/templateInput.ts`](nodes/KapsoApi/actions/templateInput.ts)
- [`actions/platformPayloads.ts`](nodes/KapsoApi/actions/platformPayloads.ts)
- Testes: [`test/unit/templateComponents.test.ts`](test/unit/templateComponents.test.ts)

**Checklist atômico:**
1. Header types: text/image/video/document/location — media obrigatório quando tipo exige?
2. Body: `parameterName` — quando é necessário vs opcional (templates nomeados)?
3. Buttons: quick_reply, url, flow, copy_code, catalog, mpm — campos condicionais completos?
4. Carousel: card count vs template — só doc ou validar?
5. Broadcast Add Recipients: builder vs `recipientComponentsJson` / `recipientsBodyJson` — quando ainda precisa JSON?
6. Advanced JSON: confirmar que só aparece em Additional Options e README não o coloca no passo 4 do caminho feliz

**Exit criteria:** lista de gaps de builder (não de API admin).

---

## Pass 04 — Platform CRUD (Contact, Conversation, Broadcast, Block)

**Pergunta:** list/get/update/create funcionam como “CRM leve” sem paginação manual?

**Arquivos:**
- [`properties/resource.fields.ts`](nodes/KapsoApi/properties/resource.fields.ts)
- [`properties/platformList.fields.ts`](nodes/KapsoApi/properties/platformList.fields.ts)
- [`properties/broadcastList.fields.ts`](nodes/KapsoApi/properties/broadcastList.fields.ts)
- [`actions/platformPayloads.ts`](nodes/KapsoApi/actions/platformPayloads.ts)
- [`actions/queryBuilders.ts`](nodes/KapsoApi/actions/queryBuilders.ts)
- [`loadOptions/listSearch.ts`](nodes/KapsoApi/loadOptions/listSearch.ts)
- Testes: [`test/unit/platformPayloads.test.ts`](test/unit/platformPayloads.test.ts), [`test/unit/queryBuilders.test.ts`](test/unit/queryBuilders.test.ts)

**Checklist atômico:**
1. Resource locators: list + search + ID manual — labels úteis?
2. Contact create/update: collections-only — falta algum campo Kapso comum (`customer_id`, metadata)?
3. Conversation updateStatus: status enum alinhado Kapso?
4. Broadcast lifecycle: create → add recipients → schedule/send — algum passo exige shape Kapso não modelado?
5. Pagination: cursor vs page — `returnAll` + filtros documentados na UI?
6. Block/unblock: formato de telefone validado na UI?

**Exit criteria:** nenhum passo do lifecycle broadcast exige `recipientsBodyJson` no caminho feliz.

---

## Pass 05 — Media + Platform Message + Message list/get

**Pergunta:** mídia e consulta de mensagens são usáveis sem tokens/cursors crus?

**Arquivos:**
- [`properties/resource.fields.ts`](nodes/KapsoApi/properties/resource.fields.ts) (media)
- [`properties/platformMessage.fields.ts`](nodes/KapsoApi/properties/platformMessage.fields.ts)
- [`properties/shared.fields.ts`](nodes/KapsoApi/properties/shared.fields.ts) (pagination)
- [`actions/routing.ts`](nodes/KapsoApi/actions/routing.ts) (media upload/download)
- [`transport/pagination.ts`](nodes/KapsoApi/transport/pagination.ts)
- Testes: [`test/unit/pagination.test.ts`](test/unit/pagination.test.ts)

**Checklist atômico:**
1. Upload binary / from URL / getUrl / delete — delivery enum alinhado OpenAPI?
2. Download: usuário entende de onde vem `downloadToken`? (descrição + exemplo chain)
3. Platform Message list: filtros (`type`, dates, phone) — nomes amigáveis?
4. Message list (Meta) vs Platform Message list — README deixa claro quando usar qual?
5. Cursor `after`/`before`: UI expõe ou só Additional Options? Usuário precisa colar cursor?

**Exit criteria:** cadeia upload → getUrl → send image documentada no README ou notice in-node.

---

## Pass 06 — Load options e IDs dinâmicos

**Pergunta:** ainda há IDs que **deveriam** ser dropdown mas são paste-only?

**Arquivos:**
- [`loadOptions/phoneNumbers.ts`](nodes/KapsoApi/loadOptions/phoneNumbers.ts)
- [`loadOptions/templates.ts`](nodes/KapsoApi/loadOptions/templates.ts)
- [`loadOptions/listSearch.ts`](nodes/KapsoApi/loadOptions/listSearch.ts)
- [`loadOptions/helpers.ts`](nodes/KapsoApi/loadOptions/helpers.ts)
- [`KapsoApi.node.ts`](nodes/KapsoApi/KapsoApi.node.ts) (registro de methods)

**Checklist atômico:**
1. Inventariar todo campo `loadOptionsMethod` / `listSearchMethod`
2. Inventariar campos ID **sem** loadOptions (mediaId, messageId, catalogId, flowId, etc.)
3. Para cada paste-only: **justificativa** (vem de step anterior / não listável / admin)
4. Testar mentalmente paginação: phone numbers, templates, conversations, contacts, broadcasts
5. Expression override nos options fields — documentado?

**Saída:** tabela `Field | loadOptions? | Acceptable? | Fix?`

**Exit criteria:** zero campos paste-only no caminho feliz sem justificativa ACCEPT.

---

## Pass 07 — Kapso Trigger e encadeamento

**Pergunta:** trigger → Kapso API node funciona com expressions padrão, sem adivinhar paths do payload?

**Arquivos:**
- [`KapsoTrigger.node.ts`](nodes/KapsoApi/KapsoTrigger.node.ts)
- [`trigger/events.ts`](nodes/KapsoApi/trigger/events.ts)
- [`trigger/trigger.ts`](nodes/KapsoApi/trigger/trigger.ts)
- [`trigger/signature.ts`](nodes/KapsoApi/trigger/signature.ts)
- [`credentials/KapsoApi.credentials.ts`](credentials/KapsoApi.credentials.ts)
- Testes: [`test/unit/trigger.test.ts`](test/unit/trigger.test.ts), [`test/unit/signature.test.ts`](test/unit/signature.test.ts)

**Checklist atômico:**
1. Cada output: payload shape estável? Campo `kapso_event` sempre presente?
2. Batch `body.data[]` — expressions funcionam item a item?
3. Secret na credential — UX clara (notice + README)?
4. Mapeamento recomendado trigger → Send Reply / Update Conversation / Get Message — **documentar 3 recipes** no README
5. HMAC/rawBody — ACCEPT com nota de limitação n8n (não reabrir unless P0 repro)

**Exit criteria:** 3 recipes copy-paste no README; nenhum recipe usa Custom API Call.

---

## Pass 08 — Matriz de caminho feliz + triagem final

**Pergunta:** um usuário novo completa estas jornadas só com README + UI?

**Jornadas obrigatórias (executar como walkthrough de código + testes, não browser):**

1. Inbound: Trigger message.received → Send Text reply
2. Outbound: Send Template (standard) com header image URL
3. Outbound: Send Buttons com header document
4. Outbound: Send Flow (published, flow name)
5. Broadcast: create → add recipients (phone) → schedule
6. Contact: create com phones collection → update display name
7. Conversation: list → update status ended
8. Media: upload from URL → send image com media id/url chain
9. Platform Message: list com filtro de tipo
10. Block user → unblock

**Por jornada, marcar:**
- Campos que exigiram abrir doc
- JSON manual necessário? (deve ser NO)
- Teste de integração existe? ([`test/unit/routing.integration.test.ts`](test/unit/routing.integration.test.ts))

**Triage final:**
1. Merge findings Pass 01–07 + Pass 08
2. Dedupe por root cause
3. Ordenar: P0 → P1 → P2
4. Separar **Release blockers** vs **0.6.x polish**
5. Gerar `review/FINAL-BACKLOG.md` com estimativa S/M/L

**Exit criteria:** backlog final ≤ 20 items; usuário pode congelar feature set após P0/P1 zerados.

---

## Inventário de escape hatches (referência — não fixar)

Registrar uma vez em `review/ESCAPE-HATCHES.md`:

| Hatch | Arquivo | Classificação |
|-------|---------|---------------|
| Custom API Call | resource.fields.ts, routing.ts | ACCEPT |
| advancedComponentsJson | shared.fields.ts | ACCEPT |
| recipientsBodyJson | resource.fields.ts | ACCEPT (expert broadcast) |
| recipientComponentsJson | resource.fields.ts | ACCEPT |
| contactMetadataJson | resource.fields.ts | ACCEPT |
| flowInitialDataJson / flowActionDataJson | messageExtended, templateShared | REVIEW — talvez builder parcial |
| messageResponseFields | shared.fields.ts | ACCEPT |
| bodyJson (custom) | resource.fields.ts | ACCEPT |

---

## Como executar cada pass (prompt template)

Copiar em chat novo, substituir `XX`:

```text
Revisão Pass XX do n8n-nodes-kapso-api.
Escopo: automação only (sem fix Custom API Call).
Siga review/STRATEGY.md Pass XX.
Compare UI → builder → routing → testes.
Produza review/PASS-XX-findings.md com cards atômicos (máx 15).
Classifique FIX/DEFER/ACCEPT. Não implemente ainda.
Repo: /root/n8n-nodes-kapso-api, versão 0.6.1.
```

---

## Ordem recomendada e esforço

| Pass | Foco | Tempo estimado | Depende de |
|------|------|----------------|------------|
| 01 | Mapa | 30 min | — |
| 02 | Message send | 60–90 min | 01 |
| 03 | Template/Broadcast | 60 min | 02 |
| 04 | Platform CRUD | 45 min | 01 |
| 05 | Media/Lists | 45 min | 04 |
| 06 | Load options | 30 min | 04, 05 |
| 07 | Trigger | 30 min | — |
| 08 | Matrix + triage | 60 min | 01–07 |

**Total:** ~6–8 h de revisão distribuída; implementação dos FIX separada (provável 0.6.2 ou 0.7.0).

---

## Entregável imediato após aprovação

1. Criar pasta [`review/`](review/) no repo
2. Salvar este documento como [`review/STRATEGY.md`](review/STRATEGY.md)
3. Criar [`review/ESCAPE-HATCHES.md`](review/ESCAPE-HATCHES.md) (esqueleto)
4. Criar [`review/PASS-01-coverage-matrix.md`](review/PASS-01-coverage-matrix.md) (vazio, template de colunas)

Passes 02–08 rodam depois, um chat por pass.
