import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationError, IDataObject } from 'n8n-workflow';
import * as messagePayloads from '../../nodes/KapsoApi/actions/messagePayloads';
import {
	buildMessageRequest,
	buildRequest,
	buildSendFlowRequest,
	customRelativePath,
	resolveWhatsappCustomPath,
} from '../../nodes/KapsoApi/actions/routing';
import { CUSTOM_API_CALL } from '../../nodes/KapsoApi/actions/operations';
import * as flowAssets from '../../nodes/KapsoApi/loadOptions/flowAssets';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

function messageRequest(operation: string, parameters: Record<string, unknown> = {}) {
	return buildMessageRequest(
		createMockExecuteFunctions({ resource: 'message', operation, ...parameters }),
		operation,
		0,
	);
}

function captureListSections(parameters: Record<string, unknown>) {
	const spy = vi
		.spyOn(messagePayloads, 'buildListMessage')
		.mockReturnValue({ type: 'interactive' } as IDataObject);

	try {
		messageRequest('sendList', parameters);
		return spy.mock.calls[0]?.[3];
	} finally {
		spy.mockRestore();
	}
}

function captureProductSections(parameters: Record<string, unknown>) {
	const spy = vi
		.spyOn(messagePayloads, 'buildProductListMessage')
		.mockReturnValue({ type: 'interactive' } as IDataObject);

	try {
		messageRequest('sendProductList', parameters);
		return spy.mock.calls[0]?.[3];
	} finally {
		spy.mockRestore();
	}
}

