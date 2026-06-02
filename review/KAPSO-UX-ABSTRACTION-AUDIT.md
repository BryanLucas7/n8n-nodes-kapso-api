# Kapso UX and Abstraction Audit

Date: 2026-06-01

Scope: current working tree of `n8n-nodes-kapso-api` after the published `0.7.3` release. This document consolidates the four subagent reviews and revises them into an implementation-ready backlog.

Goal: every common Kapso/n8n journey should be usable without reading Kapso or Meta API documentation. Documentation knowledge should be encoded as guided fields, resource locators, load options, notices, validations, and structured builders. `Custom API Call` and `Advanced JSON` remain escape hatches, not happy paths.

## Inputs Reviewed

- Agent 1: `Send Template` UX, template parsing, resource mapper, carousel, MPM, Advanced JSON.
- Agent 2: `Send Flow` UX, Flow selection, draft/published handling, metadata, initial data mapper.
- Agent 3: `Broadcast` UX, create/add recipients/send/schedule, input items, recipient mapping.
- Agent 4: descriptions/display names/notices across node, trigger, send-and-wait, resource labels.
- Public Kapso docs:
  - Send message: https://docs.kapso.ai/api/meta/whatsapp/messages/send-a-message
  - List templates: https://docs.kapso.ai/api/meta/whatsapp/templates/list-message-templates
  - Sending Flows: https://docs.kapso.ai/docs/whatsapp/flows/sending-flows
  - Create broadcast: https://docs.kapso.ai/api/platform/v1/broadcasts/create-broadcast
  - Add recipients: https://docs.kapso.ai/api/platform/v1/broadcasts/add-recipients

## Executive Summary

No P0 was found by the subagents. The main remaining gap is UX depth: the code now has strong abstractions for several flows, but some paths still leak Meta/Kapso internals or require users to infer schema from documentation.

Highest priority work:

1. Fix template dynamic button detection and empty Advanced JSON behavior.
2. Make template selection searchable/paginated instead of first-100 options.
3. Make carousel and MPM template sends structured, not JSON/manual-index heavy.
4. Make Send Flow robust when metadata is missing, stale, or draft-specific.
5. Make Broadcast Add Recipients guided by detected template structure, including input-items schema.
6. Improve descriptions so fields explain dashboard prerequisites and next steps.

## P1 Backlog

### Send Template

| ID | Finding | Files | Impact | Required Fix |
|---|---|---|---|---|
| TPL-01 | Dynamic button variable detection can fail because global regex state is reused. | `nodes/KapsoApi/loadOptions/templateDefinition.ts` | Some URL/quick-reply button fields may not appear, forcing manual JSON/API knowledge. | Replace global `.test()` usage with non-global helpers or reset `lastIndex`. Add tests with multiple dynamic buttons in sequence. |
| TPL-02 | Template picker uses options plus `limit: 100`, not paginated list search. | `nodes/KapsoApi/properties/message.fields.ts`, `nodes/KapsoApi/loadOptions/templates.ts`, `nodes/KapsoApi/loadOptions/templateFetch.ts` | Accounts with many templates may not find the desired approved template. | Convert Template to `resourceLocator` with paginated/searchable list mode and manual `template_name|language_code` fallback. |
| TPL-03 | Carousel path still requires card count/order/placeholders/button indices knowledge. | `nodes/KapsoApi/properties/message.fields.ts`, `nodes/KapsoApi/actions/templateInput.ts`, `nodes/KapsoApi/loadOptions/templateDefinition.ts` | User must understand Meta carousel component structure. | Generate guided fields per detected carousel card from `definition.carouselCards`, including body variables and button fields. |
| TPL-04 | MPM button still asks for JSON in the normal mapper path. | `nodes/KapsoApi/resourceMapping/templateParameters.ts`, `nodes/KapsoApi/properties/message.fields.ts`, `nodes/KapsoApi/properties/templateShared.fields.ts` | User must know `product_items` / `product_retailer_id` schema. | Reuse structured MPM section/product fields from `templateShared.fields.ts`; keep JSON only under Advanced JSON. |
| TPL-05 | `Advanced Components JSON` default `[]` can be interpreted as selected advanced components and rejected as empty. | `nodes/KapsoApi/properties/shared.fields.ts`, `nodes/KapsoApi/actions/messagePayloads.ts`, `nodes/KapsoApi/actions/templateComponents.ts` | User can add the option and fail without changing anything. | Change default to empty string or normalize `[]` as absent before advanced component parsing. |
| TPL-06 | Send Template fetches template identity/definition more than once. | `nodes/KapsoApi/actions/routing.ts`, `nodes/KapsoApi/actions/templateInput.ts`, `nodes/KapsoApi/loadOptions/templateFetch.ts` | Extra latency and higher rate-limit/error surface. | Resolve identity and definition once per item and pass it through the builder. |

