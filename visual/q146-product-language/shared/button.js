/* No business timer, success assumption, or framework dependency. */
(() => {
	"use strict";
	const reduce = matchMedia("(prefers-reduced-motion:reduce)"),
		groups = new WeakMap();
	const block = (b) =>
		b.disabled ||
		b.getAttribute("aria-disabled") === "true" ||
		b.getAttribute("aria-busy") === "true";
	const getButton = (target) =>
		target instanceof Element ? target.closest("[data-sg-button]") : null;
	function enhance(root = document) {
		for (const b of root.querySelectorAll("[data-sg-button]")) {
			if (b.dataset.sgReady) continue;
			b.dataset.sgReady = "true";
			b.classList.add("sg-button");
			if (b.tagName === "BUTTON" && !b.hasAttribute("type")) b.type = "button";
		}
		for (const group of root.querySelectorAll("[data-sg-segmented]")) {
			if (groups.has(group)) continue;
			const indicator = document.createElement("span");
			indicator.className = "sg-selection";
			indicator.setAttribute("aria-hidden", "true");
			group.prepend(indicator);
			group.classList.add("sg-segmented");
			function update(instant = false) {
				const selected = group.querySelector("[data-sg-button][aria-pressed=true]");
				if (!selected) {
					indicator.hidden = true;
					return;
				}
				indicator.hidden = false;
				const g = group.getBoundingClientRect(),
					r = selected.getBoundingClientRect();
				instant =
					instant ||
					reduce.matches ||
					window.SGGMotion?.instant() ||
					selected.dataset.sgInput === "keyboard";
				if (instant) group.dataset.sgInstant = "";
				indicator.style.clipPath = `inset(${r.top - g.top}px ${g.right - r.right}px ${g.bottom - r.bottom}px ${r.left - g.left}px round ${getComputedStyle(group).getPropertyValue("--sg-button-selection-radius").trim() || "10px"})`;
				if (instant && !reduce.matches) requestAnimationFrame(() => delete group.dataset.sgInstant);
			}
			const resize = new ResizeObserver(() => update(true));
			resize.observe(group);
			const mutation = new MutationObserver(() => update());
			mutation.observe(group, {
				subtree: true,
				attributes: true,
				attributeFilter: ["aria-pressed"],
			});
			groups.set(group, { update, resize, mutation });
			update(true);
		}
	}
	let pressed = null,
		pointer = null;
	function release() {
		pressed?.classList.remove("sg-pressed");
		pressed = null;
		pointer = null;
	}
	document.addEventListener(
		"pointerdown",
		(event) => {
			const b = getButton(event.target);
			if (!b || block(b) || event.button !== 0 || !event.isPrimary) return;
			release();
			b.dataset.sgInput = "pointer";
			pressed = b;
			pointer = event.pointerId;
			if (!reduce.matches) {
				b.style.setProperty(
					"--sg-press-scale",
					Math.max(0.97, 1 - 2 / Math.max(44, b.getBoundingClientRect().width)),
				);
				b.classList.add("sg-pressed");
			}
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerout",
		(event) => {
			if (pressed && !pressed.contains(event.relatedTarget)) release();
		},
		{ passive: true },
	);
	for (const event of ["pointerup", "pointercancel"])
		document.addEventListener(
			event,
			(e) => {
				if (e.pointerId === pointer) release();
			},
			{ passive: true },
		);
	window.SGGMotion?.onSettle(() => {
		release();
		for (const group of document.querySelectorAll("[data-sg-segmented]"))
			groups.get(group)?.update(true);
	});
	window.addEventListener("blur", release);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) release();
	});
	document.addEventListener(
		"keydown",
		(event) => {
			if (pressed) pressed.dataset.sgInput = "keyboard";
			release();
			const b = getButton(event.target);
			if (b) b.dataset.sgInput = "keyboard";
		},
		true,
	);
	document.addEventListener(
		"click",
		(event) => {
			const b = getButton(event.target);
			if (b && block(b)) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		},
		true,
	);
	function busy(button, value) {
		if (value) {
			if (button.getAttribute("aria-busy") === "true") return;
			button.dataset.sgWasDisabled = String(button.getAttribute("aria-disabled") === "true");
			const label = document.createElement("span");
			label.className = "sg-button-label";
			while (button.firstChild) label.append(button.firstChild);
			button.append(label);
			const spinner = document.createElement("span");
			spinner.className = "sg-button-spinner";
			spinner.setAttribute("aria-hidden", "true");
			spinner.innerHTML =
				'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" opacity=".3"/><path d="M12 4a8 8 0 0 1 8 8"/></svg>';
			button.append(spinner);
			button.setAttribute("aria-busy", "true");
			button.setAttribute("aria-disabled", "true");
			button.classList.remove("sg-pressed");
		} else {
			if (button.getAttribute("aria-busy") !== "true") return;
			const label = button.querySelector(":scope > .sg-button-label");
			button.querySelector(":scope > .sg-button-spinner")?.remove();
			if (label) label.replaceWith(...label.childNodes);
			button.removeAttribute("aria-busy");
			if (button.dataset.sgWasDisabled !== "true") button.removeAttribute("aria-disabled");
			delete button.dataset.sgWasDisabled;
		}
	}
	function create({
		label,
		role = "quiet",
		size = "regular",
		icon,
		ariaLabel,
		type = "button",
		disabled = false,
	}) {
		if (!label && !ariaLabel) throw Error("Button needs an accessible name");
		if (!["primary", "soft", "quiet", "icon", "icon-primary", "danger"].includes(role))
			throw Error("Unknown button role");
		if (!["regular", "compact"].includes(size)) throw Error("Unknown button size");
		if ((role === "icon" || role === "icon-primary") && !ariaLabel)
			throw Error("Icon button needs an accessible name");
		const b = document.createElement("button");
		b.type = type;
		b.dataset.sgButton = "";
		b.dataset.sgRole = role;
		b.dataset.sgSize = size;
		b.disabled = disabled;
		if (icon instanceof SVGElement) {
			icon.setAttribute("aria-hidden", "true");
			b.append(icon);
		}
		if (label) b.append(document.createTextNode(label));
		if (ariaLabel) b.setAttribute("aria-label", ariaLabel);
		const holder = document.createElement("span");
		holder.append(b);
		enhance(holder);
		return b;
	}

	function iconize(button, { name, label, motion }) {
		if (!label) throw Error("Icon action needs a label");
		button.dataset.sgButton = "";
		button.dataset.sgRole = button.dataset.sgRole === "icon-primary" ? "icon-primary" : "icon";
		if (button.getAttribute("aria-busy") === "true") return;
		if (
			button.dataset.sgIconName === name &&
			button.querySelector(":scope > .sg-icon-label") &&
			button.getAttribute("aria-label") === label
		)
			return;
		button.dataset.sgIconName = name;
		button.setAttribute("aria-label", label);
		button.dataset.sgTooltip = label;
		button.removeAttribute("title");
		if (motion) button.dataset.sgMotion = motion;
		const text = document.createElement("span");
		text.className = "sg-icon-label";
		text.textContent = label;
		button.replaceChildren(window.SGGIcons.create(name), text);
	}
	function feedback(button, state) {
		if (!["idle", "confirmed", "error"].includes(state)) throw Error("Unknown feedback state");
		if (button.dataset.sgFeedback === state) return;
		button.dataset.sgFeedback = state;
	}
	let tip = null,
		owner = null,
		timer = 0,
		lastClose = -Infinity;
	const tipOwnerObserver = new MutationObserver(() => {
		if (owner && !owner.isConnected) hideTip();
	});
	function hideTip() {
		clearTimeout(timer);
		timer = 0;
		const wasVisible = tip && !tip.hidden;
		if (tip) {
			if (tip.matches(":popover-open")) tip.hidePopover();
			tip.hidden = true;
		}
		owner = null;
		tipOwnerObserver.disconnect();
		if (wasVisible) lastClose = performance.now();
	}
	function showTip(button, keyboard = false) {
		clearTimeout(timer);
		if (!button?.isConnected || !button.dataset.sgTooltip) return;
		if (!tip) {
			tip = document.createElement("div");
			tip.className = "sg-tooltip";
			tip.setAttribute("role", "tooltip");
			tip.setAttribute("popover", "manual");
			tip.hidden = true;
			document.body.append(tip);
		}
		owner = button;
		tip.textContent = button.getAttribute("aria-label") || button.dataset.sgTooltip;
		tip.hidden = false;
		tipOwnerObserver.observe(document.body, { childList: true, subtree: true });
		if (tip.showPopover && !tip.matches(":popover-open")) tip.showPopover();
		const r = button.getBoundingClientRect(),
			t = tip.getBoundingClientRect();
		tip.style.left =
			Math.max(8, Math.min(innerWidth - t.width - 8, r.x + (r.width - t.width) / 2)) + "px";
		tip.style.top =
			(r.bottom + t.height + 12 < innerHeight ? r.bottom + 8 : Math.max(8, r.top - t.height - 8)) +
			"px";
	}
	document.addEventListener(
		"pointerover",
		(event) => {
			if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
			const b = getButton(event.target);
			if (!b?.dataset.sgTooltip || b.contains(event.relatedTarget)) return;
			clearTimeout(timer);
			timer = setTimeout(() => showTip(b), performance.now() - lastClose < 120 ? 0 : 400);
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerout",
		(event) => {
			const b = getButton(event.target);
			if (b?.dataset.sgTooltip && !b.contains(event.relatedTarget)) hideTip();
		},
		{ passive: true },
	);
	document.addEventListener("focusin", (event) => {
		const b = getButton(event.target);
		if (b?.matches(":focus-visible"))
			queueMicrotask(() => {
				if (document.activeElement === b && b.isConnected && b.matches(":focus-visible"))
					showTip(b, true);
			});
	});
	document.addEventListener("focusout", hideTip);
	document.addEventListener("pointerdown", hideTip, true);
	document.addEventListener(
		"keydown",
		(e) => {
			if (e.key === "Escape") hideTip();
		},
		true,
	);
	document.addEventListener("scroll", hideTip, true);
	window.addEventListener("resize", hideTip);
	reduce.addEventListener("change", () => {
		release();
		for (const group of document.querySelectorAll("[data-sg-segmented]"))
			groups.get(group)?.update(true);
	});
	window.SGGButtons = Object.freeze({ version: "1.3.0", enhance, busy, create, iconize, feedback });
	enhance();
	requestAnimationFrame(() =>
		requestAnimationFrame(() => (document.documentElement.dataset.sgMounted = "true")),
	);
})();
