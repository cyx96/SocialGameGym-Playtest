(() => {
	"use strict";
	const I = SGGI18n,
		gameName = (game) => I.t("catalog.game." + game.id + ".name"),
		gameDescription = (game) => I.t("catalog.game." + game.id + ".description");
	const focusOnly = document.body.dataset.focusOnly === "true",
		flipOnly = document.body.dataset.cardGesture === "flip";
	const profile = SGGCatalogMotion;
	const { animate } = Motion,
		stage = document.querySelector("#stage"),
		announce = document.querySelector("#announce"),
		back = document.querySelector("#back"),
		reduce = matchMedia("(prefers-reduced-motion: reduce)");
	const mod = (n, m) => ((n % m) + m) % m,
		clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
		mix = (a, b, p) => a + (b - a) * p,
		smooth = (v) => {
			v = clamp(v);
			return v * v * (3 - 2 * v);
		},
		ring = (i, p, n) => (n === 1 ? 0 : mod(i - p + n / 2, n) - n / 2);
	const order = [
		"all",
		"allocation",
		"market",
		"cooperation",
		"trust",
		"creation",
		"coordination",
		"information",
	];
	const themes = order
		.map((id) => {
			const theme = CatalogStudy.themes.find((t) => t.id === id);
			return theme
				? {
						...theme,
						get label() {
							return I.t("catalog.theme." + theme.id);
						},
						colors: SGGThemes.get(id) || theme.colors,
					}
				: null;
		})
		.filter(Boolean);
	const state = { theme: themes.findIndex((theme) => theme.id === "all"), nav: 0, boundary: 0 };
	Object.defineProperties(state, {
		open: { enumerable: true, get: () => clamp(state.nav) },
		flip: { enumerable: true, get: () => clamp(state.nav - 1) },
	});
	const plane = document.createElement("div");
	plane.id = "track-plane";
	stage.append(plane);
	const targets = { theme: state.theme, nav: 0, boundary: 0 };
	const running = new Map(),
		generations = new Map();
	let size = { w: 0, h: 0, folder: 1, poster: 1 },
		down = null,
		tapTarget = null,
		raf = 0,
		clickBlocked = false,
		wheelTimer = 0,
		wheelAxis = null,
		wheelSum = 0;
	function addText(target, text) {
		target.replaceChildren();
		if (!/\p{Script=Han}/u.test(text)) {
			target.textContent = text;
			return;
		}
		const chars = Array.from(text),
			tail = Math.min(6, Math.max(3, Math.floor(chars.length / 3)));
		target.append(document.createTextNode(chars.slice(0, -tail).join("")));
		const span = document.createElement("span");
		span.className = "phrase-tail";
		span.textContent = chars.slice(-tail).join("");
		target.append(span);
	}
	function paintArt(node, g) {
		node.style.setProperty(
			"--art",
			'url("' + new URL("/SocialGameGym-Playtest/visual/q164-sleeve-wave/" + g.art, location.href).href + '")',
		);
		node.style.setProperty("--art-size", g.backgroundSize);
		node.style.setProperty("--art-position", g.backgroundPosition);
	}
	const assemblies = themes.map((theme, index) => {
		const games = CatalogStudy.games.filter((g) => theme.id === "all" || g.category === theme.id),
			samples = SGGEntrySamples.get(theme.id);
		const selected = samples[samples.length === 3 ? 1 : 0];
		const initial = games.indexOf(selected);
		const source = SGGFolderCover.create({
			theme,
			game: selected,
			total: games.length,
			variant: "b",
		});
		const root = document.createElement("div");
		root.className = "assembly";
		root.dataset.theme = theme.id;
		root.dataset.index = index;
		root.style.cssText = source.style.cssText;
		const board = document.createElement("div");
		board.className = "board-layer";
		board.append(source.querySelector(".backboard"));
		const front = document.createElement("div");
		front.className = "front-layer";
		for (const n of [...source.children]) if (!n.classList.contains("cover-art")) front.append(n);
		root.append(board, front);
		plane.append(root);
		const cards = games.map((game, gi) => {
			const wrap = document.createElement("div");
			wrap.className = "card-wrap";
			wrap.dataset.game = game.id;
			wrap.tabIndex = -1;
			wrap.setAttribute("role", "group");
			wrap.setAttribute("aria-label", I.t("catalog.cardHint", { name: gameName(game) }));
			paintArt(wrap, game);
			const gameTheme = themes.find((t) => t.id === game.category);
			wrap.style.setProperty("--ink", gameTheme.colors.ink);
			wrap.style.setProperty("--paper", gameTheme.colors.paper);
			const turn = document.createElement("div");
			turn.className = "card-turn";
			const face = document.createElement("div");
			face.className = "card-face card-front";
			const art = document.createElement("div");
			art.className = "art";
			const wash = document.createElement("div");
			wash.className = "wash";
			const copy = document.createElement("div");
			copy.className = "card-copy";
			const title = document.createElement("h1");
			title.textContent = gameName(game);
			const desc = document.createElement("p");
			addText(desc, gameDescription(game));
			copy.append(title, desc);
			const flip = document.createElement("button");
			flip.type = "button";
			flip.className = "sg-button flip-button";
			flip.dataset.sgButton = "";
			flip.dataset.sgRole = "icon";
			I.bind(flip, "catalog.flip", { attr: "aria-label" });
			flip.append(SGGIcons.create("flip"));
			flip.onclick = (e) => {
				e.stopPropagation();
				if (!clickBlocked) flipCard();
			};
			const reading = document.createElement("div");
			reading.className = "card-reading";
			reading.append(wash, copy);
			face.append(art, reading);
			if (!flipOnly) face.append(flip);
			const reverse = document.createElement("div");
			reverse.className = "card-face card-back";
			const settingsContent = document.createElement("div");
			settingsContent.className = "settings-content";
			reverse.append(settingsContent);
			turn.append(face, reverse);
			wrap.append(turn);
			root.append(wrap);
			return {
				game,
				wrap,
				turn,
				copy,
				desc,
				flip,
				face,
				reverse,
				settingsContent,
				gi,
				wash,
				configurationMounted: false,
			};
		});
		if (games.length === 2)
			for (const c of cards) {
				const ghost = document.createElement("div");
				ghost.className = "card-wrap ghost";
				ghost.inert = true;
				ghost.setAttribute("aria-hidden", "true");
				paintArt(ghost, c.game);
				const f = c.face.cloneNode(true);
				f.querySelector(".flip-button")?.remove();
				ghost.append(f);
				root.append(ghost);
				c.ghost = ghost;
			}
		return {
			theme,
			index,
			games,
			samples,
			root,
			board,
			front,
			identity: front.querySelector(".identity"),
			cards,
			pos: initial,
			initial,
		};
	});
	const consumedConfig = new Set();
	function mountConfiguration(c) {
		let initial;
		const query = new URLSearchParams(location.search);
		if (query.get("game") === c.game.id && !consumedConfig.has(c.game.id)) {
			try {
				initial = JSON.parse(query.get("previewConfig") || "null");
			} catch {}
			consumedConfig.add(c.game.id);
		}
		c.settingsContent.replaceChildren(
			SGGGameConfiguration.mount({
				gameId: c.game.id,
				gameName: gameName(c.game),
				initial,
				onClose: (event) => {
					event.stopPropagation();
					setInputMode(event.detail === 0 ? "instant" : "gesture");
					command(1, event.detail === 0);
					stage.focus({ preventScroll: true });
				},
				onDraftSaved: () => {
					const url = new URL(location.href);
					if (url.searchParams.get("game") === c.game.id && url.searchParams.has("previewConfig")) {
						url.searchParams.delete("previewConfig");
						history.replaceState(null, "", url.href);
					}
				},
				onContinue: (config) => window.SGGCreateParticipation(c.game.id, config, c.settingsContent),
			}),
		);
		c.configurationMounted = true;
	}
	const selected = () => assemblies[mod(Math.round(state.theme), assemblies.length)];
	function setThemeColors() {
		const a = selected();
		if (
			searchNavigation ||
			down ||
			wheelAxis ||
			running.has("theme") ||
			running.has("games") ||
			running.has("nav") ||
			Math.abs(state.theme - Math.round(state.theme)) > 0.002 ||
			Math.abs(a.pos - Math.round(a.pos)) > 0.002 ||
			Math.abs(state.nav - targets.nav) > 0.002
		)
			return;
		const theme =
			targets.nav > 0.5
				? themes.find((t) => t.id === a.games[mod(Math.round(a.pos), a.games.length)].category)
				: a.theme;
		document.documentElement.dataset.sgTheme = theme.id;
		for (const [k, v] of Object.entries({
			ink: theme.colors.ink,
			wash: theme.colors.wash,
			canvas: theme.colors.canvas || theme.colors.paper,
		}))
			document.documentElement.style.setProperty("--" + k, v);
		announce.textContent = I.t("catalog.announcement", {
			theme: a.theme.label,
			game: gameName(a.games[mod(Math.round(a.pos), a.games.length)]),
		});
	}
	function measure() {
		size.w = stage.clientWidth;
		size.h = stage.clientHeight;
		const edge = profile.edge(size.h),
			safe = Math.max(160, size.h - 2 * edge - 20);
		size.folder =
			(size.w >= 640 && size.h < 440
				? Math.min(160, size.w - 80, (size.h - 40) / 1.5)
				: Math.min(292, size.w - 144, safe / 1.8)) / 300;
		size.poster = Math.min(300, size.w - 64, safe / 1.5) / 300;
		const inv = 1 / size.poster,
			shortWide = size.w >= 640 && size.h < 440;
		stage.classList.toggle("compact-wide", shortWide);
		size.backWidth = Math.min(480, size.w - 40) * inv;
		size.backHeight = Math.min(640, size.h - 32) * inv;
		size.frontWidth = shortWide ? Math.min(460, size.w - 120) * inv : 300;
		for (const a of assemblies) {
			a.root.style.setProperty("--card-inverse", inv);
			a.root.style.setProperty("--folder-title", Math.max(34, 24 / size.folder) + "px");
			a.root.style.setProperty("--folder-label-inset", Math.max(24, 20 / size.folder) + "px");
			a.root.style.setProperty("--folder-label-bottom", Math.max(30, 20 / size.folder) + "px");
			a.root.style.setProperty("--folder-label-gap", Math.max(12, 12 / size.folder) + "px");
			a.root.style.setProperty("--folder-count", Math.max(16, 16 / size.folder) + "px");
			a.root.style.setProperty("--poster-title", size.poster * 300 < 260 ? "26px" : "29px");
			a.root.style.setProperty("--poster-description", size.poster * 300 < 260 ? "14px" : "15px");
			a.root.style.setProperty("--settings-width", Math.min(480, size.w - 40) * inv + "px");
			a.root.style.setProperty("--settings-height", Math.min(640, size.h - 32) * inv + "px");
			a.root.style.setProperty("--wide-card-width", Math.min(460, size.w - 120) * inv + "px");
		}
		schedule();
	}
	function schedule() {
		if (!raf)
			raf = requestAnimationFrame(() => {
				raf = 0;
				render();
			});
	}
	function render() {
		const owner = selected(),
			p = clamp(state.open);
		stage.dataset.view =
			p > 0.998 ? (state.flip > 0.99 ? "back" : "cards") : p < 0.002 ? "folders" : "transition";
		stage.dataset.open = state.open.toFixed(4);
		stage.dataset.flip = state.flip.toFixed(4);
		stage.dataset.theme = owner.theme.id;
		stage.dataset.game = owner.games[mod(Math.round(owner.pos), owner.games.length)].id;
		stage.dataset.motion = running.size || down || wheelAxis ? "active" : "idle";
		// Settings belong to the reversed card. Keep outer navigation out of its
		// canvas throughout opening/closing, including interrupted flips.
		back.hidden =
			navigationIntent() > 1 || state.flip > 0.01 || (navigationIntent() === 0 && p < 0.01);
		back.setAttribute("aria-label", I.t("catalog.backThemes"));
		for (const a of assemblies) {
			const d = ring(a.index, state.theme, assemblies.length),
				abs = Math.abs(d),
				active = a === owner,
				scale = profile.scale(d) * mix(size.folder, size.poster, p),
				themeY = profile.position(d) * size.folder,
				themeOpacity = active ? 1 : 1 - smooth(p / 0.6),
				visible = abs < 2.2 && themeOpacity > 0.001;
			a.root.style.visibility = visible ? "visible" : "hidden";
			a.root.style.display = visible ? "" : "none";
			a.root.inert = !visible;
			if (!visible) continue;
			a.root.style.opacity = String(
				themeOpacity * profile.depth(d) * (1 - smooth((abs - 1.5) / 0.7)),
			);
			a.root.style.zIndex = String(100 - Math.round(abs * 20));
			a.root.style.transform = `translate(-50%,-50%) translate3d(${mix(-34, 0, p) + state.boundary}px,${themeY * (1 - p)}px,0) scale(${scale})`;
			const fp = active ? p : 0,
				reveal = active ? profile.reveal(d) : 0;
			// One spatial focus envelope owns the fan, its reading and the poster.
			// At the ownership midpoint both neighbours have zero reading opacity.
			if (focusOnly) a.identity.style.opacity = String(reveal);
			a.board.style.transform = `translateX(${-fp * 95}px) scale(${1 - 0.06 * fp})`;
			a.board.style.opacity = String(1 - smooth(fp / 0.78));
			a.front.style.transform = `perspective(1200px) translateX(${-fp * 150}px) rotateY(${-12 * reveal - 38 * fp}deg)`;
			a.front.style.opacity = String(1 - smooth(fp / 0.7));
			const current = mod(Math.round(a.pos), a.games.length),
				main = a.games[current],
				preview = [main, ...a.samples.filter((g) => g.id !== main.id)].slice(0, 3);
			for (const c of a.cards) {
				const gd = ring(c.gi, a.pos, a.games.length),
					ga = Math.abs(gd),
					rank = preview.indexOf(c.game),
					shown = rank >= 0;
				const px = shown ? [24, 70, 112][rank] * reveal : 0,
					py = shown ? [-12, -42, -78][rank] * reveal : 0,
					ps = shown ? [0.84, 0.8, 0.76][rank] : 0.76,
					pr = shown ? [2, 9, 16][rank] * reveal : 0;
				const oy = profile.position(gd),
					os = profile.scale(gd),
					openOpacity = 1 - smooth((ga - 1.22) / 0.27),
					closedOpacity = shown ? (rank === 0 ? 1 : reveal) : 0,
					opacity = mix(closedOpacity, openOpacity, fp);
				const gameMain = c.gi === current;
				c.wrap.style.transform = `translate(-50%,-50%) translate3d(${px * (1 - fp)}px,${mix(py, oy, fp)}px,0) scale(${mix(ps, os, fp)}) rotate(${pr * (1 - fp)}deg)`;
				c.wrap.style.zIndex = String(
					Math.round(mix(30 - (rank < 0 ? 5 : rank), 60 - ga * 20, smooth(fp))),
				);
				c.wrap.style.opacity = String(
					opacity * mix(1, profile.depth(gd), fp) * (gameMain ? 1 : 1 - 0.85 * smooth(state.flip)),
				);
				c.wrap.style.visibility = opacity > 0.001 ? "visible" : "hidden";
				c.wrap.dataset.current = String(active && gameMain);
				c.wrap.style.pointerEvents = active && gameMain ? "auto" : "none";
				c.wrap.tabIndex = active && gameMain ? 0 : -1;
				const f = active && gameMain ? state.flip * fp : 0;
				if (f > 0.5 && !c.configurationMounted) mountConfiguration(c);
				if (f < 0.01) c.configurationMounted = false;
				c.turn.style.transform = `rotateY(${f * 180}deg)`;
				const expansion = smooth((f - 0.48) / 0.52);
				c.reverse.style.transform = `translate(-50%,-50%) rotateY(180deg) scale(${mix(size.frontWidth / size.backWidth, 1, expansion)},${mix(450 / size.backHeight, 1, expansion)})`;
				c.settingsContent.style.opacity = String(smooth((f - 0.55) / 0.3));
				const readingFocus = focusOnly ? reveal * profile.reveal(gd) : 1;
				c.copy.style.opacity = String(smooth((fp - 0.4) / 0.5) * readingFocus);
				c.wash.style.opacity = String(smooth((fp - 0.35) / 0.5) * readingFocus);
				c.desc.style.visibility = gameMain ? "visible" : "hidden";
				c.flip.style.opacity = String(smooth((fp - 0.75) / 0.25) * readingFocus);
				c.flip.tabIndex = active && gameMain && fp > 0.99 && f < 0.5 ? 0 : -1;
				c.face.inert = f >= 0.5;
				c.reverse.inert = f < 0.5;
				if (c.ghost) {
					const alt = gd + (gd <= 0 ? 2 : -2),
						aa = Math.abs(alt),
						ay = profile.position(alt),
						as = profile.scale(alt),
						ao = fp * profile.depth(alt) * (1 - smooth((aa - 1.22) / 0.27));
					c.ghost.style.transform = `translate(-50%,-50%) translate3d(0,${ay}px,0) scale(${as})`;
					c.ghost.style.zIndex = String(60 - Math.round(aa * 20));
					c.ghost.style.opacity = String(ao);
					c.ghost.style.visibility = ao > 0.001 ? "visible" : "hidden";
					c.ghost.style.pointerEvents = "none";
					c.ghost.querySelector(".card-copy").style.opacity = focusOnly
						? "0"
						: String(smooth((fp - 0.4) / 0.5));
					if (focusOnly) c.ghost.querySelector(".wash").style.opacity = "0";
					c.ghost.querySelector(".card-copy p").style.visibility = "hidden";
				}
			}
		}
	}
	// The scene has one depth value: collection 0 → poster 1 → settings 2.
	// Browse position remains independent, so changing axis cannot strand a half-open scene.
	const gameTargets = new Map(assemblies.map((a) => [a, a.pos]));
	const samples = new Map();
	let wheelSnapshot = null,
		wheelSuppressedUntil = 0,
		searchNavigation = null;
	function setInputMode(mode) {
		stage.dataset.captionInput = mode;
		document.documentElement.dataset.catalogInput = mode;
	}
	function record(key, value) {
		const now = performance.now(),
			last = samples.get(key);
		samples.set(key, {
			value,
			time: now,
			velocity: last && now - last.time > 0 ? ((value - last.value) * 1000) / (now - last.time) : 0,
		});
	}
	function currentVelocity(key) {
		const sample = samples.get(key);
		return sample && performance.now() - sample.time < 80 ? sample.velocity : 0;
	}
	function stop(key) {
		generations.set(key, (generations.get(key) || 0) + 1);
		running.get(key)?.stop();
		running.delete(key);
	}
	function spring(
		key,
		value,
		{ instant = false, velocity = currentVelocity(key), complete = () => {} } = {},
	) {
		stop(key);
		const generation = generations.get(key);
		targets[key] = value;
		if (instant || reduce.matches || Math.abs(state[key] - value) < 0.00001) {
			state[key] = value;
			samples.delete(key);
			setThemeColors();
			render();
			complete();
			return;
		}
		record(key, state[key]);
		const anim = animate(state[key], value, {
			...profile.spring,
			velocity,
			onUpdate: (v) => {
				if (generations.get(key) !== generation) return;
				record(key, v);
				state[key] = v;
				schedule();
			},
			onComplete: () => {
				if (generations.get(key) !== generation) return;
				state[key] = value;
				running.delete(key);
				samples.delete(key);
				setThemeColors();
				render();
				complete();
			},
		});
		running.set(key, anim);
	}
	function moveGames(
		a,
		to,
		{ instant = false, velocity = currentVelocity("games"), complete = () => {} } = {},
	) {
		const key = "games";
		stop(key);
		const generation = generations.get(key),
			target = Math.round(to);
		gameTargets.set(a, target);
		if (instant || reduce.matches || Math.abs(a.pos - target) < 0.00001) {
			a.pos = target;
			samples.delete(key);
			setThemeColors();
			render();
			complete();
			return;
		}
		record(key, a.pos);
		const anim = animate(a.pos, target, {
			...profile.spring,
			velocity,
			onUpdate: (v) => {
				if (generations.get(key) !== generation) return;
				record(key, v);
				a.pos = v;
				schedule();
			},
			onComplete: () => {
				if (generations.get(key) !== generation) return;
				a.pos = target;
				running.delete(key);
				samples.delete(key);
				setThemeColors();
				render();
				complete();
			},
		});
		running.set(key, anim);
	}
	function navigationLevel() {
		return clamp(state.nav, 0, 2);
	}
	function navigationIntent() {
		return wheelAxis === "x" || down?.axis === "x" ? Math.round(navigationLevel()) : targets.nav;
	}
	function clearWheel(suppress = false) {
		if (suppress && wheelAxis) wheelSuppressedUntil = performance.now() + 180;
		clearTimeout(wheelTimer);
		wheelAxis = null;
		wheelSnapshot = null;
	}
	function snapshot() {
		const a = selected();
		return {
			nav: navigationLevel(),
			intent: navigationIntent(),
			theme: state.theme,
			themeTarget: targets.theme,
			a,
			pos: a.pos,
			gameTarget: gameTargets.get(a) ?? Math.round(a.pos),
			mode: navigationIntent(),
		};
	}
	function freeze() {
		searchNavigation = null;
		const g = snapshot();
		clearWheel();
		for (const key of ["nav", "theme", "games", "boundary"]) stop(key);
		return g;
	}
	function settleBrowse(g, { instant = false, original = false } = {}) {
		spring("theme", original ? g.themeTarget : Math.round(g.theme), {
			instant,
			...(!original ? { velocity: 0 } : {}),
		});
		moveGames(g.a, original ? g.gameTarget : Math.round(g.pos), {
			instant,
			...(!original ? { velocity: 0 } : {}),
		});
	}
	function resume(g, { instant = false } = {}) {
		settleBrowse(g, { instant, original: true });
		spring("nav", g.intent, { instant });
		spring("boundary", 0, { instant });
	}
	function dropPointer() {
		if (!down) return;
		const id = down.id;
		down = null;
		tapTarget = null;
		stage.classList.remove("dragging");
		if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
	}
	function command(level, instant = false) {
		searchNavigation = null;
		const g = snapshot();
		dropPointer();
		clearWheel(true);
		settleBrowse(g, { instant });
		spring("boundary", 0, { instant });
		spring("nav", clamp(level, 0, 2), { instant });
		setThemeColors();
	}
	function openFolder(instant = false) {
		command(1, instant);
	}
	function closeFolder(instant = false) {
		command(0, instant);
	}
	function flipCard(instant = false) {
		command(navigationIntent() > 1 ? 1 : 2, instant);
	}
	function previousLevel(instant = false) {
		command(Math.max(0, navigationIntent() - 1), instant);
	}
	function nextLevel(instant = false) {
		command(Math.min(2, navigationIntent() + 1), instant);
	}
	function navigationRange(base) {
		const level = Math.round(base);
		return [Math.max(0, level - 1), Math.min(2, level + 1)];
	}
	function dragNavigation(base, delta) {
		const [min, max] = navigationRange(base),
			raw = base + delta,
			next = clamp(raw, min, max);
		state.nav = next;
		state.boundary =
			raw < min || raw > max
				? -Math.sign(raw - next) * 16 * (1 - Math.exp((-Math.abs(raw - next) * 220) / 75))
				: 0;
		schedule();
	}
	function finishNavigation(g, velocity = 0, cancel = false) {
		const [min, max] = navigationRange(g.nav);
		let target = Math.round(navigationLevel());
		if (cancel) target = g.intent;
		else if (Math.abs(velocity) > 0.25)
			target = velocity > 0 ? Math.floor(g.nav + 0.00001) + 1 : Math.ceil(g.nav - 0.00001) - 1;
		spring("boundary", 0);
		spring("nav", clamp(target, min, max), {
			velocity: (velocity * 1000) / Math.min(240, size.w * 0.6),
		});
	}
	function startAxis(g, axis) {
		g.axis = axis;
		g.moved = true;
		clickBlocked = true;
		if (axis === "x") {
			settleBrowse(g);
			return;
		}
		// Settings keep their native vertical scroll. A swipe during the flip lets it finish.
		spring("nav", g.intent);
		spring("boundary", 0);
		if (g.mode > 1) {
			settleBrowse(g);
			return;
		}
		if (g.mode === 1) spring("theme", Math.round(g.theme));
		else moveGames(g.a, g.gameTarget);
	}
	stage.addEventListener("pointerdown", (e) => {
		tapTarget = null;
		if (
			down ||
			!e.isPrimary ||
			e.button !== 0 ||
			e.target.closest("input,label,summary,button,select,textarea,[contenteditable]")
		)
			return;
		if (e.clientX < 18 || e.clientX > innerWidth - 18) return;
		const g = freeze();
		down = {
			...g,
			target: e.target,
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			last: e.clientX,
			lastY: e.clientY,
			lastT: performance.now(),
			vx: 0,
			vy: 0,
			axis: null,
			moved: false,
		};
		stage.setPointerCapture(e.pointerId);
		clickBlocked = false;
		stage.classList.add("dragging");
		setInputMode("gesture");
		schedule();
	});
	stage.addEventListener("pointermove", (e) => {
		if (!down || down.id !== e.pointerId) return;
		const g = down,
			dx = e.clientX - g.x,
			dy = e.clientY - g.y,
			now = performance.now(),
			dt = Math.max(8, now - g.lastT);
		g.vx = 0.6 * g.vx + (0.4 * (e.clientX - g.last)) / dt;
		g.vy = 0.6 * g.vy + (0.4 * (e.clientY - g.lastY)) / dt;
		g.last = e.clientX;
		g.lastY = e.clientY;
		g.lastT = now;
		if (!g.axis) {
			if (Math.hypot(dx, dy) < 8) return;
			if (Math.abs(dx) > Math.abs(dy) * 1.15) startAxis(g, "x");
			else if (Math.abs(dy) > Math.abs(dx) * 1.15) startAxis(g, "y");
			else return;
		}
		if (g.axis === "x") {
			dragNavigation(g.nav, -dx / Math.min(240, size.w * 0.6));
			return;
		}
		if (g.mode > 1) return;
		const step = profile.step * (g.mode === 1 ? size.poster : size.folder);
		if (g.mode === 1) g.a.pos = g.pos - dy / step;
		else state.theme = g.theme - dy / step;
		schedule();
	});
	function release(e, cancel = false) {
		if (!down || e.pointerId !== down.id) return;
		const g = down;
		tapTarget = !g.moved && !cancel ? g.target : null;
		down = null;
		stage.classList.remove("dragging");
		const fresh = performance.now() - g.lastT < 80,
			vx = fresh ? g.vx : 0,
			vy = fresh ? g.vy : 0;
		if (g.axis === "x") finishNavigation(g, -vx, cancel);
		else if (g.axis === "y" && g.mode < 2) {
			const step = profile.step * (g.mode === 1 ? size.poster : size.folder),
				velocity = cancel ? 0 : (-vy * 1000) / step;
			if (g.mode === 1) moveGames(g.a, cancel ? g.pos : g.a.pos - (vy * 180) / step, { velocity });
			else
				spring("theme", Math.round(cancel ? g.theme : state.theme - (vy * 180) / step), {
					velocity,
				});
		} else resume(g);
		if (g.moved) clickBlocked = true;
		setThemeColors();
		schedule();
	}
	stage.addEventListener("pointerup", (e) => release(e));
	stage.addEventListener("pointercancel", (e) => release(e, true));
	stage.addEventListener("lostpointercapture", (e) => {
		if (down) release(e, true);
	});
	stage.addEventListener("click", (e) => {
		const hit = tapTarget || e.target;
		tapTarget = null;
		if (
			clickBlocked ||
			hit.closest("input,label,summary,button,select,textarea,[contenteditable]") ||
			e.detail === 0
		)
			return;
		const item = hit.closest(".assembly");
		if (!item) return;
		if (navigationIntent() === 0) {
			const index = Number(item.dataset.index);
			if (index !== mod(Math.round(state.theme), themes.length)) {
				spring(
					"theme",
					Math.round(state.theme) + ring(index, Math.round(state.theme), themes.length),
				);
				return;
			}
			openFolder();
		} else if (navigationIntent() === 1 && hit.closest(".card-front")) nextLevel();
	});
	function finishWheel() {
		const g = wheelSnapshot,
			axis = wheelAxis;
		clearWheel();
		if (!g) return;
		if (axis === "x") finishNavigation(g);
		else if (g.mode === 1) moveGames(g.a, Math.round(g.a.pos));
		else spring("theme", Math.round(state.theme));
		setThemeColors();
		schedule();
	}
	stage.addEventListener(
		"wheel",
		(e) => {
			if (
				e.ctrlKey ||
				e.target.closest("input,select,textarea,[contenteditable]") ||
				(e.target.closest(".card-back") && Math.abs(e.deltaY) >= Math.abs(e.deltaX))
			)
				return;
			const axis = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 ? "x" : "y";
			if (axis === "y" && navigationIntent() === 2) return;
			e.preventDefault();
			if (down || performance.now() < wheelSuppressedUntil) return;
			setInputMode("gesture");
			if (!wheelAxis) {
				const g = freeze();
				wheelSnapshot = g;
				wheelAxis = axis;
				wheelSum = 0;
				startAxis(g, axis);
			}
			const g = wheelSnapshot;
			wheelSum +=
				(wheelAxis === "x" ? e.deltaX : e.deltaY) *
				(e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.h : 1);
			if (wheelAxis === "x") dragNavigation(g.nav, wheelSum / 220);
			else {
				const step = profile.step * (g.mode === 1 ? size.poster : size.folder);
				if (g.mode === 1) g.a.pos = g.pos + wheelSum / step;
				else state.theme = g.theme + wheelSum / step;
				schedule();
			}
			clearTimeout(wheelTimer);
			wheelTimer = setTimeout(finishWheel, 120);
		},
		{ passive: false },
	);
	stage.addEventListener("keydown", (e) => {
		setInputMode("instant");
		if (e.target.closest("input,label,summary,button,select,textarea,[contenteditable]")) return;
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " "].includes(e.key))
			e.preventDefault();
		if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") nextLevel(true);
		if (e.key === "ArrowLeft") previousLevel(true);
		if ((e.key === "ArrowUp" || e.key === "ArrowDown") && navigationIntent() < 2) {
			const g = snapshot(),
				delta = e.key === "ArrowDown" ? 1 : -1;
			dropPointer();
			clearWheel(true);
			for (const key of [...running.keys()]) stop(key);
			samples.clear();
			state.nav = targets.nav = g.intent;
			state.boundary = targets.boundary = 0;
			state.theme = targets.theme = Math.round(g.theme);
			for (const a of assemblies) {
				a.pos = Math.round(a.pos);
				gameTargets.set(a, a.pos);
			}
			if (g.intent === 1) {
				g.a.pos = Math.round(g.pos) + delta;
				gameTargets.set(g.a, g.a.pos);
			} else state.theme = targets.theme = Math.round(g.theme) + delta;
			setThemeColors();
			render();
		}
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !document.querySelector("#search-dialog").open) {
			setInputMode("instant");
			previousLevel(true);
			stage.focus();
		}
	});
	back.onclick = (e) => {
		setInputMode(e.detail === 0 ? "instant" : "gesture");
		previousLevel(e.detail === 0);
		stage.focus({ preventScroll: true });
	};
	const dialog = document.querySelector("#search-dialog"),
		searchButton = document.querySelector("#search"),
		query = document.querySelector("#query"),
		clearQuery = document.querySelector("#clear-query"),
		results = document.querySelector("#results");
	function showResults() {
		clearQuery.hidden = !query.value;
		results.replaceChildren();
		const hits = CatalogStudy.games.filter((g) =>
			(gameName(g) + " " + gameDescription(g) + " " + g.name + " " + g.desc)
				.toLocaleLowerCase(I.locale)
				.includes(query.value.trim().toLocaleLowerCase(I.locale)),
		);
		for (const g of hits) {
			const b = document.createElement("button");
			b.className = "result";
			b.dataset.sgPress = "";
			b.dataset.sgPaperBoundary = "contained";
			b.textContent = gameName(g);
			const small = document.createElement("small");
			small.textContent = themes.find((t) => t.id === g.category)?.label || "";
			b.append(small);
			b.onclick = (e) => {
				dialogReturn = stage;
				SGGReading.close(dialog, { instant: true });
				navigateToGame(g, { instant: e.detail === 0 });
				stage.focus({ preventScroll: true });
			};
			results.append(b);
		}
		if (!hits.length) {
			const p = document.createElement("p");
			p.textContent = I.t("catalog.noResults");
			results.append(p);
		}
	}
	// Search is a destination on the existing circular rails, not another scene transition.
	// Keep the current collection (including All) when it already contains the game.
	function navigateToGame(game, { instant = false } = {}) {
		const current = selected(),
			a = current.games.includes(game)
				? current
				: assemblies.find((a) => a.theme.id === game.category);
		if (!a) return;
		const route = {
			a,
			theme: state.theme + ring(a.index, state.theme, themes.length),
			pos: a.pos + ring(a.games.indexOf(game), a.pos, a.games.length),
		};
		searchNavigation = route;
		dropPointer();
		clearWheel(true);
		setInputMode(instant ? "instant" : "gesture");
		const next = (fn) => () => {
			if (searchNavigation === route) fn();
		};
		const finish = next(() => {
			searchNavigation = null;
			setThemeColors();
			render();
		});
		spring("boundary", 0, { instant });
		if (instant || reduce.matches) {
			for (const key of [...running.keys()]) stop(key);
			state.theme = targets.theme = route.theme;
			a.pos = route.pos;
			gameTargets.set(a, a.pos);
			state.nav = targets.nav = 1;
			state.boundary = targets.boundary = 0;
			samples.clear();
			finish();
			return;
		}
		const open = next(() => spring("nav", 1, { complete: finish }));
		if (a === current) {
			// Close settings first; then use exactly the same velocity-preserving card spring as a swipe.
			spring("nav", Math.min(1, navigationLevel()), {
				complete: next(() => moveGames(a, route.pos, { complete: open })),
			});
		} else {
			// Cross-collection search retraces the visible hierarchy before entering its destination.
			spring("nav", 0, {
				complete: next(() => {
					let remaining = 2;
					const arrived = next(() => {
						if (--remaining === 0) open();
					});
					spring("theme", route.theme, { complete: arrived });
					moveGames(a, route.pos, { complete: arrived });
				}),
			});
		}
	}
	let dialogReturn = searchButton;
	const closeSearch = dialog.querySelector("#close-search");
	clearQuery.onclick = () => {
		query.value = "";
		showResults();
		query.focus();
	};
	closeSearch.type = "button";
	closeSearch.onclick = () => SGGReading.close(dialog);
	searchButton.onclick = () => {
		freeze();
		dialogReturn = searchButton;
		showResults();
		SGGReading.open(dialog);
	};
	dialog.addEventListener("close", () => {
		if (dialogReturn === searchButton) resume(snapshot());
		dialogReturn.focus({ preventScroll: true });
	});
	dialog.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			SGGReading.close(dialog, { instant: true });
		}
	});
	query.oninput = showResults;
	query.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			results.querySelector(".result")?.click();
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			results.querySelector(".result")?.focus();
		}
	});
	function finishInteraction() {
		const route = searchNavigation;
		searchNavigation = null;
		if (route) {
			dropPointer();
			clearWheel(true);
			for (const key of [...running.keys()]) stop(key);
			state.theme = targets.theme = route.theme;
			route.a.pos = route.pos;
			gameTargets.set(route.a, route.pos);
			state.nav = targets.nav = 1;
			state.boundary = targets.boundary = 0;
			samples.clear();
			setThemeColors();
			render();
			return;
		}
		const level =
			down?.axis === "x" || wheelAxis === "x" ? Math.round(navigationLevel()) : navigationIntent();
		dropPointer();
		clearWheel(true);
		for (const key of [...running.keys()]) stop(key);
		state.nav = targets.nav = level;
		state.theme = targets.theme = Math.round(state.theme);
		const a = selected();
		a.pos = Math.round(a.pos);
		gameTargets.set(a, a.pos);
		state.boundary = targets.boundary = 0;
		setThemeColors();
		render();
	}
	SGGMotion.onSettle(() => {
		if (document.documentElement.dataset.sgMotionInput === "keyboard") setInputMode("instant");
		finishInteraction();
	});
	window.addEventListener("resize", () => {
		if (down || wheelAxis) finishInteraction();
		measure();
	});
	reduce.addEventListener("change", finishInteraction);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) finishInteraction();
	});

	function refreshCopy() {
		document.title = I.t("catalog.title") + " · SocialGameGym";
		for (const a of assemblies) {
			const label = a.identity.querySelector(".theme");
			if (label) label.textContent = a.theme.label;
			for (const c of a.cards) {
				c.copy.querySelector("h1").textContent = gameName(c.game);
				addText(c.desc, gameDescription(c.game));
				c.wrap.setAttribute("aria-label", I.t("catalog.cardHint", { name: gameName(c.game) }));
				if (c.ghost) {
					c.ghost.querySelector("h1").textContent = gameName(c.game);
					addText(c.ghost.querySelector(".card-copy p"), gameDescription(c.game));
				}
			}
		}
		if (dialog.open) showResults();
		setThemeColors();
		render();
	}
	I.subscribe(refreshCopy);
	I.bindAllAnnotated(document);
	const params = new URLSearchParams(location.search);
	if (params.get("game")) {
		const g = CatalogStudy.games.find((g) => g.id === params.get("game"));
		if (g) {
			state.theme = targets.theme = themes.findIndex((t) => t.id === g.category);
			const a = selected();
			a.pos = a.games.indexOf(g);
			gameTargets.set(a, a.pos);
		}
	}
	if (params.get("state") === "open") state.nav = targets.nav = 1;
	if (params.get("state") === "back") state.nav = targets.nav = 2;
	measure();
	setThemeColors();
	render();
	refreshCopy();
	window.SGG180 = Object.freeze({
		inspect: () => ({
			themeId: selected().theme.id,
			game: selected().games[mod(Math.round(selected().pos), selected().games.length)].id,
			position: selected().pos,
			...state,
			target: targets.nav,
			view: stage.dataset.view,
			running: running.size,
			wheel: wheelAxis,
			gesture: down?.axis || null,
			caption: {
				visible: profile.reveal(ring(selected().index, state.theme, themes.length)) > 0.001,
				theme: selected().theme.id,
			},
		}),
		open: openFolder,
		close: closeFolder,
		flip: flipCard,
	});
})();
