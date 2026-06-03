import { INodeProperties } from 'n8n-workflow';
import { messageMediaOperations, messageSendOperations } from '../actions/operations';
import {
	buttonIdField,
	buttonTitleField,
	documentFilenameField,
	emojiStringField,
	FILTER_STRING_MAX,
	interactiveHeaderTextField,
	listButtonTextField,
	listRowDescriptionField,
	listRowIdField,
	listRowTitleField,
	listSectionTitleField,
	maxLengthRegexValidation,
	mediaCaptionField,
	mediaIdStringField,
	metaPhoneResourceLocatorField,
	publicUrlStringField,
	textMessageField,
	wamidStringField,
} from './fieldConstraints';
import {
	KAPSO_DOCS,
	kapsoDocLink,
	withKapsoDoc,
} from './expressionHints';
import {
	templateButtonParameterCollectionOptions,
	templateButtonParametersField,
} from './templateShared.fields';
import { INodePropertyModeTypeOptions } from 'n8n-workflow';
import { contactCardEssentialFieldValues, defaultContactEntryValue } from './contactCard.fields';
import { optionalLabel } from './displayNames';

const messageRecipientOperations = [...messageSendOperations];

const messageMediaOps = [...messageMediaOperations];
const messageCaptionOperations = ['sendImage', 'sendVideo', 'sendDocument'];

/** Recipient, plain text, and media fields shown first for each message operation. */
export const messagePrimaryFields: INodeProperties[] = [
	metaPhoneResourceLocatorField('recipient', 'Recipient Phone', {
		show: {
			resource: ['message'],
			operation: messageRecipientOperations,
		},
	}),
	textMessageField({
		show: {
			resource: ['message'],
			operation: ['sendText'],
		},
	}),
	{
		displayName: 'Media Source',
		name: 'mediaSource',
		type: 'options',
		options: [
			{ name: 'Media ID', value: 'id' },
			{ name: 'Public Link', value: 'link' },
		],
		default: 'id',
		description: 'Whether the message uses a Meta media ID or a public HTTPS URL',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: messageMediaOps,
			},
		},
	},
	mediaIdStringField('mediaId', 'Media ID', {
		show: {
			resource: ['message'],
			operation: messageMediaOps,
			mediaSource: ['id'],
		},
	}),
	publicUrlStringField('mediaUrl', 'Public URL', {
		show: {
			resource: ['message'],
			operation: messageMediaOps,
			mediaSource: ['link'],
		},
	}),
	mediaCaptionField({
		show: {
			resource: ['message'],
			operation: messageCaptionOperations,
		},
	}),
	documentFilenameField('filename', 'Filename', {
		show: {
			resource: ['message'],
			operation: ['sendDocument'],
		},
	}),
];

/** Buttons and list rows shown after body text. */
export const messageInteractiveContentFields: INodeProperties[] = [
	{
		displayName: 'Buttons',
		name: 'buttons',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			maxValues: 3,
		},
		default: {},
		required: true,
		description: 'Reply buttons shown below the message body (1-3 buttons)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendButtons'],
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				description: 'One quick-reply button on the message',
				values: [buttonIdField(), buttonTitleField()],
			},
		],
	},
	listButtonTextField({
		show: {
			resource: ['message'],
			operation: ['sendList'],
		},
	}),
	{
		displayName: 'Sections',
		name: 'sections',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		description: 'List menu sections and rows (at least one section with one row)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendList'],
			},
		},
		options: [
			{
				displayName: 'Section',
				name: 'sectionValues',
				description: 'One section in the list menu',
				values: [
					listSectionTitleField(),
					{
						displayName: 'Rows',
						name: 'rowValues',
						placeholder: 'Add Row',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Selectable rows inside this section',
						options: [
							{
								displayName: 'Row',
								name: 'row',
								description: 'One selectable row in the list menu',
								values: [listRowIdField(), listRowTitleField(), listRowDescriptionField()],
							},
						],
					},
				],
			},
		],
	},
];

