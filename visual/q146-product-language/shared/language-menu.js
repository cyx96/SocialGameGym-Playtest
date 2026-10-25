/* One global presentation control; independent from all player/runtime commands. */
(() => {
	"use strict";
	const boot = () => {
		if (window.parent !== window) {
			try {
				if (parent.SGGI18n) {
					document.documentElement.dataset.sgLanguageControl = "";
					return;
				}
			} catch {}
		}
		if (document.querySelector(".sg-language-control[data-sg-language-control]")) return;
		const I = window.SGGI18n,
			wrapper = document.createElement("div");
		wrapper.className = "sg-language-control";
		wrapper.dataset.sgLanguageControl = "";
		const trigger = SGGButtons.create({
			role: "icon",
			icon: SGGIcons.create("language"),
			ariaLabel: "Language / 语言",
		});
		trigger.id = "sg-language-trigger";
		trigger.setAttribute("aria-haspopup", "menu");
		trigger.setAttribute("aria-expanded", "false");
		trigger.setAttribute("aria-controls", "sg-language-menu");
		const menu = document.createElement("div");
		menu.className = "sg-language-menu";
		menu.id = "sg-language-menu";
		menu.setAttribute("role", "menu");
		menu.setAttribute("aria-labelledby", trigger.id);
		menu.setAttribute("popover", "auto");
		const live = document.createElement("span");
		live.className = "sg-icon-label";
		live.setAttribute("role", "status");
		live.setAttribute("aria-live", "polite");
		const options = I.definition.locales.map((language) => {
			const option = SGGButtons.create({ role: "quiet", label: language.name });
			option.setAttribute("role", "menuitemradio");
			option.setAttribute("lang", language.id);
			option.dataset.locale = language.id;
			option.tabIndex = -1;
			const check = SGGIcons.create("check");
			check.classList.add("sg-language-check");
			option.append(check);
			option.onclick = () => {
				I.set(language.id);
				live.textContent = I.t("locale.changed", { name: language.name });
				close(true);
			};
			menu.append(option);
			return option;
		});
		function update() {
			for (const option of options)
				option.setAttribute("aria-checked", String(option.dataset.locale === I.locale));
			trigger.removeAttribute("title");
			trigger.setAttribute(
				"aria-description",
				I.t("locale.selected", {
					name: I.definition.locales.find((l) => l.id === I.locale)?.name || I.locale,
				}),
			);
			menu.setAttribute("aria-label", I.t("locale.menu"));
		}
		function close(returnFocus = false) {
			if (menu.matches(":popover-open")) menu.hidePopover();
			trigger.setAttribute("aria-expanded", "false");
			if (returnFocus) trigger.focus({ preventScroll: true });
		}
		function open(event, last = false) {
			const rect = trigger.getBoundingClientRect();
			menu.style.top = `${rect.bottom + 8}px`;
			menu.style.setProperty("--sg-language-top", `${rect.bottom + 8}px`);
			menu.style.right = `${Math.max(16, innerWidth - rect.right)}px`;
			menu.showPopover();
			trigger.setAttribute("aria-expanded", "true");
			SGGMotion?.reveal(menu, { event });
			const option = last
				? options.at(-1)
				: options.find((o) => o.dataset.locale === I.locale) || options[0];
			option?.focus({ preventScroll: true });
		}
		trigger.onclick = (event) => (menu.matches(":popover-open") ? close(true) : open(event));
		trigger.onkeydown = (event) => {
			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				open(event, event.key === "ArrowUp");
			}
		};
		menu.addEventListener("keydown", (event) => {
			const current = options.indexOf(document.activeElement),
				index =
					event.key === "ArrowDown"
						? (current + 1) % options.length
						: event.key === "ArrowUp"
							? (current - 1 + options.length) % options.length
							: event.key === "Home"
								? 0
								: event.key === "End"
									? options.length - 1
									: null;
			if (index !== null) {
				event.preventDefault();
				options[index]?.focus({ preventScroll: true });
			}
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				close(true);
			}
			if (event.key === "Tab") close(true);
		});
		menu.addEventListener("toggle", () =>
			trigger.setAttribute("aria-expanded", String(menu.matches(":popover-open"))),
		);
		window.addEventListener("resize", () => close());
		// Native light-dismiss does not cross into an embedded catalog/App document.
		// Opening focuses an option here; entering any child frame then blurs this window.
		window.addEventListener("blur", () => close());
		I.subscribe(update);
		wrapper.append(trigger, menu, live);
		// One stable product-header utility. Native modals make the underlying page
		// inert; they do not acquire a second entry or move the global control.

		let utilityRow = null,
			alignmentFrame = 0;
		function align() {
			alignmentFrame = 0;
			const row = [
				...document.querySelectorAll(
					".sg-product-bar > .sg-header-actions, .catalog-header > nav, .sg-utility-shell > .topbar > nav",
				),
			].find((node) => node.checkVisibility({ checkVisibilityCSS: true }));
			if (row !== utilityRow) {
				if (utilityRow) rowSize.unobserve(utilityRow);
				utilityRow = row || null;
				if (utilityRow) rowSize.observe(utilityRow);
			}
			if (!row || !wrapper.isConnected) {
				delete wrapper.dataset.sgLanguageAligned;
				wrapper.style.removeProperty("--sg-language-control-top");
				return;
			}
			const bounds = row.getBoundingClientRect();
			wrapper.style.setProperty(
				"--sg-language-control-top",
				`${bounds.top + (bounds.height - trigger.offsetHeight) / 2}px`,
			);
			wrapper.dataset.sgLanguageAligned = "";
		}
		function scheduleAlignment() {
			if (!alignmentFrame) alignmentFrame = requestAnimationFrame(align);
		}
		const rowSize = new ResizeObserver(scheduleAlignment);
		window.addEventListener("resize", scheduleAlignment, { passive: true });
		new MutationObserver(scheduleAlignment).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["style", "class", "lang"],
		});
		function place() {
			const surface = document.documentElement.dataset.sgLanguageSurface;
			if (surface === "welcome" || surface === "pending") {
				close();
				wrapper.remove();
				delete document.documentElement.dataset.sgLanguageControl;
				return;
			}
			if (document.querySelector("dialog:modal")) close();
			if (wrapper.parentNode !== document.body) document.body.append(wrapper);
			document.documentElement.dataset.sgLanguageControl = "";
			scheduleAlignment();
		}
		document.addEventListener("sgg:languagesurfacechange", place);
		new MutationObserver((records) => {
			if (
				records.some(
					(record) =>
						record.type === "attributes" ||
						[...record.addedNodes, ...record.removedNodes].some(
							(node) =>
								node.nodeType === 1 &&
								(node.contains(wrapper) ||
									node.matches("dialog, .sg-product-bar, .catalog-header, .sg-utility-shell") ||
									node.querySelector(
										"dialog[open], .sg-product-bar, .catalog-header, .sg-utility-shell",
									)),
						),
				)
			)
				place();
		}).observe(document.documentElement, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["open", "inert", "data-sg-language-surface"],
		});
		place();
		update();
	};
	if (document.readyState === "loading")
		document.addEventListener("DOMContentLoaded", boot, { once: true });
	else boot();
})();
