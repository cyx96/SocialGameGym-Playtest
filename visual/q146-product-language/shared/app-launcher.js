/* Shared launcher asset, derived from source/app-icons.json. */
(() => {
	const icons = {"profile": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect class=\"rear\" x=\"12\" y=\"16\" width=\"35\" height=\"42\" rx=\"7\"/><rect class=\"face\" x=\"18\" y=\"9\" width=\"34\" height=\"44\" rx=\"7\"/><circle class=\"paper\" cx=\"35\" cy=\"24\" r=\"6\"/><path class=\"paper\" d=\"M25 42v-2c0-8 20-8 20 0v2Z\"/><path class=\"fine\" d=\"M27 47h16\"/></svg>", "forum": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"rear\" d=\"M10 10h32a6 6 0 0 1 6 6v19H25L14 43v-8h-4a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z\"/><path class=\"face\" d=\"M24 23h29a6 6 0 0 1 6 6v20H45l-10 8v-8H24a6 6 0 0 1-6-6V29a6 6 0 0 1 6-6Z\"/><path class=\"fine\" d=\"M28 33h20M28 40h13\"/></svg>", "dm": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect class=\"rear\" x=\"7\" y=\"20\" width=\"50\" height=\"35\" rx=\"7\"/><rect class=\"paper\" x=\"18\" y=\"8\" width=\"29\" height=\"34\" rx=\"4\"/><path class=\"ink-line\" d=\"M24 17h17M24 23h12\"/><path class=\"face\" d=\"M7 24 29 39a5 5 0 0 0 6 0l22-15v24a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7Z\"/><path class=\"fine\" d=\"m10 50 14-11M54 50 40 39\"/></svg>", "rating": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"rear\" d=\"m34 10 7 14 16 2.4L45.5 38l2.7 16L34 46.5 19.8 54l2.7-16L11 26.4 27 24Z\"/><path class=\"face\" d=\"m30 6 7 14 16 2.4L41.5 34l2.7 16L30 42.5 15.8 50l2.7-16L7 22.4 23 20Z\"/><path class=\"fine\" d=\"m30 15 4.5 9 10 1.5\"/></svg>", "game": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect class=\"rear\" x=\"9\" y=\"14\" width=\"44\" height=\"43\" rx=\"9\"/><rect class=\"face\" x=\"15\" y=\"7\" width=\"42\" height=\"43\" rx=\"9\"/><path class=\"fine\" d=\"M25 20h22M25 37h22M25 20v17M47 20v17\"/><circle class=\"paper\" cx=\"28\" cy=\"24\" r=\"4\"/><circle class=\"paper\" cx=\"43\" cy=\"34\" r=\"4\"/></svg>", "questionnaire": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect class=\"rear\" x=\"11\" y=\"14\" width=\"37\" height=\"43\" rx=\"7\"/><rect class=\"face\" x=\"17\" y=\"7\" width=\"37\" height=\"43\" rx=\"7\"/><path class=\"fine\" d=\"m25 20 3 3 5-6M38 20h8m-21 11 3 3 5-6m5 3h8m-21 11h21\"/></svg>"};
	window.SGGAppLauncher = Object.freeze({
		version: "app-launcher@2",
		create({ id, label }) {
			if (!icons[id]) throw Error("Unknown app icon");
			const b = document.createElement("button");
			b.type = "button";
			b.className = "launch-tool";
			b.dataset.tool = id;
			b.dataset.asset = "app-launcher@2";
			const translated = () => SGGI18n.systemCopy(label);
			b.setAttribute("aria-label", SGGI18n.t("asset.openApp", { label: translated() }));
			const art = document.createElement("span");
			art.className = "launch-art";
			const tile = document.createElement("span");
			tile.className = "tool-tile";
			tile.innerHTML = icons[id];
			art.append(tile);
			const caption = document.createElement("span");
			caption.textContent = translated();
			SGGI18n.observe(b, () => {
				caption.textContent = translated();
				if (!b.dataset.mode)
					b.setAttribute("aria-label", SGGI18n.t("asset.openApp", { label: translated() }));
			});
			b.append(art, caption);
			return b;
		},
	});
})();
