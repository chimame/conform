import {
	formatPaths,
	FormError,
	getPaths,
	getValue,
	isPlainObject,
	parseSubmission,
} from 'conform-dom';

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export function isNonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export function isOptionalString(value: unknown): value is string | undefined {
	return typeof value === 'undefined' || typeof value === 'string';
}

export function isOptionalNumber(value: unknown): value is number | undefined {
	return typeof value === 'undefined' || typeof value === 'number';
}

export function getListValue(
	formValue: Record<string, unknown> | null,
	name: string,
): Array<unknown> {
	const paths = getPaths(name);
	const value = getValue(formValue, paths) ?? [];

	if (!Array.isArray(value)) {
		throw new Error(`The value of "${name}" is not an array`);
	}

	return value;
}

export function insertItem<Item>(
	list: Array<Item>,
	item: Item,
	index: number,
): void {
	list.splice(index, 0, item);
}

export function removeItem(list: Array<unknown>, index: number): void {
	list.splice(index, 1);
}

export function reorderItems(
	list: Array<unknown>,
	fromIndex: number,
	toIndex: number,
): void {
	list.splice(toIndex, 0, ...list.splice(fromIndex, 1));
}

/**
 * Format based on a prefix and a path
 * @example
 * ```js
 * getName(undefined, 'todos'); // "todos"
 * getName('todos', 0); // "todos[0]"
 * getName('todos[0]', 'content'); // "todos[0].content"
 * getName('todos[0].content', undefined); // "todos[0].content"
 * ```
 */
export function getName(prefix: string | undefined, path?: string | number) {
	return typeof path !== 'undefined'
		? formatPaths([...getPaths(prefix), path])
		: prefix ?? '';
}

/**
 * Compare the parent and child paths to get the relative paths
 * Returns null if the child paths do not start with the parent paths
 */
export function getChildPaths(
	parentNameOrPaths: string | Array<string | number>,
	childName: string,
) {
	const parentPaths =
		typeof parentNameOrPaths === 'string'
			? getPaths(parentNameOrPaths)
			: parentNameOrPaths;
	const childPaths = getPaths(childName);

	if (
		childPaths.length >= parentPaths.length &&
		parentPaths.every((path, index) => childPaths[index] === path)
	) {
		return childPaths.slice(parentPaths.length);
	}

	return null;
}

export function configureListIndexUpdate(
	listName: string,
	update: (index: number) => number | null,
): (name: string) => string | null {
	const listPaths = getPaths(listName);

	return (name: string) => {
		const paths = getPaths(name);

		if (
			paths.length > listPaths.length &&
			listPaths.every((path, index) => paths[index] === path)
		) {
			const currentIndex = paths[listPaths.length];

			if (typeof currentIndex === 'number') {
				const newIndex = update(currentIndex);

				if (newIndex === null) {
					// To remove the item instead of updating it
					return null;
				}

				if (newIndex !== currentIndex) {
					// Replace the index
					paths.splice(listPaths.length, 1, newIndex);

					return formatPaths(paths);
				}
			}
		}

		return name;
	};
}

export function resolveValidateResult<FormShape, ErrorShape, Value>(
	result:
		| FormError<FormShape, ErrorShape>
		| null
		| {
				error: FormError<FormShape, ErrorShape> | null;
				value?: Value;
		  },
): {
	error: FormError<FormShape, ErrorShape> | null;
	value?: Value;
} {
	if (result !== null && 'error' in result) {
		return result;
	}

	return {
		error: result,
	};
}