/** Template, contact, reaction, and read-state fields. */
export const messageTemplateAndAdminFields: INodeProperties[] = [
	{
		displayName: 'Contacts',
		name: 'contacts',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: { contactValues: [defaultContactEntryValue] },
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
			},
		},
		description: withKapsoDoc(
			'Add one or more vCard contacts to send',
			KAPSO_DOCS.sendContact,
			'Contact',
		),
		options: [
			{
				displayName: 'Contact',
				name: 'contactValues',
				description: 'One vCard contact to send',
				values: contactCardEssentialFieldValues,
			},
		],
	},
	{
		displayName: 'Template',
		name: 'templateName',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchMessageTemplates',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'By Template Name and Language',
				name: 'id',
				type: 'string',
				placeholder: 'order_update|en_US',
				typeOptions: {
					maxLength: FILTER_STRING_MAX,
				} as unknown as INodePropertyModeTypeOptions,
				validation: [
					{
						type: 'regex',
						properties: {
							regex: String.raw`[^|\s][^|]*\|[A-Za-z_-]{2,10}`,
							errorMessage: 'Use template_name|language_code (for example order_update|en_US)',
						},
					},
					maxLengthRegexValidation(FILTER_STRING_MAX, { label: 'Template' }),
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description:
			'Approved WhatsApp template for this send. Create and approve it in Kapso Dashboard > WhatsApp > Templates, then sync/refresh before selecting it here. Search by name or language, or paste template_name|language_code from the template details. ' +
			kapsoDocLink(KAPSO_DOCS.templateSimple, 'Templates'),
	},
	{
		displayName:
			'Header format and layout below are detected from the selected template. They drive which fields appear — reselect the template after syncing changes in Kapso if values look stale.',
		name: 'templateDetectedStructureNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Detected Template Header Format Name or ID',
		name: 'templateDetectedHeaderFormat',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateDetectedHeaderFormat',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description: 'Read-only header type from the approved template (do not change unless troubleshooting). Drives header media and location fields below. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Detected Template Layout Name or ID',
		name: 'templateDetectedComponentMode',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateDetectedComponentMode',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description: 'Read-only layout from the approved template: Standard or Carousel (do not change unless troubleshooting). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName:
			'Fill body placeholders at send time. If no mapper fields appear, the template has no body variables or uses carousel layout. Pick Text, Currency, or Date & Time per variable. ' +
			kapsoDocLink(KAPSO_DOCS.templateSimple, 'Templates'),
		name: 'templateBodyParametersNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
			},
		},
	},
	{
		displayName: 'Body Text Parameters',
		name: 'templateBodyParametersMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
			},
		},
		typeOptions: {
			loadOptionsDependsOn: ['phoneNumberId', 'templateName', 'templateBodyParametersMapper'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateBodyParameterFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'parameter',
					plural: 'parameters',
				},
				noFieldsError: 'Select a template with body variables before mapping body parameters.',
			},
		},
		description:
			'Map one value for each template body variable. The fields come from the approved template. For a simple inbound reply workflow, map the single variable to {{$json.kapso.content}} from Kapso Trigger. ' +
			withKapsoDoc(
				'Pick the parameter type first; only the fields for that type are shown',
				KAPSO_DOCS.templateSimple,
				'Templates',
			),
	},
	interactiveHeaderTextField('templateHeaderText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['text'],
			templateHeaderTextHasVariable: ['yes'],
		},
	}),
	{
		displayName: 'Template Header Text Hint Name or ID',
		name: 'templateHeaderTextHasVariable',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateHeaderTextHasVariable',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description: 'Loaded automatically from the selected template to show header text only when required. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Header Media Source',
		name: 'templateHeaderMediaSource',
		type: 'options',
		options: [
			{ name: 'Public Link', value: 'link' },
			{ name: 'Media ID', value: 'id' },
		],
		default: 'link',
		description: 'Public Link: HTTPS URL Meta can fetch (must match the approved template header type). Media ID: from Upload Media or Kapso Trigger; media type must match the template.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['image'],
			},
		},
	},
	{
		displayName: 'Header Media Source',
		name: 'templateHeaderMediaSource',
		type: 'options',
		options: [
			{ name: 'Public Link', value: 'link' },
			{ name: 'Media ID', value: 'id' },
		],
		default: 'link',
		description: 'Public Link: HTTPS URL Meta can fetch (must match the approved template header type). Media ID: from Upload Media or Kapso Trigger; media type must match the template.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['video'],
			},
		},
	},
	{
		displayName: 'Header Media Source',
		name: 'templateHeaderMediaSource',
		type: 'options',
		options: [
			{ name: 'Public Link', value: 'link' },
			{ name: 'Media ID', value: 'id' },
		],
		default: 'link',
		description: 'Public Link: HTTPS URL Meta can fetch (must match the approved template header type). Media ID: from Upload Media or Kapso Trigger; media type must match the template.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['document'],
			},
		},
	},
	publicUrlStringField('templateHeaderMediaUrl', 'Header Media URL', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['image'],
			templateHeaderMediaSource: ['link'],
		},
	}, 'Public HTTPS URL Meta can fetch when Header Media Source is Public Link; must match the approved template header type'),
	publicUrlStringField('templateHeaderMediaUrl', 'Header Media URL', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['video'],
			templateHeaderMediaSource: ['link'],
		},
	}, 'Public HTTPS URL Meta can fetch when Header Media Source is Public Link; must match the approved template header type'),
	publicUrlStringField('templateHeaderMediaUrl', 'Header Media URL', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['document'],
			templateHeaderMediaSource: ['link'],
		},
	}, 'Public HTTPS URL Meta can fetch when Header Media Source is Public Link; must match the approved template header type'),
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['image'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['video'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['document'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
	documentFilenameField('templateHeaderDocumentFilename', 'Header Document Filename', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['document'],
		},
	}),
	{
		displayName: 'Header Latitude',
		name: 'templateHeaderLatitude',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
			},
		},
		description: withKapsoDoc(
			'Latitude in decimal degrees (-90 to 90)',
			KAPSO_DOCS.templateLocationHeader,
			'Location header',
		),
	},
	{
		displayName: 'Header Longitude',
		name: 'templateHeaderLongitude',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
			},
		},
		description: 'Longitude in decimal degrees (-180 to 180)',
	},
	{
		displayName: optionalLabel('Header Location Name'),
		name: 'templateHeaderLocationName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
			},
		},
		description: 'Optional location title shown in the map pin',
	},
	{
		displayName: optionalLabel('Header Location Address'),
		name: 'templateHeaderLocationAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
			},
		},
		description: 'Optional street address shown under the location name',
	},
	{
		displayName:
			'Fill carousel card body placeholders at send time. Pick Text, Currency, or Date & Time per variable. ' +
			kapsoDocLink(KAPSO_DOCS.templateCarousel, 'Carousel templates'),
		name: 'templateCarouselBodyNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['carousel'],
			},
		},
	},
	{
		displayName: 'Carousel Body Parameters',
		name: 'templateCarouselBodyParametersMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['carousel'],
			},
		},
		typeOptions: {
			loadOptionsDependsOn: [
				'phoneNumberId',
				'templateName',
				'templateCarouselBodyParametersMapper',
			],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateCarouselBodyParameterFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'parameter',
					plural: 'parameters',
				},
				noFieldsError:
					'Select a carousel template with card body placeholders before mapping body parameters.',
			},
		},
		description:
			'Map one value for each carousel card body placeholder. Fields are grouped by card index from the approved template. ' +
			withKapsoDoc(
				'Pick the parameter type first; only the fields for that type are shown',
				KAPSO_DOCS.templateCarousel,
				'Carousel',
			),
	},
	{
		displayName: 'Carousel Template Guidance Name or ID',
		name: 'templateCarouselGuidance',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateCarouselGuidanceNotice',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['carousel'],
			},
		},
		description: 'Read-only summary of each carousel card from the selected template. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Carousel Cards',
		name: 'templateCarouselCards',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['carousel'],
			},
		},
		description: withKapsoDoc(
			'Add one card per approved template carousel card, in zero-based card_index order (0 = first card). Header type is inferred from the template',
			KAPSO_DOCS.templateCarousel,
			'Carousel',
		),
		options: [
			{
				displayName: 'Card',
				name: 'cardValues',
				description: 'One carousel card matching one approved template card at the chosen zero-based index',
				values: [
					{
						displayName: 'Card Index Name or ID',
						name: 'cardIndex',
						type: 'options',
						default: '',
						required: true,
						typeOptions: {
							loadOptionsMethod: 'getTemplateCarouselCardIndices',
							loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
						},
						description: 'Zero-based index for one approved template card (0 = first card). Options load from the template definition. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
						description: 'Public Link: HTTPS URL Meta can fetch. Media ID: from Upload Media or Kapso Trigger; must match the approved card header type.',
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
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Button',
						},
						default: {},
						description: 'Dynamic button values for this carousel card',
						options: templateButtonParameterCollectionOptions,
					},
				],
			},
		],
	},
	{
		displayName:
			'Templates with MPM (multi-product) buttons require the structured Button Parameters collection below. The resource mapper does not support MPM sections.',
		name: 'templateMpmButtonsNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateMpmButtonHint: ['yes'],
			},
		},
	},
	{
		displayName: 'Template MPM Hint Name or ID',
		name: 'templateMpmButtonHint',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateMpmButtonHint',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description: 'Loaded automatically from the selected template to show the MPM button notice when needed. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	templateButtonParametersField('templateButtonParameters', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
		},
	}),
	{
		displayName: 'Button Parameters',
		name: 'templateButtonParametersMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
			},
		},
		typeOptions: {
			loadOptionsDependsOn: ['phoneNumberId', 'templateName'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateButtonParameterFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'button parameter',
					plural: 'button parameters',
				},
				noFieldsError: 'Select a template with dynamic button parameters before mapping button values.',
			},
		},
		description: withKapsoDoc(
			'Map dynamic button values from the selected template. Use URL Suffix for dynamic URL buttons, Payload for quick replies, Coupon Code for copy-code buttons, and Flow Token for Flow buttons. Use the structured Button Parameters collection when you need MPM sections',
			KAPSO_DOCS.templateButtons,
			'Buttons',
		),
	},
	wamidStringField(
		'reactionMessageId',
		'React To Message ID',
		{
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
			},
		},
		{
			description: withKapsoDoc(
				'WAMID of the message to react to. For inbound reactions, use message.reaction.message_id from the Kapso Trigger payload',
				KAPSO_DOCS.sendReaction,
				'Reaction',
			),
		},
	),
	{
		displayName: 'Reaction Action',
		name: 'reactionMode',
		type: 'options',
		default: 'react',
		required: true,
		options: [
			{
				name: 'Add or Change Emoji',
				value: 'react',
				description:
					'Send an emoji reaction, or replace an existing reaction on this message with a different emoji',
			},
			{
				name: 'Remove Reaction',
				value: 'remove',
				description: 'Remove your business reaction from this message',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
			},
		},
		description: 'Add or change an emoji reaction, or remove your business reaction from the message',
	},
	emojiStringField({
		show: {
			resource: ['message'],
			operation: ['sendReaction'],
			reactionMode: ['react'],
		},
	}),
	wamidStringField('messageId', 'Message ID', {
		show: {
			resource: ['message'],
			operation: ['get', 'markRead'],
		},
	}),
	{
		displayName: optionalLabel('Typing Indicator'),
		name: 'typingIndicator',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['markRead'],
			},
		},
		description: 'Whether to show a typing indicator while marking the message as read',
	},
];

/** @deprecated Use split exports from index.ts for field order. */
export const messageFields: INodeProperties[] = [
	...messagePrimaryFields,
	...messageInteractiveContentFields,
	...messageTemplateAndAdminFields,
];
