# Changelog

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
