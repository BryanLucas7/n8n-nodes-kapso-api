import { describe, expect, it } from 'vitest';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';
import {
	contactCardEssentialFieldValues,
	defaultContactEntryValue,
	defaultContactPhonesValue,
} from '../../nodes/KapsoApi/properties/contactCard.fields';

describe('contactCard fields', () => {
	it('starts Send Contact with one contact and one phone row by default', () => {
		const contactsField = kapsoNodeProperties.find((property) => property.name === 'contacts');
		expect(contactsField?.default).toEqual({ contactValues: [defaultContactEntryValue] });

		const phonesField = contactCardEssentialFieldValues.find((property) => property.name === 'phones');
		expect(phonesField?.default).toEqual(defaultContactPhonesValue);
	});
});
