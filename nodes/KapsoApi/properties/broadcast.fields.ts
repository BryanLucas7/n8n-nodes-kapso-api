import { INodeProperties, INodePropertyModeTypeOptions } from 'n8n-workflow';
import {
	e164PhoneResourceLocatorField,
	FILTER_STRING_MAX,
	interactiveHeaderTextField,
	limitedTextResourceLocatorField,
	LOCATION_TEXT_MAX,
	maxLengthRegexValidation,
	mediaIdStringField,
	publicUrlStringField,
	uuidResourceLocatorIdMode,
	uuidStringField,
} from './fieldConstraints';
import { KAPSO_DOCS, kapsoDocLink, withKapsoDoc } from './expressionHints';
import { templateButtonParameterCollectionOptions, templateButtonParametersField } from './templateShared.fields';
import {
	broadcastRecipientBodyMapperShow,
	broadcastRecipientButtonMapperShow,
	broadcastRecipientCarouselShow,
	broadcastRecipientCarouselBodyMapperShow,
	broadcastRecipientHeaderMediaIdShow,
	broadcastRecipientHeaderMediaSourceShow,
	broadcastRecipientHeaderMediaUrlShow,
	broadcastRecipientHeaderTextShow,
	broadcastRecipientLocationFieldShow,
} from './broadcastRecipientDisplayConditions';

const listSearchMode = (searchListMethod: string) => ({
	displayName: 'From List',
	name: 'list',
	type: 'list' as const,
	typeOptions: {
		searchListMethod,
		searchable: true,
		searchFilterRequired: false,
	},
});

const broadcastIdField: INodeProperties = {
	displayName: 'Broadcast',
	name: 'broadcastId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [listSearchMode('searchBroadcasts'), uuidResourceLocatorIdMode('broadcast-uuid')],
	displayOptions: {
		show: {
			resource: ['broadcast'],
			operation: ['get', 'addRecipients', 'listRecipients', 'send', 'schedule', 'cancel'],
		},
	},
	description: withKapsoDoc(
		'Broadcast campaign. After Create Broadcast, use the id field from the response. Search shows recent campaigns with template name and status',
		KAPSO_DOCS.broadcastApi,
		'Broadcasts',
	),
};

const broadcastTemplateSearchMode = {
	displayName: 'From List',
	name: 'list',
	type: 'list' as const,
	typeOptions: {
		searchListMethod: 'searchBroadcastTemplates',
		searchable: true,
		searchFilterRequired: false,
	},
};

const broadcastTemplateIdMode = {
	displayName: 'By Meta Template ID',
	name: 'id',
	type: 'string' as const,
	placeholder: '784203120908608',
	typeOptions: {
		maxLength: FILTER_STRING_MAX,
	} as unknown as INodePropertyModeTypeOptions,
	validation: [
		{
			type: 'regex' as const,
			properties: {
				regex: String.raw`\d{1,128}`,
				errorMessage: 'Use the numeric Meta template ID from the template details',
			},
		},
		maxLengthRegexValidation(FILTER_STRING_MAX, { label: 'Meta Template ID' }),
	],
};

