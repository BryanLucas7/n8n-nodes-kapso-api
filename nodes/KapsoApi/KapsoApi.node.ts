import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	SEND_AND_WAIT_OPERATION,
} from 'n8n-workflow';
import {
	asJsonItems,
	getBoolean,
	getMetaPhoneResourceLocatorValue,
	getNumber,
	getString,
	itemPair,
} from './actions/nodeHelpers';
import { resourcesWithCursorPagination, resourcesWithPagination } from './actions/operations';
import { buildRequest, buildBroadcastAddRecipientsRequest, buildBroadcastCreateRequest, buildGetCatalogRequest, buildSendFlowRequest, buildSendTemplateRequest, pathId } from './actions/routing';
import {
	assertBroadcastReadyToSend,
	assertBroadcastScheduledForCancel,
} from './actions/broadcastPreflight';
import { assertKapsoMetaFieldLimits } from './actions/parameterPreflight';
import { assertMetaRecipientPhone } from './actions/validation';
import {
	buildSendAndWaitMessagePayload,
	resolveSendAndWaitDeliveryMode,
} from './sendAndWait/message';
import { configureWaitTillDate } from './sendAndWait/configureWaitTillDate';
import {
	getSendAndWaitApprovalType,
	getSendAndWaitConfig,
	getSendAndWaitProperties,
	SEND_AND_WAIT_WAITING_TOOLTIP,
	sendAndWaitWebhook,
} from './sendAndWait/utils';
import { sendAndWaitWebhooksDescription } from './sendAndWait/descriptions';
import {
	getBroadcastTemplates,
	getMessageTemplates,
	getPhoneNumbers,
	getBroadcastSendPreflightNotice,
	getBroadcastTemplateSummaryNotice,
	getTemplateSummary,
	getTemplateLanguages,
	getFlowScreens,
	getFlowActions,
	searchBroadcasts,
	searchBroadcastTemplates,
	searchMessageTemplates,
	searchContacts,
	searchConversations,
	searchCatalogs,
	searchCatalogProducts,
	searchWhatsappFlows,
} from './loadOptions';
import {
	getTemplateCarouselCardIndices,
	getTemplateCarouselGuidanceNotice,
} from './loadOptions/templateCarouselOptions';
import { getBroadcastInputItemSchemaPreview } from './loadOptions/broadcastInputItemSchemaPreview';
import {
	getBroadcastRecipientBodyParameterFields,
	getBroadcastRecipientButtonParameterFields,
	getBroadcastRecipientCarouselBodyParameterFields,
} from './resourceMapping/broadcastRecipientParameters';
import {
	getTemplateBodyParameterFields,
	getTemplateButtonParameterFields,
	getTemplateCarouselBodyParameterFields,
} from './resourceMapping/templateParameters';
import { getFlowInitialDataFields } from './resourceMapping/flowInitialData';
import { kapsoNodeProperties } from './properties';
import { executeListOperation, RETURN_ALL_FETCH_LIMIT } from './transport/executeList';
import { kapsoApiRequest } from './transport/request';

