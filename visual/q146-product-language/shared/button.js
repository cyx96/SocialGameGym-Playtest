/* No business timer, success assumption, or framework dependency. */
(() => {
	"use strict";
	// Editing text does not switch the focus treatment to keyboard navigation.
	const focusRoot = document.documentElement;
	focusRoot.dataset.sgFocusInput ||= "pointer";
	document.addEventListener(
		"pointerdown",
		() => {
			focusRoot.dataset.sgFocusInput = "pointer";
		},
		{ capture: true, passive: true },
	);
	document.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Tab") focusRoot.dataset.sgFocusInput = "keyboard";
		},
		true,
	);
	const reduce = matchMedia("(prefers-reduced-motion:reduce)"),
		groups = new WeakMap();
	const block = (b) =>
		b.disabled ||
		b.getAttribute("aria-disabled") === "true" ||
		b.getAttribute("aria-busy") === "true";
	const getButton = (target) =>
		target instanceof Element ? target.closest("[data-sg-button],[data-sg-press]") : null;
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
					r = selected.getBoundingClientRect(),
					scaleX = g.width / group.offsetWidth,
					scaleY = g.height / group.offsetHeight;
				if (!scaleX || !scaleY) return;
				instant =
					instant ||
					reduce.matches ||
					window.SGGMotion?.instant() ||
					selected.dataset.sgInput === "keyboard";
				if (instant) group.dataset.sgInstant = "";
				// DOM rectangles include ancestor App-flight scale; CSS insets use local units.
				indicator.style.clipPath = `inset(${(r.top - g.top) / scaleY}px ${(g.right - r.right) / scaleX}px ${(g.bottom - r.bottom) / scaleY}px ${(r.left - g.left) / scaleX}px round ${getComputedStyle(group).getPropertyValue("--sg-button-selection-radius").trim() || "10px"})`;
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
		pointer = null,
		releaseGeneration = 0;
	const releasing = new Map();
	function settlePress(button) {
		button.dataset.sgInstant = "";
		button.classList.remove("sg-pressed");
		button.getBoundingClientRect();
		releasing.delete(button);
	}
	function release(instant = false) {
		if (pressed) {
			const button = pressed;
			if (instant) settlePress(button);
			else {
				button.classList.remove("sg-pressed");
				const stamp = ++releaseGeneration;
				releasing.set(button, stamp);
				Promise.allSettled(button.getAnimations().map((animation) => animation.finished)).then(
					() => {
						if (releasing.get(button) === stamp) releasing.delete(button);
					},
				);
			}
		}
		pressed = null;
		pointer = null;
	}
	document.addEventListener(
		"pointerdown",
		(event) => {
			const b = getButton(event.target);
			if (!b || block(b) || event.button !== 0 || !event.isPrimary) return;
			release(true);
			delete b.dataset.sgInstant;
			releasing.delete(b);
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
				if (e.pointerId === pointer) release(e.type === "pointercancel");
			},
			{ passive: true },
		);
	function settleFeedback() {
		release(true);
		for (const button of releasing.keys()) settlePress(button);
	}
	window.SGGMotion?.onSettle(() => {
		settleFeedback();
		for (const group of document.querySelectorAll("[data-sg-segmented]"))
			groups.get(group)?.update(true);
	});
	window.addEventListener("blur", settleFeedback);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) settleFeedback();
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
			} else if (b?.tagName === "BUTTON" && event.pointerType === "mouse") {
				// WebKit does not focus mouse-clicked buttons. Establish the real source before
				// the handler opens a native dialog, so its own return-focus chain remains valid.
				b.focus({ preventScroll: true });
			}
		},
		true,
	);
	function busy(button, value) {
		if (value) {
			if (button.getAttribute("aria-busy") === "true") return;
			const label = document.createElement("span");
			label.className = "sg-button-label";
			for (const node of [...button.childNodes]) {
				if (
					!(node instanceof Element) ||
					!node.matches(".sg-paper-depth,.sg-paper-grain,.sg-paper-fold")
				)
					label.append(node);
			}
			button.append(label);
			const spinner = activity();
			spinner.classList.add("sg-button-spinner");
			button.append(spinner);
			button.setAttribute("aria-busy", "true");
			button.classList.remove("sg-pressed");
		} else {
			if (button.getAttribute("aria-busy") !== "true") return;
			const label = button.querySelector(":scope > .sg-button-label");
			button.querySelector(":scope > .sg-button-spinner")?.remove();
			if (label) label.replaceWith(...label.childNodes);
			button.removeAttribute("aria-busy");
		}
	}
	function create({
		label,
		labelKey,
		labelValues = {},
		ariaLabelKey,
		ariaLabelValues = {},
		role = "quiet",
		size = "regular",
		icon,
		ariaLabel,
		type = "button",
		disabled = false,
	}) {
		if (!label && !ariaLabel && !labelKey && !ariaLabelKey)
			throw Error("Button needs an accessible name");
		if (!["primary", "soft", "quiet", "icon", "icon-primary", "danger"].includes(role))
			throw Error("Unknown button role");
		if (!["regular", "compact"].includes(size)) throw Error("Unknown button size");
		if ((role === "icon" || role === "icon-primary") && !ariaLabel && !ariaLabelKey)
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
		if (labelKey) {
			const text = document.createElement("span");
			SGGI18n.bind(text, labelKey, { values: labelValues });
			b.append(text);
		} else if (label) b.append(document.createTextNode(label));
		if (ariaLabelKey)
			SGGI18n.bind(b, ariaLabelKey, { attr: "aria-label", values: ariaLabelValues });
		else if (ariaLabel) b.setAttribute("aria-label", ariaLabel);
		const holder = document.createElement("span");
		holder.append(b);
		enhance(holder);
		return b;
	}

	function iconize(button, { name, label, labelKey, labelValues = {}, motion }) {
		if (labelKey) label = SGGI18n.t(labelKey, labelValues);
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
		button.removeAttribute("title");
		if (motion) button.dataset.sgMotion = motion;
		const text = document.createElement("span");
		text.className = "sg-icon-label";
		text.textContent = label;
		button.replaceChildren(window.SGGIcons.create(name), text);
		if (labelKey) {
			SGGI18n.bind(button, labelKey, { attr: "aria-label", values: labelValues });
			SGGI18n.bind(text, labelKey, { values: labelValues });
		}
	}
	function feedback(button, state) {
		if (!["idle", "confirmed", "error"].includes(state)) throw Error("Unknown feedback state");
		if (button.dataset.sgFeedback === state) return;
		button.dataset.sgFeedback = state;
	}
	reduce.addEventListener("change", () => {
		release();
		for (const group of document.querySelectorAll("[data-sg-segmented]"))
			groups.get(group)?.update(true);
	});
	function badgeText(value) {
		return value > 99 ? "99+" : String(value);
	}
	/** Presentation only: callers provide an authorized unread-content count. */
	function badge(host, value) {
		const count = Number.isSafeInteger(value) && value > 0 ? value : 0;
		let node = host.querySelector(
			":scope > .sg-unread, :scope > .tool-unread, :scope > .sg-button-label > .sg-unread",
		);
		if (!node && !count) return null;
		if (!node) {
			node = document.createElement("span");
			node.setAttribute("aria-hidden", "true");
			host.append(node);
		}
		const initialized = node.hasAttribute("data-count"),
			previous = Number(node.dataset.count || 0);
		if (!node.classList.contains("sg-unread")) node.classList.add("sg-unread");
		if (node.dataset.count !== String(count)) node.dataset.count = String(count);
		const text = badgeText(count);
		if (node.textContent !== text) node.textContent = text;
		node.hidden = count === 0;
		if (initialized && count > previous && node.getClientRects().length)
			window.SGGMotion?.run(
				node,
				[
					{ opacity: 0.5, transform: "translateY(2px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ role: "state" },
			);
		return node;
	}
	let unavailableId = 0;
	/** Callers decide capability; the button owns only disabled presentation and its reason. */
	function unavailable(button, { label } = {}) {
		if (!button) return null;
		button.disabled = true;
		if (pressed === button) release();
		let stack = button.parentElement;
		if (!stack?.classList.contains("sg-action-stack")) {
			stack = document.createElement("span");
			stack.className = "sg-action-stack";
			button.before(stack);
			stack.append(button);
			if (button.classList.contains("sg-toolbar-trailing")) {
				button.classList.remove("sg-toolbar-trailing");
				stack.classList.add("sg-toolbar-trailing");
			}
		}
		let hint = stack.querySelector(":scope > .sg-action-hint");
		if (!hint) {
			hint = document.createElement("span");
			hint.className = "sg-action-hint";
			stack.append(hint);
		}
		hint.id ||= "sg-unavailable-" + ++unavailableId;
		if (label !== undefined) hint.textContent = label;
		else SGGI18n.bind(hint, "asset.actionUnavailable");
		if (!button.hasAttribute("data-sg-button")) {
			button.dataset.sgButton = "";
			button.dataset.sgRole = "quiet";
			enhance(stack);
		}
		const describedBy = new Set(
			(button.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean),
		);
		describedBy.add(hint.id);
		button.setAttribute("aria-describedby", [...describedBy].join(" "));
		stack.hidden = button.hidden;
		return stack;
	}
	function activity() {
		const n = document.createElement("span");
		n.className = "sg-activity-indicator";
		n.setAttribute("aria-hidden", "true");
		n.innerHTML =
			'<svg viewBox="2 2 20 20" stroke-width="1.7"><circle cx="12" cy="12" r="8" opacity=".3"/><path d="M12 4a8 8 0 0 1 8 8"/></svg>';
		return n;
	}
	function settleActivity() {
		document.documentElement.toggleAttribute("data-sg-activity-paused", document.hidden);
	}
	document.addEventListener("visibilitychange", settleActivity);
	settleActivity();
	window.SGGButtons = Object.freeze({
		version: "1.5.0",
		activity,
		enhance,
		busy,
		create,
		iconize,
		feedback,
		badge,
		badgeText,
		unavailable,
	});
	enhance();
	requestAnimationFrame(() =>
		requestAnimationFrame(() => (document.documentElement.dataset.sgMounted = "true")),
	);
})();
