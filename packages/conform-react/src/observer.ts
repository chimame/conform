import { isInput } from 'conform-dom';

function createEventEmitter<Callback extends (...args: any) => void>(
	initialize: () => void,
	destroy: () => void,
) {
	const callbacks = new Set<Callback>();

	return {
		size: callbacks.size,
		emit(...args: Parameters<Callback>) {
			for (const callback of callbacks) {
				callback(...args);
			}
		},
		subscribe(callback: Callback) {
			initialize();
			callbacks.add(callback);

			return () => {
				destroy();
				callbacks.delete(callback);
			};
		},
	};
}

export function createFormObserver() {
	const inputUpdated = createEventEmitter<
		(
			inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
			reason?: 'reset',
		) => void
	>(initialize, destroy);
	const formDataChanged = createEventEmitter<
		(formElement: HTMLFormElement) => void
	>(initialize, destroy);

	let observer: MutationObserver | null = null;
	let resetTimeout: NodeJS.Timeout | null = null;

	function handleInput(event: Event) {
		const element = event.target;

		if (isInput(element)) {
			inputUpdated.emit(element);

			if (element.form) {
				formDataChanged.emit(element.form);
			}
		}
	}

	function handleReset(event: Event) {
		if (event.target instanceof HTMLFormElement) {
			const formElement = event.target;
			// Reset event is fired before the form is reset, so we need to wait for the next tick
			resetTimeout = setTimeout(() => {
				formDataChanged.emit(formElement);

				for (const element of formElement.elements) {
					if (isInput(element)) {
						inputUpdated.emit(element, 'reset');
					}
				}

				// Clear the timeout
				resetTimeout = null;
			});
		}
	}

	function handleSubmit(event: SubmitEvent): void {
		if (event.target instanceof HTMLFormElement) {
			formDataChanged.emit(event.target);
		}
	}

	function handleMutation(mutations: MutationRecord[]): void {
		const formElementAffected = new Set<HTMLFormElement>();
		const inputElementMoutned = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();
		const inputElementChanged = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();
		const getInputs = (node: Node) => {
			if (isInput(node)) {
				return [node];
			}

			if (node instanceof Element) {
				return Array.from(
					node.querySelectorAll<
						HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
					>('input,select,textarea'),
				);
			}

			return [];
		};
		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList':
					for (const node of mutation.addedNodes) {
						for (const input of getInputs(node)) {
							if (input.form) {
								inputElementMoutned.add(input);
								formElementAffected.add(input.form);
							}
						}
					}
					for (const node of mutation.removedNodes) {
						for (const input of getInputs(node)) {
							if (input.form) {
								formElementAffected.add(input.form);
							}
						}
					}
					break;
				case 'attributes':
					if (isInput(mutation.target)) {
						inputElementChanged.add(mutation.target);

						if (mutation.target.form) {
							formElementAffected.add(mutation.target.form);
						}
					}
					break;
			}
		}

		for (const formElement of formElementAffected) {
			formDataChanged.emit(formElement);
		}

		for (const inputElement of inputElementChanged) {
			inputUpdated.emit(inputElement);
		}

		for (const inputElement of inputElementMoutned) {
			inputUpdated.emit(inputElement);
		}
	}

	function initialize() {
		// If there are no subscribers yet, listen for input, reset, and submit events globally
		if (formDataChanged.size === 0 && inputUpdated.size === 0) {
			// Listen for input, reset, and submit events
			document.addEventListener('input', handleInput);
			document.addEventListener('reset', handleReset);
			// Capture submit event during the capturing pharse to ensure that the submitter is available
			document.addEventListener('submit', handleSubmit, true);

			// Observe form and input changes
			observer ??= new MutationObserver(handleMutation);
			observer.observe(document.body, {
				subtree: true,
				childList: true,
				attributeFilter: ['form', 'name', 'data-conform'],
			});
		}
	}

	function destroy() {
		if (resetTimeout) {
			clearTimeout(resetTimeout);
		}

		// If there are no subscribers left, remove event listeners and disconnect the observer
		if (formDataChanged.size === 0 && inputUpdated.size === 0) {
			document.removeEventListener('input', handleInput);
			document.removeEventListener('reset', handleReset);
			document.removeEventListener('submit', handleSubmit, true);
			observer?.disconnect();
		}
	}

	return {
		onInputUpdated: inputUpdated.subscribe,
		onFormDataChanged: formDataChanged.subscribe,
	};
}
