import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';
import { todosSchema } from './schema';

declare global {
	// eslint-disable-next-line no-var
	var inMemoryDemoStore: {
		todos?: z.infer<typeof todosSchema>;
	};
}

global.inMemoryDemoStore = {};

export async function getTodos() {
	await setTimeout(Math.random() * 10);

	return Promise.resolve(global.inMemoryDemoStore.todos);
}

export async function updateTodos(
	todos: z.infer<typeof todosSchema>,
): Promise<void> {
	await setTimeout(Math.random() * 100);

	global.inMemoryDemoStore.todos = todos;
}
