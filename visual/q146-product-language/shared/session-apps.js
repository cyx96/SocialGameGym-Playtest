/* UI adapters reuse the established app surfaces only in the labelled local host. */
(() => {
	"use strict";
	const L = (key, values = {}) => ({ i18n: key, values });

	if (!window.SessionApp) return;
	const A = SessionApp,
		c = A.context,
		app = A.app,
		e = (tag, cls, text) => {
			const n = document.createElement(tag);
			if (cls) n.className = cls;
			if (text?.i18n) SGGI18n.bind(n, text.i18n, { values: text.values });
			else if (text !== undefined) n.textContent = text;
			return n;
		};
	for (const [k, v] of Object.entries(c.colors || {}))
		document.documentElement.style.setProperty("--" + k, v);
	function back(button) {
		if (button) SGGI18n.bind(button, "asset.backDesktop", { attr: "aria-label" });
		button?.classList.add("sg-root-back");
		button?.addEventListener(
			"click",
			(event) => {
				event.preventDefault();
				event.stopImmediatePropagation();
				A.close();
			},
			true,
		);
	}
	function readonly() {
		if (!A.readonly) return;
		for (const input of document.querySelectorAll("input,textarea,select")) input.disabled = true;
		const title = document.querySelector(
			"#app-title,.forum-toolbar h1,.dm-toolbar h1,.app-toolbar h1,.sg-game-toolbar h2",
		);
		if (title) {
			const badge = e("span", "readonly-indicator");
			badge.setAttribute("role", "img");
			if (badge) SGGI18n.bind(badge, "asset.readOnly", { attr: "aria-label" });
			if (badge) SGGI18n.bind(badge, "asset.readOnly", { attr: "title" });
			badge.append(SGGIcons.create("eye"));
			title.append(badge);
		}
	}
	if (app === "profile") {
		back(document.querySelector(".app-close"));
		const draftKey = A.scope + ":profile-draft";
		const own = c.people.find((p) => p.id === c.viewer),
			saved = c.profiles[c.viewer] || {},
			name = document.querySelector("#name"),
			bio = document.querySelector("#bio"),
			save = document.querySelector(".save");
		name.value = saved.name || own.name;
		bio.value = saved.bio || "";
		let restored = null;
		try {
			const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
			if (draft) {
				restored = draft;
				name.value = draft.name;
				bio.value = draft.bio;
			}
		} catch {}
		const note = e("p", "local-status");
		note.setAttribute("role", "status");
		document.querySelector(".profile-fields").append(note);
		let avatar = restored?.avatar || saved.avatar || "default";
		document.querySelector(".avatar-row .avatar").innerHTML = SGGAvatar.html({
			preset: avatar,
			size: "detail",
		});
		const saveDraft = () => {
			try {
				localStorage.setItem(
					draftKey,
					JSON.stringify({ name: name.value, bio: bio.value, avatar }),
				);
				return true;
			} catch {
				SGGControls.showError(note, "草稿未能保留，请先保存后再离开。", "draft");
				return false;
			}
		};
		name.addEventListener("input", saveDraft);
		bio.addEventListener("input", saveDraft);
		save.onclick = async () => {
			save.disabled = true;
			try {
				await A.submit(save, "profile.save", { name: name.value, bio: bio.value, avatar });
				localStorage.removeItem(draftKey);
				A.close();
			} catch (error) {
				SGGControls.showError(note, error.message);
			} finally {
				save.disabled = false;
			}
		};
		const picker = e("dialog", "avatar-picker"),
			title = e("h2", "", L("asset.avatar")),
			grid = e("div", "avatar-preset-grid"),
			close = SGGButtons.create({
				role: "icon",
				ariaLabelKey: "asset.closeAvatar",
				icon: SGGIcons.create("close"),
			});
		picker.append(title, close, grid);
		document.body.append(picker);
		for (const [id, preset] of Object.entries(SGGAvatarRegistry)) {
			if (!preset.selectable) continue;
			const button = e("button", "avatar-option");
			button.type = "button";
			const refresh = () => button.setAttribute("aria-label", SGGI18n.systemCopy(preset.label));
			refresh();
			SGGI18n.observe(button, refresh);
			button.innerHTML = SGGAvatar.html({ preset: id, size: "row" });
			button.onclick = () => {
				avatar = id;
				saveDraft();
				const face = document.querySelector(".avatar-row .avatar");
				face.innerHTML = SGGAvatar.html({ preset: id, size: "detail" });
				picker.close();
			};
			grid.append(button);
		}
		close.onclick = () => picker.close();
		document.querySelector(".change").onclick = () => picker.showModal();
	}
	if (app === "forum") {
		back(document.querySelector(".forum-toolbar .back,.back"));
		// The composer has the same authorized author identity as delivered posts.
		for (const holder of document.querySelectorAll(".compose-copy .avatar,.newpost-byline .avatar"))
			holder.outerHTML = SGGIdentity.avatar(c.viewer, "message");
		const byline = document.querySelector(".newpost-byline>span:last-child");
		if (byline)
			byline.innerHTML = SGGInlinePerson.html(
				c.viewer,
				Object.fromEntries(c.people.map((p) => [p.id, { name: p.name }])),
				{ viewerId: c.viewer, selfMarker: true },
			);
		const note = e("p", "quota");
		SGGI18n.bind(note, "asset.quota", { values: { count: c.remaining } });
		document.querySelector(".newpost-footer").prepend(note);
	}
	if (app === "dm") {
		const count = document.querySelector(".compose-meta b");
		if (count) {
			const host = count.parentElement;
			const refreshQuota = () => (host.textContent = SGGProductLanguage.quota(A.context.remaining));
			refreshQuota();
			SGGI18n.observe(host, refreshQuota);
		}
		const createBudget = document.querySelector(".create-budget");
		if (createBudget) SGGI18n.bind(createBudget, "asset.quota", { values: { count: c.remaining } });
		if (A.readonly) {
			const composer = document.querySelector(".dm-compose");
			if (composer) composer.hidden = true;
			document.querySelector(".dm-empty button").hidden = true;
		}
	}
	if (app === "rating") {
		const listBack = document.querySelector("#back-list");
		listBack.addEventListener(
			"click",
			(event) => {
				if (!document.querySelector(".rating-app").classList.contains("mobile-detail")) {
					event.preventDefault();
					event.stopImmediatePropagation();
					A.close();
				}
			},
			true,
		);
	}
	if (app === "game") {
		const toolbar = e("nav", "sg-game-toolbar");
		if (toolbar) SGGI18n.bind(toolbar, "asset.gameApps", { attr: "aria-label" });
		const backButton = SGGButtons.create({
				role: "icon",
				ariaLabelKey: "asset.backDesktop",
				icon: SGGIcons.create("back"),
			}),
			title = e("h2", "", L("asset.game")),
			end = e("span", "toolbar-end"),
			records = SGGButtons.create({
				role: "icon",
				ariaLabelKey: "asset.records",
				icon: SGGIcons.create("records"),
			});
		backButton.classList.add("sg-game-back");
		if (c.returnTo === "questionnaire")
			if (backButton) SGGI18n.bind(backButton, "asset.backQuestionnaire", { attr: "aria-label" });
			else backButton.classList.add("sg-root-back");
		backButton.onclick = () => A.close();
		records.onclick = () => A.request("ui.records").catch(() => {});
		end.append(records);
		toolbar.append(backButton, title, end);
		SGGLayout.toolbar(toolbar);
		toolbar.classList.add("sg-shell-width");
		document.querySelector("#app").before(toolbar);
		const form = document.querySelector("#game-decision");
		form?.addEventListener(
			"submit",
			async (event) => {
				event.preventDefault();
				event.stopImmediatePropagation();
				if (A.readonly) return;
				const b =
					document.querySelector("button[form=game-decision]") ||
					form.querySelector("[type=submit]");
				b.disabled = true;
				try {
					await A.submit(b, "game.submit", GameUiPreview.readDraft());
				} catch (error) {
					let note = document.querySelector(".action-footer .inline-note");
					if (note) {
						SGGControls.showError(note, error.message);
						note.classList.add("visible");
					}
					b.disabled = false;
				}
			},
			true,
		);
	}
	if (app === "game" && c.waiting) {
		const heading = document.querySelector(".intro h1"),
			description = document.querySelector(".intro>p");
		if (heading) SGGI18n.bind(heading, "asset.submitted");
		if (description) SGGI18n.bind(description, "asset.waitingOthers");
	}
	if (app === "game" && window.GameUiPreview?.screen === "result")
		document.querySelector(".action-footer")?.remove();
	readonly();
	document.documentElement.dataset.sessionReady = "true";
})();
