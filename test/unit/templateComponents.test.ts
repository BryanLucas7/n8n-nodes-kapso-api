import { describe, expect, it } from 'vitest';
import { buildMetaTemplateComponents } from '../../nodes/KapsoApi/actions/templateComponents';

describe('buildMetaTemplateComponents', () => {
	it('builds text header, body, and button components', () => {
		expect(
			buildMetaTemplateComponents({
				headerType: 'text',
				headerText: 'Order update',
				bodyParameters: [{ parameterName: 'first_name', parameterText: 'Jessica' }],
				buttonParameters: [
					{ buttonSubType: 'quick_reply', buttonIndex: 0, buttonText: 'Track' },
				],
			}),
		).toEqual([
			{
				type: 'header',
				parameters: [{ type: 'text', text: 'Order update' }],
			},
			{
				type: 'body',
				parameters: [
					{
						type: 'text',
						text: 'Jessica',
						parameter_name: 'first_name',
					},
				],
			},
			{
				type: 'button',
				sub_type: 'quick_reply',
				index: '0',
				parameters: [{ type: 'text', text: 'Track' }],
			},
		]);
	});

	it('builds named text header parameters with parameter_name', () => {
		expect(
			buildMetaTemplateComponents({
				headerType: 'text',
				headerText: 'Summer Sale',
				parameterFormat: 'named',
				headerVariable: {
					id: 'sale_name',
					displayName: 'sale_name',
					parameterName: 'sale_name',
					valueType: 'text',
				},
			}),
		).toEqual([
			{
				type: 'header',
				parameters: [{ type: 'text', text: 'Summer Sale', parameter_name: 'sale_name' }],
			},
		]);
	});

	it('builds image header from media id', () => {
		expect(
			buildMetaTemplateComponents({
				headerType: 'image',
				headerMediaSource: 'id',
				headerMediaId: '1234567890',
			}),
		).toEqual([
			{
				type: 'header',
				parameters: [{ type: 'image', image: { id: '1234567890' } }],
			},
		]);
	});

	it('builds document header with optional filename', () => {
		expect(
			buildMetaTemplateComponents({
				headerType: 'document',
				headerMediaSource: 'link',
				headerMediaUrl: 'https://cdn.example.com/invoice.pdf',
				headerDocumentFilename: 'invoice.pdf',
			}),
		).toEqual([
			{
				type: 'header',
				parameters: [
					{
						type: 'document',
						document: {
							link: 'https://cdn.example.com/invoice.pdf',
							filename: 'invoice.pdf',
						},
					},
				],
			},
		]);
	});

	it('builds location header', () => {
		expect(
			buildMetaTemplateComponents({
				headerType: 'location',
				headerLatitude: '-23.55',
				headerLongitude: '-46.63',
				headerLocationName: 'Store',
				headerLocationAddress: 'Main St',
			}),
		).toEqual([
			{
				type: 'header',
				parameters: [
					{
						type: 'location',
						location: {
							latitude: -23.55,
							longitude: -46.63,
							name: 'Store',
							address: 'Main St',
						},
					},
				],
			},
		]);
	});

	it('builds flow and payload button parameters', () => {
		expect(
			buildMetaTemplateComponents({
				buttonParameters: [
					{
						buttonSubType: 'flow',
						buttonIndex: 0,
						flowToken: 'token-abc',
						flowActionData: {
							fieldValues: [{ key: 'order_id', value: '42' }],
						},
					},
					{
						buttonSubType: 'quick_reply',
						buttonIndex: 1,
						buttonParameterType: 'payload',
						buttonPayload: 'TRACK_ORDER',
					},
				],
			}),
		).toEqual([
			{
				type: 'button',
				sub_type: 'flow',
				index: '0',
				parameters: [
					{
						type: 'action',
						action: {
							flow_token: 'token-abc',
							flow_action_data: { order_id: '42' },
						},
					},
				],
			},
			{
				type: 'button',
				sub_type: 'quick_reply',
				index: '1',
				parameters: [{ type: 'payload', payload: 'TRACK_ORDER' }],
			},
		]);
	});

	it('builds carousel template component', () => {
		expect(
			buildMetaTemplateComponents({
				componentMode: 'carousel',
				carouselCards: [
					{
						cardIndex: 0,
						headerType: 'image',
						headerMediaSource: 'link',
						headerMediaUrl: 'https://cdn.example.com/card0.jpg',
						bodyParameters: [{ parameterText: 'Card 0 body' }],
						buttonParameters: [
							{ buttonSubType: 'url', buttonIndex: 0, buttonText: 'shop' },
						],
					},
					{
						cardIndex: 1,
						headerType: 'video',
						headerMediaSource: 'id',
						headerMediaId: '2233445566',
					},
				],
			}),
		).toEqual([
			{
				type: 'carousel',
				cards: [
					{
						card_index: 0,
						components: [
							{
								type: 'header',
								parameters: [
									{
										type: 'image',
										image: { link: 'https://cdn.example.com/card0.jpg' },
									},
								],
							},
							{
								type: 'body',
								parameters: [{ type: 'text', text: 'Card 0 body' }],
							},
							{
								type: 'button',
								sub_type: 'url',
								index: '0',
								parameters: [{ type: 'text', text: 'shop' }],
							},
						],
					},
					{
						card_index: 1,
						components: [
							{
								type: 'header',
								parameters: [{ type: 'video', video: { id: '2233445566' } }],
							},
						],
					},
				],
			},
		]);
	});

		it('builds catalog and mpm template button components', () => {
			expect(
				buildMetaTemplateComponents({
					buttonParameters: [
						{
							buttonSubType: 'catalog',
							buttonIndex: 0,
							catalogThumbnailProductRetailerId: 'SKU_THUMB',
						},
						{
							buttonSubType: 'mpm',
							buttonIndex: 1,
							mpmThumbnailProductRetailerId: 'SKU_1',
							mpmSections: [
								{
									sectionTitle: 'Popular',
									productRetailerIds: ['SKU_1', 'SKU_2'],
								},
							],
						},
					],
				}),
			).toEqual([
				{
					type: 'button',
					sub_type: 'catalog',
					index: '0',
					parameters: [
						{
							type: 'action',
							action: { thumbnail_product_retailer_id: 'SKU_THUMB' },
						},
					],
				},
				{
					type: 'button',
					sub_type: 'mpm',
					index: '1',
					parameters: [
						{
							type: 'action',
							action: {
								thumbnail_product_retailer_id: 'SKU_1',
								sections: [
									{
										title: 'Popular',
										product_items: [
											{ product_retailer_id: 'SKU_1' },
											{ product_retailer_id: 'SKU_2' },
										],
									},
								],
							},
						},
					],
				},
			]);
		});

		it('builds copy-code template button components', () => {
			expect(
				buildMetaTemplateComponents({
					buttonParameters: [
						{
							buttonSubType: 'copy_code',
							buttonIndex: 0,
							buttonText: 'SAVE25',
						},
					],
				}),
			).toEqual([
				{
					type: 'button',
					sub_type: 'copy_code',
					index: '0',
					parameters: [{ type: 'coupon_code', coupon_code: 'SAVE25' }],
				},
			]);
		});

		it('uses advanced components JSON when provided', () => {
			expect(
				buildMetaTemplateComponents({
					advancedComponentsJson: '[{"type":"body","parameters":[{"type":"text","text":"Hi"}]}]',
					headerType: 'text',
					headerText: 'Ignored',
				}),
			).toEqual([
				{
					type: 'body',
					parameters: [{ type: 'text', text: 'Hi' }],
				},
			]);
		});

		it('rejects advanced components JSON that is not an array', () => {
			expect(() =>
				buildMetaTemplateComponents({
					advancedComponentsJson: '{"type":"body"}',
				}),
			).toThrow(/must be a JSON array/);
		});

		it('treats empty advanced components JSON array as absent', () => {
			expect(
				buildMetaTemplateComponents({
					advancedComponentsJson: '[]',
				}),
			).toBeUndefined();
		});

		it('rejects carousel mode without cards', () => {
			expect(() =>
				buildMetaTemplateComponents({
					componentMode: 'carousel',
					carouselCards: [],
				}),
			).toThrow(/at least one carousel card/);
		});

		it('rejects invalid location header coordinates', () => {
			expect(() =>
				buildMetaTemplateComponents({
					headerType: 'location',
					headerLatitude: 'not-a-number',
					headerLongitude: '-46.63',
				}),
			).toThrow(/latitude/i);
		});

		it('builds mpm button sections from nested UI values', () => {
			expect(
				buildMetaTemplateComponents({
					buttonParameters: [
						{
							buttonSubType: 'mpm',
							buttonIndex: 0,
							mpmSectionValues: {
								sectionValues: [
									{
										sectionTitle: 'Popular',
										productValues: {
											productItems: [{ productRetailerId: 'SKU_1' }, { productRetailerId: 'SKU_2' }],
										},
									},
								],
							},
						},
					],
				}),
			).toEqual([
				{
					type: 'button',
					sub_type: 'mpm',
					index: '0',
					parameters: [
						{
							type: 'action',
							action: {
								sections: [
									{
										title: 'Popular',
										product_items: [
											{ product_retailer_id: 'SKU_1' },
											{ product_retailer_id: 'SKU_2' },
										],
									},
								],
							},
						},
					],
				},
			]);
		});

		it('rejects mpm sections without products', () => {
			expect(() =>
				buildMetaTemplateComponents({
					buttonParameters: [
						{
							buttonSubType: 'mpm',
							buttonIndex: 0,
							mpmSectionValues: {
								sectionValues: [
									{
										sectionTitle: 'Popular',
										productValues: { productItems: [] },
									},
								],
							},
						},
					],
				}),
			).toThrow(/at least one product/);
		});
});
