# Changelog

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
