# Escape hatches — inventário (não fixar no escopo automação)

Superfícies onde o usuário **deve** conhecer a API Kapso/Meta. Classificação fixa salvo revisão explícita.

| Hatch | Arquivo(s) | Classificação | Notas |
|-------|------------|---------------|-------|
| Custom API Call | `properties/resource.fields.ts`, `actions/routing.ts` | **ACCEPT** | Path relativo, surface, method, bodyJson |
| `advancedComponentsJson` | `properties/shared.fields.ts` | **ACCEPT** | Label “expert use”; exige array JSON Meta |
| `recipientsBodyJson` | `properties/resource.fields.ts` | **ACCEPT** | Substitui builder de broadcast recipients |
| `recipientComponentsJson` | `properties/resource.fields.ts` | **ACCEPT** | Meta components por recipient |
| `contactMetadataJson` | `properties/resource.fields.ts` | **ACCEPT** | Metadata arbitrário Kapso |
| `flowInitialDataJson` | `properties/messageExtended.fields.ts` | **REVIEW** | Flow screen data — builder parcial possível |
| `flowActionDataJson` | `properties/templateShared.fields.ts` | **REVIEW** | Flow button action data |
| `messageResponseFields` | `properties/shared.fields.ts` | **ACCEPT** | Meta `fields` query syntax |
| `bodyJson` (Custom API) | `properties/resource.fields.ts` | **ACCEPT** | Corpo HTTP arbitrário |
| HMAC `rawBody` fallback | `trigger/signature.ts` | **ACCEPT** | Limitação runtime n8n; usa rawBody quando presente |

**Regra:** escape hatch no caminho feliz de uma jornada README = bug (P1), não ACCEPT.
