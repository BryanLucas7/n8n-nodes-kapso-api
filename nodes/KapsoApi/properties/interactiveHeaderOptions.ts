import { INodeProperties } from 'n8n-workflow';

export const interactiveHeaderTypeOptions = [
	{ name: 'None', value: 'none' },
	{ name: 'Text', value: 'text' },
	{ name: 'Image', value: 'image' },
	{ name: 'Video', value: 'video' },
	{ name: 'Document', value: 'document' },
];

export const productListHeaderTypeOptions = [
	{ name: 'Text', value: 'text' },
	{ name: 'Image', value: 'image' },
	{ name: 'Video', value: 'video' },
	{ name: 'Document', value: 'document' },
];

export const interactiveHeaderMediaTypes = ['image', 'video', 'document'] as const;

export function interactiveHeaderMediaFields(
	prefix: string,
	operation: string[],
): INodeProperties[] {
	return [
		{
			displayName: 'Header Media Source',
			name: `${prefix}HeaderMediaSource`,
			type: 'options',
			options: [
				{ name: 'Public Link', value: 'link' },
				{ name: 'Media ID', value: 'id' },
			],
			default: 'link',
			displayOptions: {
				show: {
					resource: ['message'],
					operation,
					[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
				},
			},
		},
		{
			displayName: 'Header Media URL',
			name: `${prefix}HeaderMediaUrl`,
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					resource: ['message'],
					operation,
					[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
					[`${prefix}HeaderMediaSource`]: ['link'],
				},
			},
		},
		{
			displayName: 'Header Media ID',
			name: `${prefix}HeaderMediaId`,
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					resource: ['message'],
					operation,
					[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
					[`${prefix}HeaderMediaSource`]: ['id'],
				},
			},
			description: 'Media ID from Upload Media',
		},
		{
			displayName: 'Header Document Filename',
			name: `${prefix}HeaderDocumentFilename`,
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					resource: ['message'],
					operation,
					[`${prefix}HeaderType`]: ['document'],
				},
			},
			description: 'Optional filename shown for document headers',
		},
	];
}
