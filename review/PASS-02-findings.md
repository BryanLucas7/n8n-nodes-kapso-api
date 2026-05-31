# Pass 02 — Message send (non-template) findings

**Versão:** 0.6.1 | **Ops:** sendText → markRead (19, excl. sendTemplate)

## Operation summary

| Operation | Happy path |
|-----------|------------|
| sendText, sendAudio, sendDocument, sendReaction, markRead | Y |
| sendImage, sendVideo, sendSticker, sendLocation, requestLocation, sendButtons, sendList, sendCtaUrl, sendProduct, sendProductList, sendCatalog, sendFlow, sendCallPermission, sendContact | Partial |

---

### [P1] Mock sendProductList usa shape errado de productItems
- **Pass:** 02
- **Superfície:** Message → Send Product List
- **Arquivos:** test/helpers/mockExecuteFunctions.ts:106-108, properties/messageExtended.fields.ts:299-310, actions/routing.ts:164-191
- **Sintoma:** Testes passam com `product_items: []` silenciosamente
- **Evidência:** Mock aninha `productItems.productItems`; schema UI usa `productItems.product[]`
- **Fix proposto:** Corrigir mock para `{ product: [{ productRetailerId }] }`; assert routing body
- **Esforço:** S
- **Decisão:** FIX

### [P1] sendProductList permite seções sem produtos
- **Pass:** 02
- **Superfície:** Message → Send Product List
- **Arquivos:** actions/validation.ts:29-33, actions/messagePayloads.ts:721-757
- **Sintoma:** API Meta rejeita; node não valida
- **Evidência:** `assertProductListSectionCount` só conta seções, não produtos por seção
- **Fix proposto:** `assertProductListSectionShape` exige ≥1 product_retailer_id por seção
- **Esforço:** S
- **Decisão:** FIX

### [P1] sendFlow não valida flowCta/flowToken vazios em runtime
- **Pass:** 02
- **Superfície:** Message → Send Flow
- **Arquivos:** properties/messageExtended.fields.ts:414-441, actions/routing.ts:424-461
- **Sintoma:** 400 Meta opaco
- **Evidência:** UI `required: true` mas routing passa strings vazias; mock sem flowCta/flowToken
- **Fix proposto:** Guards em routing espelhando id/name XOR
- **Esforço:** S
- **Decisão:** FIX

### [P1] Routing integration é envelope-only para 12+ sends
- **Pass:** 02
- **Superfície:** Message sends (geral)
- **Arquivos:** test/unit/routing.integration.test.ts:168-176
- **Sintoma:** Regressões field→payload não detectadas
- **Evidência:** Só sendText, sendAudio, sendDocument, sendReaction, markRead assert body shape
- **Fix proposto:** Um teste de body por operação send*
- **Esforço:** L
- **Decisão:** FIX

### [P1] sendFlow id/name validation sem teste de routing
- **Pass:** 02
- **Superfície:** Message → Send Flow
- **Arquivos:** actions/routing.ts:429-435
- **Sintoma:** Validação XOR pode regredir
- **Evidência:** Zero routing.integration cases para neither/both id+name
- **Fix proposto:** 3 testes ApplicationError
- **Esforço:** S
- **Decisão:** FIX

### [P2] parseCoordinate sem range lat/lng
- **Pass:** 02
- **Superfície:** Message → Send Location / interactive location headers
- **Arquivos:** actions/validation.ts:3-10
- **Sintoma:** 999,999 passa client-side
- **Evidência:** Só `Number.isFinite`
- **Fix proposto:** lat ∈ [-90,90], lng ∈ [-180,180]
- **Esforço:** S
- **Decisão:** FIX

### [P2] sendLocation defaults Null Island (0,0)
- **Pass:** 02
- **Superfície:** Message → Send Location
- **Arquivos:** properties/messageExtended.fields.ts:16,32, actions/routing.ts:309-310
- **Sintoma:** Node mal configurado envia 0,0
- **Evidência:** Default numérico 0 + fallback getNumber(..., 0)
- **Fix proposto:** Remover default ou rejeitar (0,0)
- **Esforço:** S
- **Decisão:** DEFER

### [P2] Header text opcional quando type=text
- **Pass:** 02
- **Superfície:** Interactive sends
- **Arquivos:** actions/messagePayloads.ts:109-110
- **Sintoma:** Header omitido silenciosamente
- **Evidência:** `resolveInteractiveHeader` retorna undefined se text vazio
- **Fix proposto:** required condicional ou throw
- **Esforço:** S
- **Decisão:** DEFER

### [P2] sendContact phone-required path untested
- **Pass:** 02
- **Superfície:** Message → Send Contact
- **Arquivos:** actions/messagePayloads.ts:365-369
- **Sintoma:** Guard pode regredir
- **Evidência:** Só happy path em payloads.test.ts
- **Fix proposto:** expect().toThrow test
- **Esforço:** S
- **Decisão:** FIX

### [P2] sendCtaUrl test passa footer como headerMediaUrl
- **Pass:** 02
- **Superfície:** Message → Send CTA URL
- **Arquivos:** test/unit/payloads.test.ts:393-418
- **Sintoma:** Footer nunca testado
- **Evidência:** 8º arg é headerMediaUrl, não footer (11º)
- **Fix proposto:** Corrigir ordem de args + assert footer
- **Esforço:** S
- **Decisão:** FIX

### [P2] sendImage/sendVideo link media untested in routing
- **Pass:** 02
- **Superfície:** Message → Send Image/Video
- **Arquivos:** actions/routing.ts:217-235
- **Sintoma:** mediaSource=link mapping frágil
- **Evidência:** Nenhum routing test com link
- **Fix proposto:** Integration test `{ image: { link } }`
- **Esforço:** S
- **Decisão:** FIX

### [P2] validation.ts sem unit tests dedicados
- **Pass:** 02
- **Superfície:** validation helpers
- **Arquivos:** actions/validation.ts
- **Sintoma:** Guards testados só indiretamente
- **Evidência:** No validation.test.ts
- **Fix proposto:** test/unit/validation.test.ts
- **Esforço:** S
- **Decisão:** FIX

### [P2] sendList nested row shape untested at routing
- **Pass:** 02
- **Superfície:** Message → Send List
- **Arquivos:** actions/routing.ts:141-158
- **Sintoma:** extractListRows nested path nunca exercitado
- **Evidência:** Mock usa flat rows only
- **Fix proposto:** Routing test flat + nested
- **Esforço:** M
- **Decisão:** FIX

### [P2] sendContact fora de messageReplyOperations
- **Pass:** 02
- **Superfície:** Message → Send Contact
- **Arquivos:** actions/operations.ts:125-137
- **Sintoma:** Sem reply-to em contacts
- **Evidência:** Omissão intencional provável (Meta)
- **Fix proposto:** Documentar limitação ou adicionar se Meta suporta
- **Esforço:** M
- **Decisão:** ACCEPT

**Tally:** FIX 10 · DEFER 2 · ACCEPT 1
