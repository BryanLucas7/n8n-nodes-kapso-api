import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KapsoApi } from '../../nodes/KapsoApi/KapsoApi.node';
import { namedOrderUpdateDefinition } from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const kapsoApiRequestMock = vi.fn();
const requestPaginatedMock = vi.fn();
const requestCursorListAllMock = vi.fn();
const fetchSelectedTemplateDefinitionMock = vi.hoisted(() => vi.fn());

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../nodes/KapsoApi/loadOptions/templateFetch')>();
	return {
		...actual,
		fetchSelectedTemplateDefinition: fetchSelectedTemplateDefinitionMock,
		resolveSendTemplateContext: vi.fn(async (_ef, _itemIndex) => {
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

vi.mock('../../nodes/KapsoApi/transport/request', () => ({
	kapsoApiRequest: (...args: unknown[]) => kapsoApiRequestMock(...args),
}));

vi.mock('../../nodes/KapsoApi/transport/pagination', () => ({
	requestPaginated: (...args: unknown[]) => requestPaginatedMock(...args),
	requestCursorListAll: (...args: unknown[]) => requestCursorListAllMock(...args),
	RETURN_ALL_FETCH_LIMIT: 100,
}));

describe('KapsoApi node execute', () => {
	const node = new KapsoApi();

	it('is usable as an AI tool', () => {
		expect(node.description.usableAsTool).toBe(true);
	});

	beforeEach(() => {
		kapsoApiRequestMock.mockReset();
		requestPaginatedMock.mockReset();
		requestCursorListAllMock.mockReset();
		fetchSelectedTemplateDefinitionMock.mockResolvedValue(namedOrderUpdateDefinition);
	});

	it('returns JSON items for a standard platform request', async () => {
		kapsoApiRequestMock.mockResolvedValue({ data: { id: 'conv-1' } });
		const ef = createMockExecuteFunctions({
			resource: 'conversation',
			operation: 'get',
		});

		const [items] = await node.execute.call(ef);

		expect(items).toHaveLength(1);
		expect(items[0].json).toEqual({ data: { id: 'conv-1' } });
		expect(kapsoApiRequestMock).toHaveBeenCalledOnce();
	});

	it('uses requestCursorListAll when message list returnAll is enabled', async () => {
		requestCursorListAllMock.mockResolvedValue({
			data: [{ id: 1 }, { id: 2 }],
			meta: { paginated: true },
		});
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'list',
			returnAll: true,
			page: 2,
			perPage: 50,
		});

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toMatchObject({ data: [{ id: 1 }, { id: 2 }] });
		expect(requestCursorListAllMock).toHaveBeenCalledOnce();
		expect(requestCursorListAllMock).toHaveBeenCalledWith(
			ef,
			expect.objectContaining({
				query: expect.objectContaining({ limit: 100 }),
			}),
			100,
			0,
		);
		expect(requestPaginatedMock).not.toHaveBeenCalled();
		expect(kapsoApiRequestMock).not.toHaveBeenCalled();
	});

	it('uses requestCursorListAll when platform message list returnAll is enabled', async () => {
		requestCursorListAllMock.mockResolvedValue({
			data: [{ id: 'msg-1' }],
			meta: { paginated: true },
		});
		const ef = createMockExecuteFunctions({
			resource: 'platformMessage',
			operation: 'list',
			returnAll: true,
			perPage: 50,
		});

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toMatchObject({ data: [{ id: 'msg-1' }] });
		expect(requestCursorListAllMock).toHaveBeenCalledOnce();
	});

	it('uses kapsoApiRequest with limit for a single message list page', async () => {
		kapsoApiRequestMock.mockResolvedValue({ data: [{ id: 'msg-1' }] });
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'list',
			perPage: 25,
		});

		await node.execute.call(ef);

		expect(kapsoApiRequestMock).toHaveBeenCalledWith(
			ef,
			expect.objectContaining({
				query: expect.objectContaining({ limit: 25 }),
			}),
			0,
		);
	});

	it('uploads binary media via multipart form data', async () => {
		kapsoApiRequestMock.mockResolvedValue({ id: 'media-1' });
		const ef = createMockExecuteFunctions(
			{
				resource: 'media',
				operation: 'uploadBinary',
				binaryPropertyName: 'data',
				phoneNumberId: TEST_PHONE_NUMBER_ID,
			},
			{
				items: [
					{
						json: {},
						binary: {
							data: {
								fileName: 'photo.png',
								mimeType: 'image/png',
							},
						},
					},
				],
			},
		);
		ef.helpers.getBinaryDataBuffer = vi.fn().mockResolvedValue(Buffer.from('png-bytes'));

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toEqual({ id: 'media-1' });
		expect(kapsoApiRequestMock).toHaveBeenCalledWith(
			ef,
			expect.objectContaining({
				api: 'whatsapp',
				method: 'POST',
				path: `/${TEST_PHONE_NUMBER_ID}/media`,
				formData: expect.objectContaining({
					messaging_product: 'whatsapp',
				}),
			}),
			0,
		);
	});

	it('downloads media into a binary output property', async () => {
		kapsoApiRequestMock.mockResolvedValue({
			body: Buffer.from('file-bytes'),
			headers: { 'content-type': 'image/png' },
		});
		const preparedBinary = { data: 'base64', mimeType: 'image/png' };
		const ef = createMockExecuteFunctions({
			resource: 'media',
			operation: 'download',
			outputBinaryProperty: 'mediaFile',
			downloadToken: 'signed-token',
		});
		ef.helpers.prepareBinaryData = vi.fn().mockResolvedValue(preparedBinary);

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toEqual({
			success: true,
			contentType: 'image/png',
		});
		expect(items[0].binary).toEqual({ mediaFile: preparedBinary });
	});

	it('captures errors when continueOnFail is enabled', async () => {
		kapsoApiRequestMock.mockRejectedValue(new Error('Kapso unavailable'));
		const ef = createMockExecuteFunctions(
			{
				resource: 'contact',
				operation: 'get',
			},
			{ continueOnFail: true },
		);

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toEqual({ error: 'Kapso unavailable' });
	});

	it('throws when binary upload input is missing', async () => {
		const ef = createMockExecuteFunctions({
			resource: 'media',
			operation: 'uploadBinary',
			binaryPropertyName: 'missing',
		});

		await expect(node.execute.call(ef)).rejects.toThrow(/Binary property "missing" was not found/);
	});

	it('uses requestPaginated for page-based broadcast lists', async () => {
		requestPaginatedMock.mockResolvedValue({
			data: [{ id: 'recipient-1' }],
			meta: { page: 2, total_pages: 5 },
		});
		const ef = createMockExecuteFunctions({
			resource: 'broadcast',
			operation: 'listRecipients',
			broadcastId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
			page: 2,
			perPage: 25,
			returnAll: false,
		});

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toMatchObject({ data: [{ id: 'recipient-1' }] });
		expect(requestPaginatedMock).toHaveBeenCalledOnce();
		expect(requestCursorListAllMock).not.toHaveBeenCalled();
	});

	it('executes sendTemplate through the async request builder', async () => {
		kapsoApiRequestMock.mockResolvedValue({
			messaging_product: 'whatsapp',
			messages: [{ id: 'wamid.template' }],
		});

		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'sendTemplate',
			templateName: 'order_update',
			languageCode: 'en_US',
			templateDetectedHeaderFormat: 'text',
			templateDetectedComponentMode: 'standard',
			templateBodyParametersMapper: {
				mappingMode: 'defineBelow',
				value: { first_name: 'Jessica', order_id: '12345' },
			},
		});

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toMatchObject({
			messages: [{ id: 'wamid.template' }],
		});
		expect(kapsoApiRequestMock).toHaveBeenCalledOnce();
		expect(kapsoApiRequestMock).toHaveBeenCalledWith(
			ef,
			expect.objectContaining({
				api: 'whatsapp',
				method: 'POST',
				body: expect.objectContaining({
					type: 'template',
					template: expect.objectContaining({
						name: 'order_update',
						language: { code: 'en_US' },
					}),
				}),
			}),
			0,
		);
	});

	it('exposes loadOptions and listSearch methods', () => {
		expect(node.methods?.loadOptions).toMatchObject({
			getPhoneNumbers: expect.any(Function),
			getMessageTemplates: expect.any(Function),
			getBroadcastTemplates: expect.any(Function),
		});
		expect(node.methods?.resourceMapping).toMatchObject({
			getTemplateBodyParameterFields: expect.any(Function),
			getTemplateButtonParameterFields: expect.any(Function),
			getFlowInitialDataFields: expect.any(Function),
		});
		expect(node.methods?.listSearch).toMatchObject({
			searchConversations: expect.any(Function),
			searchContacts: expect.any(Function),
			searchBroadcasts: expect.any(Function),
			searchCatalogs: expect.any(Function),
			searchCatalogProducts: expect.any(Function),
			searchWhatsappFlows: expect.any(Function),
		});
	});
});