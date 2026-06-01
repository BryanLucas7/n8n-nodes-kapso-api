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
