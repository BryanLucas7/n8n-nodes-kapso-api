import { INodeProperties } from 'n8n-workflow';
import { documentFilenameField, mediaIdStringField, publicUrlStringField } from './fieldConstraints';

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

export function interactiveHeaderTypeField(
	name: string,
	displayName: string,
	operation: string[],
): INodeProperties {
	return {
		displayName,
		name,
		type: 'options',
		options: interactiveHeaderTypeOptions,
		default: 'none',
		description: 'Optional header shown above the message body',
		displayOptions: {
			show: {
				resource: ['message'],
				operation,
			},
		},
	};
}

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
			description: 'Whether the header uses a Meta media ID or a public HTTPS URL',
			displayOptions: {
				show: {
					resource: ['message'],
					operation,
					[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
				},
			},
		},
		publicUrlStringField(`${prefix}HeaderMediaUrl`, 'Header Media URL', {
			show: {
				resource: ['message'],
				operation,
				[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
				[`${prefix}HeaderMediaSource`]: ['link'],
			},
		}, 'Public HTTPS URL for the header media'),
		mediaIdStringField(`${prefix}HeaderMediaId`, 'Header Media ID', {
			show: {
				resource: ['message'],
				operation,
				[`${prefix}HeaderType`]: [...interactiveHeaderMediaTypes],
				[`${prefix}HeaderMediaSource`]: ['id'],
			},
		}, false),
		documentFilenameField(`${prefix}HeaderDocumentFilename`, 'Header Document Filename', {
			show: {
				resource: ['message'],
				operation,
				[`${prefix}HeaderType`]: ['document'],
			},
		}),
	];
}
