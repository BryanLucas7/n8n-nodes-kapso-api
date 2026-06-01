import nock from 'nock';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTemplateMessageFromParams } from '../../nodes/KapsoApi/actions/messagePayloads';
import { buildKapsoRequestOptions } from '../../nodes/KapsoApi/transport/request';
import { namedOrderUpdateDefinition } from '../fixtures/metaTemplates';
import { requestWithNodeHttps } from '../helpers/http';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const credentials = {
	baseUrl: 'https://api.kapso.ai',
	apiKey: 'mock-api-key',
};

describe('Kapso sendTemplate mock API integration', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('posts a template message payload with header and body components', async () => {
		const body = buildTemplateMessageFromParams(
			'15551234567',
			'order_update',
			'en_US',
			{
				componentMode: 'standard',
				headerType: 'text',
				headerText: 'Order shipped',
				bodyParameters: [
					{ parameterName: 'first_name', parameterText: 'Jessica' },
					{ parameterName: 'order_id', parameterText: '12345' },
				],
				buttonParameters: [],
				carouselCards: [],
			},
		);

		const scope = nock('https://api.kapso.ai', {
			reqheaders: {
				'X-API-Key': 'mock-api-key',
				'Content-Type': 'application/json',
			},
		})
			.post(`/meta/whatsapp/v24.0/${TEST_PHONE_NUMBER_ID}/messages`, body)
			.reply(200, {
				messaging_product: 'whatsapp',
				messages: [{ id: 'wamid.template.mock' }],
			});

		const response = await requestWithNodeHttps(
			buildKapsoRequestOptions(credentials, {
				api: 'whatsapp',
				method: 'POST',
				path: `/${TEST_PHONE_NUMBER_ID}/messages`,
				body,
			}),
		);

		expect(response).toEqual({
			messaging_product: 'whatsapp',
			messages: [{ id: 'wamid.template.mock' }],
		});
		expect(body).toMatchObject({
			type: 'template',
			template: {
				name: 'order_update',
				language: { code: 'en_US' },
				components: expect.arrayContaining([
					{
						type: 'header',
						parameters: [{ type: 'text', text: 'Order shipped' }],
					},
					{
						type: 'body',
						parameters: [
							{ type: 'text', text: 'Jessica', parameter_name: 'first_name' },
							{ type: 'text', text: '12345', parameter_name: 'order_id' },
						],
					},
				]),
			},
		});
		expect(namedOrderUpdateDefinition.name).toBe('order_update');
		expect(scope.isDone()).toBe(true);
	});
});
