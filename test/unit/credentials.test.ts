import { describe, expect, it } from 'vitest';
import { KapsoApi } from '../../credentials/KapsoApi.credentials';

describe('KapsoApi credentials', () => {
	it('exposes documented credential fields and test request', () => {
		const credentials = new KapsoApi();

		expect(credentials.name).toBe('kapsoApi');
		expect(credentials.properties.map((property) => property.name)).toEqual([
			'baseUrl',
			'apiKey',
			'webhookSecret',
		]);
		expect(credentials.properties.find((property) => property.name === 'apiKey')?.default).toBe('');
		expect(credentials.authenticate).toMatchObject({
			type: 'generic',
			properties: {
				headers: {
					'X-API-Key': '={{$credentials.apiKey}}',
				},
			},
		});
		expect(credentials.test?.request?.url).toBe('/platform/v1/whatsapp/phone_numbers?per_page=1');
	});
});
