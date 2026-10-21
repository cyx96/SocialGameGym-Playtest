/* Shared presentation motion. No timers or animation completions advance product state. */
(() => {
	"use strict";
	const root = document.documentElement,
		reduced = matchMedia("(prefers-reduced-motion:reduce)"),
		active = new Map(),
		origins = new Map(),
		listeners = new Set();
	let exposed = true;
	const instant = (event) =>
		reduced.matches || event?.detail === 0 || root.dataset.sgMotionInput === "keyboard";
	function options(role = "enter") {
		if (
			![
				"enter",
				"exit",
				"state",
				"press",
				"release",
				"expand",
				"collapse",
				"app-open",
				"app-close",
			].includes(role)
		)
			throw Error("Unregistered motion role: " + role);
		const css = getComputedStyle(root);
		return {
			duration: parseFloat(css.getPropertyValue("--sg-motion-" + role)) || 0,
			easing: css.getPropertyValue("--sg-ease").trim() || "linear",
		};
	}
	function cancel(node) {
		const a = active.get(node);
		active.delete(node);
		a?.cancel();
	}
	function input(value) {
		if (!["keyboard", "pointer"].includes(value)) return;
		root.dataset.sgMotionInput = value;
		if (value === "keyboard") settle();
	}
	function settle() {
		for (const node of active.keys()) cancel(node);
		for (const fn of listeners) fn();
	}
	function run(node, frames, { role = "enter", immediate = false, event, fill = "none" } = {}) {
		if (!node?.isConnected) return null;
		const previous = active.get(node),
			current = previous ? getComputedStyle(node) : null,
			from = current ? { opacity: current.opacity, transform: current.transform } : null;
		if (from && (role === "app-open" || role === "app-close")) from.opacity = 1;
		if (from && frames.some((f) => "clipPath" in f))
			from.clipPath = current.clipPath === "none" ? frames[0].clipPath : current.clipPath;
		cancel(node);
		if (immediate || instant(event) || document.hidden || !exposed) return null;
		const a = node.animate(from ? [from, frames.at(-1)] : frames, { ...options(role), fill });
		active.set(node, a);
		a.finished
			.catch(() => {})
			.finally(() => {
				if (active.get(node) === a) active.delete(node);
			});
		return a;
	}
	function scene(node, { direction = "forward", ...config } = {}) {
		const x = direction === "back" ? -6 : direction === "replace" ? 0 : 6;
		return run(
			node,
			[
				{ opacity: 0.92, transform: `translate3d(${x}px,0,0)` },
				{ opacity: 1, transform: "translate3d(0,0,0)" },
			],
			{ role: direction === "replace" ? "state" : "enter", ...config },
		);
	}
	function app(node, desktop, { opening, anchor, bounds, desktopBounds: home, source }) {
		const x = anchor.x + anchor.width / 2,
			y = anchor.y + anchor.height / 2,
			scale = Math.min(anchor.width / bounds.width, anchor.height / bounds.height);
		if (!(scale > 0 && Number.isFinite(scale))) return [];
		// The complete visible viewport keeps its aspect ratio and contents; never crop full-size text into the source tile.
		node.style.transformOrigin = "50% 50%";
		desktop.style.transformOrigin = `${x - home.x}px ${y - home.y}px`;
		const rest = { transform: "translate(0px,0px) scale(1)", opacity: 1 },
			near = {
				transform: `translate(${x - bounds.x - bounds.width / 2}px,${y - bounds.y - bounds.height / 2}px) scale(${scale})`,
				opacity: 1,
			};
		const homeRest = { transform: "scale(1)", opacity: 1 },
			receded = { transform: "scale(.985)", opacity: 1 };
		const animations = [
			run(node, opening ? [near, rest] : [rest, near], {
				role: opening ? "app-open" : "app-close",
				fill: "both",
			}),
			run(desktop, opening ? [homeRest, receded] : [receded, homeRest], {
				role: opening ? "app-open" : "app-close",
				fill: "both",
			}),
		].filter(Boolean);
		const pane = animations[0];
		if (!pane || !source) return animations;
		source.dataset.sgAppOriginHidden = "";
		const release = () => {
			if (origins.get(node)?.animation === pane) {
				delete source.dataset.sgAppOriginHidden;
				origins.delete(node);
			}
		};
		origins.set(node, { animation: pane, source });
		const nativeCancel = pane.cancel.bind(pane);
		pane.cancel = () => {
			release();
			nativeCancel();
		};
		pane.finished.catch(() => {}).finally(release);
		return animations;
	}
	function gateway(source, destination) {
		// Carry the invitation's silhouette into the actual destination. Text stays at its
		// final reading size: only this one viewport mask changes, never its layout.
		const anchor = source.getBoundingClientRect(),
			bounds = destination.getBoundingClientRect(),
			x = Math.max(0, anchor.left - bounds.left),
			y = Math.max(0, anchor.top - bounds.top),
			right = Math.max(0, bounds.right - anchor.right),
			bottom = Math.max(0, bounds.bottom - anchor.bottom),
			radius = Math.min(anchor.width, anchor.height) / 2;
		if (!(anchor.width > 0 && anchor.height > 0 && bounds.width > 0 && bounds.height > 0))
			return [];
		return [
			run(source, [{ opacity: 1 }, { opacity: 0 }], { role: "exit", fill: "both" }),
			run(
				destination,
				[
					{ clipPath: `inset(${y}px ${right}px ${bottom}px ${x}px round ${radius}px)`, opacity: 0 },
					{ clipPath: "inset(0px 0px 0px 0px round 0px)", opacity: 1 },
				],
				{ role: "app-open" },
			),
		].filter(Boolean);
	}
	function reveal(node, config = {}) {
		return run(
			node,
			[
				{ opacity: 0.9, transform: "translateY(4px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			config,
		);
	}
	root.dataset.sgMotionInput = "pointer";
	document.addEventListener(
		"keydown",
		(e) => {
			if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
			input("keyboard");
		},
		true,
	);
	document.addEventListener("pointerdown", () => input("pointer"), {
		passive: true,
		capture: true,
	});
	reduced.addEventListener("change", () => {
		if (reduced.matches) settle();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) settle();
	});
	window.addEventListener("message", (e) => {
		if (e.source === parent && e.data?.channel === "q146-app-visibility") {
			exposed = Boolean(e.data.visible);
			if (!exposed) settle();
		}
	});
	// Native details retains focus, semantics and immediate access; only its revealed contents move.
	document.addEventListener(
		"click",
		(e) => {
			const summary = e.target.closest?.("summary");
			if (!summary || summary.closest("#stage")) return;
			const details = summary.parentElement;
			if (details.tagName !== "DETAILS") return;
			details.dataset.sgDisclosureInput = instant(e) ? "instant" : "pointer";
			if (details.open) for (const child of details.children) cancel(child);
		},
		true,
	);
	document.addEventListener(
		"toggle",
		(e) => {
			const details = e.target;
			if (
				details.tagName !== "DETAILS" ||
				!details.open ||
				details.dataset.sgDisclosureInput !== "pointer"
			)
				return;
			details.dataset.sgDisclosureInput = "";
			for (const child of details.children) if (child.tagName !== "SUMMARY") reveal(child);
		},
		true,
	);
	window.SGGMotion = Object.freeze({
		version: "sgg.motion/1",
		options,
		instant,
		input,
		cancel,
		run,
		reveal,
		scene,
		app,
		gateway,
		onSettle(fn) {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		get reduced() {
			return reduced.matches;
		},
	});
})();