export function deepEqual<Value>(prev: Value, next: Value): boolean {
	if (prev === next) {
		return true;
	}

	if (!prev || !next) {
		return false;
	}

	if (Array.isArray(prev) && Array.isArray(next)) {
		if (prev.length !== next.length) {
			return false;
		}

		for (let i = 0; i < prev.length; i++) {
			if (!deepEqual(prev[i], next[i])) {
				return false;
			}
		}

		return true;
	}

	if (isPlainObject(prev) && isPlainObject(next)) {
		const prevKeys = Object.keys(prev);
		const nextKeys = Object.keys(next);

		if (prevKeys.length !== nextKeys.length) {
			return false;
		}

		for (const key of prevKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(next, key) ||
				// @ts-expect-error FIXME
				!deepEqual(prev[key], next[key])
			) {
				return false;
			}
		}

		return true;
	}

	return false;
}

/**
 * Create a copy of the object with the updated properties if there is any change
 */
export function mutate<Obj extends Record<string, any>>(
	obj: Obj,
	update: Partial<Obj>,
): Obj {
	if (
		obj === update ||
		Object.entries(update).every(([key, value]) => obj[key] === value)
	) {
		return obj;
	}

	return Object.assign({}, obj, update);
}

export function mapKeys<Value>(
	obj: Record<string, Value>,
	fn: (key: string) => string | null,
) {
	const result: Record<string, Value> = {};

	for (const [key, value] of Object.entries(obj)) {
		const name = fn(key);

		if (name !== null) {
			result[name] = value;
		}
	}

	return result;
}

export function addItem<Item>(list: Array<Item>, item: Item) {
	if (list.includes(item)) {
		return list;
	}

	return list.concat(item);
}

export function mapItems<Item>(
	list: Array<NonNullable<Item>>,
	fn: (value: Item) => Item | null,
): Array<Item> {
	const result: Array<Item> = [];

	for (const item of list) {
		const value = fn(item);

		if (value !== null) {
			result.push(value);
		}
	}

	return result;
}

export function getSubmitEvent(
	event: React.FormEvent<HTMLFormElement>,
): SubmitEvent {
	if (event.type !== 'submit') {
		throw new Error('The event is not a submit event');
	}

	return event.nativeEvent as SubmitEvent;
}

export type FormRef =
	| React.RefObject<
			| HTMLFormElement
			| HTMLFieldSetElement
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement
			| null
	  >
	| string;

export function getFormElement(
	formRef: FormRef | undefined,
): HTMLFormElement | null {
	if (typeof formRef === 'string') {
		return document.forms.namedItem(formRef);
	}

	const element = formRef?.current;

	if (element instanceof HTMLFormElement) {
		return element;
	}

	return element?.form ?? null;
}

/**
 * Updates the DOM element with the provided value.
 *
 * @param element The form element to update
 * @param options The options to update the form element
 */
export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options: {
		value?: string | string[];
		defaultValue?: string | string[];
	},
) {
	const value =
		typeof options.value === 'undefined'
			? null
			: Array.isArray(options.value)
				? options.value
				: [options.value];
	const defaultValue =
		typeof options.defaultValue === 'undefined'
			? null
			: Array.isArray(options.defaultValue)
				? options.defaultValue
				: [options.defaultValue];

	if (element instanceof HTMLInputElement) {
		switch (element.type) {
			case 'checkbox':
			case 'radio':
				if (value) {
					element.checked = value.includes(element.value);
				}
				if (defaultValue) {
					element.defaultChecked = defaultValue.includes(element.value);
				}
				break;
			case 'file':
				// Do nothing for now
				break;
			default:
				if (value) {
					element.value = value[0] ?? '';
				}
				if (defaultValue) {
					element.defaultValue = defaultValue[0] ?? '';
				}
				break;
		}
	} else if (element instanceof HTMLSelectElement) {
		for (const option of element.options) {
			if (value) {
				const index = value.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.selected !== selected) {
					option.selected = selected;
				}

				// Remove the option from the value array
				if (selected) {
					value.splice(index, 1);
				}
			}
			if (defaultValue) {
				const index = defaultValue.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.selected !== selected) {
					option.defaultSelected = selected;
				}

				// Remove the option from the defaultValue array
				if (selected) {
					defaultValue.splice(index, 1);
				}
			}
		}

		// We have already removed all selected options from the value and defaultValue array at this point
		const missingOptions = new Set([...(value ?? []), ...(defaultValue ?? [])]);

		for (const optionValue of missingOptions) {
			element.options.add(
				new Option(
					optionValue,
					optionValue,
					defaultValue?.includes(optionValue),
					value?.includes(optionValue),
				),
			);
		}
	} else {
		if (value) {
			/**
			 * Triggering react custom change event
			 * Solution based on dom-testing-library
			 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
			 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
			 */
			const inputValue = value[0] ?? '';
			const { set: valueSetter } =
				Object.getOwnPropertyDescriptor(element, 'value') || {};
			const prototype = Object.getPrototypeOf(element);
			const { set: prototypeValueSetter } =
				Object.getOwnPropertyDescriptor(prototype, 'value') || {};

			if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
				prototypeValueSetter.call(element, inputValue);
			} else {
				if (valueSetter) {
					valueSetter.call(element, inputValue);
				} else {
					throw new Error('The given element does not have a value setter');
				}
			}
		}
		if (defaultValue) {
			element.defaultValue = defaultValue[0] ?? '';
		}
	}
}

