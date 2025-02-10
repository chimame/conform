import { getPaths, getValue, isPlainObject } from 'conform-dom';
import type { DefaultValue, FieldName, FormState } from './control';
import { getListValue, getName, getChildPaths } from './util';

type BaseCombine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

export type Combine<T> = {
	[K in keyof BaseCombine<T>]: BaseCombine<T>[K];
};

export type Field<
	FieldShape,
	Metadata extends Record<string, unknown>,
> = Metadata & { key: string | undefined; name: FieldName<FieldShape> } & ([
		FieldShape,
	] extends [Date | File]
		? {}
		: [FieldShape] extends [Array<infer Item> | null | undefined]
			? {
					getFieldList: () => Array<Field<Item, Metadata>>;
				}
			: [FieldShape] extends [Record<string, unknown> | null | undefined]
				? {
						getFieldset: () => Fieldset<FieldShape, Metadata>;
					}
				: {});

export type Fieldset<FormShape, Metadata extends Record<string, unknown>> = {
	[Key in keyof Combine<FormShape>]-?: Field<Combine<FormShape>[Key], Metadata>;
};

export function serialize(value: unknown): string | string[] | undefined {
	if (typeof value === 'string') {
		return value;
	} else if (isPlainObject(value)) {
		return;
	} else if (Array.isArray(value)) {
		const result: string[] = [];

		for (const item of value) {
			const serializedItem = serialize(item);

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

/**
 * Determine if the field is touched
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is touched, i.e. form / fieldset
 */
export function isTouched(state: FormState<any, any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPaths(name);

	return state.touchedFields.some(
		(field) => field !== name && getChildPaths(paths, field) !== null,
	);
}

export function getSerializedValue(
	valueObject: unknown,
	name: string,
	serializeFn: (value: unknown) => string | string[] | undefined = serialize,
): string | string[] | undefined {
	const paths = getPaths(name);
	const value = getValue(valueObject, paths);

	return serializeFn(value);
}

export function getError<ErrorShape>(
	state: FormState<any, ErrorShape>,
	name?: string,
): ErrorShape | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isTouched(state, name)) {
		return;
	}

	return (name ? error.fieldError[name] : error.formError) ?? undefined;
}

export function getDefaultListKey(
	formValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getListValue(formValue, name).map((_, index) => getName(name, index));
}

export function createFieldset<
	FormShape,
	Metadata extends Record<string, unknown>,
>(options: {
	initialValue?: Record<string, unknown> | null;
	keys?: Record<string, string[]>;
	name?: string;
	defineMetadata?: (name: string) => Metadata;
}): Fieldset<FormShape, Metadata> {
	function createField(name: string, key?: string) {
		const metadata = options?.defineMetadata?.(name) ?? {};

		return Object.assign(metadata, {
			key,
			name,
			getFieldset() {
				return createFieldset({
					...options,
					name,
				});
			},
			getFieldList() {
				const keys =
					options.keys?.[name] ??
					getDefaultListKey(options.initialValue ?? {}, name);

				return keys.map((key, index) => {
					return createField(getName(name, index), key);
				});
			},
		});
	}

	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name !== 'string') {
				return Reflect.get(target, name, receiver);
			}

			return createField(getName(options?.name, name));
		},
	});
}

export function getMetadata<
	FormShape,
	ErrorShape,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	>,
>(
	state: FormState<FormShape, ErrorShape>,
	options?: {
		defaultValue?: DefaultValue<FormShape>;
		formProps?: FormProps;
		serialize?: (value: unknown) => string | string[] | undefined;
	},
): {
	form: {
		touched: boolean;
		invalid: boolean;
		error: ErrorShape | undefined;
		fieldError: Record<string, ErrorShape>;
		props: FormProps | undefined;
	};
	fields: Fieldset<
		FormShape,
		Readonly<{
			defaultValue: string | undefined;
			defaultSelected: string[] | undefined;
			touched: boolean;
			invalid: boolean;
			error: ErrorShape | undefined;
		}>
	>;
} {
	const initialValue = state.initialValue ?? options?.defaultValue ?? null;

	return {
		form: {
			get error() {
				return getError(state);
			},
			get fieldError() {
				return state.touchedFields.reduce<Record<string, ErrorShape>>(
					(result, field) => {
						const error = getError(state, field);

						if (typeof error !== 'undefined') {
							result[field] = error;
						}

						return result;
					},
					{},
				);
			},
			get touched() {
				return isTouched(state);
			},
			get invalid() {
				return typeof this.error !== 'undefined';
			},
			props: options?.formProps,
		},
		fields: createFieldset({
			initialValue,
			keys: state.keys,
			defineMetadata(name) {
				return {
					get defaultValue() {
						const value = getSerializedValue(
							initialValue,
							name,
							options?.serialize,
						);

						return typeof value === 'string' ? value : value?.[0];
					},
					get defaultSelected() {
						const value = getSerializedValue(
							initialValue,
							name,
							options?.serialize,
						);

						return typeof value === 'string' ? [value] : value;
					},
					get touched() {
						return isTouched(state, name);
					},
					get invalid() {
						return typeof this.error !== 'undefined';
					},
					get error() {
						return getError(state, name);
					},
				};
			},
		}),
	};
}
