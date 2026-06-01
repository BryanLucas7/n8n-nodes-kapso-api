import { describe, expect, it } from 'vitest';
import type { INodeProperties } from 'n8n-workflow';
import { getNodeParameters } from 'n8n-workflow';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';

function collectNestedDisplayOptionViolations(
	properties: INodeProperties[],
	path = '',
): string[] {
	const violations: string[] = [];

	for (const property of properties) {
		const propertyPath = path ? `${path}.${property.name}` : property.name;

		if (property.type === 'collection' && property.options) {
			for (const child of property.options) {
				const childPath = `${propertyPath}.options.${child.name}`;
				if (child.displayOptions) {
					violations.push(`${childPath} has displayOptions inside collection`);
				}
				violations.push(...collectNestedDisplayOptionViolations([child], childPath));
			}
		}

		if (property.type === 'fixedCollection' && property.options) {
			for (const group of property.options) {
				if (!('values' in group) || !group.values) {
					continue;
				}

				for (const child of group.values) {
					const childPath = `${propertyPath}.options.${group.name}.values.${child.name}`;
					if (child.displayOptions) {
						violations.push(`${childPath} has displayOptions inside fixedCollection`);
					}
					violations.push(...collectNestedDisplayOptionViolations([child], childPath));
				}
			}
		}
	}

	return violations;
}

describe('kapsoNodeProperties', () => {
	it('resolves parameter dependencies through n8n getNodeParameters', () => {
		expect(() =>
			getNodeParameters(
				kapsoNodeProperties,
				{ resource: 'message', operation: 'sendText' },
				true,
				false,
				null,
				{ properties: kapsoNodeProperties },
			),
		).not.toThrow();
	});

	it('does not use displayOptions show/hide arrays (OR rules must be split fields)', () => {
		const violations: string[] = [];

		function walk(properties: INodeProperties[], path: string): void {
			for (const property of properties) {
				const propertyPath = path ? `${path}.${property.name}` : property.name;
				const { displayOptions } = property;
				if (displayOptions) {
					for (const [ruleName, ruleValue] of Object.entries(displayOptions)) {
						if (Array.isArray(ruleValue)) {
							violations.push(`${propertyPath}.displayOptions.${ruleName} is an array`);
						}
					}
				}

				if (property.type === 'collection' && property.options) {
					for (const child of property.options) {
						walk([child], `${propertyPath}.options.${child.name}`);
					}
				}

				if (property.type === 'fixedCollection' && property.options) {
					for (const group of property.options) {
						if ('values' in group && group.values) {
							walk(group.values, `${propertyPath}.options.${group.name}.values`);
						}
					}
				}
			}
		}

		walk(kapsoNodeProperties, '');
		expect(violations).toEqual([]);
	});

	it('does not use unsupported notice typeOptions such as openUrl', () => {
		const violations: string[] = [];

		function walk(properties: INodeProperties[], path: string): void {
			for (const property of properties) {
				const propertyPath = path ? `${path}.${property.name}` : property.name;
				if (property.type === 'notice' && property.typeOptions?.openUrl) {
					violations.push(`${propertyPath} uses unsupported notice typeOptions.openUrl`);
				}

				if (property.type === 'collection' && property.options) {
					for (const child of property.options) {
						walk([child], `${propertyPath}.options.${child.name}`);
					}
				}

				if (property.type === 'fixedCollection' && property.options) {
					for (const group of property.options) {
						if ('values' in group && group.values) {
							walk(group.values, `${propertyPath}.options.${group.name}.values`);
						}
					}
				}
			}
		}

		walk(kapsoNodeProperties, '');
		expect(violations).toEqual([]);
	});

	it('does not use displayOptions on collection or fixedCollection children', () => {
		const violations = collectNestedDisplayOptionViolations(kapsoNodeProperties);

		expect(violations).toEqual([]);
	});

	it('includes split contact and conversation list option collections', () => {
		const names = kapsoNodeProperties.map((property) => property.name);

		expect(names).toContain('contactListOptions');
		expect(names).toContain('conversationListOptions');
		expect(names).not.toContain('platformListOptions');
	});
});
