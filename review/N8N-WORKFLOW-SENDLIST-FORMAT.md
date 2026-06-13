# n8n workflow migration — Send List sections

When agents or scripts write Kapso **sendList** nodes into n8n workflow JSON, use the shape the n8n UI expects:

```json
"rowValues": {
  "row": [
    { "rowId": "id", "rowTitle": "title", "rowDescription": "desc" }
  ]
}
```

Flat arrays and per-row wrapper arrays work at **runtime** in `extractListRows()` but **do not display** in the n8n parameter editor.

See `/root/Projetos/n8n/migracao-kapso/KAPSO-N8N-PARIDADE.md` for WAHA porting and webhook v2 shim notes.
