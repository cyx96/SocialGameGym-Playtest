/* Same approved-wordmark S derivative; owns browser chrome only, never product theme. */
(() => {
	const source = document.currentScript?.src;
	if (!source) return;
	const asset = new URL("../brand/", source);
	const dark = matchMedia("(prefers-color-scheme: dark)");
	let frame = null,
		frameDocument = null,
		frameObserver = null,
		queued = false;
	const links = new Map();
	function link(key, rel, type, sizes) {
		let node = document.querySelector(`link[data-sg-favicon="${key}"]`);
		if (!node) {
			node = document.createElement("link");
			node.dataset.sgFavicon = key;
			node.rel = rel;
			if (type) node.type = type;
			node.sizes = sizes;
			document.head.append(node);
		}
		links.set(key, node);
		return node;
	}
	function visible(node) {
		if (!node?.isConnected || node.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
		const style = node.ownerDocument.defaultView.getComputedStyle(node);
		return (
			style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0
		);
	}
	function theme(value) {
		return window.SGGThemes?.ids?.includes(value) ? value : "neutral";
	}
	function clearFrame() {
		frameObserver?.disconnect();
		frameObserver = null;
		frameDocument = null;
		if (frame) frame.removeEventListener("load", schedule);
		frame = null;
	}
	function catalogTheme(node) {
		if (frame !== node) {
			clearFrame();
			frame = node;
			frame.addEventListener("load", schedule);
		}
		try {
			const doc = frame.contentDocument;
			if (doc !== frameDocument) {
				frameObserver?.disconnect();
				frameDocument = doc;
				frameObserver = null;
				if (doc?.documentElement) {
					frameObserver = new MutationObserver(schedule);
					frameObserver.observe(doc.documentElement, {
						attributes: true,
						attributeFilter: ["data-sg-theme"],
					});
				}
			}
			return theme(doc?.documentElement.dataset.sgTheme);
		} catch {
			return "neutral";
		}
	}
	function currentTheme() {
		const home = [...document.querySelectorAll(".sg-home")].find(visible);
		if (home?.dataset.welcomeActive === "true") {
			clearFrame();
			return "neutral";
		}
		const catalog = [
			...document.querySelectorAll('.sg-catalog-home[data-visible="true"] iframe'),
		].find(visible);
		if (catalog) return catalogTheme(catalog);
		clearFrame();
		// A retained home with no visible catalog has no selected public surface theme.
		if (home) return "neutral";
		const surface = [
			...document.querySelectorAll(".experience[data-sg-theme],.sg-utility-shell[data-sg-theme]"),
		].find(visible);
		return theme((surface || document.documentElement).dataset.sgTheme);
	}
	function update() {
		queued = false;
		const name = `s-${currentTheme()}-${dark.matches ? "reverse" : "positive"}`;
		for (const [key, node] of links) {
			const path =
				key === "apple"
					? "apple-touch-neutral-180.png"
					: key === "svg"
						? `svg/${name}.svg`
						: `png/${name}-${key}.png`;
			const url = new URL(path, asset).href;
			if (node.href !== url) node.href = url;
		}
	}
	function schedule() {
		if (queued) return;
		queued = true;
		queueMicrotask(update);
	}
	const surfaceSelector = ".sg-home,.sg-catalog-home,.experience,.sg-utility-shell";
	function containsSurface(node) {
		return (
			node instanceof Element &&
			(node.matches(surfaceSelector) || Boolean(node.querySelector(surfaceSelector)))
		);
	}
	function surfaceChanged(records) {
		return records.some((record) => {
			if (record.type === "attributes")
				return (
					record.target === document.documentElement ||
					containsSurface(record.target) ||
					(record.target instanceof Element &&
						record.target.matches("iframe") &&
						record.target.closest(".sg-catalog-home"))
				);
			const nodes = [...record.addedNodes, ...record.removedNodes];
			return (
				nodes.some(containsSurface) ||
				(record.target instanceof Element &&
					record.target.matches(".sg-catalog-home") &&
					nodes.some((node) => node instanceof Element && node.matches("iframe")))
			);
		});
	}
	function start() {
		for (const node of document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]'))
			node.remove();
		for (const size of [16, 32, 48]) link(String(size), "icon", "image/png", `${size}x${size}`);
		link("svg", "icon", "image/svg+xml", "any");
		link("apple", "apple-touch-icon", "image/png", "180x180");
		new MutationObserver((records) => {
			if (surfaceChanged(records)) schedule();
		}).observe(document.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [
				"data-sg-theme",
				"data-welcome-active",
				"data-visible",
				"hidden",
				"inert",
				"aria-hidden",
			],
		});
		dark.addEventListener("change", schedule);
		update();
	}
	if (document.readyState === "loading")
		document.addEventListener("DOMContentLoaded", start, { once: true });
	else start();
})();
