import { IDataObject } from 'n8n-workflow';
import type { KapsoContactInput } from './messagePayloads';
import { readStringParameterValue } from './nodeHelpers';

/** Flattens Additional Contact Details and keeps legacy top-level contact fields working. */
export function normalizeContactInput(raw: IDataObject): KapsoContactInput {
	const additional = (raw.contactAdditionalDetails ?? {}) as IDataObject;

	const pickString = (key: keyof KapsoContactInput): string | undefined =>
		readOptionalString(raw[key] ?? additional[key]);

	const pickCollection = <K extends 'emails' | 'urls' | 'addresses'>(key: K) => {
		const value = raw[key] ?? additional[key];
		return value as KapsoContactInput[K];
	};

	return {
		formattedName: readStringParameterValue(raw.formattedName),
		firstName: pickString('firstName'),
		lastName: pickString('lastName'),
		middleName: pickString('middleName'),
		namePrefix: pickString('namePrefix'),
		nameSuffix: pickString('nameSuffix'),
		birthday: pickString('birthday'),
		phones: normalizePhones(raw.phones),
		emails: normalizeEmails(pickCollection('emails')),
		organization: pickString('organization'),
		orgDepartment: pickString('orgDepartment'),
		orgTitle: pickString('orgTitle'),
		urls: normalizeUrls(pickCollection('urls')),
		addresses: normalizeAddresses(pickCollection('addresses')),
	};
}

export function normalizeContactInputs(rawContacts: IDataObject[]): KapsoContactInput[] {
	return rawContacts.map((contact) => normalizeContactInput(contact));
}

function readOptionalString(value: unknown): string | undefined {
	const text = readStringParameterValue(value).trim();
	return text || undefined;
}

function normalizePhones(value: unknown): KapsoContactInput['phones'] {
	const phoneValues = (value as { phoneValues?: IDataObject[] } | undefined)?.phoneValues;
	if (!Array.isArray(phoneValues)) {
		return value as KapsoContactInput['phones'];
	}

	return {
		phoneValues: phoneValues.map((phone) => ({
			phoneNumber: readStringParameterValue(phone.phoneNumber),
			phoneType: readOptionalString(phone.phoneType),
			waId: readOptionalString(phone.waId),
		})),
	};
}

function normalizeEmails(value: unknown): KapsoContactInput['emails'] {
	const emailValues = (value as { emailValues?: IDataObject[] } | undefined)?.emailValues;
	if (!Array.isArray(emailValues)) {
		return value as KapsoContactInput['emails'];
	}

	return {
		emailValues: emailValues.map((email) => ({
			email: readStringParameterValue(email.email),
			emailType: readOptionalString(email.emailType),
		})),
	};
}

function normalizeUrls(value: unknown): KapsoContactInput['urls'] {
	const urlValues = (value as { urlValues?: IDataObject[] } | undefined)?.urlValues;
	if (!Array.isArray(urlValues)) {
		return value as KapsoContactInput['urls'];
	}

	return {
		urlValues: urlValues.map((urlEntry) => ({
			url: readStringParameterValue(urlEntry.url),
			urlType: readOptionalString(urlEntry.urlType),
		})),
	};
}

function normalizeAddresses(value: unknown): KapsoContactInput['addresses'] {
	const addressValues = (value as { addressValues?: IDataObject[] } | undefined)?.addressValues;
	if (!Array.isArray(addressValues)) {
		return value as KapsoContactInput['addresses'];
	}

	return {
		addressValues: addressValues.map((address) => ({
			street: readOptionalString(address.street),
			city: readOptionalString(address.city),
			state: readOptionalString(address.state),
			zip: readOptionalString(address.zip),
			country: readOptionalString(address.country),
			countryCode: readOptionalString(address.countryCode),
			addressType: readOptionalString(address.addressType),
		})),
	};
}
