# Pass 01 — Coverage matrix

**Versão auditada:** 0.6.1  
**Data:** 2026-05-30  
**Escopo:** first-class ops (excl. Custom API Call do happy-path)

Legenda **Happy path sem doc:** Y = UI+builder cobrem caminho típico; Partial = funciona mas exige IDs externos ou validação fraca; N = exige doc API no caminho feliz.

| Resource | Operation | Happy path | Dependências ocultas | Notas |
|----------|-----------|------------|----------------------|-------|
| **Message** | sendText | Y | phoneNumberId, recipient | README example; integration test |
| | sendImage | Partial | media id/link, phone | link path weakly tested |
| | sendVideo | Partial | id/link | same as image |
| | sendAudio | Y | media id | voice note path tested |
| | sendDocument | Y | media id, filename | tested |
| | sendSticker | Partial | media id | payload only |
| | sendLocation | Partial | lat/lng (defaults 0,0) | no range validation |
| | requestLocation | Partial | body text | payload only |
| | sendButtons | Partial | buttonId/rowId naming | limits validated |
| | sendList | Partial | rowId, sections | limits validated |
| | sendCtaUrl | Partial | url, button label | test arg-order bug |
| | sendProduct | Partial | catalogId, productRetailerId | paste-only IDs |
| | sendProductList | Partial | catalogId, sections | mock fixture mis-shaped |
| | sendCatalog | Partial | catalogId, thumbnail SKU | paste-only |
| | sendFlow | Partial | flowId XOR flowName, cta, token | runtime gaps |
| | sendCallPermission | Partial | body | payload only |
| | sendContact | Partial | vCard collections | phones required at runtime |
| | sendTemplate | Partial | template name, components | see Pass 03 |
| | sendReaction | Y | messageId, emoji | tested |
| | markRead | Y | messageId | tested |
| | list | Partial | cursors, Meta fields syntax | advanced filters |
| | get | Partial | messageId (WAMID) | paste from trigger OK |
| **Platform Message** | list | Partial | phoneNumberId, cursors | no date filters vs Meta list |
| | get | Partial | platformMessageId | paste from trigger OK |
| **Media** | uploadBinary | Y | phoneNumberId, binary field | |
| | uploadFromUrl | Y | ingestPhoneNumberId, delivery enum | README typo “Kapso Media” |
| | getUrl | Partial | mediaId, phone | two-step with download |
| | download | Partial | downloadToken | chain undocumented |
| | delete | Partial | mediaId | |
| **Contact** | get | Y | contactIdentifier (locator) | |
| | list | Y | cursor filters in Additional Options | |
| | create | Partial | wa_id format (+ vs no +) | inconsistent with message recipient |
| | update | Partial | at least one field | empty update throws at runtime |
| | erase | Y | contactIdentifier | |
| **Conversation** | get | Y | conversationId locator | |
| | list | Y | cursor filters | |
| | updateStatus | Y | conversationId, status enum | README example |
| **Broadcast** | create | Y | phone, template Meta ID | template loadOptions |
| | list | Partial | page pagination | no cursor like contacts |
| | addRecipients | Partial | phone XOR contactId, template params | carousel gaps Pass 03 |
| | send | Y | broadcastId | no body |
| | schedule | Y | broadcastId, scheduledAt | tested |
| | get | Y | broadcastId | |
| | listRecipients | Partial | broadcastId, page only | no filters |
| | cancel | Y | broadcastId | |
| **Block User** | block | Partial | digits-only phones | placeholder inconsistent |
| | unblock | Partial | same | |
| **Custom API Call** | custom | N | path, surface, body | **ACCEPT** escape hatch |

## README cross-check

| Jornada README | Ops usadas | Happy path? | Gap |
|----------------|------------|-------------|-----|
| Send Text | sendText | Y | — |
| Send Template | sendTemplate | Partial | Advanced JSON no step 4 ideal |
| Close Conversation | updateStatus | Y | — |
| Upload From URL | uploadFromUrl | Y | Delivery label wrong L156 |

## Pass 01 findings

### [P2] README cita delivery inválido
- **Pass:** 01
- **Superfície:** README → Upload From URL example
- **Arquivos:** README.md:156
- **Sintoma:** “Kapso Media” não existe na UI (0.6.1)
- **Evidência:** UI offers `Meta Media` / `Meta Resumable Asset` only
- **Fix proposto:** Atualizar README step 5
- **Esforço:** S
- **Decisão:** FIX

### [P2] README template example menciona Advanced JSON no passo 4
- **Pass:** 01
- **Superfície:** README → Send Template
- **Arquivos:** README.md:140-141
- **Sintoma:** Caminho feliz mistura builder e expert JSON
- **Evidência:** Step 4 lists Advanced Components JSON alongside standard builder
- **Fix proposto:** Mover Advanced JSON para nota “expert”; steps 4 = Standard/Carousel fields only
- **Esforço:** S
- **Decisão:** FIX

**Exit criteria:** 100% ops classificadas — **met**.
