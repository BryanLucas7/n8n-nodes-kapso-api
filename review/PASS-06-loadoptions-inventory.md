# Pass 06 — Load options inventory

**Versão:** 0.6.1

| Field | loadOptions / listSearch? | Acceptable? | Fix? |
|-------|---------------------------|-------------|------|
| `phoneNumberId` | Yes — `getPhoneNumbers` | Yes | — |
| `ingestPhoneNumberId` | Yes — `getPhoneNumbers` | Yes | Unificar com phoneNumberId (DEFER) |
| `broadcastPhoneNumberId` | Yes — `getPhoneNumbers` | Yes | — |
| `broadcastTemplateId` | Yes — `getBroadcastTemplates` | Yes | — |
| `templateName` | Yes — `getMessageTemplates` | Yes | — |
| `conversationId` | Yes — `searchConversations` | Yes | Search quality see P04-01 |
| `contactIdentifier` | Yes — `searchContacts` | Partial | P04-02 value fallback |
| `broadcastId` | Yes — `searchBroadcasts` | Partial | No phone filter P04-09 |
| `mediaId` | No | Yes | Add expression hint (FIX) |
| `downloadToken` | No | Yes | Document from getUrl (FIX) |
| `platformMessageId` | No | Yes | Expression hint (FIX) |
| `messageId` | No | Yes | Expression hint (FIX) |
| `reactionMessageId` | No | Yes | Expression hint (FIX) |
| `mediaValue` (id mode) | No | Yes | From upload step |
| `platformMessageConversationId` | No | **No** | Use locator (FIX) |
| `messageListConversationId` | No | **No** | Use locator (FIX) |
| `replyToMessageId` | No | Yes | Trigger expression (FIX doc) |
| `broadcastListPhoneNumberId` | No | **No** | Add getPhoneNumbers (FIX) |
| `conversationPhoneNumberId` (list filter) | No | **No** | Add getPhoneNumbers (FIX) |
| `whatsappContactId` (broadcast recipient) | No | Partial | searchContacts optional (DEFER) |
| `recipient` | No | Yes | From trigger |
| `flowId` / `flowName` | No | Yes | No flows API in package |
| `catalogId` | No | Yes | Commerce setup (dashboard) |
| `productRetailerId` | No | Yes | Catalog-specific |

## Pass 06 findings

### [P1] List search client-side only (duplicate P04-01)
- **Pass:** 06
- **Superfície:** All resourceLocators
- **Arquivos:** loadOptions/listSearch.ts
- **Decisão:** FIX (see Pass 04)

### [P2] platformMessageConversationId / messageListConversationId paste-only
- **Pass:** 06
- **Superfície:** Platform Message list, Message list filters
- **Arquivos:** platformMessage.fields.ts:59-64, shared.fields.ts:177-178
- **Fix proposto:** resourceLocator + searchConversations
- **Esforço:** M
- **Decisão:** FIX

### [P2] broadcastListPhoneNumberId / conversationPhoneNumberId sem dropdown
- **Pass:** 06
- **Superfície:** List filter Additional Options
- **Arquivos:** broadcastList.fields.ts:29-32, platformList.fields.ts:140-142
- **Fix proposto:** type options + getPhoneNumbers
- **Esforço:** S
- **Decisão:** FIX

**Exit criteria:** paste-only no happy path without ACCEPT — **met** exceto conversation filter fields (FIX above).
