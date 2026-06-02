import { INodeProperties } from 'n8n-workflow';
import { optionalLabel } from './displayNames';

export const templateAdvancedOptionsField: INodeProperties = {
	displayName: 'Template Advanced Options',
	name: 'templateAdvancedOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description:
		'Expert overrides for Send Template. Use only when structured template fields cannot express the approved template',
	displayOptions: {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
		},
	},
	options: [
		{
			displayName: optionalLabel('Advanced Components JSON'),
			name: 'advancedComponentsJson',
			type: 'json',
			default: '',
			description:
				'Optional raw Meta components array for edge cases not covered by the structured template fields',
		},
	],
};
