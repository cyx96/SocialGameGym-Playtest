/* Read-only visual projections. A missing record projection stays missing, never invented. */
(() => {
	const L = (key, values = {}) => ({ i18n: key, values });

	const B = window.SGGButtons,
		I = window.SGGIcons;
	if (!B || !I) return;
	const base = new URL("../", document.currentScript.src),
		file = location.pathname.split("/").pop(),
		isCatalog = file === "q64-game-config.html",
		isRating = file === "index.html" && location.pathname.includes("/rating/");
	const header = document.querySelector("body>header.app-header,body>header.product-header");
	if (!header) return;
	header.classList.add("sg-session-header");
	if (isRating) document.body.dataset.journeySurface = "rating";
	let reading = isCatalog
		? document.querySelector("#session-tools")
		: header.querySelector(".reading");
	if (!reading) {
		reading = document.createElement("nav");
		reading.className = "reading";
		if (reading) SGGI18n.bind(reading, "asset.reading", { attr: "aria-label" });
		header.append(reading);
	}
	if (!reading.children.length)
		for (const kind of ["rules", "records"]) {
			const b = B.create({
				role: "icon",
				ariaLabelKey: kind === "rules" ? "asset.rules" : "asset.records",
				icon: I.create(kind),
			});
			b.dataset.panel = kind;
			reading.append(b);
		}
	for (const [i, b] of [...reading.querySelectorAll("button")].entries()) {
		const kind = i === 0 ? "rules" : "records";
		b.dataset.journeyReading = kind;
		B.iconize(b, { name: kind, labelKey: kind === "rules" ? "asset.rules" : "asset.records" });
	}
	const e = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text?.i18n) SGGI18n.bind(n, text.i18n, { values: text.values });
		else if (text !== undefined) n.textContent = text;
		return n;
	};
	const dialog = e("dialog", "sg-reading"),
		head = e("header", "sg-reading-head"),
		title = e("h2", "", L("asset.rules")),
		body = e("div", "sg-reading-body"),
		close = B.create({ role: "icon", ariaLabelKey: "asset.closeReading", icon: I.create("close") });
	title.id = "journey-reading-title";
	dialog.setAttribute("aria-labelledby", title.id);
	B.iconize(close, { name: "close", labelKey: "asset.closeReading" });
	head.append(title, close);
	dialog.append(head, body);
	dialog.id = "journey-reading";
	document.body.append(dialog);
	SGGReading.enhance(dialog);
	for (const b of reading.querySelectorAll("button")) {
		b.setAttribute("aria-controls", dialog.id);
		b.setAttribute("aria-haspopup", "dialog");
	}
	let opener = null;
	const bundle = window.GAME_UI_PACKAGES,
		trust = bundle?.games.find((g) => g.id === "trust");
	const supplied = new URLSearchParams(location.search);
	let arrived = null;
	if (window.PreparationCatalog && supplied.has("previewConfig")) {
		const g = PreparationCatalog[supplied.get("game")];
		if (g) {
			try {
				const c = JSON.parse(supplied.get("previewConfig"));
				const rounds = Number(c.rounds);
				if (Number.isSafeInteger(rounds) && rounds > 0) {
					arrived = { ...g, brief: g.brief.replaceAll("{rounds}", String(rounds)) };
					const ctx = header.querySelector(".game-context");
					ctx.firstElementChild.textContent = g.gameName;
					SGGI18n.bind(ctx.querySelector(".round"), "asset.roundProgress", {
						values: { round: 1, rounds },
					});
					for (const [k, v] of Object.entries(g.colors))
						document.documentElement.style.setProperty("--" + k, v);
				}
			} catch {}
		}
	}
	function show(kind, button) {
		opener = button;
		body.replaceChildren();
		SGGI18n.bind(title, kind === "rules" ? "asset.rules" : "asset.records");
		dialog.dataset.content = kind;
		dialog.dataset.keyboard = String(button.matches(":focus-visible"));
		if (kind === "rules") {
			if (isCatalog) {
				const id = document.body.dataset.current || "trust",
					game = window.SessionSupportData?.games[id];
				for (const chapter of game?.chapters || [])
					for (const block of chapter.blocks) {
						let text = block.type === "schedule" ? block.unspecified : block.text;
						if (!text) continue;
						text = text
							.replaceAll("{rounds}", document.querySelector("#rounds")?.value || "5")
							.replaceAll("{players}", "2");
						body.append(e("p", "rules-brief", text));
					}
			} else
				body.append(
					e("p", "rules-brief", arrived?.brief || trust?.brief || L("asset.rulesUnavailable")),
				);
		} else {
			const knownEmpty = isCatalog || ["q82-profile.html", "q82-profile-edit.html"].includes(file);
			body.append(
				GameRecords.render({
					view: knownEmpty ? { groups: [] } : null,
					identities: trust?.identities || {},
					viewerId: "self",
					avatarBase: new URL("game/assets/avatars/", base).href,
				}),
			);
		}
		for (const b of reading.querySelectorAll("button"))
			b.setAttribute("aria-expanded", String(b === button));
		SGGReading.open(dialog, { instant: button.matches(":focus-visible") });
		close.focus({ preventScroll: true });
	}
	for (const b of [
		...reading.querySelectorAll("button"),
		...document.querySelectorAll("[data-open-rules]"),
	])
		b.addEventListener(
			"click",
			(event) => {
				event.preventDefault();
				event.stopImmediatePropagation();
				show(b.dataset.journeyReading || "rules", b);
			},
			true,
		);
	close.addEventListener("click", (event) =>
		SGGReading.close(dialog, { instant: event.detail === 0 }),
	);
	dialog.addEventListener("close", () => {
		for (const b of reading.querySelectorAll("button")) b.setAttribute("aria-expanded", "false");
		if (opener?.isConnected) opener.focus({ preventScroll: true });
	});
	dialog.addEventListener("click", (event) => {
		if (event.target !== dialog) return;
		const r = dialog.getBoundingClientRect();
		if (
			event.clientX < r.left ||
			event.clientX > r.right ||
			event.clientY < r.top ||
			event.clientY > r.bottom
		)
			SGGReading.close(dialog);
	});
	document.addEventListener(
		"keydown",
		(event) => {
			if (dialog.open && event.key === "Escape") {
				event.preventDefault();
				event.stopImmediatePropagation();
				SGGReading.close(dialog, { instant: true });
			}
		},
		true,
	);
	if (file === "q82-dm.html") {
		const creator = document.querySelector(".dm-create"),
			note = creator?.querySelector(".create-note"),
			field = document.querySelector("#first-message");
		if (note) {
			creator.querySelector(".create-body").append(note);
			note.hidden = true;
		}
		field?.addEventListener("focus", () => {
			if (note) note.hidden = false;
			field.scrollIntoView({ block: "nearest", behavior: "instant" });
		});
	}
	if (
		file === "q82-profile-edit.html" &&
		new URLSearchParams(location.search).get("entry") === "first"
	) {
		const name = document.querySelector("#name"),
			bio = document.querySelector("#bio"),
			initial = { name: name?.value, bio: bio?.value };
		document.querySelector(".app-close")?.addEventListener(
			"click",
			() => {
				if (name?.value === initial.name && bio?.value === initial.bio) {
					document.body.dataset.firstProfileConfirmed = "default";
					document.dispatchEvent(new CustomEvent("a6-preview-default-profile-confirmed"));
				}
			},
			true,
		);
	}
	const preview = new URLSearchParams(location.search);
	if (file === "q82-profile-edit.html" && preview.get("view") === "home")
		document.querySelector(".app-close")?.click();
	if (["rules", "records"].includes(preview.get("reading")))
		requestAnimationFrame(() =>
			reading.querySelector('[data-journey-reading="' + preview.get("reading") + '"]')?.click(),
		);
})();
