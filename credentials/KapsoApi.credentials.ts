import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KapsoApi implements ICredentialType {
	name = 'kapsoApi';
	displayName = 'Kapso API';
	documentationUrl = 'https://docs.kapso.ai/docs/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.kapso.ai',
			placeholder: 'https://api.kapso.ai',
			description:
				'Root URL for Kapso APIs. Keep the default unless Kapso gave you a dedicated endpoint. Find your project in the Kapso dashboard under Settings or API.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			placeholder: 'kapso_live_xxxxxxxx',
			typeOptions: {
				password: true,
			},
			description:
				'Project API key from Kapso: dashboard → your project → Settings → API (or API Keys). Sent as the X-API-Key header.',
			required: true,
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			default: '',
			placeholder: 'whsec_xxxxxxxx',
			typeOptions: {
				password: true,
			},
			description:
				'Signing secret for Kapso Trigger (Integrate → API & Webhooks in the Kapso dashboard). Used to verify X-Webhook-Signature with HMAC SHA256.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/platform/v1/whatsapp/phone_numbers?per_page=1',
			method: 'GET',
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
				Accept: 'application/json',
			},
		},
	};
}