### Send Flow

| ID | Finding | Files | Impact | Required Fix |
|---|---|---|---|---|
| FLOW-01 | Flow list search fetches version assets but ignores `assets.jsonVersion`. | `nodes/KapsoApi/loadOptions/flowSearch.ts`, `nodes/KapsoApi/loadOptions/flowAssets.ts` | Sends can fall back to `flow_message_version: "3"` even when Flow JSON uses another version. | Encode `assets.jsonVersion ?? entry.json_version`; use `flow_json.version` as fallback. |
| FLOW-02 | Flow list search ignores `assets.hasDataEndpoint`. | `nodes/KapsoApi/loadOptions/flowSearch.ts` | Flow with data endpoint can default to `navigate`, hiding data-exchange UX. | Encode `assets.hasDataEndpoint ?? Boolean(entry.has_data_endpoint)`. |
| FLOW-03 | Execute path relies on metadata embedded in `flowId`. | `nodes/KapsoApi/actions/routing.ts` | Manual/By ID or stale selection still requires users to know action, screen, version. | Load Flow assets during execute when selection metadata is missing/incomplete. |
| FLOW-04 | Draft Flow assets can be resolved as published. | `nodes/KapsoApi/loadOptions/flowAssets.ts` | Draft Flow selection may send as draft but load screens/actions/data from published version. | Preserve selected draft status when no explicit mode override is set. |
| FLOW-05 | Flow Initial Data mapper does not validate keys against selected Flow/screen during execute. | `nodes/KapsoApi/actions/flowMapperInput.ts`, `nodes/KapsoApi/resourceMapping/flowInitialData.ts` | Stale mapper fields can be sent silently after changing Flow or screen. | Reuse template-style validation: reject unexpected keys and screen mismatch with user-facing errors. |

### Broadcast

| ID | Finding | Files | Impact | Required Fix |
|---|---|---|---|---|
| BCAST-01 | Recipient builder shows header/media/location/carousel/Advanced JSON fields regardless of detected template. | `nodes/KapsoApi/properties/broadcast.fields.ts` | User must know which fields apply to the broadcast template. | Condition fields by `broadcastDetectedHeaderFormat` and `broadcastDetectedComponentMode`, mirroring Send Template. |
| BCAST-02 | `From Input Items` does not expose expected item keys. | `nodes/KapsoApi/properties/broadcast.fields.ts`, `nodes/KapsoApi/actions/broadcastRecipientInput.ts` | User has to inspect docs/code to prepare Sheets/CSV/input JSON. | Add schema preview or mapper that lists exact expected columns for the selected broadcast template. |
| BCAST-03 | `From Input Items` does not support carousel cards. | `nodes/KapsoApi/actions/broadcastRecipientInput.ts`, `nodes/KapsoApi/actions/templateInput.ts` | Carousel broadcast input-items mode appears supported but fails. | Either block input-items for carousel with clear notice, or support `card_0_*` structured keys. Recommended: support structured keys. |
| BCAST-04 | Input-items body mapper forces all body variables to text. | `nodes/KapsoApi/actions/broadcastRecipientInput.ts`, `nodes/KapsoApi/actions/templateMapperInput.ts` | Currency/date templates cannot be sent from input items without advanced JSON. | Reuse Send Template body variable type handling, including currency/date suffix fields. |
| BCAST-05 | Broadcast template picker can silently return empty and only checks first 100. | `nodes/KapsoApi/loadOptions/broadcastTemplateSearch.ts` | User cannot distinguish missing dashboard setup from pagination/search issue. | Add WABA/template prerequisite warning and paginated/server-side search. |