/**
 * Check if the value is a File
 */
export function isFile(obj: unknown): obj is File {
	// Skip checking if File is not defined
	if (typeof File === 'undefined') {
		return false;
	}

	return obj instanceof File;
}

/**
 * A simple random key generator
 */
export function generateRandomKey(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

export function serialize(value: unknown): string | string[] | undefined {
	if (typeof value === 'string') {
		return value;
	} else if (isPlainObject(value)) {
		return;
	} else if (Array.isArray(value)) {
		const result: string[] = [];

		for (const item of value) {
			// People might set the defaultValue to `null` or `undefined`
			// We will treat it as an empty string here
			const serializedItem = serialize(item) ?? '';

			if (typeof serializedItem !== 'string') {
				return;
			}

			result.push(serializedItem);
		}

		return result;
	} else if (value instanceof Date) {
		return value.toISOString();
	} else if (typeof value === 'boolean') {
		return value ? 'on' : undefined;
	} else if (typeof value === 'number' || typeof value === 'bigint') {
		return value.toString();
	}

	return value?.toString();
}

export function normalize<Value extends Record<string, unknown>>(
	value: Value,
	serialize: (value: unknown) => string | string[] | undefined,
): Record<string, unknown> {
	const fileStore = new Map<string, File>();
	const json = JSON.stringify(value, (_, value) => {
		if (isPlainObject(value)) {
			if (Object.keys(value).length === 0) {
				return undefined;
			}

			return value;
		} else if (Array.isArray(value)) {
			if (value.length === 0) {
				return undefined;
			} else if (value.length === 1 && typeof value[0] === 'string') {
				return value[0];
			}

			return value;
		} else if (isFile(value)) {
			if (value.name === '' && value.size === 0) {
				return undefined;
			}

			// File can not be serialized, so we store it in a map and replace it with a key
			const key = generateRandomKey();
			fileStore.set(key, value);

			return key;
		} else if (typeof value === 'string' && value === '') {
			return undefined;
		}

		return serialize(value);
	});

	return JSON.parse(json, (_, value) => {
		if (typeof value === 'string' && fileStore.has(value)) {
			return fileStore.get(value);
		}

		return value;
	});
}

export function isDirty(
	formData: FormData | URLSearchParams | null,
	options?: {
		defaultValue?: Record<string, unknown> | null;
		serialize?: (value: unknown) => string | string[] | undefined;
		skipEntry?: (name: string) => boolean;
	},
): boolean {
	if (!formData) {
		return false;
	}

	const { value } = parseSubmission(formData, {
		skipEntry: options?.skipEntry,
	});
	const defaultValue = options?.defaultValue;
	const serializeFn = options?.serialize ?? serialize;

	return !deepEqual(
		normalize(value, serializeFn),
		defaultValue ? normalize(defaultValue, serializeFn) : {},
	);
}
