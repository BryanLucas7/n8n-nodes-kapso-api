# Pass 04 — Platform CRUD findings

**Versão:** 0.6.1

---

### [P0] List search filtra só 5 rows client-side (API não recebe query)
- **Pass:** 04
- **Superfície:** Resource locators (conversations, contacts, broadcasts)
- **Arquivos:** loadOptions/listSearch.ts:25-32,85-92, helpers.ts:8
- **Sintoma:** “Type to filter” não encontra matches fora da primeira página de 5
- **Evidência:** `matchesFilter` após `limit: 5`; filter string não vai para API
- **Fix proposto:** Passar filter para API se suportado; ou aumentar limit + documentar; ou server-side search endpoint
- **Esforço:** M
- **Decisão:** FIX

### [P1] contactValue pode usar phone/wa_id em vez de UUID
- **Pass:** 04
- **Superfície:** Contact locator → get/update/erase
- **Arquivos:** loadOptions/listSearch.ts:66-69
- **Sintoma:** GET `/contacts/{phone}` se row sem id
- **Evidência:** Fallback chain id→phone→wa_id
- **Fix proposto:** Value = id/uuid/contact_id only; phone só como display
- **Esforço:** S
- **Decisão:** FIX

### [P1] Formato telefone inconsistente contact vs message
- **Pass:** 04
- **Superfície:** Contact create vs Message recipient
- **Arquivos:** properties/resource.fields.ts:199-206 vs message.fields.ts:20-27
- **Sintoma:** Contact placeholder “with plus”; message “without plus”
- **Evidência:** Descrições conflitantes mesmo platform
- **Fix proposto:** Normalizar em builder (strip +) + placeholders alinhados
- **Esforço:** S
- **Decisão:** FIX

### [P2] Contact update falha se todos campos vazios
- **Pass:** 04
- **Superfície:** Contact → Update
- **Arquivos:** actions/platformPayloads.ts:73-90, properties/resource.fields.ts:209-256
- **Sintoma:** Runtime error “Provide at least one field”
- **Evidência:** Todos optional na UI
- **Fix proposto:** Notice ou validação UI “at least one”
- **Esforço:** S
- **Decisão:** FIX

### [P2] Broadcast list sem cursor pagination na UI
- **Pass:** 04
- **Superfície:** Broadcast → List
- **Arquivos:** broadcastList.fields.ts vs platformList.fields.ts:17-41
- **Sintoma:** Só page/per_page; contacts/conversations têm after/before
- **Evidência:** queryBuilders broadcast list sem cursor keys
- **Fix proposto:** Adicionar filtros cursor se API suporta; senão documentar diferença
- **Esforço:** M
- **Decisão:** DEFER

### [P2] recipientsBodyJson bypass total (escape hatch)
- **Pass:** 04
- **Superfície:** Broadcast → Add Recipients
- **Arquivos:** actions/platformPayloads.ts:121-124
- **Sintoma:** Expert override
- **Evidência:** Substitui builder inteiro
- **Fix proposto:** Nenhum
- **Esforço:** —
- **Decisão:** ACCEPT

### [P2] Date filters pass-through sem normalização ISO
- **Pass:** 04
- **Superfície:** Contact/Conversation/Broadcast list
- **Arquivos:** actions/queryBuilders.ts:97-165
- **Sintoma:** Formato dateTime n8n pode não bater Kapso
- **Evidência:** getPlatformListOptionString raw string
- **Fix proposto:** Normalizar toISOString() no builder
- **Esforço:** S
- **Decisão:** FIX

### [P2] searchBroadcasts não filtra por phone_number_id
- **Pass:** 04
- **Superfície:** Broadcast locator
- **Arquivos:** loadOptions/listSearch.ts:175-187 vs 142-147
- **Sintoma:** Lista broadcasts de todos os números
- **Evidência:** conversations passam phoneNumberId; broadcasts não
- **Fix proposto:** Opcional filter por broadcastPhoneNumberId se API suporta
- **Esforço:** S
- **Decisão:** DEFER

### [P2] broadcast:listRecipients sem filtros
- **Pass:** 04
- **Superfície:** Broadcast → List Recipients
- **Arquivos:** actions/queryBuilders.ts:274-316
- **Sintoma:** Só paginação page/per_page
- **Evidência:** buildOperationQuery retorna {} para listRecipients
- **Fix proposto:** Adicionar filtros se API documenta
- **Esforço:** M
- **Decisão:** DEFER

### [P2] Labels duplicados “Created After/Before” em platformList
- **Pass:** 04
- **Superfície:** Additional Options UX
- **Arquivos:** properties/platformList.fields.ts:55-100
- **Sintoma:** Confusão no picker
- **Evidência:** Mesmo displayName, names diferentes
- **Fix proposto:** Prefixar “Contact” / “Conversation” nos labels
- **Esforço:** S
- **Decisão:** FIX

### [P2] Block user phone placeholder vs contact create
- **Pass:** 04
- **Superfície:** Block User
- **Arquivos:** properties/resource.fields.ts:746-752 vs 199-206
- **Sintoma:** Inconsistência +/no +
- **Evidência:** Placeholders divergentes
- **Fix proposto:** Alinhar com normalização única
- **Esforço:** S
- **Decisão:** FIX (mesmo fix P1 phone format)

**Tally:** P0: 1 · P1: 2 · P2 FIX: 4 · DEFER: 3 · ACCEPT: 1

**Exit criteria broadcast lifecycle sem recipientsBodyJson no happy path:** **met** (builder cobre phone + template params).
