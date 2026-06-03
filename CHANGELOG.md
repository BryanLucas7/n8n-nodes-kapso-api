# Changelog

## Unreleased

## 0.8.1 - 2026-06-03

- **Fix List Messages / Get / Mark Read**: `buildMessageRequest` no longer reads **Recipient Phone** for `list`, `get`, or `markRead` operations. Previously these admin operations failed with `Could not get parameter` (`recipient`) when the node had no recipient field configured.
- **Tests**: added coverage ensuring `list` and `markRead` build requests without a recipient parameter.
- **Docs**: added `review/N8N-WORKFLOW-SENDLIST-FORMAT.md` for migration tooling (Send List `rowValues.row[]` shape in workflow JSON).

- **Send Template / Broadcast carousel body parameters**: carousel card body placeholders now use typed resource mappers (Text, Currency, Date & Time) with `card_{index}_`-prefixed field IDs, matching standard body parameter mapping. Removed manual Parameter Name + Text collections from carousel card UI; Advanced JSON remains the override escape hatch.
- **Pre-publish P1 fixes**: Phone Number field covers all message send/read ops; Send Catalog omits optional thumbnail when empty; Send Flow blocks data-exchange without dashboard encryption and shows guided fields for manual Meta Flow ID; broadcast input-items infer media ID source; template `parameter_format` inferred from named placeholders; document template headers support filename; broadcast recipients get structured Button Parameters for MPM.
- **UX/API audit fixes**: Add Recipients From Input Items maps only the current item (not all items); Recipients Builder runs once on item 0; draft preflight before add recipients; scheduled preflight before cancel; `recipientsBodyJson` enforces 1,000 recipient max; template fetch paginates all approved templates at execute time; template/broadcast search warns when WABA cannot be resolved; broadcast template summary and send preflight loadOptions notices; flow fields hidden until Flow selected; execute-time flow ID lookup paginates; removed unused `flowSendOptions` field file; Flow Token no longer masked as password.
- **FLOW fixes**: Flow Button Label max 20 (matches Kapso API); `flow_message_version` always sends `3` (separate from Flow JSON version); Flow Mode field before Flow picker with Auto/Draft/Published; Meta Flow ID search paginates all pages; Flow Action shows Auto (Detected From Flow).
- **Broadcast fixes**: Schedule body uses top-level `scheduled_at` per Kapso API; local future-time validation; 1,000 recipient limit enforced; Send/Schedule preflight checks draft status and recipient count; broadcast search filters by operation status; template search paginates all approved templates.
- **Refactors**: shared WABA resolver (`businessAccount.ts`), detected template structure options, template field ID helpers for input-item schema, `executeListOperation` for list pagination, broadcast list filter validation, notice field helpers.
- **Descriptions and copy**: node, resource, phone number, template, flow, broadcast, trigger, and Send and Wait field descriptions now explain what each value is, where to get it in Kapso/n8n, and what happens next (aligned with KAPSO UX audit).
- **Message options UX**: replaced monolithic **Additional Options** with scoped option collections (**Message Send Options**, **Message List Options**, **Template Advanced Options**, **Custom API Options**). Legacy `advancedOptions` still works at execute time. **Link Preview** now appears only on **Send Text** (it was incorrectly offered on media and other message types).
- **Message field order**: interactive sends now follow Meta message structure — header/setup → body → buttons/sections/CTA → footer → optional reply options. Flow Mode stays before Flow; voice note follows media fields.
- **Fix autosave / duplicate nodes**: moved **Link Preview** out of **Message Send Options** collection (n8n cannot resolve nested `displayOptions` in collections). Use community nodes volume only — remove duplicate install from Docker image custom extensions path.
- **Send Template fixes**: named text headers now emit `parameter_name` when the approved template uses `parameter_format: named`; static text headers no longer show **Header Text** in the UI or accept extra header parameters at execute time.
- **Reply To Message ID coverage**: added to **Request Location**, **Request Call Permission**, and **Send and Wait**. Intentionally excluded from **Send Template** (Meta does not show the quote bubble) and **Send Reaction** (uses **React To Message ID** instead).
- **Send Contact UX**: main form shows only essentials (Formatted Name, First/Last Name, Phones); middle name, prefix/suffix, birthday, organization, emails, URLs, and addresses move to **Additional Contact Details**. Optional fields are labeled **(optional)** across message sends, list filters, flow/template fields, and option collections. **Send Contact** now supports **Reply To Message ID** via `context.message_id`. Opens with one contact and one phone row ready to fill.
- **Request Location / Call Permission UX**: replaced the large **Body Text** textarea with a single-line **Location Request Prompt** / **Call Permission Prompt** field and example placeholders.
- **Send Template UX**: searchable template picker (`searchMessageTemplates`), structured **Button Parameters** collection for MPM, carousel card index/guidance load options, single template fetch per send (`resolveSendTemplateContext`), empty Advanced JSON `[]` treated as absent.
- **Send Flow UX**: flow list search encodes `jsonVersion` / `hasDataEndpoint` from version assets, draft selection preserved when Flow Mode is default, execute-time initial data validation, ID-like flow search skips `name_contains`, execute enriches incomplete flow selection metadata.
- **Broadcast Add Recipients**: template-driven conditional fields inside the recipient builder (header/carousel/body/button visibility), input-item schema preview, carousel + currency/date input-item keys.
- **Broadcast Add Recipients** loads template structure from `GET /whatsapp/broadcasts/{id}` (header format, carousel, body/button mappers) with Send Template–level validation at execute time.
- **Broadcast Create** uses searchable template picker (`encodeMessageTemplateValue`), shared **Phone Number** field, and a post-create notice to use the returned `id` in Add Recipients.
- **Broadcast** search labels include template name and status; Add Recipients supports **From Input Items** mode (`$json.phone` and body keys).
- **Send CTA** replaces separate Send CTA URL / Send CTA Phone Call operations (`ctaType`: URL or phone). No backward compatibility with the old operation names.
- **Catalog** and **Product** fields use searchable resource locators (`searchCatalogs`, `searchCatalogProducts`) tied to the selected phone number, matching contacts/broadcasts UX (5 initial results, type to filter).
- **Send Flow** uses a searchable Flow picker from Kapso Platform API; removed Flow Name and Flow Message Version fields.
- **Flow Mode** is Default (Published) or Draft only; draft mode auto-applies when a draft Flow is selected from the list.
- **Flow Screen** and **Flow Action** load from the selected Flow JSON / data-endpoint metadata.
- **Flow Token** and **Flow Button Label** are optional: token defaults to the Flow ID (Kapso response collection); CTA defaults to the Flow name.
- **Flow Action** auto-selects from Flow metadata when empty; draft Flow Mode filters the Flow picker to drafts only.
- **Send Flow** adds a resource mapper for initial data from `flow_json`, published-only Flow search by default, draft preview and encryption notices, hides redundant screen/action fields, and moves Flow Mode to Additional Options.