## P2 Backlog

### Send Template

| ID | Finding | Files | Required Fix |
|---|---|---|---|
| TPL-07 | Detected header/layout fields use internal labels like `Name or ID`. | `nodes/KapsoApi/properties/message.fields.ts` | Rename to `Detected Template Header Format` and `Detected Template Layout`; describe as auto-loaded/read-only metadata. |
| TPL-08 | Body mapper lacks template context/examples. | `nodes/KapsoApi/resourceMapping/templateParameters.ts` | Include body preview/example values where available. |
| TPL-09 | Button mapper labels are zero-indexed and lack approved button text. | `nodes/KapsoApi/resourceMapping/templateParameters.ts` | Use labels like `Button 1 (index 0) - URL Suffix` and include button label/type. |

### Send Flow

| ID | Finding | Files | Required Fix |
|---|---|---|---|
| FLOW-06 | Flow Mode appears after the Flow picker, but draft search depends on Flow Mode. | `nodes/KapsoApi/properties/messageExtended.fields.ts` | Move Flow Mode before picker or expose a visible draft/published toggle near Flow. |
| FLOW-07 | Searching by Meta Flow ID can fail because remote query uses `name_contains`. | `nodes/KapsoApi/loadOptions/flowSearch.ts` | If filter looks ID-like, avoid `name_contains` or use API-supported ID filter. |
| FLOW-08 | Flow Action default is empty but dropdown looks unresolved. | `nodes/KapsoApi/properties/messageExtended.fields.ts` | Add explicit `Auto (Detected From Flow)` option with empty value. |
| FLOW-09 | Flow CTA limit is inconsistent: description says 1-20 but validation/default use different max. | `nodes/KapsoApi/properties/fieldConstraints.ts`, `nodes/KapsoApi/loadOptions/flowSelection.ts` | Align description, validation constant, and default truncation. |

### Broadcast

| ID | Finding | Files | Required Fix |
|---|---|---|---|
| BCAST-06 | Recipient Contact ID is manual string despite existing contact search. | `nodes/KapsoApi/properties/broadcast.fields.ts`, `nodes/KapsoApi/properties/resource.fields.ts` | Use `resourceLocator` with `searchContacts` plus By ID fallback. |
| BCAST-07 | Broadcast locator lists campaigns without operation-aware status filtering. | `nodes/KapsoApi/loadOptions/listSearch.ts`, `nodes/KapsoApi/properties/broadcast.fields.ts` | Search draft broadcasts for Add Recipients/Send/Schedule and scheduled broadcasts for Cancel where possible. |
| BCAST-08 | Send/Schedule POST directly; user discovers missing recipients/status only from API error. | `nodes/KapsoApi/actions/routing.ts` | Add preflight GET or dynamic notice with status, recipient count, and prerequisites. |
| BCAST-09 | Flow template button mapper exposes only Flow token in standard mapper. | `nodes/KapsoApi/resourceMapping/templateParameters.ts`, `nodes/KapsoApi/properties/templateShared.fields.ts` | Align Flow button abstraction with Send Flow where feasible, including action data and token default policy. |

## Descriptions and Copy Improvements

Apply this rule globally: each useful field description should explain what the value is, where to get it in Kapso/n8n, and what happens next.

