(() => {
	let sequence = 0;
	const boardOutline = (variant) =>
		variant === "b"
			? "M12 1 H86 Q93 1 97 7 L104 16 H288 Q299 16 299 28 V438 Q299 449 288 449 H12 Q1 449 1 438 V12 Q1 1 12 1 Z"
			: "M14 1 H286 Q299 1 299 14 V436 Q299 449 286 449 H14 Q1 449 1 436 V14 Q1 1 14 1 Z";
	function create({ theme, game, total, variant }) {
		const root = document.createElement("figure");
		root.className = "cover " + (variant === "b" ? "indexed" : "pocket");
		root.dataset.theme = theme.id;
		root.dataset.coverGame = game.id;
		root.setAttribute("role", "img");
		root.setAttribute("aria-label", theme.label + "收藏夹，" + total + "款游戏");
		root.style.setProperty("--ink", theme.colors.ink);
		root.style.setProperty("--paper", theme.colors.paper);
		root.style.setProperty(
			"--wash-rgb",
			theme.colors.wash
				.slice(1)
				.match(/../g)
				.map((n) => parseInt(n, 16))
				.join(","),
		);
		root.style.setProperty(
			"--art",
			'url("' + new URL("/SocialGameGym-Playtest/visual/q164-sleeve-wave/" + game.art, location.href).href + '")',
		);
		root.style.setProperty("--art-size", game.backgroundSize);
		root.style.setProperty("--art-position", game.backgroundPosition);
		const board = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		board.classList.add("backboard");
		board.setAttribute("viewBox", "0 0 300 450");
		board.setAttribute("preserveAspectRatio", "none");
		board.setAttribute("aria-hidden", "true");
		const boardClipId = "folder-board-" + ++sequence;
		board.innerHTML =
			'<defs><clipPath id="' +
			boardClipId +
			'"><path d="' +
			boardOutline(variant) +
			'"/></clipPath></defs><path d="' +
			boardOutline(variant) +
			'" fill="' +
			theme.colors.wash +
			'" stroke="' +
			theme.colors.ink +
			'" stroke-opacity=".13" stroke-width=".8"/><foreignObject width="300" height="450" clip-path="url(#' +
			boardClipId +
			')"><div xmlns="http://www.w3.org/1999/xhtml" class="folder-paper" data-sg-paper-print=""></div></foreignObject><path d="M9 25 V432 Q9 440 18 440 H284" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="1"/>';
		const art = document.createElement("div");
		art.className = "cover-art";
		const shadow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		shadow.classList.add("entry-shadow");
		shadow.setAttribute("viewBox", "0 0 300 450");
		shadow.setAttribute("aria-hidden", "true");
		shadow.innerHTML =
			'<path d="M3 263 297 321" stroke="' +
			theme.colors.ink +
			'" stroke-opacity=".16" stroke-width="3"/>';
		const clipId = "folder-front-" + ++sequence;
		const clip = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		clip.setAttribute("width", "0");
		clip.setAttribute("height", "0");
		clip.style.position = "absolute";
		clip.setAttribute("aria-hidden", "true");
		clip.innerHTML =
			'<defs><clipPath id="' +
			clipId +
			'" clipPathUnits="objectBoundingBox"><path d="M0 .59 L1 .72 V.97333 Q1 1 .96 1 H.04 Q0 1 0 .97333 Z"/></clipPath></defs>';
		const front = document.createElement("div");
		front.className = "paper-front";
		front.style.clipPath = "url(#" + clipId + ")";
		front.innerHTML =
			'<span class="paper-color"></span><span class="paper-grain" data-sg-paper-print=""></span><span class="paper-bend"></span><svg class="paper-edge" viewBox="0 0 300 450" preserveAspectRatio="none" aria-hidden="true"><path d="M0 265.5 300 324"/></svg>';
		const fold = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		fold.classList.add("fold-edge");
		fold.setAttribute("viewBox", "0 0 300 450");
		fold.setAttribute("aria-hidden", "true");
		fold.innerHTML =
			'<path d="M8 280 V432 Q8 441 18 441 H282" stroke="#ffffff" stroke-opacity=".48" stroke-width=".8"/><path d="M292 334 V434 Q292 442 284 442" stroke="' +
			theme.colors.ink +
			'" stroke-opacity=".09" stroke-width=".7"/>';
		const label = document.createElement("div");
		label.className = "identity";
		const text = document.createElement("span");
		text.className = "identity-text";
		const title = document.createElement("span");
		title.className = "theme";
		title.textContent = theme.label;
		const count = document.createElement("span");
		count.className = "count";
		count.textContent = total;
		text.append(title, count);
		label.append(text);
		root.append(clip, board, art, shadow, front, fold, label);
		return root;
	}
	window.SGGFolderCover = Object.freeze({ create });
	const params = new URLSearchParams(location.search),
		theme =
			CatalogStudy.themes.find((t) => t.id === params.get("theme")) ||
			CatalogStudy.themes.find((t) => t.id === "cooperation"),
		samples = SGGEntrySamples.get(theme.id),
		game = samples[samples.length === 3 ? 1 : 0],
		total = CatalogStudy.games.filter((g) => theme.id === "all" || g.category === theme.id).length;
	for (const node of document.querySelectorAll("[data-variant]"))
		node.append(create({ theme, game, total, variant: node.dataset.variant }));
})();