export class KapsoApi implements INodeType {
	methods = {
		loadOptions: {
			getPhoneNumbers,
			getMessageTemplates,
			getBroadcastTemplates,
			getTemplateLanguages,
			getBroadcastTemplateSummaryNotice,
	getBroadcastSendPreflightNotice,
	getTemplateSummary,
			getTemplateCarouselCardIndices,
			getTemplateCarouselGuidanceNotice,
			getBroadcastInputItemSchemaPreview,
			getFlowScreens,
			getFlowActions,
		},
		listSearch: {
			searchConversations,
			searchContacts,
			searchBroadcasts,
			searchBroadcastTemplates,
			searchMessageTemplates,
			searchCatalogs,
			searchCatalogProducts,
			searchWhatsappFlows,
		},
		resourceMapping: {
			getTemplateBodyParameterFields,
			getTemplateButtonParameterFields,
			getTemplateCarouselBodyParameterFields,
			getBroadcastRecipientBodyParameterFields,
			getBroadcastRecipientButtonParameterFields,
			getBroadcastRecipientCarouselBodyParameterFields,
			getFlowInitialDataFields,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Kapso API',
		name: 'kapsoApi',
		icon: 'file:kapso.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Send WhatsApp messages, templates, flows, media, contacts, broadcasts, and inbox records through Kapso. Choose a resource, then follow each operation setup hints.',
		documentationUrl: 'https://docs.kapso.ai/docs/introduction',
		defaults: {
			name: 'Kapso API',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		waitingNodeTooltip: SEND_AND_WAIT_WAITING_TOOLTIP,
		webhooks: sendAndWaitWebhooksDescription,
		credentials: [
			{
				name: 'kapsoApi',
				required: true,
			},
		],
		properties: [...kapsoNodeProperties, ...getSendAndWaitProperties()],
	};

	webhook = sendAndWaitWebhook;

	customOperations = {
		message: {
			async [SEND_AND_WAIT_OPERATION](this: IExecuteFunctions) {
				const phoneNumberId = pathId(getString(this, 'phoneNumberId', 0), 'Phone Number ID');
				const to = assertMetaRecipientPhone(
					getMetaPhoneResourceLocatorValue(this, 'recipient', 0, 'Recipient Phone'),
				);
				const config = getSendAndWaitConfig(this);
				const approvalType = getSendAndWaitApprovalType(this);
				const requestedDeliveryMode = getString(this, 'sendAndWaitDeliveryMode', 0) || 'textLinks';
				const deliveryMode = resolveSendAndWaitDeliveryMode(requestedDeliveryMode, approvalType);
				const messageBody = buildSendAndWaitMessagePayload(
					to,
					config,
					deliveryMode,
					this.getInstanceId(),
				);

				try {
					await kapsoApiRequest(
						this,
						{
							api: 'whatsapp',
							method: 'POST' as IHttpRequestMethods,
							path: `/${phoneNumberId}/messages`,
							body: messageBody,
						},
						0,
					);
				} catch (error) {
					if (this.continueOnFail()) {
						return [[{ json: { error: error instanceof Error ? error.message : String(error) } }]];
					}

					throw new NodeOperationError(this.getNode(), error as Error);
				}

				const waitTill = configureWaitTillDate(this);
				await this.putExecutionToWait(waitTill);
				return [this.getInputData()];
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'message') {
					assertKapsoMetaFieldLimits(this, itemIndex);
				}

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

				if (resource === 'message' && operation === 'sendTemplate') {
					const response = await kapsoApiRequest(
						this,
						await buildSendTemplateRequest(this, itemIndex),
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'message' && operation === 'getCatalog') {
					const response = await kapsoApiRequest(
						this,
						await buildGetCatalogRequest(this, itemIndex),
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'message' && operation === 'sendFlow') {
					const response = await kapsoApiRequest(
						this,
						await buildSendFlowRequest(this, itemIndex),
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'broadcast' && operation === 'create') {
					const response = await kapsoApiRequest(
						this,
						await buildBroadcastCreateRequest(this, itemIndex),
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'broadcast' && operation === 'addRecipients') {
					const recipientSource =
						getString(this, 'broadcastRecipientSource', itemIndex) || 'builder';
					if (recipientSource === 'builder' && itemIndex > 0) {
						returnData.push({
							json: {
								skipped: true,
								reason:
									'Add Recipients (Recipients Builder) runs once on input item 0 only. Connect a single item or use From Input Items for one recipient per item.',
							},
							pairedItem: itemPair(itemIndex),
						});
						continue;
					}

					const response = await kapsoApiRequest(
						this,
						await buildBroadcastAddRecipientsRequest(this, itemIndex),
						itemIndex,
					);
					returnData.push(...asJsonItems(response, itemIndex));
					continue;
				}

				if (resource === 'broadcast' && operation === 'cancel') {
					await assertBroadcastScheduledForCancel(this, itemIndex);
				}

				if (resource === 'broadcast' && (operation === 'send' || operation === 'schedule')) {
					await assertBroadcastReadyToSend(this, itemIndex);
				}

				const requestArgs = buildRequest(this, resource, operation, itemIndex);
				const opKey = `${resource}:${operation}`;
				const isPaginated =
					resourcesWithPagination.includes(opKey) ||
					resourcesWithCursorPagination.includes(opKey);
				const returnAll = isPaginated && getBoolean(this, 'returnAll', itemIndex);
				const perPage = returnAll
					? RETURN_ALL_FETCH_LIMIT
					: getNumber(this, 'perPage', itemIndex, 20);
				const page = getNumber(this, 'page', itemIndex, 1);

				const response =
					isPaginated || resourcesWithCursorPagination.includes(opKey)
						? await executeListOperation(this, opKey, requestArgs, itemIndex, {
								returnAll,
								page,
								perPage,
							})
						: await kapsoApiRequest(this, requestArgs, itemIndex);

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
