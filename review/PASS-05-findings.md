# Pass 05 — Media + Platform Message findings

**Versão:** 0.6.1

---

### [P2] README delivery label “Kapso Media” obsoleto
- **Pass:** 05
- **Superfície:** README → Upload From URL
- **Arquivos:** README.md:156, properties/resource.fields.ts:714-715
- **Sintoma:** Usuário procura opção inexistente
- **Evidência:** UI só `meta_media` / `meta_resumable_asset`
- **Fix proposto:** README step 5 → “Meta Resumable Asset”
- **Esforço:** S
- **Decisão:** FIX

### [P2] Dois parâmetros phone para Media (ingestPhoneNumberId vs phoneNumberId)
- **Pass:** 05
- **Superfície:** Media operations
- **Arquivos:** properties/resource.fields.ts:677-693, properties/shared.fields.ts:38-53
- **Sintoma:** Confusão qual phone usar
- **Evidência:** uploadFromUrl usa ingestPhoneNumberId; demais ops phoneNumberId
- **Fix proposto:** Unificar em phoneNumberId ou notice explicando
- **Esforço:** M
- **Decisão:** DEFER

### [P2] Cadeia getUrl → download não documentada
- **Pass:** 05
- **Superfície:** Media → Download
- **Arquivos:** properties/resource.fields.ts:52-65, actions/routing.ts:611-619
- **Sintoma:** downloadToken origem obscura
- **Evidência:** Sem description linking prior getUrl output
- **Fix proposto:** README section + field description com expression hint
- **Esforço:** S
- **Decisão:** FIX

### [P2] platformMessageConversationId é string; conversationId é locator
- **Pass:** 05
- **Superfície:** Platform Message → List
- **Arquivos:** properties/platformMessage.fields.ts:59-64 vs resource.fields.ts:79-94
- **Sintoma:** Mesmo conceito, UX diferente
- **Evidência:** Plain string vs resourceLocator+search
- **Fix proposto:** Reutilizar searchConversations ou resourceLocator
- **Esforço:** M
- **Decisão:** FIX

### [P2] Platform Message list sem filtros de data (Meta list tem since/until)
- **Pass:** 05
- **Superfície:** Platform Message vs Message list
- **Arquivos:** platformMessage.fields.ts, shared.fields.ts:287-329
- **Sintoma:** Paridade de filtros incompleta
- **Evidência:** Meta message:list tem since/until; platformMessage não
- **Fix proposto:** Adicionar created_after/before se API Kapso suporta
- **Esforço:** M
- **Decisão:** DEFER

### [P2] mediaId/platformMessageId/messageId sem hints de expression
- **Pass:** 05
- **Superfície:** Media get/delete; Message get/markRead; Platform get
- **Arquivos:** properties/resource.fields.ts:24-35, platformMessage.fields.ts:4-16, message.fields.ts:932
- **Sintoma:** Paste-only OK mas trigger chain não documentada in-field
- **Evidência:** Descriptions genéricas
- **Fix proposto:** Descriptions: `={{ $json.message.id }}` etc.
- **Esforço:** S
- **Decisão:** FIX

### [P2] Platform Message list ainda scoped por phoneNumberId
- **Pass:** 05
- **Superfície:** Platform Message → List
- **Arquivos:** properties/shared.fields.ts:45-47, queryBuilders.ts:176
- **Sintoma:** “Cross-conversation” mas per phone
- **Evidência:** phone_number_id sempre enviado
- **Fix proposto:** Documentar no README (não bug se API exige)
- **Esforço:** S
- **Decisão:** ACCEPT

### [P2] Cadeia upload → send image não no README
- **Pass:** 05
- **Superfície:** Media + Message
- **Arquivos:** README.md (missing section)
- **Sintoma:** Usuário não sabe encadear media id
- **Evidência:** Só upload example; sem “use id in Send Image”
- **Fix proposto:** README example journey #8
- **Esforço:** S
- **Decisão:** FIX

**Exit criteria upload→getUrl→send:** **not met** until README/field hints (findings above).

**Tally:** FIX 5 · DEFER 2 · ACCEPT 1
