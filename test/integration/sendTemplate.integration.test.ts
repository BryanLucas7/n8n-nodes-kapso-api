import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSendTemplateRequest } from '../../nodes/KapsoApi/actions/routing';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import {
	carouselPromoDefinition,
	dynamicButtonsDefinition,
	imageHeaderDefinition,
	mpmSectionsJson,
	namedOrderUpdateDefinition,
} from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
}));

function mapperValue(entries: Record<string, string>) {
	return {
		mappingMode: 'defineBelow',
		value: entries,
	};
}

describe('sendTemplate integration', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('builds a named body and text header template payload', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		const request = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'order_update',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'text',
				templateDetectedComponentMode: 'standard',
				templateHeaderText: 'Order shipped',
				templateBodyParametersMapper: mapperValue({
					first_name: 'Jessica',
					order_id: '12345',
				}),
			}),
			0,
		);

		expect(request.body).toMatchObject({
			type: 'template',
			template: {
				name: 'order_update',
				language: { code: 'en_US' },
				components: [
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
				],
			},
		});
	});

	it('builds dynamic button components from the button resource mapper', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(dynamicButtonsDefinition);

		const request = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'shop_actions',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'none',
				templateDetectedComponentMode: 'standard',
				templateButtonParametersMapper: mapperValue({
					btn_0_url_suffix: 'promo-123',
					btn_1_flow_token: 'flow-token-abc',
					btn_2_copy_code: 'SAVE50',
					btn_3_catalog_thumbnail: 'SKU_THUMB',
					btn_4_mpm: mpmSectionsJson,
				}),
			}),
			0,
		);

		const components = (request.body as { template: { components: unknown[] } }).template.components;

		expect(components).toEqual(
			expect.arrayContaining([
				{
					type: 'button',
					sub_type: 'url',
					index: '0',
					parameters: [{ type: 'text', text: 'promo-123' }],
				},
				{
					type: 'button',
					sub_type: 'flow',
					index: '1',
					parameters: [{ type: 'action', action: { flow_token: 'flow-token-abc' } }],
				},
				{
					type: 'button',
					sub_type: 'copy_code',
					index: '2',
					parameters: [{ type: 'coupon_code', coupon_code: 'SAVE50' }],
				},
			]),
		);
	});

	it('builds image header media and carousel card components', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValueOnce(imageHeaderDefinition);

		const imageRequest = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'promo_banner',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'image',
				templateDetectedComponentMode: 'standard',
				templateHeaderMediaSource: 'link',
				templateHeaderMediaUrl: 'https://cdn.example.com/banner.jpg',
				templateBodyParametersMapper: mapperValue({ promo_code: 'SAVE10' }),
			}),
			0,
		);

		expect(imageRequest.body).toMatchObject({
			template: {
				components: expect.arrayContaining([
					{
						type: 'header',
						parameters: [{ type: 'image', image: { link: 'https://cdn.example.com/banner.jpg' } }],
					},
				]),
			},
		});

		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValueOnce(carouselPromoDefinition);

		const carouselRequest = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'carousel_promo',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'none',
				templateDetectedComponentMode: 'carousel',
				templateCarouselCards: {
					cardValues: [
						{
							cardIndex: 0,
							cardHeaderMediaSource: 'link',
							cardHeaderMediaUrl: 'https://cdn.example.com/card-0.jpg',
							cardBodyParameters: {
								parameterValues: [{ parameterText: 'Summer deal' }],
							},
							cardButtonParameters: {
								buttonParameterValues: [
									{ templateButtonKind: 'url', buttonIndex: 0, buttonText: 'buy-now' },
								],
							},
						},
						{
							cardIndex: 1,
							cardHeaderMediaSource: 'id',
							cardHeaderMediaId: 'video-media-id',
							cardBodyParameters: {
								parameterValues: [{ parameterText: 'Video deal' }],
							},
						},
					],
				},
			}),
			0,
		);

		expect(carouselRequest.body).toMatchObject({
			template: {
				components: expect.arrayContaining([
					expect.objectContaining({
						type: 'carousel',
						cards: expect.arrayContaining([
							expect.objectContaining({
								card_index: 0,
							}),
						]),
					}),
				]),
			},
		});
	});

	it('surfaces mapper and structure validation errors during request build', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		await expect(
			buildSendTemplateRequest(
				createMockExecuteFunctions({
					resource: 'message',
					operation: 'sendTemplate',
					templateDetectedHeaderFormat: 'text',
					templateDetectedComponentMode: 'standard',
					templateBodyParametersMapper: mapperValue({ first_name: 'Jessica' }),
				}),
				0,
			),
		).rejects.toThrow('Body parameter "order_id" is required for this template.');

		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(imageHeaderDefinition);

		await expect(
			buildSendTemplateRequest(
				createMockExecuteFunctions({
					resource: 'message',
					operation: 'sendTemplate',
					templateDetectedHeaderFormat: 'text',
					templateDetectedComponentMode: 'standard',
				}),
				0,
			),
		).rejects.toThrow('does not match the template (image)');
	});
});
