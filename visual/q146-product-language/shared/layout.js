/* Layout primitives take nodes and authorised display data; they do not infer game rules. */
(() => {
	"use strict";
	const node = (tag, cls, text) => {
		const n = document.createElement(tag);
		n.className = cls;
		if (text != null) n.textContent = text;
		return n;
	};
	function header(root) {
		root.classList.add("sg-product-bar");
		root
			.querySelector(":scope>nav,:scope>.reading,:scope>#session-tools")
			?.classList.add("sg-header-actions");
		return root;
	}
	function progress(root, { group, name, count, trailing } = {}) {
		root.classList.add("sg-progress");
		group ??= root.querySelector(":scope>.sg-progress-group");
		if (!group) {
			group = node("div", "sg-progress-group");
			root.prepend(group);
		}
		group.classList.add("sg-progress-group");
		if (name) {
			name.classList.add("sg-progress-name");
			group.append(name);
		}
		if (count) {
			count.classList.add("sg-progress-count");
			group.append(count);
		}
		if (trailing?.length) {
			let actions = root.querySelector(":scope>.sg-progress-actions");
			if (!actions) {
				actions = node("div", "sg-progress-actions");
				root.append(actions);
			}
			actions.append(...trailing);
		}
		return root;
	}
	function toolbar(root) {
		root.classList.add("sg-toolbar", "sg-pane-toolbar");
		// App navigation has its own frame, independent of the content reading width.
		// Profile peeks belong to the host Reading and have no product-level App bar.
		const page = root.parentElement;
		if (
			document.documentElement.dataset.sessionApp &&
			!document.documentElement.hasAttribute("data-profile-peek") &&
			page?.matches("body > .sg-page")
		) {
			if (root.hasAttribute("data-sg-navigation-scroll")) {
				// A scroll-owned navigation overlay needs the full navigation viewport;
				// its children retain the page's independent reading-width role.
				page.classList.add("sg-navigation-scroll-canvas");
			} else {
				root.classList.add("sg-navigation-canvas");
				page.before(root);
			}
			root.dispatchEvent(new Event("sgg:navigation-mounted"));
		}
		const title = [...root.children].find((n) =>
			n.matches("h1,h2,.app-title,.sg-task-toolbar-label"),
		);
		if (title) title.classList.add("sg-toolbar-title");
		let before = true;
		for (const n of [...root.children]) {
			if (n === title) {
				before = false;
				continue;
			}
			n.classList.add(before ? "sg-toolbar-leading" : "sg-toolbar-trailing");
		}
		return root;
	}
	function stage({ name, step }) {
		const root = node("div", "sg-progress");
		const label = node("span", "sg-progress-name", name),
			count = step ? node("span", "sg-progress-count", step) : null;
		return progress(root, { name: label, count });
	}
	function task({ context, interaction, actions, recipe = "flow" }) {
		if (!["flow", "decision", "summary"].includes(recipe))
			throw new TypeError("Unknown task recipe");
		const root = node("div", "workspace sg-task-layout");
		if (recipe !== "flow") root.dataset.scene = recipe;
		context.classList.add("intro");
		interaction.classList.add("content");
		root.append(context, interaction);
		if (actions) {
			if (recipe === "flow") interaction.append(actions);
			else {
				actions.classList.add("sg-scene-actions");
				root.append(actions);
			}
		}
		return root;
	}
	function frame({
		brand,
		gameName,
		round,
		phase,
		actions = [],
		width = "work",
		scroll = "flow",
		space = "flow",
	} = {}) {
		if (
			!["focus", "work", "split", "gallery"].includes(width) ||
			!["flow", "workspace"].includes(scroll) ||
			!["flow", "decision", "summary"].includes(space)
		)
			throw new TypeError("Unknown layout role");
		const bar = node("header", "sg-product-bar"),
			logo = brand || node("span", "brand", "SocialGameGym"),
			context = node("div", "game-context"),
			nav = node("nav", "sg-header-actions");
		logo.classList.add("brand");
		context.classList.add("sg-context-line");
		const pair = node("span", "sg-context-game");
		pair.append(node("span", "", gameName));
		if (round) pair.append(node("span", "round", round));
		context.append(pair);
		SGGI18n.bind(nav, "asset.reading", { attr: "aria-label" });
		nav.append(...actions);
		bar.append(logo, context, nav);
		const main = node("main", "sg-page");
		main.dataset.width = width;
		if (space !== "flow") main.dataset.space = "scene";
		const rail = phase ? stage(phase) : null;
		if (rail) context.append(rail);
		return {
			header: bar,
			progress: rail,
			main,
			scroll,
			mount(host) {
				host.dataset.sgShell = "";
				host.dataset.scroll = scroll;
				if (space !== "flow") host.dataset.taskScene = space;
				if (rail) host.dataset.contextProgress = "";
				host.append(bar, main);
				return main;
			},
		};
	}
	window.SGGLayout = Object.freeze({
		header,
		progress,
		toolbar,
		stage,
		task,
		frame,
		version: "q184-1",
	});
})();