### Node and Resource Level

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/KapsoApi.node.ts` | Node description says it uses documented APIs, not what it helps users do. | "Send WhatsApp messages, templates, flows, media, contacts, broadcasts, and inbox records through Kapso. Choose a resource, then follow each operation's setup hints." |
| `nodes/KapsoApi/properties/index.ts` | Resource field has no description. | Explain Message vs Platform Message vs Broadcast at the resource selector. |
| `nodes/KapsoApi/actions/operations.ts` | Resource options have no descriptions. | Add option descriptions for Message, Platform Message, Media, Contact, Conversation, Broadcast, Block User, Custom API Call. |

### Shared Phone Number and IDs

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/properties/shared.fields.ts` | Phone Number description is generic n8n text. | Say it loads from connected Kapso WhatsApp numbers and is used for sends/templates/flows/catalogs. |
| `nodes/KapsoApi/properties/platformMessage.fields.ts` | WAMID field does not say where to obtain it. | "WAMID from Kapso Trigger, List Messages, or Platform Message List." |
| `nodes/KapsoApi/properties/resource.fields.ts` | Contact create field is labeled WhatsApp ID while helper expects E.164 phone. | Rename to Contact Phone Number or clearly explain E.164 phone stored as `wa_id`. |
| `nodes/KapsoApi/properties/resource.fields.ts` | Upload media phone field does not explain why phone is needed. | "Used to ingest the URL into the selected WhatsApp account's media store." |

### Send Template Copy

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/properties/message.fields.ts` | Template description omits dashboard approval/sync prerequisite. | Explain template must be approved in Kapso/Meta first and refreshed after approval. |
| `nodes/KapsoApi/properties/message.fields.ts` | Header/layout fields look manually editable. | Rename as detected values and tell users to refresh when template changes. |
| `nodes/KapsoApi/properties/message.fields.ts` | Body mapper notice does not explain empty fields. | If no fields appear, template has no body variables or is carousel. |
| `nodes/KapsoApi/properties/message.fields.ts` | Header media source lacks source guidance. | Public Link must be Meta-accessible HTTPS; Media ID comes from Upload Media/Kapso Trigger and must match approved template type. |
| `nodes/KapsoApi/properties/message.fields.ts` | Carousel card instruction lacks index guidance. | Explain one card per approved template card and zero-based card index. |
| `nodes/KapsoApi/properties/message.fields.ts` | MPM JSON text leaks schema. | Replace with structured section/product guidance once TPL-04 is implemented. |

### Send Flow Copy

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/properties/fieldConstraints.ts` | Flow field lacks dashboard/draft prerequisite. | Explain Flow comes from Kapso Dashboard and draft flows require Flow Mode Draft. |
| `nodes/KapsoApi/properties/fieldConstraints.ts` | "Flow JSON" leaks internals. | Describe screen as first screen recipient sees. |
| `nodes/KapsoApi/properties/messageExtended.fields.ts` | Encryption notice says what but not where. | Say configure Flow encryption in Kapso Dashboard before data-exchange messages. |
| `nodes/KapsoApi/properties/messageExtended.fields.ts` | Initial Data mentions `flow_json` and version API. | Say fields are loaded from the selected Flow screen and should be defined in the Flow builder. |
| `nodes/KapsoApi/resourceMapping/flowInitialData.ts` | Empty notice says `flow_json`. | "This selected Flow screen does not define initial data fields in the Flow builder." |

### Broadcast Copy

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Create notice says copy ID manually. | "Create returns a draft campaign. Next use Add Recipients and select it from From List or map `{{$json.data.id}}`, then Send or Schedule." |
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Template description lacks approved/template scope prerequisite. | Explain template must be approved for selected phone number's WABA. |
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Add Recipients notice mentions raw GET path. | Replace with flow language: choose a draft broadcast; node reads its template; add recipients only in Draft. |
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Input-items description does not list key names. | List phone/contact key plus template variable names, header fields, and button field examples. |
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Phone JSON Field says `$json.phone` but field expects key name. | "Name of the input JSON key containing the E.164 phone number, for example `phone`." |
| `nodes/KapsoApi/properties/broadcast.fields.ts` | Advanced broadcast body description is too raw. | Explain it is only for prebuilt payloads when builder/input-items cannot express components. |

### Trigger and Send and Wait Copy

