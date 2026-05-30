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
npm install /path/to/n8n-nodes-kapso-api-0.3.0.tgz
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

- **Message**: send text, image, video, audio, document, buttons, list, contact,
  template, reaction, mark as read, send raw JSON, list messages, get message.
- **Media**: upload binary media, upload from public URL, get media URL,
  download signed media URL, delete media.
- **Contact**: get, create, update, erase.
- **Conversation**: get, update status.
- **Broadcast**: create, add recipients, send, schedule, get, list recipients,
  cancel scheduled broadcast.
- **Block User**: block, unblock.
- **Custom API Call**: call documented Kapso Platform, Meta WhatsApp, or media
  download paths that are intentionally not shown as first-class menu items.

### Kapso Trigger

The trigger node receives Kapso webhooks and routes them across eight outputs
using the `X-Webhook-Event` header:

- `whatsapp.message.received`
- `whatsapp.message.sent`
- `whatsapp.message.delivered`
- `whatsapp.message.read`
- `whatsapp.message.failed`
- `whatsapp.conversation.created`
- `whatsapp.conversation.ended`
- `whatsapp.conversation.inactive`

## Dynamic fields

The node avoids asking users to paste common IDs:

- Phone numbers load from `GET /platform/v1/whatsapp/phone_numbers`.
- Approved templates load from the WABA resolved through the selected phone
  number.
- Conversations, contacts, and broadcasts use searchable `resourceLocator`
  fields with list and manual ID modes.

Advanced request filters live under **Additional Options** as JSON. Common
message flows use dedicated n8n fields and builders instead of raw JSON.

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
4. Optional: add body/header/button parameters, or Advanced Components JSON

Close a conversation:

1. Resource: `Conversation`
2. Operation: `Update Status`
3. Choose a conversation or paste the ID from a trigger payload
4. Body JSON example:

```json
{
  "status": "closed"
}
```

Upload media from a public URL:

1. Resource: `Media`
2. Operation: `Upload From URL`
3. Body JSON:

```json
{
  "media_ingest": {
    "phone_number_id": "1234567890",
    "source": "https://example.com/image.png",
    "delivery": "meta_media"
  }
}
```

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
resources in v0.3.0. Use the Kapso dashboard for setup and admin work, or
**Custom API Call** when a workflow needs a documented endpoint.

The Kapso Trigger covers phone webhook events for messages and conversations.
Project-level events such as `phone_number.created`, `phone_number.deleted`,
`workflow.execution.handoff`, and `workflow.execution.failed` are not routed
in v0.3.0.

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
