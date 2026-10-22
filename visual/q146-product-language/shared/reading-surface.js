/* Reading-layer motion owns no content, permission or phase. Reopening invalidates old exits. */
(() => {
	"use strict";
	const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
		active = new WeakMap(),
		known = new WeakSet();
	function clear(dialog) {
		const a = active.get(dialog);
		active.delete(dialog);
		a?.cancel();
		delete dialog.dataset.closing;
		dialog.inert = false;
	}
	function finish(dialog) {
		clear(dialog);
		if (dialog.open) dialog.close();
	}
	function open(dialog, { event, instant = false } = {}) {
		enhance(dialog);
		const interrupted = active.has(dialog),
			style = interrupted ? getComputedStyle(dialog) : null,
			from = style ? { opacity: style.opacity, transform: style.transform } : null;
		clear(dialog);
		dialog.dataset.keyboardOpen = String(instant || window.SGGMotion?.instant(event) || false);
		if (!dialog.open) {
			// A top-layer reading takes over from an entering scene; never animate both layers.
			for (let parent = dialog.parentElement; parent; parent = parent.parentElement)
				window.SGGMotion?.cancel(parent);
			if (dialog.dataset.keyboardOpen === "true") dialog.removeAttribute("tabindex");
			dialog.showModal();
			// Native showModal autofocus otherwise puts a ring on Close after some pointer paths.
			// The dialog is the initial reading target; Tab still starts at its first control.
			if (dialog.dataset.keyboardOpen !== "true") {
				dialog.tabIndex = -1;
				dialog.focus({ preventScroll: true });
			}
		}
		if (interrupted && from) {
			for (const a of dialog.getAnimations()) a.cancel();
			window.SGGMotion?.run(
				dialog,
				[
					{ ...from, opacity: 1 },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{
					immediate: instant,
					event,
				},
			);
		}
	}
	function close(dialog, { instant = false } = {}) {
		if (!dialog?.open) return;
		if (instant || reduced.matches || window.SGGMotion?.instant()) {
			finish(dialog);
			return;
		}
		if (active.has(dialog)) return;
		const style = getComputedStyle(dialog),
			from = { opacity: style.opacity, transform: style.transform };
		for (const a of dialog.getAnimations()) a.cancel();
		dialog.dataset.closing = "true";
		dialog.inert = true;
		const css = getComputedStyle(document.documentElement),
			a = dialog.animate(
				[
					from,
					{
						opacity: style.getPropertyValue("--sg-reading-exit-opacity").trim() || "0",
						transform:
							style.getPropertyValue("--sg-reading-exit-transform").trim() || "translateY(6px)",
					},
				],
				{
					duration: parseFloat(css.getPropertyValue("--sg-motion-exit")) || 120,
					easing: css.getPropertyValue("--sg-ease").trim() || "linear",
					fill: "forwards",
				},
			);
		active.set(dialog, a);
		a.finished
			.then(() => {
				if (active.get(dialog) === a) finish(dialog);
			})
			.catch(() => {});
	}
	function enhance(dialog) {
		if (known.has(dialog)) return;
		known.add(dialog);
		dialog.addEventListener("cancel", (event) => {
			event.preventDefault();
			close(dialog, { instant: true });
		});
		dialog.addEventListener("close", () => clear(dialog));
	}
	for (const dialog of document.querySelectorAll("dialog.sg-reading")) enhance(dialog);
	window.SGGMotion?.onSettle(() => {
		for (const d of document.querySelectorAll("dialog")) {
			if (!known.has(d)) continue;
			if (active.has(d)) finish(d);
			else for (const a of d.getAnimations()) a.cancel();
		}
	});
	reduced.addEventListener("change", () => {
		if (reduced.matches)
			for (const d of document.querySelectorAll("dialog"))
				if (known.has(d) && active.has(d)) finish(d);
	});
	window.SGGReading = Object.freeze({ enhance, open, close });
})();
