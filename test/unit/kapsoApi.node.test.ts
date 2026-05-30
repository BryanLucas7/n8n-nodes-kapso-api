import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KapsoApi } from '../../nodes/KapsoApi/KapsoApi.node';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const kapsoApiRequestMock = vi.fn();
const requestPaginatedMock = vi.fn();

vi.mock('../../nodes/KapsoApi/transport/request', () => ({
	kapsoApiRequest: (...args: unknown[]) => kapsoApiRequestMock(...args),
}));

vi.mock('../../nodes/KapsoApi/transport/pagination', () => ({
	requestPaginated: (...args: unknown[]) => requestPaginatedMock(...args),
}));

describe('KapsoApi node execute', () => {
	const node = new KapsoApi();

	beforeEach(() => {
		kapsoApiRequestMock.mockReset();
		requestPaginatedMock.mockReset();
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

	it('uses requestPaginated when returnAll is enabled', async () => {
		requestPaginatedMock.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], meta: { paginated: true } });
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'list',
			returnAll: true,
			page: 2,
			perPage: 50,
		});

		const [items] = await node.execute.call(ef);

		expect(items[0].json).toMatchObject({ data: [{ id: 1 }, { id: 2 }] });
		expect(requestPaginatedMock).toHaveBeenCalledOnce();
		expect(kapsoApiRequestMock).not.toHaveBeenCalled();
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

	it('exposes loadOptions and listSearch methods', () => {
		expect(node.methods?.loadOptions).toMatchObject({
			getPhoneNumbers: expect.any(Function),
			getMessageTemplates: expect.any(Function),
		});
		expect(node.methods?.listSearch).toMatchObject({
			searchConversations: expect.any(Function),
			searchContacts: expect.any(Function),
			searchBroadcasts: expect.any(Function),
		});
	});
});
