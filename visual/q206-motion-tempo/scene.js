(() => {
	"use strict";
	const params = new URLSearchParams(location.search),
		scenario = params.get("scene") === "app" ? "app" : "gateway";
	const tempo =
		window.SGGTempoCandidates.find((c) => c.id === params.get("tempo")) ||
		window.SGGTempoCandidates[0];
	const root = document.documentElement;
	root.style.setProperty("--sg-motion-gateway", tempo.gateway + "ms");
	root.style.setProperty("--sg-motion-app-open", tempo.open + "ms");
	root.style.setProperty("--sg-motion-app-close", tempo.close + "ms");
	for (const node of document.querySelectorAll("[data-icon]"))
		node.replaceChildren(SGGIcons.create(node.dataset.icon));
	let generation = 0,
		flights = [];
	function cancel() {
		generation++;
		for (const a of flights) a.cancel();
		flights = [];
	}
	const welcome = document.querySelector("#welcome"),
		catalog = document.querySelector("#catalog"),
		prompt = document.querySelector("#prompt"),
		send = document.querySelector("#send");
	const catalogFrame = catalog.querySelector("iframe");
	let loaded = false;
	catalogFrame.addEventListener("load", () => {
		loaded = true;
		send.disabled = false;
		const doc = catalogFrame.contentDocument;
		doc?.addEventListener("pointerdown", () => SGGMotion.input("pointer"), true);
		doc?.addEventListener("keydown", () => SGGMotion.input("keyboard"), true);
	});
	function resetGateway() {
		cancel();
		catalog.hidden = true;
		catalog.inert = true;
		welcome.hidden = false;
		welcome.inert = false;
		delete welcome.dataset.leaving;
		send.disabled = !loaded;
		const copy = document.querySelector(".sg-welcome-copy");
		copy.scrollLeft = copy.scrollWidth;
	}
	function enter() {
		if (!loaded) return;
		cancel();
		const current = generation;
		catalog.hidden = false;
		catalog.inert = false;
		welcome.inert = true;
		welcome.dataset.leaving = "true";
		flights = SGGMotion.gateway(prompt, catalog);
		Promise.allSettled(flights.map((a) => a.finished)).then(() => {
			if (current !== generation) return;
			welcome.hidden = true;
			for (const a of flights) a.cancel();
			flights = [];
		});
		catalogFrame.contentDocument?.querySelector("#stage")?.focus({ preventScroll: true });
	}
	send.onclick = enter;
	const desktop = document.querySelector("#desktop"),
		pane = document.querySelector("#app-pane"),
		launchers = document.querySelector("#launchers");
	const apps = [
		["profile", "资料"],
		["forum", "论坛"],
		["dm", "私信"],
		["rating", "评分"],
		["game", "游戏"],
		["questionnaire", "问卷"],
	];
	let active = null,
		source = null;
	function finish(open) {
		desktop.hidden = open;
		desktop.inert = open;
		pane.hidden = !open;
		pane.inert = !open;
	}
	function move(open) {
		if (!source) return;
		const current = ++generation;
		// Both real viewports stay in their layout slots while their one motion owner samples the current pose.
		desktop.hidden = false;
		pane.hidden = false;
		desktop.inert = open;
		pane.inert = !open;
		const nodes = [desktop, pane];
		for (const node of nodes) node.dataset.measuring = "";
		const geometry = {
			anchor: source.getBoundingClientRect(),
			bounds: pane.getBoundingClientRect(),
			desktopBounds: desktop.getBoundingClientRect(),
		};
		for (const node of nodes) delete node.dataset.measuring;
		const animations = SGGMotion.app(pane, desktop, { opening: open, ...geometry, source });
		flights = animations;
		Promise.allSettled(animations.map((a) => a.finished)).then(() => {
			if (current !== generation) return;
			finish(open);
			for (const a of animations) a.cancel();
			flights = [];
			if (!open) source.closest("button").focus({ preventScroll: true });
		});
	}
	function openApp(id, name, button) {
		active = id;
		source = button.querySelector(".tool-tile");
		document.querySelector("#app-name").textContent = name;
		document.querySelector("#profile-content").hidden = id !== "profile";
		document.querySelector("#other-content").hidden = id === "profile";
		document.querySelector("#app-content-title").textContent = name;
		move(true);
		document.querySelector("#back").focus({ preventScroll: true });
	}
	for (const [id, name] of apps) {
		const button = SGGAppLauncher.create({ id, label: name });
		button.onclick = () => openApp(id, name, button);
		launchers.append(button);
	}
	function close() {
		if (!active) return;
		active = null;
		move(false);
	}
	document.querySelector("#back").onclick = close;
	document.querySelector("#return").onclick = close;
	document.querySelector("#follow").onclick = (e) => {
		const b = e.currentTarget,
			on = b.getAttribute("aria-pressed") === "true";
		b.setAttribute("aria-pressed", String(!on));
		b.textContent = on ? "关注" : "已关注";
	};
	document.querySelector("#experience-next").onclick = () =>
		launchers.querySelector("[data-tool=game]").click();
	function resetApp() {
		cancel();
		active = null;
		finish(false);
	}
	function settle() {
		cancel();
		if (scenario === "gateway") {
			if (welcome.inert) {
				welcome.hidden = true;
				catalog.hidden = false;
			}
		} else finish(!!active);
	}
	SGGMotion.onSettle(settle);
	window.addEventListener("resize", settle);
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && scenario === "app") close();
		if (
			e.key === "Enter" &&
			scenario === "gateway" &&
			!welcome.hidden &&
			e.target === document.body
		)
			enter();
	});
	window.addEventListener("message", (e) => {
		if (
			e.source !== parent ||
			e.origin !== location.origin ||
			e.data?.channel !== "sgg:tempo-replay"
		)
			return;
		scenario === "gateway" ? resetGateway() : resetApp();
	});
	document.querySelector("#gateway-scene").hidden = scenario !== "gateway";
	document.querySelector("#app-scene").hidden = scenario !== "app";
	if (scenario === "gateway") resetGateway();
	else resetApp();
})();
