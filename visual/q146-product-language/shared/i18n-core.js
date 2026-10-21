/* Pure message/locale owner. Shared by classic browser assets and typed web bindings. */
(() => {
	"use strict";
	function create(definition, initial) {
		const supported = new Set(definition.locales.map((l) => l.id));
		let locale = supported.has(initial) ? initial : definition.fallback;
		const listeners = new Set(),
			missing = new Set(),
			source = new Map();
		for (const [key, entry] of Object.entries(definition.messages))
			for (const value of Object.values(entry))
				if (typeof value === "string" && !source.has(value)) source.set(value, key);
		function t(key, values = {}) {
			const entry = definition.messages[key];
			if (!entry || entry[locale] === undefined) {
				missing.add(key);
				return key;
			}
			let message = entry[locale];
			if (typeof message === "object") {
				const count = Number(values.count ?? 0),
					category = new Intl.PluralRules(locale).select(count);
				message = message[category] ?? message.other;
			}
			return String(message).replace(/\{([A-Za-z][\w]*)\}/g, (slot, name) =>
				Object.hasOwn(values, name) ? String(values[name]) : slot,
			);
		}
		return Object.freeze({
			get locale() {
				return locale;
			},
			definition,
			get missingKeys() {
				return [...missing];
			},
			t,
			systemCopy(message, values) {
				const key = source.get(message);
				return key ? t(key, values) : message;
			},
			set(next) {
				if (!supported.has(next) || next === locale) return;
				locale = next;
				for (const listener of listeners) listener();
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
		});
	}
	globalThis.SGGI18nCore = Object.freeze({ create });
})();
