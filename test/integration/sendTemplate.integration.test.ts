import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSendTemplateRequest } from '../../nodes/KapsoApi/actions/routing';
import {
	carouselPromoDefinition,
	dynamicButtonsDefinition,
	imageHeaderDefinition,
	mpmSectionsJson,
	namedHeaderVariableDefinition,
	namedOrderUpdateDefinition,
} from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const fetchSelectedTemplateDefinitionMock = vi.hoisted(() => vi.fn());

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../nodes/KapsoApi/loadOptions/templateFetch')>();
	return {
		...actual,
		fetchSelectedTemplateDefinition: fetchSelectedTemplateDefinitionMock,
		resolveSendTemplateContext: vi.fn(async () => {
			const definition = await fetchSelectedTemplateDefinitionMock();
			if (!definition) {
				throw new Error('Could not resolve the selected template name and language.');
			}

			return {
				identity: { name: definition.name, language: definition.language },
				definition,
			};
		}),
	};
});

function mapperValue(entries: Record<string, string>) {
	return {
		mappingMode: 'defineBelow',
		value: entries,
	};
}

describe('sendTemplate integration', () => {
	beforeEach(() => {
		fetchSelectedTemplateDefinitionMock.mockReset();
	});

	it('builds a named body template payload without a static text header component', async () => {
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(namedOrderUpdateDefinition);

		const request = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'order_update',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'text',
				templateDetectedComponentMode: 'standard',
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

	it('builds a named text header with parameter_name', async () => {
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(namedHeaderVariableDefinition);

		const request = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'seasonal_sale',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'text',
				templateDetectedComponentMode: 'standard',
				templateHeaderTextHasVariable: 'yes',
				templateHeaderText: 'Summer Sale',
				templateBodyParametersMapper: mapperValue({
					first_name: 'Jessica',
					sale_name: 'Summer',
				}),
			}),
			0,
		);

		expect(request.body).toMatchObject({
			template: {
				components: [
					{
						type: 'header',
						parameters: [
							{ type: 'text', text: 'Summer Sale', parameter_name: 'sale_name' },
						],
					},
					{
						type: 'body',
						parameters: [
							{ type: 'text', text: 'Jessica', parameter_name: 'first_name' },
							{ type: 'text', text: 'Summer', parameter_name: 'sale_name' },
						],
					},
				],
			},
		});
	});

	it('rejects header text on static text headers', async () => {
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(namedOrderUpdateDefinition);

		await expect(
			buildSendTemplateRequest(
				createMockExecuteFunctions({
					resource: 'message',
					operation: 'sendTemplate',
					templateName: 'order_update',
					languageCode: 'en_US',
					templateDetectedHeaderFormat: 'text',
					templateDetectedComponentMode: 'standard',
					templateHeaderText: 'Unexpected header override',
					templateBodyParametersMapper: mapperValue({
						first_name: 'Jessica',
						order_id: '12345',
					}),
				}),
				0,
			),
		).rejects.toThrow(/static text header/i);
	});

	it('builds dynamic button components from the button resource mapper', async () => {
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(dynamicButtonsDefinition);

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
		fetchSelectedTemplateDefinitionMock.mockResolvedValueOnce(imageHeaderDefinition);

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

		fetchSelectedTemplateDefinitionMock.mockResolvedValueOnce(carouselPromoDefinition);

		const carouselRequest = await buildSendTemplateRequest(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'sendTemplate',
				templateName: 'carousel_promo',
				languageCode: 'en_US',
				templateDetectedHeaderFormat: 'none',
				templateDetectedComponentMode: 'carousel',
				templateCarouselBodyParametersMapper: mapperValue({
					card_0_param_1: 'Summer deal',
					card_1_param_1: 'Video deal',
				}),
				templateCarouselCards: {
					cardValues: [
						{
							cardIndex: 0,
							cardHeaderMediaSource: 'link',
							cardHeaderMediaUrl: 'https://cdn.example.com/card-0.jpg',
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
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(namedOrderUpdateDefinition);

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

		fetchSelectedTemplateDefinitionMock.mockResolvedValue(imageHeaderDefinition);

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
