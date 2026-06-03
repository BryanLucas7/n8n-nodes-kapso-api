import { INodeProperties } from 'n8n-workflow';
import { optionalLabel } from './displayNames';
import {
	CONTACT_FORMATTED_NAME_MAX,
	e164PhoneResourceLocatorField,
	limitedTextResourceLocatorField,
} from './fieldConstraints';

/** One empty phone row — phone is required, so Send Contact starts with a slot ready to fill. */
export const defaultContactPhonesValue = {
	phoneValues: [{ phoneNumber: '', phoneType: 'MOBILE' }],
};

/** One empty contact row with a default phone slot for Send Contact. */
export const defaultContactEntryValue = {
	formattedName: '',
	phones: defaultContactPhonesValue,
};

const phoneEntryFields: INodeProperties[] = [
	e164PhoneResourceLocatorField(
		'phoneNumber',
		'Phone Number',
		undefined,
		'Phone number in E.164 format with leading + for the contact card',
	),
	{
		displayName: optionalLabel('Phone Type'),
		name: 'phoneType',
		type: 'options',
		options: [
			{ name: 'Mobile', value: 'MOBILE' },
			{ name: 'Work', value: 'WORK' },
			{ name: 'Home', value: 'HOME' },
			{ name: 'Main', value: 'MAIN' },
		],
		default: 'MOBILE',
		description: 'Category shown on the contact card. Defaults to Mobile.',
	},
	{
		displayName: optionalLabel('WhatsApp ID'),
		name: 'waId',
		type: 'string',
		default: '',
		description: 'WhatsApp user ID for Message/Save contact buttons. Leave empty to show Invite to WhatsApp instead.',
	},
];

const emailEntryFields: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		description: 'Email address',
	},
	{
		displayName: optionalLabel('Email Type'),
		name: 'emailType',
		type: 'options',
		options: [
			{ name: 'Work', value: 'WORK' },
			{ name: 'Home', value: 'HOME' },
		],
		default: 'WORK',
		description: 'Category shown on the contact card. Defaults to Work.',
	},
];

const urlEntryFields: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		description: 'Website URL',
	},
	{
		displayName: optionalLabel('URL Type'),
		name: 'urlType',
		type: 'options',
		options: [
			{ name: 'Work', value: 'WORK' },
			{ name: 'Home', value: 'HOME' },
		],
		default: 'WORK',
		description: 'Category shown on the contact card. Defaults to Work.',
	},
];

const addressEntryFields: INodeProperties[] = [
	{
		displayName: optionalLabel('Street'),
		name: 'street',
		type: 'string',
		default: '',
		description: 'Street address line',
	},
	{
		displayName: optionalLabel('City'),
		name: 'city',
		type: 'string',
		default: '',
		description: 'City name',
	},
	{
		displayName: optionalLabel('State'),
		name: 'state',
		type: 'string',
		default: '',
		description: 'State, province, or region',
	},
	{
		displayName: optionalLabel('ZIP'),
		name: 'zip',
		type: 'string',
		default: '',
		description: 'Postal or ZIP code',
	},
	{
		displayName: optionalLabel('Country'),
		name: 'country',
		type: 'string',
		default: '',
		description: 'Country name',
	},
	{
		displayName: optionalLabel('Country Code'),
		name: 'countryCode',
		type: 'string',
		default: '',
		description: 'Two-letter country code (ISO 3166-1 alpha-2)',
	},
	{
		displayName: optionalLabel('Address Type'),
		name: 'addressType',
		type: 'options',
		options: [
			{ name: 'Work', value: 'WORK' },
			{ name: 'Home', value: 'HOME' },
		],
		default: 'WORK',
		description: 'Category shown on the contact card. Defaults to Work.',
	},
];

/** Essential contact card fields shown by default in Send Contact. */
export const contactCardEssentialFieldValues: INodeProperties[] = [
	limitedTextResourceLocatorField('formattedName', 'Formatted Name', CONTACT_FORMATTED_NAME_MAX, {
		required: true,
		description: `Full display name shown on the contact card (max ${CONTACT_FORMATTED_NAME_MAX} characters)`,
	}),
	{
		displayName: optionalLabel('First Name'),
		name: 'firstName',
		type: 'string',
		default: '',
		description: 'Given name for the contact card',
	},
	{
		displayName: optionalLabel('Last Name'),
		name: 'lastName',
		type: 'string',
		default: '',
		description: 'Family name for the contact card',
	},
	{
		displayName: 'Phones',
		name: 'phones',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-fixed-collection -- one empty phone row for Send Contact UX
		default: defaultContactPhonesValue,
		required: true,
		description: 'At least one phone number for the contact card',
		options: [
			{
				displayName: 'Phone',
				name: 'phoneValues',
				description: 'Phone entry on the contact card',
				values: phoneEntryFields,
			},
		],
	},
	{
		displayName: 'Additional Contact Details',
		name: 'contactAdditionalDetails',
		type: 'collection',
		placeholder: 'Add Detail',
		default: {},
		description:
			'Optional vCard fields such as email, organization, birthday, URLs, and addresses',
		options: [
			{
				displayName: optionalLabel('Middle Name'),
				name: 'middleName',
				type: 'string',
				default: '',
				description: 'Middle name on the contact card',
			},
			{
				displayName: optionalLabel('Name Prefix'),
				name: 'namePrefix',
				type: 'string',
				default: '',
				placeholder: 'Dr.',
				description: 'Honorific prefix (for example Dr., Mr.)',
			},
			{
				displayName: optionalLabel('Name Suffix'),
				name: 'nameSuffix',
				type: 'string',
				default: '',
				placeholder: 'Jr.',
				description: 'Name suffix (for example Jr., III)',
			},
			{
				displayName: optionalLabel('Birthday'),
				name: 'birthday',
				type: 'string',
				default: '',
				placeholder: '1990-01-01',
				description: 'ISO 8601 date (YYYY-MM-DD)',
			},
			{
				displayName: optionalLabel('Organization'),
				name: 'organization',
				type: 'string',
				default: '',
				description: 'Company or organization name',
			},
			{
				displayName: optionalLabel('Organization Department'),
				name: 'orgDepartment',
				type: 'string',
				default: '',
				description: 'Department within the organization',
			},
			{
				displayName: optionalLabel('Organization Title'),
				name: 'orgTitle',
				type: 'string',
				default: '',
				description: 'Job title or role',
			},
			{
				displayName: optionalLabel('Emails'),
				name: 'emails',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Email addresses for the contact card',
				options: [
					{
						displayName: 'Email',
						name: 'emailValues',
						description: 'Email entry on the contact card',
						values: emailEntryFields,
					},
				],
			},
			{
				displayName: optionalLabel('URLs'),
				name: 'urls',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Website URLs for the contact card',
				options: [
					{
						displayName: 'URL',
						name: 'urlValues',
						description: 'Website entry on the contact card',
						values: urlEntryFields,
					},
				],
			},
			{
				displayName: optionalLabel('Addresses'),
				name: 'addresses',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Postal addresses for the contact card',
				options: [
					{
						displayName: 'Address',
						name: 'addressValues',
						description: 'Address entry on the contact card',
						values: addressEntryFields,
					},
				],
			},
		],
	},
];

/** @deprecated Use contactCardEssentialFieldValues. */
export const contactCardFieldValues: INodeProperties[] = contactCardEssentialFieldValues;
