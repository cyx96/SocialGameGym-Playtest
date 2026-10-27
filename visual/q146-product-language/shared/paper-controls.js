/* Material only. Button/control owners retain input, semantics, busy and business state. */
(() => {
	"use strict";
	const motion = window.SGGMotion,
		root = document.documentElement;
	const precise = matchMedia("(hover:hover) and (pointer:fine)");
	const faces = new WeakMap();
	let current = null,
		point = null,
		frame = 0,
		focused = true;
	function layer(name) {
		const n = document.createElement("span");
		n.className = name;
		n.setAttribute("aria-hidden", "true");
		return n;
	}
	function enhance(scope = document) {
		const all = (selector) => [
			...(scope.matches?.(selector) ? [scope] : []),
			...scope.querySelectorAll(selector),
		];
		for (const surface of all(
			".experience,.experience-app-pane,.sg-social-workspace-host,.sg-pane-toolbar,.sg-task-context-rail,.sg-page,.sg-utility-shell,.sg-stage-route-host,.sg-welcome,body,body[data-catalog-craft] #stage",
		))
			surface.dataset.sgPaperCanvas = "canvas";
		for (const surface of all(
			".experience-header,.sg-product-bar,.catalog-header,.detail-pane,.sg-utility-shell .topbar",
		))
			surface.dataset.sgPaperCanvas = "surface";
		// Opaque printed regions need material, but never an extra raised action surface.
		for (const paper of all(
			"[data-sg-paper-print],.bubble,.player-choice-menu,.player-choice-token,.number-detail,.sg-result-document,.seat-identity-icon,.sg-stage-focus,.sg-stage-marker,.sg-utility-shell .admin-facts pre,body[data-catalog-craft] .card-face,body[data-catalog-craft] .card-front .wash",
		)) {
			paper.dataset.sgPaperPrint = "";
			if (!paper.querySelector(":scope > .sg-paper-grain")) paper.prepend(layer("sg-paper-grain"));
		}
		for (const composite of all(".sg-number,.sg-select")) composite.dataset.sgPaperField = "";
		for (const image of all(
			"button:is(.profile-card-avatar,.sg-avatar-choice,.avatar-option,.profile-avatar-edit),button.sg-person-link:has(.sg-avatar)",
		))
			image.dataset.sgPress = "";
		for (const face of all(
			"[data-sg-button],[data-sg-press],.sg-choice .option-label,.star-option,.sg-switch-track",
		)) {
			if (face.closest(".sg-number,.compose-field,.sg-language-menu"))
				face.dataset.sgPaperBoundary = "contained";
			if (faces.has(face) && face.querySelector(":scope > .sg-paper-depth")) continue;
			face.classList.add("sg-paper-face");
			const depth = layer("sg-paper-depth"),
				grain = layer("sg-paper-grain"),
				fold = layer("sg-paper-fold");
			for (const side of ["left", "right"])
				fold.append(layer("sg-paper-plane sg-paper-plane-" + side));
			fold.append(layer("sg-paper-light"), layer("sg-paper-shade"), layer("sg-paper-ridge"));
			face.prepend(depth, fold, grain);
			faces.set(face, {
				fold,
				left: fold.children[0],
				right: fold.children[1],
				light: fold.children[2],
				shade: fold.children[3],
				ridge: fold.children[4],
			});
		}
		for (const field of all("[data-sg-paper-field]"))
			if (!field.querySelector(":scope > .sg-paper-grain")) field.prepend(layer("sg-paper-grain"));
		for (const paper of all(".sg-welcome-prompt"))
			if (!paper.querySelector(":scope > .sg-paper-grain")) paper.prepend(layer("sg-paper-grain"));
		for (const sheet of all("dialog.sg-reading,.sg-language-menu")) {
			sheet.classList.add("sg-paper-sheet");
			if (!sheet.querySelector(":scope > .sg-paper-grain")) sheet.prepend(layer("sg-paper-grain"));
		}
	}
	function blocked(face) {
		return (
			!face?.isConnected ||
			face.matches(":disabled,[aria-disabled=true],[aria-busy=true]") ||
			face.closest("[inert],[hidden],[aria-hidden=true],[aria-disabled=true]") ||
			face.closest(".option,.star-option,.sg-switch")?.querySelector("input")?.matches(":disabled")
		);
	}
	function reset(instant = false) {
		themeObserver.disconnect();
		cancelAnimationFrame(frame);
		frame = 0;
		point = null;
		if (!current) return;
		current.classList.toggle("sg-paper-instant", instant);
		delete current.dataset.paperActive;
		current = null;
	}
	function paint() {
		frame = 0;
		if (
			!current ||
			!point ||
			blocked(current) ||
			!precise.matches ||
			motion.instant() ||
			document.hidden ||
			!focused
		)
			return reset(true);
		const face = current,
			parts = faces.get(face),
			rect = face.getBoundingClientRect();
		if (!parts || !rect.width || !rect.height || !face.checkVisibility()) return reset(true);
		// Selection and theme remain authoritative even while the pointer is still.
		const fill = getComputedStyle(face).backgroundColor;
		// Finish geometry/animation reads before changing inherited lighting and
		// fold styles. Querying animations afterwards forces a second style pass.
		const pressing = face
			.getAnimations()
			.some(
				(a) => a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity,
			);
		const paperFill = fill === "rgba(0, 0, 0, 0)" ? "var(--surface,white)" : fill;
		if (face.style.getPropertyValue("--sg-paper-fill") !== paperFill)
			face.style.setProperty("--sg-paper-fill", paperFill);
		const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width)),
			y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
		const span = 12 + (y - 0.5) * 6,
			top = x * 100 - span * y,
			bottom = x * 100 + span * (1 - y);
		parts.left.style.clipPath = `polygon(0 0,${top}% 0,${bottom}% 100%,0 100%)`;
		parts.right.style.clipPath = `polygon(${top}% 0,100% 0,100% 100%,${bottom}% 100%)`;
		parts.light.style.opacity = String(0.015 + (1 - y) * 0.025);
		parts.shade.style.opacity = String(y * 0.025);
		parts.ridge.style.clipPath = `polygon(${top - 0.25}% 0,${top + 0.25}% 0,${bottom + 0.25}% 100%,${bottom - 0.25}% 100%)`;
		parts.ridge.style.opacity = ".07";
		for (const [name, value] of [
			["--sg-paper-icon-light", String(0.04 + (1 - x) * 0.12 + (1 - y) * 0.06)],
			["--sg-paper-icon-shade", String(0.02 + x * 0.1 + y * 0.06)],
		])
			if (face.style.getPropertyValue(name) !== value) face.style.setProperty(name, value);
		// Only resample during the finite press/release transform, never as an idle loop.
		if (pressing) frame = requestAnimationFrame(paint);
	}
	function track(event) {
		if (
			event.pointerType !== "mouse" ||
			!precise.matches ||
			motion.instant() ||
			document.hidden ||
			!focused
		)
			return;
		const hit = event.target.closest?.(
				"[data-sg-button],[data-sg-press],.sg-choice .option,.star-option,.sg-switch",
			),
			face = hit?.matches(".option")
				? hit.querySelector(".option-label")
				: hit?.matches(".sg-switch")
					? hit.querySelector(".sg-switch-track")
					: hit;
		if (!face || blocked(face)) return reset(true);
		if (current !== face) {
			reset();
			enhance(face);
			current = face;
			// Theme roots may be local (the real experience host), not only html.
			// Observe only the active face's inheritance chain, never every style mutation.
			for (let ancestor = face; ancestor; ancestor = ancestor.parentElement)
				themeObserver.observe(ancestor, {
					attributes: true,
					attributeFilter: ["style", "data-sg-theme", "class"],
				});
			face.classList.remove("sg-paper-instant");
			const fill = getComputedStyle(face).backgroundColor;
			face.style.setProperty(
				"--sg-paper-fill",
				fill === "rgba(0, 0, 0, 0)" ? "var(--surface,white)" : fill,
			);
			face.dataset.paperActive = "";
		}
		point = { x: event.clientX, y: event.clientY };
		if (!frame) frame = requestAnimationFrame(paint);
	}
	function edit(target = document.activeElement, instant = false) {
		root.toggleAttribute(
			"data-paper-edit-instant",
			instant || motion.instant() || document.hidden || !focused,
		);
		const field =
			focused &&
			!document.hidden &&
			target?.matches?.(
				"input:not(:disabled):not([readonly]),textarea:not(:disabled):not([readonly]),select:not(:disabled)",
			)
				? target.closest("[data-sg-paper-field]") ||
					target.closest("[data-sg-paper-field-host]")?.querySelector("[data-sg-paper-field]")
				: null;
		for (const n of document.querySelectorAll("[data-paper-editing]"))
			if (n !== field) delete n.dataset.paperEditing;
		// A decorative material may itself be aria-hidden; the real input owns availability.
		if (field && !target.closest("[inert],[hidden],[aria-hidden=true]"))
			field.dataset.paperEditing = "";
	}
	for (const name of ["pointerover", "pointermove", "pointerdown", "pointerup"])
		document.addEventListener(name, track, { passive: true });
	document.addEventListener(
		"pointerout",
		(e) => {
			if (current && !current.contains(e.relatedTarget)) reset();
		},
		{ passive: true },
	);
	document.addEventListener("pointercancel", () => reset(true), { passive: true });
	document.addEventListener("focusin", (e) => edit(e.target));
	document.addEventListener("focusout", (e) => edit(e.relatedTarget));
	function settle() {
		reset(true);
		edit(document.activeElement, true);
	}
	function resample() {
		if (current && !frame) frame = requestAnimationFrame(paint);
	}
	const themeObserver = new MutationObserver(resample);
	document.addEventListener("change", resample);
	motion.onSettle(settle);
	precise.addEventListener("change", settle);
	window.addEventListener("blur", () => {
		focused = false;
		settle();
	});
	window.addEventListener("focus", () => {
		focused = true;
		settle();
	});
	window.addEventListener("resize", settle);
	window.addEventListener("pagehide", settle);
	document.addEventListener("visibilitychange", settle);
	document.addEventListener("scroll", () => reset(true), { capture: true, passive: true });
	new MutationObserver((records) => {
		for (const record of records)
			for (const n of record.addedNodes)
				if (
					n instanceof Element &&
					!n.classList.contains("sg-paper-grain") &&
					!n.classList.contains("sg-paper-depth") &&
					!n.classList.contains("sg-paper-fold")
				)
					enhance(n);
		if (current && blocked(current)) reset(true);
		else if (
			records.some((r) => r.attributeName === "aria-pressed" || r.attributeName === "aria-selected")
		)
			resample();
		if (records.some((r) => r.type === "attributes")) edit(document.activeElement, true);
	}).observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: [
			"disabled",
			"readonly",
			"aria-disabled",
			"aria-busy",
			"inert",
			"hidden",
			"aria-hidden",
			"aria-pressed",
			"aria-selected",
		],
	});
	enhance();
	window.SGGPaper = Object.freeze({ enhance, settle });
})();
