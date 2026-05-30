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
				'Root URL for Kapso APIs. Keep the default unless you are using a Kapso-provided dedicated endpoint.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '={{$env.KAPSO_API_KEY}}',
			typeOptions: {
				password: true,
			},
			description:
				'Kapso project API key. Prefer setting KAPSO_API_KEY in the n8n environment and leaving this expression as-is.',
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
