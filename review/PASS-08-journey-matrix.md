# Pass 08 — Happy path journey matrix

**Versão:** 0.6.1  
**Método:** walkthrough código + routing.integration.test.ts (sem browser)

| # | Jornada | JSON manual? | Abriu doc? | Integration test? | Blockers |
|---|---------|--------------|------------|-------------------|----------|
| 1 | Trigger received → Send Text reply | No | Expression paths | trigger.test + sendText routing | P07 recipes README |
| 2 | Send Template standard + header image URL | No | parameterName se named vars | sendTemplate routing L111 | P03 header validation |
| 3 | Send Buttons + header document | No | buttonId naming | envelope only | P02 routing coverage |
| 4 | Send Flow published by name | No | flow fields | envelope only | P02 flowCta/token |
| 5 | Broadcast create → add recipients → schedule | No | — | create/schedule/addRecipients | P03 carousel if used |
| 6 | Contact create phones → update display | No | phone + format | create/update routing | P04 phone format |
| 7 | Conversation list → update ended | No | — | updateStatus routing | P04 list search |
| 8 | Upload URL → send image with media id | No | media id chain | uploadFromUrl routing | P05 README chain |
| 9 | Platform Message list + type filter | No | type string | platformMessage list query | P06 conversation id |
| 10 | Block → unblock | No | digits format | blockUser routing | P04 phone placeholder |

**JSON manual em todas:** **NO** (happy path não exige escape hatches).

**Gaps transversais:**
- List search client-side (P04-01 / P06) afeta jornadas 7, 9
- Routing integration shallow afeta confiança em 3, 4
- README gaps afetam 1, 8

## Pass 08 findings

### [P1] Jornada 7/9 bloqueada por list search fraco
- **Pass:** 08
- **Superfície:** Conversation/Platform Message workflows
- **Arquivos:** loadOptions/listSearch.ts
- **Decisão:** FIX (dedupe P04-01)

### [P2] Jornada 8 sem documentação encadeada
- **Pass:** 08
- **Superfície:** Media → Send Image
- **Arquivos:** README.md
- **Decisão:** FIX (dedupe P05)

**Exit criteria backlog ≤20:** delegated to FINAL-BACKLOG.md.
