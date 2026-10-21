/* Browser-native document navigation only. No router, network, business state or animation gate. */
(() => {
	"use strict";
	const key = "sgg:document-motion",
		root = document.documentElement;
	let active;
	window.SGGMotion?.onSettle(() => active?.skipTransition());
	function observe(transition) {
		if (!transition) return;
		for (const promise of [transition.ready, transition.finished, transition.updateCallbackDone])
			promise?.catch(() => {});
	}
	function skip() {
		return (
			matchMedia("(prefers-reduced-motion: reduce)").matches ||
			root.dataset.sgMotionInput === "keyboard"
		);
	}
	addEventListener("pageswap", (event) => {
		observe(event.viewTransition);
		const immediate = skip();
		try {
			sessionStorage.setItem(key, JSON.stringify({ immediate, at: Date.now() }));
		} catch {}
		if (immediate) event.viewTransition?.skipTransition();
	});
	addEventListener("pagereveal", (event) => {
		observe(event.viewTransition);
		let immediate = skip();
		try {
			const last = JSON.parse(sessionStorage.getItem(key) || "null");
			sessionStorage.removeItem(key);
			if (last && Date.now() - last.at < 10000) immediate ||= last.immediate === true;
		} catch {}
		const transition = event.viewTransition;
		if (!transition) return;
		active = transition;
		if (immediate) {
			transition.skipTransition();
			return;
		}
		root.dataset.sgDocumentTransition = "active";
		transition.finished
			.catch(() => {})
			.finally(() => {
				if (active === transition) {
					active = undefined;
					delete root.dataset.sgDocumentTransition;
				}
			});
	});
})();
