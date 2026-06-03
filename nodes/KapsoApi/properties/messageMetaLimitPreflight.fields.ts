import { INodeProperties } from 'n8n-workflow';

const metaLimitPreflightOperations = [
	'sendText',
	'sendImage',
	'sendVideo',
	'sendDocument',
	'sendButtons',
	'sendList',
	'sendCta',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
	'requestLocation',
	'sendCallPermission',
];

export const messageMetaLimitPreflightField: INodeProperties = {
	displayName: 'Meta Field Limit Preflight Name or ID',
	name: 'metaFieldLimitPreflightNotice',
	type: 'options',
	default: '',
	typeOptions: {
		loadOptionsMethod: 'getMetaFieldLimitPreflightNotice',
		loadOptionsDependsOn: [
			'resource',
			'operation',
			'textBody',
			'bodyText',
			'caption',
			'footerText',
			'listButtonText',
			'listHeaderType',
			'listHeaderText',
			'buttonHeaderType',
			'headerText',
			'ctaHeaderType',
			'ctaHeaderText',
			'ctaButtonLabel',
			'productListHeaderType',
			'productListHeaderText',
			'buttons',
			'sections',
			'productSections',
			'flowCta',
			'flowToken',
			'productRetailerId',
			'catalogThumbnailProductId',
		],
	},
	displayOptions: {
		show: {
			resource: ['message'],
			operation: metaLimitPreflightOperations,
		},
	},
	description:
		'Read-only check of Meta character limits for the current message fields. Refresh after editing text, buttons, or list rows. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
};
