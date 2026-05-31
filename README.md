# n8n-nodes-kapso-api

n8n community node for the documented Kapso Platform API and Kapso
Meta-compatible WhatsApp API.

Documentation:

- <https://docs.kapso.ai/docs/introduction>
- <https://docs.kapso.ai/docs/whatsapp/cli>
- <https://docs.kapso.ai/llms.txt>

## Requirements

- n8n 2.x. The validation target used here was n8n `2.22.5`.
- Node.js `>=22.16` for n8n 2.x runtime validation.
- A Kapso project API key.

## Installation

After npm publication, install from the n8n Community Nodes UI with:

```text
n8n-nodes-kapso-api
```

For local validation from this repository:

```bash
pnpm install
pnpm build
pnpm pack
```

Install the generated tarball into an n8n custom extension directory:

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm install /path/to/n8n-nodes-kapso-api-0.6.0.tgz
n8n start
```

For Docker, mount a custom extensions folder or bake the tarball into the image
and run `npm install` in that folder before starting n8n.

## Credentials

Create a credential named **Kapso API**.

Fields:

- **Base URL**: defaults to `https://api.kapso.ai`.
- **API Key**: your Kapso project API key (field starts empty).

The node sends the API key as:

```text
X-API-Key: <credential value>
```

No API key or `.env` file is committed by this package. Local `.env*` files are
ignored.

## Implemented nodes

### Kapso API

The action node exposes documented Kapso endpoints that are useful inside
recurring n8n automations:

- **Message**: send text, image, video, audio, document, sticker, location, buttons,
  list, CTA URL, product, product list, catalog, flow, location request, call permission,
  contact, template, reaction, mark as read, list messages, get message.
- **Platform Message**: list and get messages across conversations (Kapso Platform API).
- **Contact**: get, list, create, update, erase.
- **Conversation**: get, list, update status.
- **Broadcast**: create, list, add recipients, send, schedule, get, list recipients,
  cancel scheduled broadcast.
- **Media**: upload binary media, upload from public URL, get media URL,
  download signed media URL, delete media.
- **Block User**: block, unblock.
- **Custom API Call**: call documented Kapso Platform, Meta WhatsApp, or media
  download paths that are intentionally not shown as first-class menu items.

### Kapso Trigger

The trigger node receives Kapso webhooks and routes them across nine outputs
using the `X-Webhook-Event` header. Set the **Webhook Secret** on the Kapso API
credential (from your Kapso webhook settings); every request is verified with
HMAC SHA256 via `X-Webhook-Signature`. Unrecognized event types route to
**Other Event**.

- `whatsapp.message.received`
- `whatsapp.message.sent`
- `whatsapp.message.delivered`
- `whatsapp.message.read`
- `whatsapp.message.failed`
- `whatsapp.conversation.created`
- `whatsapp.conversation.ended`
- `whatsapp.conversation.inactive`
- `Other Event` (any other `X-Webhook-Event` value)

## Dynamic fields

The node avoids asking users to paste common IDs:

- Phone numbers load from `GET /platform/v1/whatsapp/phone_numbers`.
- Approved templates load from the WABA resolved through the selected phone
  number.
- Conversations, contacts, and broadcasts use searchable `resourceLocator`
  fields with list and manual ID modes.

Advanced message filters and template overrides live under **Additional Options**.
Use **Platform Message → List** to query messages across all conversations on the Kapso
Platform API (`GET /whatsapp/messages`) with cursor pagination and cross-conversation
filters. Meta **Message → List Messages** remains scoped to a single phone number.
Contact and Conversation **List** operations use cursor pagination (`limit`, `after`,
`before`) with optional filters.

Send Template and Broadcast Add Recipients include a **Carousel** component mode
with per-card header, body, and button parameters. Card count must match the
approved Meta template.
Common message flows use dedicated n8n fields and builders instead of raw JSON.

## Examples

Send a text message:

1. Resource: `Message`
2. Operation: `Send Text`
3. Phone Number Name or ID: choose the Kapso/Meta phone number
4. Recipient Phone: destination phone number without `+`
5. Text: message body

Send a template message:

1. Resource: `Message`
2. Operation: `Send Template`
3. Set Phone Number, Recipient Phone, Template Name and Language Code
4. Optional: choose **Standard** or **Carousel** component mode, add body/header/
   button (or per-card) template parameters, or Advanced Components JSON

Close a conversation:

1. Resource: `Conversation`
2. Operation: `Update Status`
3. Choose a conversation or paste the ID from a trigger payload
4. Status: `Ended` (or `Active` to reopen)

Upload media from a public URL:

1. Resource: `Media`
2. Operation: `Upload From URL`
3. Phone Number Name or ID: choose the Kapso/Meta phone number
4. Source URL: public media URL
5. Delivery: `Meta Media` or `Kapso Media`

## Limitations

This package targets the Kapso Platform and Meta WhatsApp Cloud API. The
following are not available through documented Kapso endpoints exposed as
first-class node operations:

- QR or session pairing, instance restart/logout, runtime settings, presence, or
  per-instance proxy.
- WhatsApp group administration.
- Native poll messages, status/stories sending, or chat mutations such as
  archive, unread, delete-for-everyone, edit-message, or presence updates.

Documented Kapso admin and setup endpoints — phone-number connect/delete,
template administration, webhook CRUD, WhatsApp Flow administration, logs,
business profile updates, and calls — are not exposed as dedicated menu
resources. Use the Kapso dashboard for setup and admin work, or **Custom API Call**
when a workflow needs a documented endpoint.

The Kapso Trigger verifies signed phone-number webhooks and routes known message
and conversation events to dedicated outputs. Other signed webhook event types
(including many project-level events) appear on the **Other Event** output.

## Tests

Run with Node.js `>=22.16`:

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:coverage   # unit + mock + 90% line coverage threshold
pnpm test:unit
pnpm test:mock
pnpm test:live
```

Live tests are opt-in and require explicit environment variables:

```bash
RUN_KAPSO_LIVE_TESTS=1 \
KAPSO_API_KEY=... \
KAPSO_PHONE_NUMBER_ID=<kapso-phone-number-id> \
pnpm test:live
```

The live suite performs read-only requests unless these additional explicit
variables are present:

```bash
RUN_KAPSO_LIVE_SEND_MESSAGE=1 \
KAPSO_TEST_RECIPIENT=<sandbox-registered-test-number> \
pnpm test:live
```

## Development notes

- HTTP construction is centralized in `nodes/KapsoApi/transport/request.ts`.
- JSON parsing, pagination and error normalization are tested separately.
- Multipart upload options are covered by unit tests.
- Mock integration tests use documented paths and assert `X-API-Key`.
- Signed media download uses the documented unversioned
  `/meta/whatsapp/media_download` path and does not send `X-API-Key`.
