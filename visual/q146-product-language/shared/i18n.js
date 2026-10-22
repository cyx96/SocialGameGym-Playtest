/* Presentation preference only: no command, identity, draft or navigation mutation. */
(() => {
	"use strict";
	const definition = window.SGGI18nDefinition,
		key = definition.preferenceKey;
	let saved;
	try {
		saved = localStorage.getItem(key);
	} catch {}
	const supported = new Set(definition.locales.map((l) => l.id));
	const browser = (navigator.languages || [navigator.language])
		.map((l) => l.toLowerCase())
		.map((l) => (l.startsWith("zh") ? "zh-CN" : l.startsWith("en") ? "en" : null))
		.find(Boolean);
	const initial = supported.has(window.__SGG_LOCALE__)
		? window.__SGG_LOCALE__
		: supported.has(saved)
			? saved
			: definition.initial === "browser"
				? browser
				: definition.fallback;
	const store = SGGI18nCore.create(definition, initial),
		bindings = new Map(),
		scopes = new Map();
	// Only detached element removals trigger cleanup; text/attribute updates never scan scopes.
	let cleanupQueued = false;
	const removedRoots = new Set();
	function scheduleCleanup() {
		if (cleanupQueued) return;
		cleanupQueued = true;
		queueMicrotask(() => {
			cleanupQueued = false;
			const detached = (node) =>
				!node.isConnected && [...removedRoots].some((root) => root.contains(node));
			for (const [node] of bindings) if (detached(node)) bindings.delete(node);
			for (const [token, scope] of scopes) {
				if (detached(scope.node)) {
					scope.unsubscribe();
					scopes.delete(token);
				}
			}
			removedRoots.clear();
		});
	}
	new MutationObserver((records) => {
		for (const record of records)
			for (const node of record.removedNodes) if (node.nodeType === 1) removedRoots.add(node);
		if (removedRoots.size) scheduleCleanup();
	}).observe(document.documentElement, { childList: true, subtree: true });
	function observe(node, listener) {
		const token = {},
			unsubscribe = store.subscribe(listener);
		scopes.set(token, { node, unsubscribe });
		return () => {
			unsubscribe();
			scopes.delete(token);
		};
	}
	function notifyChildren() {
		for (const child of document.querySelectorAll("iframe")) {
			try {
				child.contentWindow?.postMessage(
					{ channel: "sgg:locale", locale: store.locale },
					location.origin,
				);
			} catch {}
		}
	}
	function apply() {
		document.documentElement.lang = store.locale;
		document.documentElement.dir =
			definition.locales.find((l) => l.id === store.locale)?.direction || "ltr";
		for (const [node, slots] of bindings) {
			if (!node.isConnected) {
				bindings.delete(node);
				continue;
			}
			for (const update of slots.values()) update();
		}
		notifyChildren();
		document.dispatchEvent(
			new CustomEvent("sgg:localechange", { detail: { locale: store.locale } }),
		);
	}
	function set(locale) {
		if (!supported.has(locale)) return;
		try {
			localStorage.setItem(key, locale);
		} catch {}
		store.set(locale);
	}
	function bind(node, message, { attr, values = {} } = {}) {
		const annotation = attr ? "data-sg-copy-" + attr : "data-sg-copy";
		if ((!attr || attrs.includes(attr)) && node.getAttribute(annotation) !== message)
			node.setAttribute(annotation, message);
		const slot = attr || "text",
			update = () => {
				const text = store.t(message, values);
				if (attr) node.setAttribute(attr, text);
				else node.textContent = text;
			};
		const slots = bindings.get(node) || new Map();
		slots.set(slot, update);
		bindings.set(node, slots);
		update();
		return () => {
			slots.delete(slot);
			if (!slots.size) bindings.delete(node);
		};
	}
	const attrs = ["aria-label", "aria-description", "placeholder", "title"];
	function bindAllAnnotated(scope = document) {
		const selector = ["[data-sg-copy]", ...attrs.map((a) => "[data-sg-copy-" + a + "]")].join(",");
		const nodes = [
			...(scope.matches?.(selector) ? [scope] : []),
			...scope.querySelectorAll(selector),
		];
		for (const node of nodes) {
			// An explicit state binding owns its slot. A later static scan only fills unbound slots.
			if (node.dataset.sgCopy && !bindings.get(node)?.has("text")) bind(node, node.dataset.sgCopy);
			for (const attr of attrs) {
				const message = node.getAttribute("data-sg-copy-" + attr);
				if (message && !bindings.get(node)?.has(attr)) bind(node, message, { attr });
			}
		}
	}
	window.SGGI18n = Object.freeze({
		...store,
		get locale() {
			return store.locale;
		},
		get missingKeys() {
			return store.missingKeys;
		},
		set,
		observe,
		bind,
		bindAllAnnotated,
	});
	store.subscribe(apply);
	window.addEventListener("storage", (e) => {
		if (e.key === key && supported.has(e.newValue)) store.set(e.newValue);
	});
	window.addEventListener("message", (e) => {
		if (
			e.origin !== location.origin ||
			e.source !== parent ||
			e.data?.channel !== "sgg:locale" ||
			!supported.has(e.data.locale)
		)
			return;
		store.set(e.data.locale);
	});
	document.addEventListener(
		"load",
		(e) => {
			if (e.target?.tagName === "IFRAME") notifyChildren();
		},
		true,
	);
	document.addEventListener(
		"DOMContentLoaded",
		() => {
			apply();
			bindAllAnnotated(document);
		},
		{ once: true },
	);
	apply();
})();
