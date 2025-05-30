import { check, nullish, number, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('nullish', () => {
	test('should pass also undefined', () => {
		const schema = object({ name: nullish(string()), age: nullish(number()) });

		expect(parseWithValibot(new FormData(), { schema })).toMatchObject({
			status: 'success',
			value: {},
		});

		const output = parseWithValibot(createFormData('age', ''), { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});
		expect(
			parseWithValibot(createFormData('age', '20'), { schema }),
		).toMatchObject({
			status: 'success',
			value: { age: 20 },
		});
		expect(
			parseWithValibot(createFormData('age', 'non number'), { schema }),
		).toMatchObject({
			error: { age: expect.anything() },
		});
	});

	test('should pass nullish with pipe', () => {
		const schema = object({
			age: pipe(
				nullish(number()),
				check(
					(value) => value == null || value > 0,
					'age must be greater than 0',
				),
			),
		});

		const output1 = parseWithValibot(createFormData('age', ''), { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});

		const output2 = parseWithValibot(createFormData('age', '20'), { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { age: 20 },
		});

		const errorOutput = parseWithValibot(createFormData('age', '0'), {
			schema,
		});
		expect(errorOutput).toMatchObject({
			error: { age: expect.anything() },
		});
	});

	test('should use default if required', () => {
		const default_ = 'default';

		const schema1 = object({ name: nullish(string(), default_) });
		const output1 = parseWithValibot(createFormData('name', ''), {
			schema: schema1,
		});
		expect(output1).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});

		const schema2 = object({ name: nullish(string(), () => default_) });
		const output2 = parseWithValibot(createFormData('name', ''), {
			schema: schema2,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});

		const schema3 = object({ name: nullish(string(), () => default_) });
		const output3 = parseWithValibot(createFormData('age', '30'), {
			schema: schema3,
		});
		expect(output3).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});
	});
});