| Location | Current Problem | Replacement Direction |
|---|---|---|
| `nodes/KapsoApi/KapsoTrigger.node.ts` | Description does not mention webhook URL/secret setup. | Explain copying n8n webhook URL into Kapso and using matching Webhook Secret. |
| `nodes/KapsoApi/trigger/notes.ts` | "this URL" is ambiguous. | Distinguish Production URL vs Test URL and point to Kapso Dashboard webhooks. |
| `nodes/KapsoApi/trigger/notes.ts` | Event outputs are listed but not explained. | Explain each output maps to event type, unknown goes to Other Event, item includes original payload plus `kapso_event`. |
| `nodes/KapsoApi/sendAndWait/utils.ts` | Delivery copy only says Send Text. | Explain Text Links vs CTA URL and approval/decline behavior. |
| `nodes/KapsoApi/sendAndWait/descriptions.ts` | Timeout copy does not say downstream effect. | Explain workflow resumes automatically and downstream data may not contain approval click. |

## Reusable Abstractions to Replicate

| Existing Good Pattern | Where | Replicate To |
|---|---|---|
| Credential descriptions include dashboard path and technical effect. | `credentials/KapsoApi.credentials.ts` | Phone Number, Template, Flow, Trigger setup. |
| Broadcast locator explains next step and search result content. | `nodes/KapsoApi/properties/broadcast.fields.ts` | Contact, Conversation, Template, Flow. |
| Concrete operational limit notices. | `nodes/KapsoApi/properties/broadcast.fields.ts` | Message buttons, list rows, template carousel, media limits. |
| Value origin hints like "Upload Media or Kapso Trigger". | `nodes/KapsoApi/properties/fieldConstraints.ts` | WAMID, template IDs, contact IDs, broadcast IDs. |
| Product/Catalog sequence guidance. | `nodes/KapsoApi/properties/fieldConstraints.ts` | Send Template, Send Flow, Broadcast Add Recipients. |
| Dynamic Flow preview notice. | `nodes/KapsoApi/properties/flowDisplayConditions.ts` | Template preview/status and broadcast template/status where possible. |
| Delivery mode options explain tradeoffs and restrictions. | `nodes/KapsoApi/sendAndWait/utils.ts` | Media Source, Header Type, Recipient Source, Flow Mode. |

## Implementation Plan

### Worker A: Send Template

Ownership:

- `nodes/KapsoApi/loadOptions/templateDefinition.ts`
- `nodes/KapsoApi/loadOptions/templates.ts`
- `nodes/KapsoApi/loadOptions/templateFetch.ts`
- `nodes/KapsoApi/properties/message.fields.ts`
- `nodes/KapsoApi/resourceMapping/templateParameters.ts`
- `nodes/KapsoApi/actions/templateInput.ts`
- `nodes/KapsoApi/actions/templateMapperInput.ts`
- `nodes/KapsoApi/actions/templateComponents.ts`
- Template tests.

Tasks:

1. Fix non-global variable detection.
2. Add paginated resourceLocator/listSearch template selection.
3. Normalize empty Advanced JSON.
4. Add template preview/examples in mapper fields.
5. Implement structured carousel card fields.
6. Replace MPM JSON happy path with structured section/product fields.
7. Remove duplicate template fetches in execute path.

### Worker B: Send Flow

Ownership:

- `nodes/KapsoApi/loadOptions/flowSearch.ts`
- `nodes/KapsoApi/loadOptions/flowAssets.ts`
- `nodes/KapsoApi/loadOptions/flowSelection.ts`
- `nodes/KapsoApi/actions/flowMapperInput.ts`
- `nodes/KapsoApi/actions/routing.ts`
- `nodes/KapsoApi/properties/messageExtended.fields.ts`
- `nodes/KapsoApi/resourceMapping/flowInitialData.ts`
- Flow tests.

Tasks:

1. Encode complete Flow metadata from version assets.
2. Preserve draft/published status correctly.
3. Fetch Flow assets during execute when metadata is incomplete.
4. Validate Flow Initial Data keys against selected screen.
5. Move or expose Flow Mode before/near Flow picker.
6. Add `Auto (Detected From Flow)` action option.
7. Align Flow CTA max length and truncation.