## 0.8.0 - 2026-05-30

- Send Template body mapper now supports manual **Text / Currency / Date & Time** per variable,
  ISO currency code dropdown, and prefilled example values (including positional `{{1}}` currency).
- Send and Wait aligned with the official WhatsApp node: no Subject field, default labels
  `✓ Approve` / `✗ Decline`, n8n attribution link, optional CTA URL button delivery (single
  approval, 24-hour session), and UI notice for double approval + text links.
- Added **Send CTA Phone Call** (`sendCtaCall`) interactive message with optional header/footer.
- Added read-only **Get Catalogs** (`getCatalog`) to list product catalogs for the WABA linked to the selected phone number.

## 0.7.3 - 2026-06-01

- Added opt-in live Kapso API tests (sandbox messaging + production read-only
  probes) and a separate GitHub Actions workflow. Live tests require env vars
  or repository secrets; no project-specific defaults are shipped in code.
- Removed internal `review/` audit notes from the repository.
- CI keeps coverage thresholds but no longer uploads HTML coverage artifacts.
- Fixed TypeScript build errors in Send Template resource mapper handling.
- README examples now match current Upload From URL delivery options and Send
  Template auto-detected component mode.

## 0.7.2 - 2026-05-30

- Expanded automated test coverage for Send Template 0.7.x: resource mapper
  validation, template fetch, structure loadOptions, carousel/broadcast paths,
  node execute async flow, and nock contract tests for template POST payloads.
- Added shared Meta template fixtures under `test/fixtures/`.
- CI now enforces coverage thresholds (90% lines/functions/statements, 80%
  branches) and uploads the HTML coverage report as a workflow artifact.

## 0.7.1 - 2026-05-30