describe('routing message edge cases', () => {
	it('throws for unsupported message operations', () => {
		const ef = createMockExecuteFunctions();

		expect(() => buildMessageRequest(ef, 'unsupported', 0)).toThrow(ApplicationError);
		expect(() => buildMessageRequest(ef, 'unsupported', 0)).toThrow(/Unsupported message operation/);
	});

	it('requires custom relative paths', () => {
		expect(() => customRelativePath('')).toThrow(/Custom Relative Path is required/);
	});

	it('rejects sendTemplate in buildMessageRequest', () => {
		expect(() => messageRequest('sendTemplate')).toThrow(
			/Send Template requests are built asynchronously/,
		);
	});

	describe('sendList row extraction', () => {
		it('returns no rows when rowValues are absent before validation', () => {
			expect(() =>
				messageRequest('sendList', {
					sections: {
						sectionValues: [{ sectionTitle: 'Empty section' }],
					},
				}),
			).toThrow(ApplicationError);
		});

		it('omits rows when rowValues are missing', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{ sectionTitle: 'Empty section' },
						{
							sectionTitle: 'Filled section',
							rowValues: [{ rowId: 'keep', rowTitle: 'Keep' }],
						},
					],
				},
			});

			const sections = (request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
				.interactive.action.sections;
			expect(sections[0].rows).toEqual([]);
			expect(sections[1].rows).toEqual([{ id: 'keep', title: 'Keep' }]);
		});

		it('extracts flat row objects with optional description', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Options',
							rowValues: [
								{ rowId: 'a', rowTitle: 'Option A' },
								{ rowId: 'b', rowTitle: 'Option B', rowDescription: 'With details' },
							],
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
					.interactive.action.sections[0].rows,
			).toEqual([
				{ id: 'a', title: 'Option A' },
				{ id: 'b', title: 'Option B', description: 'With details' },
			]);
		});

		it('extracts nested row collections from array entries', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Nested',
							rowValues: [
								{
									row: [
										{ rowId: 'n1', rowTitle: 'Nested 1' },
										{ rowId: 'n2', rowTitle: 'Nested 2', rowDescription: 'Nested desc' },
									],
								},
							],
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
					.interactive.action.sections[0].rows,
			).toEqual([
				{ id: 'n1', title: 'Nested 1' },
				{ id: 'n2', title: 'Nested 2', description: 'Nested desc' },
			]);
		});

		it('extracts rows from object-shaped rowValues', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Object rows',
							rowValues: {
								row: [{ rowId: 'obj1', rowTitle: 'Object row' }],
							},
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
					.interactive.action.sections[0].rows,
			).toEqual([{ id: 'obj1', title: 'Object row' }]);
		});

		it('ignores invalid rowValues shapes', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Invalid',
							rowValues: [null, 'bad', { notRow: true }, { row: 'not-array' }],
						},
						{
							sectionTitle: 'Valid',
							rowValues: [{ rowId: 'ok', rowTitle: 'OK' }],
						},
					],
				},
			});

			const sections = (request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
				.interactive.action.sections;
			expect(sections[0].rows).toEqual([]);
			expect(sections[1].rows).toEqual([{ id: 'ok', title: 'OK' }]);
		});

		it('returns no rows for unrecognized rowValues objects', () => {
			const request = messageRequest('sendList', {
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Unknown',
							rowValues: { unexpected: true },
						},
						{
							sectionTitle: 'Valid',
							rowValues: [{ rowId: 'ok', rowTitle: 'OK' }],
						},
					],
				},
			});

			const sections = (request.body as { interactive: { action: { sections: Array<{ rows: unknown[] }> } } })
				.interactive.action.sections;
			expect(sections[0].rows).toEqual([]);
			expect(sections[1].rows).toEqual([{ id: 'ok', title: 'OK' }]);
		});
	});

	describe('sendProductList product extraction', () => {
		it('returns no products when productItems are absent before validation', () => {
			expect(() =>
				messageRequest('sendProductList', {
					productSections: {
						sectionValues: [{ sectionTitle: 'Empty products' }],
					},
				}),
			).toThrow('Each product list section must include at least one product.');
		});

		it('omits product ids when productItems are missing', () => {
			const sections = captureProductSections({
				productSections: {
					sectionValues: [
						{ sectionTitle: 'Empty products' },
						{
							sectionTitle: 'Filled products',
							productItems: [{ productRetailerId: 'SKU_KEEP' }],
						},
					],
				},
			});

			expect(sections).toEqual([
				{ sectionTitle: 'Empty products', productRetailerIds: [] },
				{ sectionTitle: 'Filled products', productRetailerIds: ['SKU_KEEP'] },
			]);
		});

		it('extracts flat productRetailerId entries', () => {
			const request = messageRequest('sendProductList', {
				productSections: {
					sectionValues: [
						{
							sectionTitle: 'Flat',
							productItems: [{ productRetailerId: 'SKU_FLAT' }],
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ product_items: unknown[] }> } } })
					.interactive.action.sections[0].product_items,
			).toEqual([{ product_retailer_id: 'SKU_FLAT' }]);
		});

		it('extracts nested product collections from array entries', () => {
			const request = messageRequest('sendProductList', {
				productSections: {
					sectionValues: [
						{
							sectionTitle: 'Nested',
							productItems: [
								{
									product: [
										{ productRetailerId: 'SKU_N1' },
										{ productRetailerId: 'SKU_N2' },
									],
								},
							],
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ product_items: unknown[] }> } } })
					.interactive.action.sections[0].product_items,
			).toEqual([
				{ product_retailer_id: 'SKU_N1' },
				{ product_retailer_id: 'SKU_N2' },
			]);
		});

		it('ignores invalid productItems shapes', () => {
			const request = messageRequest('sendProductList', {
				productSections: {
					sectionValues: [
						{
							sectionTitle: 'Invalid',
							productItems: [null, { product: 'not-array' }, { productRetailerId: 'SKU_OK' }],
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ product_items: unknown[] }> } } })
					.interactive.action.sections[0].product_items,
			).toEqual([{ product_retailer_id: 'SKU_OK' }]);
		});

		it('extracts products from object-shaped productItems', () => {
			const request = messageRequest('sendProductList', {
				productSections: {
					sectionValues: [
						{
							sectionTitle: 'Object products',
							productItems: {
								product: [{ productRetailerId: 'SKU_OBJ' }],
							},
						},
					],
				},
			});

			expect(
				(request.body as { interactive: { action: { sections: Array<{ product_items: unknown[] }> } } })
					.interactive.action.sections[0].product_items,
			).toEqual([{ product_retailer_id: 'SKU_OBJ' }]);
		});

		it('returns no products for unrecognized productItems values', () => {
			const sections = captureProductSections({
				productSections: {
					sectionValues: [
						{
							sectionTitle: 'Unknown object',
							productItems: { unexpected: true },
						},
						{
							sectionTitle: 'Unknown scalar',
							productItems: 'not-a-collection',
						},
						{
							sectionTitle: 'Valid',
							productItems: [{ productRetailerId: 'SKU_OK' }],
						},
					],
				},
			});

			expect(sections?.[0]?.productRetailerIds).toEqual([]);
			expect(sections?.[1]?.productRetailerIds).toEqual([]);
			expect(sections?.[2]?.productRetailerIds).toEqual(['SKU_OK']);
		});
	});

	describe('sendFlow validation', () => {
		it('requires a flow id', async () => {
			await expect(
				buildSendFlowRequest(
					createMockExecuteFunctions({
						resource: 'message',
						operation: 'sendFlow',
						flowId: '',
					}),
					0,
				),
			).rejects.toThrow(/Select a Flow/);
		});

		it('blocks data-exchange sends when flow encryption is not configured', async () => {
			const enrichSpy = vi.spyOn(flowAssets, 'enrichFlowSelectionForExecute').mockResolvedValue({
				metaFlowId: 'flow-1',
				hasDataEndpoint: true,
				flowsEncryptionConfigured: false,
				defaultScreen: 'BOOKING',
			});

			try {
				await expect(
					buildSendFlowRequest(
						createMockExecuteFunctions({
							resource: 'message',
							operation: 'sendFlow',
							flowId: 'flow-1',
							flowAction: 'data_exchange',
						}),
						0,
					),
				).rejects.toThrow(/Flow encryption is not configured/);
			} finally {
				enrichSpy.mockRestore();
			}
		});

		it('builds sendFlow using parsed flow metadata', async () => {
			const spy = vi
				.spyOn(messagePayloads, 'buildFlowMessage')
				.mockReturnValue({ type: 'interactive' } as IDataObject);

			try {
				await buildSendFlowRequest(
					createMockExecuteFunctions({
						resource: 'message',
						operation: 'sendFlow',
						flowId: 'kapso-uuid|flow-1|draft|3.0|0|BOOKING|Flow|0|0|',
						flowOptions: {},
					}),
					0,
				);

				const flowArgs = spy.mock.calls[0] ?? [];
    expect(flowArgs[4]).toBe('3');
				expect(flowArgs[5]).toBe('navigate');
				expect(flowArgs[6]).toBe('BOOKING');
				expect(flowArgs[9]).toBe('draft');
				expect(flowArgs.at(-2)).toBe('flow-1');
				expect(flowArgs.at(-1)).toBeUndefined();
			} finally {
				spy.mockRestore();
			}
		});
	});

	describe('optional header and body defaults', () => {
		it('defaults button header type when empty', () => {
			const request = messageRequest('sendButtons', {
				buttonHeaderType: '',
			});

			expect((request.body as { interactive: { header?: { type: string } } }).interactive.header).toBeUndefined();
		});

		it('defaults list header type when empty', () => {
			const request = messageRequest('sendList', {
				listHeaderType: '',
			});

			expect((request.body as { interactive: { header?: { type: string } } }).interactive.header).toBeUndefined();
		});

		it('omits optional sendProduct body text when empty', () => {
			const request = messageRequest('sendProduct', {
				bodyText: '',
			});

			expect((request.body as { interactive: { body?: { text: string } } }).interactive.body).toBeUndefined();
		});

		it('defaults product list header fields when empty', () => {
			const spy = vi
				.spyOn(messagePayloads, 'buildProductListMessage')
				.mockReturnValue({ type: 'interactive' } as IDataObject);

			try {
				messageRequest('sendProductList', {
					productListHeaderType: '',
					productListHeaderText: '',
				});

				expect(spy.mock.calls[0]?.[4]).toBe('text');
				expect(spy.mock.calls[0]?.[5]).toBeUndefined();
			} finally {
				spy.mockRestore();
			}
		});

		it('defaults reaction mode when empty', () => {
			const request = messageRequest('sendReaction', {
				reactionMode: '',
				reactionMessageId: 'wamid.react',
				emoji: '👍',
			});

			expect((request.body as { reaction: { emoji: string } }).reaction.emoji).toBe('👍');
		});
	});

	describe('custom API path helpers', () => {
		it('leaves whatsapp-prefixed paths unchanged without phone prefix', () => {
			expect(resolveWhatsappCustomPath('', '/whatsapp/contacts')).toBe('/whatsapp/contacts');
			expect(resolveWhatsappCustomPath('', '/12345/messages')).toBe('/12345/messages');
		});

		it('includes body on custom GET requests when body json is provided', () => {
			const request = buildRequest(
				createMockExecuteFunctions({
					resource: CUSTOM_API_CALL,
					operation: CUSTOM_API_CALL,
					customMethod: 'GET',
					customApiSurface: 'platform',
					customPath: '/whatsapp/contacts',
					bodyJson: '{"limit":1}',
				}),
				CUSTOM_API_CALL,
				CUSTOM_API_CALL,
				0,
			);

			expect(request.body).toEqual({ limit: 1 });
		});
	});
});

describe('routing media operation type fallback', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('defaults unknown media operations to image type', async () => {
		vi.doMock('../../nodes/KapsoApi/actions/operations', async () => {
			const actual = await vi.importActual<typeof import('../../nodes/KapsoApi/actions/operations')>(
				'../../nodes/KapsoApi/actions/operations',
			);
			return {
				...actual,
				messageMediaOperations: ['orphanMedia'],
			};
		});

		const { buildMessageRequest: buildMessageRequestIsolated } = await import(
			'../../nodes/KapsoApi/actions/routing'
		);

		const request = buildMessageRequestIsolated(
			createMockExecuteFunctions({
				resource: 'message',
				operation: 'orphanMedia',
				mediaSource: 'id',
			}),
			'orphanMedia',
			0,
		);

		expect((request.body as { type: string }).type).toBe('image');
	});
});
