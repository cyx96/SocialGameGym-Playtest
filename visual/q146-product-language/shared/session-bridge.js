/* Bridge used only inside the explicitly labelled local review host. */
(() => {
	"use strict";
	const q = new URLSearchParams(location.search);
	if (!window.__SGG_CONTEXT__) throw Error("Missing authorised surface context");
	let context = window.__SGG_CONTEXT__;
	if (context.themeId) document.documentElement.dataset.sgTheme = context.themeId;
	const app = window.__SGG_APP__;
	document.documentElement.dataset.sessionApp = app;
	document.documentElement.dataset.readonly = String(context.readonly);
	const pending = new Map();
	let serial = 0;
	function send(type, data = {}) {
		return new Promise((resolve, reject) => {
			const id = ++serial,
				timer = setTimeout(() => {
					parent.postMessage({ channel: "sgg-surface-slow", id }, new URL(document.baseURI).origin);
				}, 8000);
			pending.set(id, { resolve, reject, timer });
			parent.postMessage(
				{ channel: "sgg-surface", id, app, type, data, window: context.window },
				new URL(document.baseURI).origin,
			);
		});
	}
	window.addEventListener("message", (e) => {
		if (
			e.source === parent &&
			e.origin === new URL(document.baseURI).origin &&
			e.data?.channel === "q146-notices"
		) {
			context = { ...context, ...e.data.context };
			dispatchEvent(new Event("sgg:notice-update"));
			return;
		}
		if (
			e.source !== parent ||
			e.origin !== new URL(document.baseURI).origin ||
			e.data?.channel !== "sgg-surface-response"
		)
			return;
		const p = pending.get(e.data.id);
		if (!p) {
			parent.postMessage(
				{ channel: "sgg-surface-ack", id: e.data.id },
				new URL(document.baseURI).origin,
			);
			return;
		}
		clearTimeout(p.timer);
		pending.delete(e.data.id);
		// Keep the receipt in this child message task: deferred callbacks in WebKit
		// srcdoc frames can lose the exact sender Window. postMessage already queues
		// delivery after the promise reactions below have cleared the local draft.
		if (e.data.error) {
			p.reject(Error(e.data.error));
			parent.postMessage(
				{ channel: "sgg-surface-ack", id: e.data.id },
				new URL(document.baseURI).origin,
			);
		} else {
			if (e.data.context) context = e.data.context;
			p.resolve(Object.hasOwn(e.data, "result") ? e.data.result : e.data.context);
			parent.postMessage(
				{ channel: "sgg-surface-ack", id: e.data.id },
				new URL(document.baseURI).origin,
			);
		}
	});
	window.SessionApp = {
		get context() {
			return context;
		},
		get readonly() {
			return context.readonly;
		},
		get scope() {
			return [context.room, context.viewer, context.participation, context.window, app].join(":");
		},
		request(type, data) {
			return send(type, { ...data, requestId: crypto.randomUUID() });
		},
		submit(button, type, data) {
			if (button.getAttribute("aria-busy") === "true")
				return Promise.reject(Error("正在保存，请稍候。"));
			const disabled = button.disabled;
			button.disabled = true;
			window.SGGButtons?.busy(button, true);
			return send(type, { ...data, requestId: crypto.randomUUID() }).finally(() => {
				window.SGGButtons?.busy(button, false);
				button.disabled = disabled;
			});
		},
		close() {
			send("ui.close", {
				keyboard: document.activeElement?.matches(":focus-visible") || false,
			}).catch(() => {});
		},
		refresh() {
			send("ui.refresh").catch(() => {});
		},
		get app() {
			return app;
		},
	};
})();