export const broadcastFields: INodeProperties[] = [
	broadcastIdField,
	{
		displayName: 'Create returns a Draft broadcast. Next add recipients using the returned data.ID or select the broadcast from the list, then Send or Schedule. Drafts can also be reviewed in Kapso Dashboard > WhatsApp > Broadcasts.',
		name: 'broadcastCreateNextStepNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Broadcast Name',
		name: 'broadcastName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
		description: withKapsoDoc(
			'Human-readable name for the broadcast campaign',
			KAPSO_DOCS.broadcastApi,
			'Broadcasts',
		),
	},
	{
		displayName: 'Template',
		name: 'broadcastTemplateId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [broadcastTemplateSearchMode, broadcastTemplateIdMode],
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
		description:
			'Approved WhatsApp template for this campaign. Create and approve it in Kapso Dashboard > WhatsApp > Templates, then sync/refresh. Search by name or language, or paste the Meta template ID from the template details. ' +
			kapsoDocLink(KAPSO_DOCS.broadcastApi, 'Broadcasts'),
	},
	{
		displayName: 'Scheduled At',
		name: 'scheduledAt',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['schedule'],
			},
		},
		description: 'Date and time to send the broadcast. Use the date picker or ISO 8601; include a timezone offset when entering a value manually.',
	},
	{
		displayName: 'Broadcast Preflight Name or ID',
		name: 'broadcastSendPreflightNotice',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastSendPreflightNotice',
			loadOptionsDependsOn: ['broadcastId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['send', 'schedule'],
			},
		},
		description: 'Read-only status and recipient count before send or schedule. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName:
			'Sends the draft broadcast immediately. The broadcast must stay in draft status and already include recipients from Add Recipients.',
		name: 'broadcastSendOperationNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['send'],
			},
		},
	},
	{
		displayName:
			'Schedules the draft broadcast for the selected time. The broadcast must stay in draft status and already include recipients from Add Recipients.',
		name: 'broadcastScheduleOperationNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['schedule'],
			},
		},
	},
	{
		displayName:
			'Choose a draft broadcast below. The node loads its template fields automatically. Recipients can be added only while status is Draft.',
		name: 'broadcastAddRecipientsTemplateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
	},
	{
		displayName: 'Broadcast Template Summary Name or ID',
		name: 'broadcastTemplateSummaryNotice',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastTemplateSummaryNotice',
			loadOptionsDependsOn: ['broadcastId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
		description: 'Read-only summary of the template attached to the selected broadcast. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Kapso accepts up to 1,000 recipients per Add Recipients request. Split larger lists across multiple nodes.',
		name: 'broadcastAddRecipientsBatchNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
	},
	{
		displayName: 'Recipient Source',
		name: 'broadcastRecipientSource',
		type: 'options',
		default: 'builder',
		options: [
			{
				name: 'Recipients Builder',
				value: 'builder',
				description: 'Add recipients one by one in the node with template-driven fields',
			},
			{
				name: 'From Input Items',
				value: 'inputItems',
				description: 'Map one upstream item per recipient using JSON keys for phone and template variables',
			},
		],
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
		description: 'Use Recipients Builder for a small manual list. Use From Input Items when each incoming item is one recipient with a phone field plus optional contact ID, template variables, header values, and button values.',
	},
	{
		displayName: 'Phone JSON Field',
		name: 'broadcastRecipientPhoneField',
		type: 'string',
		default: 'phone',
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['inputItems'],
			},
		},
		description:
			'Name of the input JSON key containing the E.164 phone number, for example phone',
	},
	{
		displayName: 'Expected Input Item Keys Name or ID',
		name: 'broadcastInputItemSchemaPreview',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastInputItemSchemaPreview',
			loadOptionsDependsOn: [
				'broadcastId',
				'broadcastRecipientPhoneField',
				'broadcastRecipientContactIdField',
			],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['inputItems'],
			},
		},
		description: 'Read-only preview of the JSON keys each incoming item must provide for the selected broadcast template. Reselect the broadcast after template changes to refresh this list. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Contact ID JSON Field',
		name: 'broadcastRecipientContactIdField',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['inputItems'],
			},
		},
		description: 'Optional input item JSON key for an existing Kapso contact UUID. Used when no phone is present on the item.',
	},
	{
		displayName: 'Detected Template Header Format Name or ID',
		name: 'broadcastDetectedHeaderFormat',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastDetectedHeaderFormat',
			loadOptionsDependsOn: ['broadcastId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
			},
		},
		description: 'Read-only header type loaded from the broadcast template. If stale, reselect the broadcast after syncing template changes. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Detected Template Layout Name or ID',
		name: 'broadcastDetectedComponentMode',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastDetectedComponentMode',
			loadOptionsDependsOn: ['broadcastId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
			},
		},
		description: 'Read-only layout loaded from the broadcast template: standard body fields or carousel cards. If stale, reselect the broadcast after syncing template changes. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName:
			'Templates with MPM (multi-product) buttons require the structured Button Parameters collection on each recipient. The resource mapper does not support MPM sections.',
		name: 'broadcastMpmButtonsNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
				broadcastDetectedComponentMode: ['standard'],
				broadcastMpmButtonHint: ['yes'],
			},
		},
	},
	{
		displayName: 'Broadcast MPM Hint Name or ID',
		name: 'broadcastMpmButtonHint',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getBroadcastMpmButtonHint',
			loadOptionsDependsOn: ['broadcastId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
			},
		},
		description: 'Loaded automatically from the broadcast template to show the MPM button notice when needed. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Recipients',
		name: 'broadcastRecipients',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
			},
		},
		description: 'Recipients with template body, header, and button values per phone number or contact. Header type and carousel layout come from the broadcast template.',
		options: [
			{
				displayName: 'Recipient',
				name: 'recipientValues',
				values: [
					e164PhoneResourceLocatorField('phoneNumber', 'Phone Number', undefined, undefined, false),
					uuidStringField('whatsappContactId', 'Contact ID', {
						description: 'Optional existing Kapso contact UUID',
					}),
					{
						displayName: 'Body Text Parameters',
						name: 'recipientBodyParametersMapper',
						type: 'resourceMapper',
						noDataExpression: true,
						default: {
							mappingMode: 'defineBelow',
							value: null,
						},
						displayOptions: broadcastRecipientBodyMapperShow(),
						typeOptions: {
							loadOptionsDependsOn: ['broadcastId', 'recipientBodyParametersMapper'],
							resourceMapper: {
								resourceMapperMethod: 'getBroadcastRecipientBodyParameterFields',
								mode: 'add',
								addAllFields: true,
								supportAutoMap: false,
								fieldWords: {
									singular: 'parameter',
									plural: 'parameters',
								},
								noFieldsError:
									'Select a broadcast with body variables before mapping recipient body parameters.',
							},
						},
						description:
							'Map each body placeholder for this recipient (standard templates only; ignored for carousel)',
					},
					{
						displayName: 'Button Parameters',
						name: 'recipientButtonParametersMapper',
						type: 'resourceMapper',
						noDataExpression: true,
						default: {
							mappingMode: 'defineBelow',
							value: null,
						},
						displayOptions: broadcastRecipientButtonMapperShow(),
						typeOptions: {
							loadOptionsDependsOn: ['broadcastId'],
							resourceMapper: {
								resourceMapperMethod: 'getBroadcastRecipientButtonParameterFields',
								mode: 'add',
								addAllFields: true,
								supportAutoMap: false,
								fieldWords: {
									singular: 'button parameter',
									plural: 'button parameters',
								},
								noFieldsError:
									'Select a broadcast with dynamic buttons before mapping button parameters.',
							},
						},
						description:
							'Map dynamic button parameters for this recipient (standard templates only; ignored for carousel). Use the structured Button Parameters collection below for MPM sections.',
					},
					templateButtonParametersField('recipientButtonParameters', {
						show: {
							broadcastDetectedComponentMode: ['standard'],
						},
					}),
					interactiveHeaderTextField(
						'recipientHeaderText',
						'Header Text',
						broadcastRecipientHeaderTextShow(),
					),
					{
						displayName: 'Header Media Source',
						name: 'recipientHeaderMediaSource',
						type: 'options',
						options: [
							{ name: 'Public Link', value: 'link' },
							{ name: 'Media ID', value: 'id' },
						],
						default: 'link',
						displayOptions: broadcastRecipientHeaderMediaSourceShow('image'),
						description:
							'Media source when the broadcast template header is image, video, or document',
					},
					{
						displayName: 'Header Media Source',
						name: 'recipientHeaderMediaSource',
						type: 'options',
						options: [
							{ name: 'Public Link', value: 'link' },
							{ name: 'Media ID', value: 'id' },
						],
						default: 'link',
						displayOptions: broadcastRecipientHeaderMediaSourceShow('video'),
						description:
							'Media source when the broadcast template header is image, video, or document',
					},
					{
						displayName: 'Header Media Source',
						name: 'recipientHeaderMediaSource',
						type: 'options',
						options: [
							{ name: 'Public Link', value: 'link' },
							{ name: 'Media ID', value: 'id' },
						],
						default: 'link',
						displayOptions: broadcastRecipientHeaderMediaSourceShow('document'),
						description:
							'Media source when the broadcast template header is image, video, or document',
					},
					publicUrlStringField(
						'recipientHeaderMediaUrl',
						'Header Media URL',
						broadcastRecipientHeaderMediaUrlShow('image'),
						'Public media URL when Header Media Source is Public Link',
					),
					publicUrlStringField(
						'recipientHeaderMediaUrl',
						'Header Media URL',
						broadcastRecipientHeaderMediaUrlShow('video'),
						'Public media URL when Header Media Source is Public Link',
					),
					publicUrlStringField(
						'recipientHeaderMediaUrl',
						'Header Media URL',
						broadcastRecipientHeaderMediaUrlShow('document'),
						'Public media URL when Header Media Source is Public Link',
					),
					mediaIdStringField(
						'recipientHeaderMediaId',
						'Header Media ID',
						broadcastRecipientHeaderMediaIdShow('image'),
						false,
					),
					mediaIdStringField(
						'recipientHeaderMediaId',
						'Header Media ID',
						broadcastRecipientHeaderMediaIdShow('video'),
						false,
					),
					mediaIdStringField(
						'recipientHeaderMediaId',
						'Header Media ID',
						broadcastRecipientHeaderMediaIdShow('document'),
						false,
					),
					{
						displayName: 'Header Latitude',
						name: 'recipientHeaderLatitude',
						type: 'string',
						default: '',
						displayOptions: broadcastRecipientLocationFieldShow(),
						description: 'Location latitude when the broadcast template header is location',
					},
					{
						displayName: 'Header Longitude',
						name: 'recipientHeaderLongitude',
						type: 'string',
						default: '',
						displayOptions: broadcastRecipientLocationFieldShow(),
						description: 'Location longitude when the broadcast template header is location',
					},
					limitedTextResourceLocatorField(
						'recipientHeaderLocationName',
						'Header Location Name',
						LOCATION_TEXT_MAX,
						{
							optional: true,
							displayOptions: broadcastRecipientLocationFieldShow(),
							description: `Optional location title when the broadcast template header is location (max ${LOCATION_TEXT_MAX} characters)`,
						},
					),
					limitedTextResourceLocatorField(
						'recipientHeaderLocationAddress',
						'Header Location Address',
						LOCATION_TEXT_MAX,
						{
							optional: true,
							displayOptions: broadcastRecipientLocationFieldShow(),
							description: `Optional street address when the broadcast template header is location (max ${LOCATION_TEXT_MAX} characters)`,
						},
					),
					{
						displayName: 'Carousel Body Parameters',
						name: 'recipientCarouselBodyParametersMapper',
						type: 'resourceMapper',
						noDataExpression: true,
						default: {
							mappingMode: 'defineBelow',
							value: null,
						},
						displayOptions: broadcastRecipientCarouselBodyMapperShow(),
						typeOptions: {
							loadOptionsDependsOn: [
								'broadcastId',
								'recipientCarouselBodyParametersMapper',
							],
							resourceMapper: {
								resourceMapperMethod: 'getBroadcastRecipientCarouselBodyParameterFields',
								mode: 'add',
								addAllFields: true,
								supportAutoMap: false,
								fieldWords: {
									singular: 'parameter',
									plural: 'parameters',
								},
								noFieldsError:
									'Select a broadcast with carousel card body placeholders before mapping body parameters.',
							},
						},
						description:
							'Map each carousel card body placeholder for this recipient. Fields are grouped by card index from the broadcast template.',
					},
					{
						displayName: 'Carousel Cards',
						name: 'recipientCarouselCards',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						displayOptions: broadcastRecipientCarouselShow(),
						description: withKapsoDoc(
							'Carousel cards when the broadcast template uses carousel layout. Header type is inferred from the template',
							KAPSO_DOCS.templateCarousel,
							'Carousel',
						),
						options: [
							{
								displayName: 'Card',
								name: 'cardValues',
								description: 'One carousel card matching the approved template order',
								values: [
									{
										displayName: 'Card Index',
										name: 'cardIndex',
										type: 'number',
										default: 0,
										required: true,
										typeOptions: { minValue: 0 },
										description: 'Zero-based card index matching the template card_index',
									},
									{
										displayName: 'Header Media Source',
										name: 'cardHeaderMediaSource',
										type: 'options',
										options: [
											{ name: 'Public Link', value: 'link' },
											{ name: 'Media ID', value: 'id' },
										],
										default: 'link',
										description: 'Whether this card header uses a Meta media ID or a public URL',
									},
									publicUrlStringField('cardHeaderMediaUrl', 'Header Media URL', {
										show: {
											cardHeaderMediaSource: ['link'],
										},
									}, 'Public media URL when Header Media Source is Public Link'),
									mediaIdStringField('cardHeaderMediaId', 'Header Media ID', {
										show: {
											cardHeaderMediaSource: ['id'],
										},
									}, false),
					{
						displayName: 'Button Parameters',
										name: 'cardButtonParameters',
										type: 'fixedCollection',
										placeholder: 'Add Button Parameter',
										typeOptions: {
											multipleValues: true,
											multipleValueButtonText: 'Add Button Parameter',
										},
										default: {},
										description:
											'Add one entry per carousel card button index. Pick the type that matches that button.',
										options: templateButtonParameterCollectionOptions,
									},
								],
							},
						],
					},
					{
						displayName:
							'Optional override: raw Meta components array for this recipient only. When set, it replaces the body, header, and button fields above.',
						name: 'broadcastRecipientComponentsOverrideNotice',
						type: 'notice',
						default: '',
						displayOptions: {
							show: {
								broadcastDetectedComponentMode: ['standard'],
							},
						},
					},
					{
						displayName: 'Advanced Components JSON',
						name: 'recipientComponentsJson',
						type: 'json',
						default: '',
						displayOptions: {
							show: {
								broadcastDetectedComponentMode: ['standard'],
							},
						},
						description:
							'Optional raw Meta components array for this recipient. Overrides the body, header, and button fields above.',
					},
				],
			},
		],
	},
	{
		displayName: 'Recipients Body JSON (Advanced)',
		name: 'recipientsBodyJson',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
				broadcastRecipientSource: ['builder'],
			},
		},
		description:
			'Optional full Kapso recipients payload when the builder cannot express template components. Use only for prebuilt JSON from Kapso docs or API tooling. Not used with From Input Items.',
	},
];