- Removed Send Template compatibility fallbacks for legacy `templateBodyParameters`
  and `templateButtonParameters` fixed collections; execute now reads only
  `templateBodyParametersMapper` and `templateButtonParametersMapper`.
- Removed unused template helpers (`getTemplateHasMpmButton`, `templateHeaderTypeOptions`,
  `getTemplateButtonParameters`) and legacy button parameter group keys
  (`urlButtonValues`, `quickReplyButtonValues`, etc.). Broadcast/carousel button
  parameters use the unified `buttonParameterValues` entry only.

## 0.7.0 - 2026-05-30

- **Send Template** body and dynamic button values now use **resourceMapper** fields
  derived from the selected template schema (named or positional body variables,
  fixed button slots by index). Templates without body variables show an empty
  mapper notice instead of a free-form Add Parameter list.
- **Header Type** and **Component Mode** are removed from Send Template UI. They
  are auto-detected from the template (`Template Header Format`, `Template Component
  Mode`) and enforced at execute time.
- Carousel card header type is inferred from the approved template definition.

## 0.6.8 - 2026-05-30

- Dependent dropdowns (**Template Name**, **Language**, **Broadcast Template**) now follow
  the same credential and dependency flow as **Phone Number**: show *Set up credential to
  see options* when credentials are missing, and a clear *Select … first* message when a
  parent field is still empty (instead of *The value "" is not supported!*).

## 0.6.7 - 2026-05-30

- **Send Template** button parameters now share one ordered list so add order matches
  template indices. Empty **Index** auto-fills 0, 1, 2…; set manually to reorder.
  Button Parameters collection is sortable via drag-and-drop.

## 0.6.6 - 2026-05-30

- **Send Template** Quick Reply split into **Quick Reply (Text)** and **Quick Reply (Payload)**
  picker options so only the relevant field appears (n8n cannot hide fields inside
  fixed collections). URL buttons drop the redundant parameter-type selector; suffix
  field renamed **URL Suffix**. Button Parameters description documents Meta limits.

## 0.6.5 - 2026-05-30

- **Send Template** MPM/Catalog button UI: nested collections now show **Add Section**
  and **Add Product** instead of generic **Choose...**; button type picker uses short
  labels (URL, MPM, etc.); thumbnail/product fields use **SKU** labels to avoid truncation.
- MPM template sections validate Meta limits at runtime (1-10 sections, 1+ product per
  section, 30 products total).

## 0.6.4 - 2026-05-30