### Worker C: Broadcast

Ownership:

- `nodes/KapsoApi/properties/broadcast.fields.ts`
- `nodes/KapsoApi/actions/broadcastRecipientInput.ts`
- `nodes/KapsoApi/actions/platformPayloads.ts`
- `nodes/KapsoApi/loadOptions/broadcastTemplateSearch.ts`
- `nodes/KapsoApi/loadOptions/listSearch.ts`
- `nodes/KapsoApi/resourceMapping/broadcastRecipientParameters.ts`
- Broadcast tests.

Tasks:

1. Condition recipient builder fields by detected template structure.
2. Add input-items schema preview/mapper.
3. Support or clearly block carousel input-items mode.
4. Reuse Template mapper type handling for currency/date-time.
5. Convert recipient contact ID to contact resourceLocator.
6. Add operation-aware broadcast search/status filtering.
7. Add Send/Schedule preflight or clear local validation.
8. Paginate/warn broadcast template picker.

### Worker D: Descriptions and Notices

Ownership:

- `nodes/KapsoApi/KapsoApi.node.ts`
- `nodes/KapsoApi/actions/operations.ts`
- `nodes/KapsoApi/properties/index.ts`
- `nodes/KapsoApi/properties/shared.fields.ts`
- `nodes/KapsoApi/properties/resource.fields.ts`
- `nodes/KapsoApi/properties/platformMessage.fields.ts`
- `nodes/KapsoApi/KapsoTrigger.node.ts`
- `nodes/KapsoApi/trigger/notes.ts`
- `nodes/KapsoApi/sendAndWait/*`
- Description tests if present.

Tasks:

1. Apply the copy improvements from this document.
2. Replace internal API terms with dashboard/user-flow terms.
3. Add source-of-value hints for IDs.
4. Ensure Advanced/Custom fields are clearly marked as expert escape hatches.
5. Keep descriptions concise enough for n8n UI.

## Test Plan

Required checks after implementation:

```bash
pnpm build
pnpm test
pnpm test:coverage
npm pack --dry-run --json
```

Targeted tests to add or update:

- Template parser detects multiple dynamic URL/quick-reply buttons.
- Template list search paginates beyond first 100 templates.
- Empty `Advanced Components JSON` behaves as absent.
- Carousel Send Template sends without Advanced JSON.
- MPM Send Template sends without manual JSON.
- Flow selection uses `assets.jsonVersion` and `assets.hasDataEndpoint`.
- Draft Flow loads draft screens/actions/data.
- Manual Flow ID execute path fetches assets.
- Flow Initial Data rejects stale/unexpected keys.
- Broadcast input-items supports text/currency/date-time body variables.
- Broadcast input-items supports carousel or produces explicit local error.
- Broadcast Add Recipients hides irrelevant header/carousel fields.
- Broadcast Send/Schedule detects wrong status or missing recipients before POST where feasible.
- Description regression tests verify key fields contain dashboard/source hints.

## Acceptance Criteria

The next release is ready only when:

1. Happy paths for Send Template, Send Flow, and Send Broadcast do not require Advanced JSON.
2. `Custom API Call` and Advanced JSON remain available but are not needed for normal documented operations.
3. Template/Flow/Broadcast selectors can find items in large accounts.
4. Descriptions explain dashboard prerequisites and value origins.
5. Existing release gates pass.
6. `npm pack --dry-run --json` excludes `test/`, `review/`, `.env`, coverage, and local tarballs.

## Notes

- Current working tree is dirty and includes post-`0.7.3` changes. Do not revert unrelated user/Cursor changes.
- Do not install n8n locally. Use package tests/builds only.
- This audit intentionally treats `review/` as an internal artifact. If keeping this file out of npm is important, confirm package `files` remains limited to `dist`, README, CHANGELOG, LICENSE, and mandatory npm metadata.
