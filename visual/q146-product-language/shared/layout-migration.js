/* Explicit adapters for the frozen visual pages. New pages use the primitives directly. */
(() => {
	"use strict";
	const L = SGGLayout,
		body = document.body;
	const header = body.querySelector(":scope>.sg-product-bar");
	if (header) {
		L.header(header);
		const observer = new ResizeObserver(([entry]) => {
			const h = entry.borderBoxSize?.[0]?.blockSize ?? header.getBoundingClientRect().height;
			document.documentElement.style.setProperty("--sg-header-block", h + "px");
		});
		observer.observe(header);
	}
	const rail = body.querySelector(":scope>.sg-progress");
	if (rail) {
		if (rail.classList.contains("phase"))
			L.progress(rail, {
				name: rail.querySelector(":scope>h1"),
				count: rail.querySelector(":scope>.turn"),
				trailing: [...rail.querySelectorAll(":scope>.finish")],
			});
		else if (body.dataset.layoutSurface === "rating") {
			const group = rail.firstElementChild;
			L.progress(rail, {
				group,
				name: document.querySelector("#phase-name"),
				count: document.querySelector("#phase-step"),
				trailing: [document.querySelector("#phase-note")].filter(Boolean),
			});
		} else
			L.progress(rail, {
				group: rail.querySelector(".phase-label"),
				name: rail.querySelector(".phase-name"),
				count: rail.querySelector(".phase-step"),
				trailing: [...rail.querySelectorAll(":scope>.person")],
			});
	}
	// A single context line owns game/round and phase/step; no empty vertical rail.
	const context = header?.querySelector(":scope>.game-context");
	if (context) {
		context.classList.add("sg-context-line");
		const pair = document.createElement("span");
		pair.className = "sg-context-game";
		pair.append(...context.childNodes);
		context.append(pair);
		if (rail) {
			context.append(rail);
			body.dataset.contextProgress = "";
		}
	}
	const bars = [...document.querySelectorAll(".toolbar,.app-toolbar,.forum-toolbar,.dm-toolbar")];
	for (const bar of bars) {
		if (bar.classList.contains("forum-toolbar")) bar.dataset.sgNavigationScroll = "";
		L.toolbar(bar);
		if (bar.classList.contains("forum-toolbar")) bar.dataset.sticky = "";
		new MutationObserver(() => L.toolbar(bar)).observe(bar, { childList: true });
	}
	for (const layout of document.querySelectorAll(".sg-page>.workspace,.sg-page>.feedback-layout"))
		layout.classList.add("sg-task-layout");
	for (const work of document.querySelectorAll(".sg-page>.rating-app,.sg-page>.dm-workspace"))
		work.classList.add("sg-workspace");
	for (const label of document.querySelectorAll(".sg-progress-group"))
		if (!label.children.length) label.classList.add("sg-progress-name");
	for (const bar of document.querySelectorAll(".sg-reading-head,.dialog-head,.sheet-toolbar"))
		bar.classList.add("sg-panel-toolbar");
	document.documentElement.dataset.layoutVersion = L.version;
})();