- **Kapso Trigger** webhook docs link fixed (404 `phone-numbers` →
  [webhooks overview](https://docs.kapso.ai/docs/platform/webhooks/overview)).
  Setup notice now points to **Integrate → API & Webhooks → WhatsApp webhooks**
  in the Kapso dashboard plus the overview doc.

## 0.6.3 - 2026-05-30

- **Kapso Trigger** parameters simplified to match common n8n webhook UX (setup note,
  events list) instead of five technical notices. Documentation uses `documentationUrl`
  plus an HTML link in the notice text (`openUrl` on notices is not supported by n8n).
- **Send Template** language code is now a searchable dropdown loaded from approved
  template languages for the selected template name.
- **Send or Remove Reaction** uses a **Reaction Action** dropdown (Add or Change Emoji /
  Remove Reaction) instead of a remove toggle; emoji appears only for the react mode.
- **Per Page** is hidden when **Return All** is enabled; return-all requests use an
  internal fetch limit of 100 per API call.
- Send Image/Video/Audio/Document and Send Sticker split **Media ID** and **Public URL**
  fields by media source (same pattern as interactive message headers).
- Runtime validation for recipient phone, media ID, public URL, wamid message IDs,
  and reaction emoji; Public URL fields use n8n `validateType: url` in the UI.
- **Phase 1 Meta field limits** in the UI (`maxLength`) and at runtime: text (4096),
  interactive body/caption (1024), header/footer text (60), button titles (20),
  list fields (button 20, section 24, row title 24, description 72, row ID 200),
  and header media IDs (32 digits). E.164 phones for **Contact → WhatsApp ID** and
  **Broadcast → Phone Number** use `resourceLocator` with regex validation and
  reject legacy plain-text values.
- **Phase 2 limits:** CTA URL and Source URL use `validateType: url` with 2048-char
  cap; document filename (240); catalog ID (64); product retailer ID (100); flow
  token (128), screen (64), and button label (30).
- **Phase 3 limits:** UUID fields and list filters (128 chars) in the UI; conversation
  and broadcast resource locator IDs validate UUID format; JSON escape hatches enforce
  a 64 KB payload limit at execution; download token and custom API path length caps.
- Template button parameters are split by button type (URL, Quick Reply, Flow, etc.)
  so only relevant fields appear, with structured Flow action data and clearer MPM
  add buttons.
- Fix node load failure **"Could not resolve parameter dependencies. Max iterations
  reached!"** caused by `phoneNumberId` using an array OR in `displayOptions.show`
  (n8n dependency resolver treats array indices as parameter names). Split into
  separate fields like the operation selector.
- Remove `displayOptions` from children inside `collection` and `fixedCollection`
  parameters (n8n dependency resolver limitation).
- Split contact and conversation list filters into separate option collections
  (`contactListOptions`, `conversationListOptions`) instead of one shared
  `platformListOptions` field.
- Add regression test that walks all node properties and rejects nested
  `displayOptions` inside collections.

## 0.6.2 - 2026-05-30

- **Send Product List** validates non-empty sections and a maximum of 30 products
  total (Meta/Kapso limit).
- **Send Template** carousel mode errors when no cards are configured instead of
  falling back to standard components.
- **Send Flow** rejects empty Flow CTA and Flow token at runtime.
- Contact/conversation resource locators send search text to the Kapso API
  (`profile_name_contains`, `wa_id_contains`, `phone_number`) instead of filtering
  only the first local page.
- Contact locator values use platform IDs only (no phone/`wa_id` fallback).
- Removed unsupported **Flow Action** template button parameter type from the UI.
- **Advanced Components JSON** rejects empty arrays.
- Clarified phone format descriptions per API (Meta send/block without `+`; Kapso
  Platform with `+`).

## 0.6.1 - 2026-05-30

- **Upload From URL** delivery options aligned with Kapso OpenAPI (`meta_media`,
  `meta_resumable_asset`; removed invalid `kapso_media`).
- Conversation and contact resource locators use Kapso cursor pagination
  (`limit`/`after`) instead of page-based queries.
- **Kapso Trigger** reads **Webhook Secret** from the Kapso API credential
  (encrypted storage) instead of a node parameter.
- Interactive list/button and product list builders validate Meta section/row
  limits before send.
- Template **Advanced Components JSON** must be a JSON array; invalid location
  header coordinates are rejected.
- Cursor `returnAll` pagination guards against repeated `after` cursors and
  excessive page counts; custom relative paths reject `..` segments.

## 0.6.0 - 2026-05-31

- **Kapso Trigger** requires Webhook Secret and verifies every request with HMAC SHA256
  (`X-Webhook-Signature`). Unknown events route to a dedicated **Other Event** output.
- **Send Audio** no longer sends captions (UI and builder aligned with Kapso/Meta).
- **Send Product List** requires a valid header (Meta `product_list` requirement).
- **Broadcast Add Recipients** rejects recipients missing both phone number and contact ID.
- Interactive message headers support **document** type across buttons, list, CTA, product list,
  and flow builders.
- **Send Location** emits numeric latitude/longitude coordinates.
- Template **Copy Code** buttons emit `sub_type: copy_code` with `coupon_code` parameters.
- **Send Contact** uses collection-only phones/emails/urls and adds vCard name/birthday fields.
- **Send Flow** exposes Flow ID and Flow Name together (mutually exclusive, validated in routing).
- Removed legacy contact list page/per_page pagination, duplicate contact fields, OTP alias,
  broadcast header image URL alias, and extra `messaging_product` on block/unblock bodies.

## 0.5.3 - 2026-05-30

- Send Contact supports multiple phones (with optional WhatsApp ID), emails, URLs, and
  addresses, plus organization department and title.
- Send Flow accepts **Flow Name** as an alternative to Flow ID (mutually exclusive).
- Broadcast Add Recipients maps nested MPM section/product UI into template button
  components.

## 0.5.2 - 2026-05-30

- Contact List adds **Customer External ID** filter; Broadcast List adds status, phone
  number, and created date filters.
- Template builder supports **Catalog** and **MPM** button types with product sections.
- Send Flow adds **mode** (draft/published), optional header/footer, and media ID headers.
- Interactive messages (buttons, list, CTA, product list, flow) support header media via
  public link or uploaded **Media ID**.

## 0.5.1 - 2026-05-30

- Added **Platform Message** resource with List and Get operations for Kapso
  `GET /whatsapp/messages` (cross-conversation message query with cursor pagination).
- Added routing integration tests with request body and query assertions per operation.

## 0.5.0 - 2026-05-30

- Contact and Conversation List now use Kapso cursor pagination (`limit`, `after`,
  `before`) with filters under Additional Options; Contact List can opt into
  legacy `page`/`per_page` (max page 50).
- Send Template and Broadcast Add Recipients support carousel cards, video/document/
  location headers, media ID headers, flow buttons, OTP buttons, and payload quick
  replies via the shared template component builder.
- Send Audio exposes **Send As Voice Note** (`voice: true`); Send Reaction exposes
  **Remove Reaction**; Send Product List supports text/image/video headers.

## 0.4.1 - 2026-05-30

- Send Template now uses the same Meta template component builder as Broadcast
  (text/image headers, named body parameters, button sub_type and index).
- Send Buttons and Send List support optional text, image, or video headers.
- Custom API Call requires Phone Number for WhatsApp paths such as `/messages`,
  hides Body JSON on GET, and omits empty bodies.
- Removed dead code (`buildInteractiveMessage`, `advancedBodyJson`, unused exports).
- Fixed link preview fallback, pagination query helper, and README examples.

## 0.4.0 - 2026-05-30

- Added dedicated Message operations for location, sticker, CTA URL, catalog products,
  catalog browse, WhatsApp Flow, location request, and call permission request.
- Removed Send Raw JSON in favor of dedicated operations and Custom API Call.
- Custom API Call now supports Phone Number dropdown on WhatsApp API surface with
  automatic phone ID path prefixing.
- Added List operations for Contact, Conversation, and Broadcast resources.
- Message List/Get now always request Kapso extensions unless Custom Response Fields
  overrides the query.
- Send List now supports an optional header text field.

## 0.3.4 - 2026-05-30

- Removed legacy query JSON compatibility and nested Additional Options shapes.
- Additional Options now appears only for Message and Custom API Call operations,
  with each sub-field scoped to its specific operation.
- Message List/Get now expose Include Kapso Extensions toggle and custom response
  fields instead of JSON query parameters.
- Media Get URL and Delete now require the Phone Number field for Kapso proxy
  queries.
- Custom API Call uses a Query Parameters collection instead of JSON.

## 0.3.3 - 2026-05-30

- Broadcast Create now loads approved templates from the selected phone number
  (Meta template ID dropdown).
- Broadcast Add Recipients builder supports body, header, and button template
  components per recipient, with optional Advanced Components JSON override.
- Message List and Get expose documented filter fields (conversation, direction,
  status, time range, cursors, response fields) instead of relying only on
  Additional Options query JSON.
- Message List pagination now uses Kapso cursor parameters (`limit`, `after`).
- Broadcast Send and Cancel no longer attach an empty JSON body.

## 0.3.2 - 2026-05-30

- Fixed Additional Options collection so options like Link Preview and Reply To
  Message ID appear when added (flattened collection structure).
- Replaced generic Body JSON with Kapso-specific fields for conversation status,
  contact create/update, broadcast create/schedule/recipients, media upload from
  URL, and block/unblock users.
- Body JSON remains only for Custom API Call, Send Raw JSON, and advanced
  broadcast recipient overrides.

## 0.3.1 - 2026-05-30

- Kapso API credentials now start with an empty API Key field instead of a
  pre-filled `{{$env.KAPSO_API_KEY}}` expression.

## 0.3.0 - 2026-05-30

Initial public release of the Kapso n8n community node package.

- **Kapso API** action node for documented Platform and Meta-compatible WhatsApp
  endpoints: Message, Media, Contact, Conversation, Broadcast, Block User, and
  Custom API Call.
- **Kapso Trigger** with eight webhook outputs routed by `X-Webhook-Event`.
- Dynamic phone number and approved template loading from the Kapso API.
- Searchable resource locators for conversations, contacts, and broadcasts.
- Dedicated message builders for text, media, buttons, lists, contacts, and
  templates; advanced JSON hidden under Additional Options.
- Centralized HTTP transport with pagination, multipart upload, and error
  normalization.
- Unit, mock, and opt-in live test suites with 90% line coverage threshold.
