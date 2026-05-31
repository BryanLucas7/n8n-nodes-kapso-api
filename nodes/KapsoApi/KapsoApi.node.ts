import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import {
	asJsonItems,
	getBoolean,
	getNumber,
	getString,
	itemPair,
} from './actions/nodeHelpers';
import { resourcesWithCursorPagination, resourcesWithPagination } from './actions/operations';
import { buildRequest, pathId } from './actions/routing';
import {
	getBroadcastTemplates,
	getMessageTemplates,
	getPhoneNumbers,
	searchBroadcasts,
	searchContacts,
	searchConversations,
} from './loadOptions';
import { kapsoNodeProperties } from './properties';
import { requestCursorListAll, requestPaginated } from './transport/pagination';
import { kapsoApiRequest } from './transport/request';

export class KapsoApi implements INodeType {
	methods = {
		loadOptions: {
			getPhoneNumbers,
			getMessageTemplates,
			getBroadcastTemplates,
		},
		listSearch: {
			searchConversations,
			searchContacts,
			searchBroadcasts,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Kapso API',
		name: 'kapsoApi',
		icon: 'file:kapso.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Use documented Kapso Platform and Meta-compatible WhatsApp APIs',
		defaults: {
			name: 'Kapso API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kapsoApi',
				required: true,
			},
		],
		properties: kapsoNodeProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'media' && operation === 'uploadBinary') {
					const binaryPropertyName = getString(this, 'binaryPropertyName', itemIndex);
					const item = items[itemIndex];
					const binaryMetadata = item.binary?.[binaryPropertyName];

					if (!binaryMetadata) {
						throw new NodeOperationError(
							this.getNode(),
							`Binary property "${binaryPropertyName}" was not found on item ${itemIndex}.`,
							{ itemIndex },
						);
					}

					const fileBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
					const phoneNumberId = pathId(getString(this, 'phoneNumberId', itemIndex), 'Phone Number ID');
					const response = await kapsoApiRequest(
						this,
						{
							api: 'whatsapp',
							method: 'POST' as IHttpRequestMethods,
							path: `/${phoneNumberId}/media`,
							formData: {
								messaging_product: 'whatsapp',
								file: {
									value: fileBuffer,
									options: {
										filename: binaryMetadata.fileName ?? 'upload',
										contentType: binaryMetadata.mimeType,
									},
								},
							},
						},
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'media' && operation === 'download') {
					const response = (await kapsoApiRequest(
						this,
						buildRequest(this, resource, operation, itemIndex),
						itemIndex,
					)) as { body?: Buffer; headers?: IDataObject };
					const body = response.body ?? (response as unknown as Buffer);
					const headers = response.headers ?? {};
					const outputBinaryProperty = getString(this, 'outputBinaryProperty', itemIndex);
					const contentType = (headers['content-type'] as string | undefined) ?? 'application/octet-stream';
					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.isBuffer(body) ? body : Buffer.from(String(body)),
						'kapso-media',
						contentType,
					);

					returnData.push({
						json: {
							success: true,
							contentType,
						},
						binary: {
							[outputBinaryProperty]: binaryData,
						},
						pairedItem: itemPair(itemIndex),
					});
					continue;
				}

				const requestArgs = buildRequest(this, resource, operation, itemIndex);
				const opKey = `${resource}:${operation}`;
				const isPaginated = resourcesWithPagination.includes(opKey);
				const returnAll = isPaginated && getBoolean(this, 'returnAll', itemIndex);
				const perPage = getNumber(this, 'perPage', itemIndex, 20);
				const page = getNumber(this, 'page', itemIndex, 1);

				let response: unknown;

				if (resourcesWithCursorPagination.includes(opKey)) {
					const listQuery = {
						...(requestArgs.query ?? {}),
						limit: perPage,
					};

					response = returnAll
						? await requestCursorListAll(
								this,
								{
									...requestArgs,
									query: listQuery,
								},
								perPage,
								itemIndex,
							)
						: await kapsoApiRequest(
								this,
								{
									...requestArgs,
									query: listQuery,
								},
								itemIndex,
							);
				} else if (isPaginated) {
					response = await requestPaginated(
						this,
						{
							...requestArgs,
							query: {
								...(requestArgs.query ?? {}),
								page,
								per_page: perPage,
							},
						},
						returnAll,
						perPage,
						itemIndex,
					);
				} else {
					response = await kapsoApiRequest(this, requestArgs, itemIndex);
				}

				returnData.push(...asJsonItems(response, itemIndex));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: itemPair(itemIndex),
					});
					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}
