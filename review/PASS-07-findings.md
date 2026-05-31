# Pass 07 — Kapso Trigger findings

**Versão:** 0.6.1

---

### [P2] webhookSecret optional na credential UI, mandatory no trigger
- **Pass:** 07
- **Superfície:** Kapso API credential + Trigger
- **Arquivos:** credentials/KapsoApi.credentials.ts:34-44, trigger/trigger.ts:60-67
- **Sintoma:** Credential salva sem secret; webhook 500 em runtime
- **Evidência:** Sem `required: true` no field
- **Fix proposto:** required quando usado com trigger (ou notice stronger)
- **Esforço:** S
- **Decisão:** FIX

### [P2] Event type ausente → webhook 200, zero items
- **Pass:** 07
- **Superfície:** Kapso Trigger
- **Arquivos:** trigger/trigger.ts:87-110
- **Sintoma:** Silent no-op em todos outputs
- **Evidência:** eventType undefined → nenhum branch preenche workflowData
- **Fix proposto:** Route para Other Event ou log notice; ou 400 response
- **Esforço:** S
- **Decisão:** DEFER

### [P2] README sem trigger→API expression recipes
- **Pass:** 07
- **Superfície:** README + KapsoTrigger notice
- **Arquivos:** README.md:85-101, KapsoTrigger.node.ts:65-72
- **Sintoma:** Usuário adivinha paths do payload
- **Evidência:** Notice aponta doc Kapso; README lista eventos só
- **Fix proposto:** Adicionar 3 recipes abaixo ao README
- **Esforço:** S
- **Decisão:** FIX

### [P2] HMAC rawBody fallback (limitação n8n)
- **Pass:** 07
- **Superfície:** trigger/signature.ts
- **Sintoma:** Possível 401 se body re-serializado
- **Evidência:** JSON.stringify fallback
- **Fix proposto:** Documentar; ACCEPT unless repro
- **Esforço:** —
- **Decisão:** ACCEPT

### [P2] Credential test não cobre webhook secret
- **Pass:** 07
- **Superfície:** credentials test
- **Arquivos:** credentials/KapsoApi.credentials.ts:56-66
- **Sintoma:** Secret inválido só descoberto no trigger
- **Evidência:** Test só phone_numbers
- **Fix proposto:** Opcional: doc-only note (secret validated on first webhook)
- **Esforço:** S
- **Decisão:** DEFER

**Verified OK:**
- Batch `body.data[]` → múltiplos items com `kapso_event` (trigger.ts:45-51)
- 9 outputs mapeados (events.ts + KapsoTrigger.node.ts)
- Signature tests (signature.test.ts)

---

## Trigger → API recipes (draft for README)

### Recipe A — Auto-reply on inbound message

Connect **Message Received** output → Kapso API:

| Field | Value |
|-------|-------|
| Resource / Operation | Message → Send Text |
| Phone Number ID | `={{ $json.phone_number_id }}` |
| Recipient Phone | `={{ $json.message.from }}` *(adjust to live payload)* |
| Text | Your reply text |
| Reply To Message ID (Additional Options) | `={{ $json.message.id }}` |

### Recipe B — Mark delivered message as read

Connect **Message Delivered** → Kapso API:

| Field | Value |
|-------|-------|
| Resource / Operation | Message → Mark as Read |
| Phone Number ID | `={{ $json.phone_number_id }}` |
| Message ID | `={{ $json.message.id }}` |

### Recipe C — Close conversation when Kapso ends it

Connect **Conversation Ended** → Kapso API:

| Field | Value |
|-------|-------|
| Resource / Operation | Conversation → Update Status |
| Conversation | By ID: `={{ $json.conversation.id ?? $json.conversation_id }}` |
| Status | `ended` |

**Exit criteria 3 recipes in README:** **not met** until README updated (FIX above).
