/* Catalog navigation categories and per-game registered visual palettes. */
(() => {
	const folderOrder = Object.freeze([
		"all",
		"allocation",
		"market",
		"cooperation",
		"trust",
		"creation",
		"coordination",
		"information",
	]);
	const palettes = new Map(
		SGGThemes.ids.map((id) => [id, Object.freeze({ id, colors: SGGThemes.get(id) })]),
	);
	function resolve(game) {
		if (game.category === "all" || !folderOrder.includes(game.category))
			throw Error("Unknown catalog category: " + game.category + " (" + game.id + ")");
		const id = Object.hasOwn(game, "visualTheme") ? game.visualTheme : game.category;
		const palette = palettes.get(id);
		if (!palette) throw Error("Unknown catalog visual theme: " + id + " (" + game.id + ")");
		return palette;
	}
	function validate(catalog) {
		const folders = new Set(catalog.themes.map((theme) => theme.id));
		if (folders.size !== catalog.themes.length) throw Error("Duplicate catalog folder ID");
		if (folders.size !== folderOrder.length || folderOrder.some((id) => !folders.has(id)))
			throw Error("Catalog folders must match the rendered order");
		const games = new Set();
		for (const game of catalog.games) {
			if (typeof game.id !== "string" || !game.id.trim()) throw Error("Invalid catalog game ID");
			if (games.has(game.id)) throw Error("Duplicate catalog game ID: " + game.id);
			games.add(game.id);
			resolve(game);
		}
	}
	window.SGGCatalogGameThemes = Object.freeze({ folderOrder, validate, resolve });
})();
