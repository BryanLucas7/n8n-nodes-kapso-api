# Pass 03 — Template / Carousel / Broadcast components findings

**Versão:** 0.6.1

---

### [P0] Carousel mode vazio cai para componentes standard
- **Pass:** 03
- **Superfície:** Message → Send Template (Carousel)
- **Arquivos:** actions/templateComponents.ts:320-349, properties/message.fields.ts:602-631
- **Sintoma:** UI em carousel mode sem cards envia header/body/button standard (shape errado)
- **Evidência:** `componentMode === 'carousel'` só emite carousel se `carouselCards.length > 0`; senão fallthrough
- **Fix proposto:** Se carousel mode e cards vazios → ApplicationError; não usar campos standard ocultos
- **Esforço:** S
- **Decisão:** FIX

### [P1] Carousel card header media opcional
- **Pass:** 03
- **Superfície:** Send Template / Broadcast recipients (carousel)
- **Arquivos:** properties/message.fields.ts:803-820, actions/templateComponents.ts:281-295
- **Sintoma:** Cards sem header quando template exige
- **Evidência:** cardHeaderMediaUrl/Id sem required; builder omite header
- **Fix proposto:** required quando card header type exige media
- **Esforço:** S
- **Decisão:** FIX

### [P1] Button type “Flow Action” exposto mas não mapeado
- **Pass:** 03
- **Superfície:** Template buttons
- **Arquivos:** properties/templateShared.fields.ts:12-16, actions/templateComponents.ts:208-212
- **Sintoma:** Selecionar “Flow Action” envia text vazio
- **Evidência:** `buildTemplateButtonParameterValue` só trata payload; default text
- **Fix proposto:** Implementar action type ou remover opção da UI
- **Esforço:** M
- **Decisão:** FIX

### [P1] recipientComponentsJson aceita array vazio
- **Pass:** 03
- **Superfície:** Broadcast → Add Recipients
- **Arquivos:** actions/templateComponents.ts:310-317, actions/platformPayloads.ts:146-148
- **Sintoma:** `components: []` anexado ao recipient
- **Evidência:** Array vazio parse OK, sem reject
- **Fix proposto:** Rejeitar array vazio quando JSON fornecido
- **Esforço:** S
- **Decisão:** FIX

### [P2] Template buttons com buttonText vazio
- **Pass:** 03
- **Superfície:** Template buttons (url/quick_reply)
- **Arquivos:** actions/templateComponents.ts:265-277
- **Sintoma:** `{ type: "text", text: "" }` enviado
- **Evidência:** Sem throw exceto copy_code
- **Fix proposto:** Validar buttonText por sub_type
- **Esforço:** S
- **Decisão:** FIX

### [P2] Catalog/MPM buttons com action vazio
- **Pass:** 03
- **Superfície:** Template catalog/mpm buttons
- **Arquivos:** actions/templateComponents.ts:154-180
- **Sintoma:** `{ action: {} }` parcial
- **Evidência:** Thumbnail/sections opcionais no builder
- **Fix proposto:** Validar campos obrigatórios por sub_type
- **Esforço:** S
- **Decisão:** FIX

### [P2] Broadcast recipient location header sem required lat/lng
- **Pass:** 03
- **Superfície:** Broadcast Add Recipients
- **Arquivos:** properties/resource.fields.ts:474-496 vs message.fields.ts:696-723
- **Sintoma:** Inconsistente com sendTemplate
- **Evidência:** sendTemplate required; broadcast não
- **Fix proposto:** Alinhar required + parseCoordinate
- **Esforço:** S
- **Decisão:** FIX

### [P2] Standard header media omitido silenciosamente
- **Pass:** 03
- **Superfície:** Send Template standard mode
- **Arquivos:** actions/templateComponents.ts:77-102
- **Sintoma:** image/video/document sem URL/ID → sem header
- **Evidência:** buildTemplateHeaderParameters retorna undefined
- **Fix proposto:** Throw quando headerType exige valor
- **Esforço:** S
- **Decisão:** FIX

### [P2] Carousel cardIndex sem validação unicidade
- **Pass:** 03
- **Superfície:** Carousel mode
- **Arquivos:** actions/templateComponents.ts:324-327
- **Sintoma:** Índices duplicados/ausentes
- **Evidência:** Só descrição UI avisa
- **Fix proposto:** Validar unique card_index set
- **Esforço:** S
- **Decisão:** DEFER

### [P2] Advanced JSON bypassa toda validação builder
- **Pass:** 03
- **Superfície:** Send Template / Broadcast
- **Arquivos:** actions/templateComponents.ts:310-317
- **Sintoma:** Expert path sem guard rails (esperado)
- **Evidência:** Early return com parsed array
- **Fix proposto:** Nenhum (escape hatch)
- **Esforço:** —
- **Decisão:** ACCEPT

### [P2] Duplicação header media fields message vs templateShared
- **Pass:** 03
- **Superfície:** Manutenção UI
- **Arquivos:** properties/templateShared.fields.ts:183-236 vs message.fields.ts:648-694
- **Sintoma:** Drift entre message e broadcast UIs
- **Evidência:** Helpers shared não reutilizados em sendTemplate
- **Fix proposto:** Refactor para reutilizar templateMediaSourceField
- **Esforço:** M
- **Decisão:** DEFER

**Tally:** P0: 1 · P1: 3 · P2 FIX: 5 · DEFER: 2 · ACCEPT: 1
