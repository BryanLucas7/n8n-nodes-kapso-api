import { INodeProperties } from 'n8n-workflow';
import { interactiveFooterTextField } from './fieldConstraints';

/** Footer fields placed after message body and primary action content. */
export const messageInteractiveFooterFields: INodeProperties[] = [
	interactiveFooterTextField('footerText', 'Footer Text', {
		show: {
			resource: ['message'],
			operation: ['sendButtons', 'sendList', 'sendCta', 'sendProductList'],
		},
	}),
];
