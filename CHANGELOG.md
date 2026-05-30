# Changelog

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
