/* Presentation observer only. One context per pane; no game state or scroll position writes. */
(() => {
	"use strict";
	const owners = new WeakMap();
	function connect({ pane, toolbar, source, primary }) {
		if (!pane || !source || !primary) return () => {};
		owners.get(pane)?.();
		const rail = toolbar ? document.createElement("div") : null,
			slot = rail ? document.createElement("span") : null;
		if (rail && slot) {
			rail.className = "sg-task-context-rail";
			rail.setAttribute("role", "region");
			SGGI18n.bind(rail, "asset.currentTask", { attr: "aria-label" });
			rail.inert = true;
			slot.className = "sg-task-context-slot";
			rail.append(slot);
			toolbar.after(rail);
			toolbar.classList.add("sg-task-toolbar");
		}
		source.dataset.sgTaskContext = "";
		let frame = 0,
			closed = false;
		function copy() {
			if (!slot) return;
			const clone = document.createElement("span"),
				content = primary.cloneNode(true);
			clone.className = "sg-task-primary";
			clone.dataset.taskPrimary = "";
			clone.append(...content.childNodes);
			for (const node of clone.querySelectorAll("[id]")) node.removeAttribute("id");
			slot.replaceChildren(clone);
			slot.title = primary.textContent.trim();
		}
		function update() {
			frame = 0;
			if (closed) return;
			const stacked = getComputedStyle(source).getPropertyValue("--sg-task-stacked").trim() === "1",
				visible = pane.checkVisibility({ checkVisibilityCSS: true });
			pane.dataset.sgTaskStacked = String(stacked);
			if (!toolbar) return;
			if (visible)
				pane.style.setProperty(
					"--sg-task-nav-height",
					toolbar.getBoundingClientRect().height + "px",
				);
			const compact =
				stacked &&
				visible &&
				primary.getBoundingClientRect().bottom <= toolbar.getBoundingClientRect().bottom;
			const previous = toolbar.dataset.sgContext;
			toolbar.dataset.sgContext = compact ? "compact" : "expanded";
			if (rail) {
				rail.dataset.sgContext = toolbar.dataset.sgContext;
				rail.inert = !compact;
			}
			if (compact && previous !== "compact")
				window.SGGMotion?.run(slot, [{ opacity: 0 }, { opacity: 1 }], { role: "state" });
			else if (!compact) window.SGGMotion?.cancel(slot);
		}
		function schedule() {
			if (!frame) frame = requestAnimationFrame(update);
		}
		const size = new ResizeObserver(schedule);
		size.observe(pane);
		size.observe(primary);
		if (toolbar) size.observe(toolbar);
		const text = new MutationObserver(() => {
			copy();
			schedule();
		});
		text.observe(primary, { childList: true, subtree: true, characterData: true });
		const visibility = new MutationObserver(schedule);
		visibility.observe(pane, { attributes: true, attributeFilter: ["hidden"] });
		pane.addEventListener("scroll", schedule, { passive: true });
		copy();
		update();
		function disconnect() {
			if (closed) return;
			closed = true;
			cancelAnimationFrame(frame);
			window.SGGMotion?.cancel(slot);
			size.disconnect();
			text.disconnect();
			visibility.disconnect();
			pane.removeEventListener("scroll", schedule);
			if (toolbar) {
				toolbar.classList.remove("sg-task-toolbar");
				delete toolbar.dataset.sgContext;
			}
			delete source.dataset.sgTaskContext;
			delete pane.dataset.sgTaskStacked;
			pane.style.removeProperty("--sg-task-nav-height");
			rail?.remove();
			if (owners.get(pane) === disconnect) owners.delete(pane);
		}
		owners.set(pane, disconnect);
		return disconnect;
	}
	function renderText(root, parts, { identities = {}, viewerId } = {}) {
		root.replaceChildren();
		for (const part of parts) {
			if (typeof part === "string") root.append(document.createTextNode(part));
			else if (part && Object.hasOwn(part, "number")) {
				const value = document.createElement("strong");
				value.className = "sg-task-value";
				value.append(NumberUI.element(part.number, { role: "data", unit: part.unit || "" }));
				root.append(value);
			} else if (part && typeof part.personId === "string")
				root.append(SGGInlinePerson.person(part.personId, identities, { viewerId }));
			else throw new TypeError("Task text requires explicit text, number or person parts");
		}
		return root;
	}
	function message({ primary, support, leading, level = 1 } = {}) {
		const header = document.createElement("header"),
			copy = document.createElement("div"),
			title = document.createElement(level === 2 ? "h2" : "h1");
		header.className = "intro sg-task-message";
		header.dataset.sgTaskMessage = "";
		copy.className = "sg-task-copy";
		title.className = "sg-task-primary";
		title.dataset.taskPrimary = "";
		title.append(
			primary instanceof Node ? primary : document.createTextNode(String(primary ?? "")),
		);
		copy.append(title);
		if (support) {
			const description = document.createElement("p");
			description.className = "description sg-task-support";
			description.append(
				support instanceof Node ? support : document.createTextNode(String(support)),
			);
			copy.append(description);
		}
		if (leading) header.append(leading);
		header.append(copy);
		return header;
	}
	window.SGGTaskContext = Object.freeze({
		version: "sgg.task-context/1",
		connect,
		message,
		renderText,
	});
})();
