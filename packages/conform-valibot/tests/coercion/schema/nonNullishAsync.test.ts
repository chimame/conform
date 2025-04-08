import {
	checkAsync,
	nonNullishAsync,
	number,
	objectAsync,
	optionalAsync,
	pipeAsync,
	undefined_,
	unionAsync,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('nonOptionalAsync', () => {
	test('should not pass undefined', async () => {
		const schema1 = objectAsync({
			item: nonNullishAsync(optionalAsync(number())),
		});
		const input1 = createFormData('item', '1');
		const output1 = await parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({ status: 'success', value: { item: 1 } });
		expect(
			await parseWithValibot(createFormData('item', 'non Number'), {
				schema: schema1,
			}),
		).toMatchObject({
			error: { item: expect.anything() },
		});
		expect(
			await parseWithValibot(createFormData('item2', 'non Param'), {
				schema: schema1,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});

		const schema2 = objectAsync({
			item: nonNullishAsync(unionAsync([number(), undefined_()])),
		});
		const output2 = await parseWithValibot(input1, { schema: schema2 });
		expect(output2).toMatchObject({ status: 'success', value: { item: 1 } });
		expect(
			await parseWithValibot(createFormData('item', 'non Number'), {
				schema: schema2,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});
		expect(
			await parseWithValibot(createFormData('item2', 'non Param'), {
				schema: schema2,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});
	});

	test('should pass nonNullish with pipe', async () => {
		const schema = objectAsync({
			age: pipeAsync(
				nonNullishAsync(optionalAsync(number())),
				checkAsync((value) => value > 0, 'age must be greater than 0'),
			),
		});

		const output1 = await parseWithValibot(createFormData('age', ''), {
			schema,
		});
		expect(output1).toMatchObject({
			error: {
				age: expect.anything(),
			},
		});

		const output2 = await parseWithValibot(createFormData('age', '20'), {
			schema,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { age: 20 },
		});

		const errorOutput = await parseWithValibot(createFormData('age', '0'), {
			schema,
		});
		expect(errorOutput).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
