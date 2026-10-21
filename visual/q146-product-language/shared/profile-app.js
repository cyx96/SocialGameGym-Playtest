/* Reads authorized profile/activity projections; writes use only offered actions. */
(() => {
	"use strict";
	const L = (key, values = {}) => ({ i18n: key, values });

	const A = window.SessionApp;
	if (!A) {
		const note = document.createElement("p");
		SGGI18n.bind(note, "asset.profileEntry");
		note.setAttribute("role", "status");
		document.querySelector("main").replaceChildren(note);
		document.documentElement.dataset.sessionReady = "true";
		return;
	}
	const B = SGGButtons,
		I = SGGIcons,
		V = SGGAvatar,
		c = A.context,
		list = document.querySelector("#profile-list"),
		filter = document.querySelector("#profile-filter"),
		form = document.querySelector("#profile-edit"),
		toolbar = document.querySelector("#profile-toolbar"),
		name = document.querySelector("#profile-name"),
		bio = document.querySelector("#profile-bio"),
		status = document.querySelector("#profile-status"),
		dialog = document.querySelector("#profile-detail"),
		main = document.querySelector("main"),
		draftKey = ["q146.profile-draft", c.room, c.viewer, c.participation, c.window].join(":"),
		scrollKey = draftKey + ".scroll",
		editorKey = draftKey + ".editing";
	addEventListener("sgg:notice-update", () => {
		if (!editing) drawList();
	});
	let memoryDraft = null,
		editing = false,
		preset = "default",
		savedScroll = Number(sessionStorage.getItem(scrollKey) || 0),
		followedOnly = false,
		selected = null,
		activityGeneration = 0,
		activityCleanup = () => {},
		appVisible = true;
	const seenActivity = new Set();
	const initial = window.__SGG_INITIAL_PROFILE__ === true,
		peek = window.__SGG_PROFILE_PEEK__;
	for (const [k, v] of Object.entries(c.colors || {}))
		document.documentElement.style.setProperty("--" + k, v);
	const node = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text?.i18n) SGGI18n.bind(n, text.i18n, { values: text.values });
		else if (text !== undefined) n.textContent = text;
		return n;
	};
	const own = () =>
		A.context.profiles[c.viewer] || {
			name: c.people.find((p) => p.id === c.viewer)?.name || "",
			bio: "",
			avatar: "default",
		};
	const canEdit = () => (A.context.profileActions ? A.context.profileActions.edit : !A.readonly);
	function showError(n, message) {
		SGGControls.showError(n, message, "submit");
	}
	function rememberDraft() {
		if (window.__SGG_RETIRED__) return;
		memoryDraft = { name: name.value, bio: bio.value, avatar: preset };
		try {
			localStorage.setItem(draftKey, JSON.stringify(memoryDraft));
		} catch {
			status.dataset.errorSource = "draft";
			SGGControls.showError(status, "未能保留草稿，请保持当前页面打开。", "draft");
		}
	}
	function avatar(person, size = "row") {
		const p = A.context.profiles[person.id];
		return V.node({
			preset: p?.avatar || person.avatarPreset || "default",
			size,
			person: person.id,
		});
	}
	function bar() {
		toolbar.replaceChildren();
		const back = B.create({
				role: "icon",
				ariaLabelKey: editing && !initial ? "asset.backProfile" : "asset.backDesktop",
				icon: I.create("back"),
			}),
			title = node("h1", "", L("asset.profile"));
		if (!editing || initial) back.classList.add("sg-root-back");
		back.onclick = (event) => (editing && !initial ? showList(event) : A.close());
		toolbar.append(back, title);
		if (canEdit()) {
			const action = B.create({
				role: "icon",
				ariaLabelKey: editing ? "asset.saveProfile" : "asset.editProfile",
				icon: I.create(editing ? "check" : "edit"),
			});
			action.dataset.profileAction = editing ? "save" : "edit";
			action.onclick = (event) => (editing ? save(action, event) : edit(event));
			toolbar.append(action);
		}
		SGGLayout.toolbar(toolbar);
	}
	function drawFilter() {
		const existing = filter.querySelector("[data-sg-segmented]");
		if (existing) {
			for (const button of existing.querySelectorAll("button"))
				button.setAttribute(
					"aria-pressed",
					String(button.dataset.followedOnly === String(followedOnly)),
				);
			return;
		}
		const group = node("div");
		group.dataset.sgSegmented = "";
		group.setAttribute("role", "group");
		if (group) SGGI18n.bind(group, "asset.profileFilter", { attr: "aria-label" });
		for (const [value, label] of [
			[false, "asset.all"],
			[true, "asset.following"],
		]) {
			const button = B.create({ labelKey: label });
			button.dataset.followedOnly = String(value);
			button.setAttribute("aria-pressed", String(followedOnly === value));
			button.onclick = () => {
				savedScroll = 0;
				followedOnly = value;
				drawFilter();
				drawList();
				filter.querySelector(`[aria-pressed="true"]`).focus({ preventScroll: true });
			};
			group.append(button);
		}
		filter.append(group);
		B.enhance(filter);
	}
	function drawList() {
		list.replaceChildren();
		for (const person of A.context.people) {
			if (followedOnly && !A.context.following?.includes(person.id)) continue;
			const p = A.context.profiles[person.id],
				row = node("button", "profile-row");
			row.type = "button";
			row.dataset.person = person.id;
			row.append(avatar(person));
			const copy = node("span", "profile-copy"),
				title = node("strong");
			title.append(
				SGGInlinePerson.label(person.id, SGGProductLanguage.identities(A.context), {
					viewerId: c.viewer,
					selfMarker: true,
				}),
			);
			copy.append(title);
			if (p?.bio) copy.append(node("small", "", p.bio));
			const chevron = I.create("back");
			chevron.style.transform = "rotate(180deg)";
			row.append(copy);
			const unread = (A.context.appNoticeEvents?.profile?.[person.id] || []).filter(
				(id) => !seenActivity.has(id),
			).length;
			if (unread) {
				const count = node("span", "profile-unread", String(unread));
				SGGI18n.bind(count, "asset.unreadActivity", {
					attr: "aria-label",
					values: { count: unread },
				});
				row.append(count);
			}
			row.append(chevron);
			row.onclick = (event) => detail(person, event);
			list.append(row);
		}
		if (!list.children.length) list.append(node("p", "profile-empty", L("asset.noFollowing")));
		requestAnimationFrame(() => (main.scrollTop = savedScroll));
	}
	function editorMode(value) {
		try {
			if (value) sessionStorage.setItem(editorKey, "true");
			else sessionStorage.removeItem(editorKey);
		} catch {}
	}
	function showList(event) {
		SGGMotion.cancel(form);
		editing = false;
		editorMode(false);
		form.hidden = true;
		list.hidden = false;
		filter.hidden = false;
		bar();
		drawFilter();
		drawList();
		if (event) {
			SGGMotion.scene(list, { direction: "back", event });
			toolbar.querySelector('[data-profile-action="edit"]')?.focus({ preventScroll: true });
		}
	}
	function drawFollow(host, person) {
		host.replaceChildren();
		if (person.id === c.viewer) return;
		const following = A.context.following?.includes(person.id) || false,
			values = A.context.profileActions?.follow?.[person.id] || [];
		if (!A.readonly && values.includes(!following)) {
			const button = B.create({ labelKey: following ? "asset.unfollow" : "asset.follow" }),
				error = node("p", "profile-error");
			error.hidden = true;
			error.setAttribute("role", "alert");
			button.onclick = async () => {
				try {
					await A.submit(button, "profile.follow", { target: person.id, following: !following });
					drawFollow(host, person);
					drawList();
					bar();
					(host.querySelector("button") || dialog.querySelector("header button"))?.focus({
						preventScroll: true,
					});
				} catch (e) {
					showError(error, e.message);
				}
			};
			host.append(
				button,
				node("span", "profile-quota", SGGProductLanguage.quota(A.context.remaining)),
				error,
			);
		} else if (following) host.append(node("p", "profile-relation", L("asset.following")));
	}
	function activityMeta(source, detail) {
		const meta = node("span", "profile-activity-tag sg-activity-meta");
		meta.append(node("span", "sg-activity-kind", source));
		if (detail) meta.append(node("span", "sg-activity-detail", detail));
		return meta;
	}
	function activityContent(record) {
		const entry = node("article", "profile-activity-item");
		entry.dataset.activityId = record.recordId;
		const d = record.data || {},
			labels = Object.fromEntries(
				Object.entries(SGGActivityDefinition.kinds).map(([kind, definition]) => [
					kind,
					definition.label,
				]),
			);
		if (!labels[record.recordKind]) return null;
		entry.append(
			activityMeta(
				L("asset.social"),
				SGGI18n.systemCopy(record.activityTag) ||
					SGGActivityDefinition.kinds[record.recordKind].tag ||
					labels[record.recordKind],
			),
		);
		if (record.recordKind === "social.profile.update.v2") {
			if (d.displayName !== undefined) entry.append(node("p", "", d.displayName));
			if (d.bio !== undefined) entry.append(node("p", "", d.bio || L("asset.bioCleared")));
			if (d.avatar !== undefined)
				entry.append(node("p", "profile-activity-meta", L("asset.avatarUpdated")));
		} else if (record.recordKind === "social.rating.set.v1") {
			const line = node("p");
			SGGInlinePerson.render(
				line,
				[{ personId: d.targetSeatId }, SGGI18n.t("asset.stars", { count: d.score })],
				{ identities: SGGProductLanguage.identities(A.context), viewerId: c.viewer },
			);
			entry.append(line);
			if (d.note) entry.append(node("p", "", d.note));
		} else entry.append(node("p", "", d.body || ""));
		return entry;
	}
	function localizedGameTokens(copy, fallback = []) {
		if (!copy?.key) return fallback;
		return SGGI18n.t(copy.key, copy.count === undefined ? {} : { count: copy.count })
			.split(/(\{[A-Za-z][A-Za-z0-9_]*\})/g)
			.filter(Boolean)
			.flatMap((part) => {
				const token = part.startsWith("{") ? copy.values?.[part.slice(1, -1)] : null;
				if (!token) return [{ type: "text", value: part }];
				return token.type === "text" && token.copy
					? localizedGameTokens(token.copy, [token])
					: [token];
			});
	}
	function gameLine(host, tokens) {
		for (const token of tokens || []) {
			if (token.type === "person")
				host.append(
					SGGInlinePerson.person(token.seatId, SGGProductLanguage.identities(A.context), {
						viewerId: c.viewer,
					}),
				);
			else if (token.type === "number") host.append(NumberUI.element(token.value));
			else if (token.type === "text") host.append(document.createTextNode(token.value));
		}
		return host;
	}
	function gameActivityContent(item) {
		if (item.itemKind !== "game-round") return null;
		const article = node("article", "profile-game-item"),
			copy = node("span", "sg-game-round-copy"),
			tag = activityMeta(L("asset.game")),
			roundLabel = node("span", "sg-activity-detail"),
			events = node("div", "sg-game-round-events");
		article.dataset.activityId = item.recordId;
		gameLine(roundLabel, localizedGameTokens(item.copy?.title, item.title));
		tag.append(roundLabel);
		copy.append(tag);
		for (const event of item.events || []) {
			const entry = node("article", "sg-game-event");
			entry.dataset.activityId = item.recordId;
			entry.dataset.activityRead = "";
			entry.append(
				gameLine(
					node("p", "sg-game-event-title"),
					localizedGameTokens(event.copy?.title, event.title),
				),
			);
			for (const [index, line] of (event.details || []).entries())
				entry.append(
					gameLine(
						node("p", "sg-game-event-detail"),
						localizedGameTokens(event.copy?.details?.[index], line),
					),
				);
			events.append(entry);
		}
		copy.append(events);
		article.append(copy);
		return article;
	}
	function mountActivity(body, person) {
		activityCleanup();
		const section = node("section", "profile-activity"),
			heading = node("h3", "profile-activity-heading", L("asset.activity")),
			content = node("div", "profile-activity-content"),
			records = node("div", "profile-activity-list sg-game-records"),
			status = node("p", "profile-activity-status"),
			error = node("p", "profile-error"),
			actions = node("div", "profile-activity-actions");
		heading.id = "profile-activity-title";
		section.setAttribute("aria-labelledby", heading.id);
		error.hidden = true;
		error.setAttribute("role", "alert");
		status.setAttribute("role", "status");
		content.append(status, records, error, actions);
		section.append(heading, content);
		body.append(section);
		const generation = ++activityGeneration,
			binding = A.context.profileBindings?.[person.id];
		let items = [],
			cursor = null,
			loaded = false,
			busy = false,
			retryCursor;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!dialog.open || !appVisible || document.hidden) return;
				const unread = new Set(A.context.appNoticeEvents?.profile?.[person.id] || []),
					ids = [
						...new Set(
							entries
								.filter((e) => e.isIntersecting && e.intersectionRatio >= 0.5)
								.map((e) => e.target.dataset.activityId)
								.filter((id) => unread.has(id) && !seenActivity.has(id)),
						),
					];
				if (!ids.length) return;
				ids.forEach((id) => seenActivity.add(id));
				drawList();
				A.request("ui.seen", { ids: [person.id], recordIds: ids }).catch(() => {
					ids.forEach((id) => seenActivity.delete(id));
					drawList();
				});
			},
			{ threshold: [0.5] },
		);
		activityCleanup = () => {
			observer.disconnect();
			removeEventListener("sgg:notice-update", observe);
			removeEventListener("sgg:app-visible", observe);
			document.removeEventListener("visibilitychange", resume);
			unlocale();
		};
		addEventListener("sgg:notice-update", observe);
		addEventListener("sgg:app-visible", observe);
		document.addEventListener("visibilitychange", resume);
		function resume() {
			if (appVisible && !document.hidden) observe();
		}
		function observe() {
			observer.disconnect();
			for (const item of records.querySelectorAll("[data-activity-read]")) observer.observe(item);
		}
		function draw() {
			records.replaceChildren(
				...items
					.map((item) => {
						const game = item.itemKind === "game-round",
							entry = game ? gameActivityContent(item) : activityContent(item);
						if (entry && !game) entry.dataset.activityRead = "";
						return entry;
					})
					.filter(Boolean),
			);
			observe();
			actions.replaceChildren();
			status.textContent = busy
				? SGGI18n.t("asset.loading")
				: loaded && !items.length
					? SGGI18n.t("asset.noActivity")
					: "";
			if (error.hidden && cursor) {
				const more = B.create({ labelKey: "asset.older", disabled: busy });
				more.onclick = () => load(cursor);
				actions.append(more);
			}
			if (!error.hidden && binding) {
				const retry = B.create({ labelKey: "asset.retry", disabled: busy });
				retry.onclick = () => load(retryCursor);
				actions.append(retry);
			}
		}
		async function load(older) {
			if (busy || generation !== activityGeneration) return;
			if (!binding) {
				showError(error, SGGI18n.t("asset.profileIdentity"));
				return;
			}
			busy = true;
			retryCursor = older;
			draw();
			try {
				const page = await A.request("ui.profile-activity", {
					target: person.id,
					participationId: binding,
					source: "all",
					...(older ? { cursor: older } : {}),
				});
				if (generation !== activityGeneration || !dialog.open) return;
				if (page?.participant?.seatId !== person.id || page.participant.participationId !== binding)
					throw Error(SGGI18n.t("asset.profileChanged"));
				items = older
					? [...new Map([...items, ...page.items].map((r) => [r.recordId, r])).values()]
					: page.items;
				cursor = page.nextCursor;
				loaded = true;
				SGGControls.clearError(error, "submit");
			} catch (e) {
				if (generation !== activityGeneration) return;
				showError(error, e.message);
			} finally {
				if (generation === activityGeneration) {
					busy = false;
					draw();
				}
			}
		}
		const unlocale = SGGI18n.observe(section, draw);
		void load();
	}
	function detail(person, event) {
		selected = person.id;
		const p = A.context.profiles[person.id];
		document.querySelector("#detail-name").textContent = p?.name || person.name;
		const head = dialog.querySelector("header");
		head.querySelector("button")?.remove();
		const close = B.create({
			role: "icon",
			ariaLabelKey: "asset.closeProfile",
			icon: I.create("close"),
		});
		close.onclick = (e) => SGGReading.close(dialog, { instant: e.detail === 0 });
		if (!peek) head.append(close);
		const body = document.querySelector("#detail-body");
		body.replaceChildren(avatar(person, "detail"));
		if (p?.bio) body.append(node("p", "", p.bio));
		const follow = node("div", "profile-follow");
		body.append(follow);
		drawFollow(follow, person);
		if (!peek || A.context.profileBindings?.[person.id]) mountActivity(body, person);
		if (peek) {
			dialog.setAttribute("open", "");
			dialog.setAttribute("role", "group");
		} else {
			SGGReading.open(dialog, { event });
			close.focus({ preventScroll: true });
		}
	}
	function edit(event) {
		SGGMotion.cancel(list);
		editing = true;
		editorMode(true);
		savedScroll = main.scrollTop;
		list.hidden = true;
		filter.hidden = true;
		form.hidden = false;
		const profile = own();
		let draft = memoryDraft;
		try {
			draft ??= JSON.parse(localStorage.getItem(draftKey));
		} catch {}
		name.value = typeof draft?.name === "string" ? draft.name : profile.name;
		bio.value = typeof draft?.bio === "string" ? draft.bio : profile.bio || "";
		preset = V.resolve(draft?.avatar || profile.avatar);
		validateFields();
		avatarPicker.setValue(preset);
		bar();
		if (event) {
			SGGMotion.scene(form, { direction: "forward", event });
			if (event.detail === 0 || document.documentElement.dataset.sgMotionInput === "keyboard")
				name.focus({ preventScroll: true });
		}
	}
	const avatarPicker = SGGAvatarPicker.mount({
		host: document.querySelector("#profile-avatar"),
		dialog: document.querySelector("#avatar-picker"),
		options: document.querySelector("#avatar-options"),
		allowedPresets: () => A.context.avatarPresets,
		onChange: (key) => {
			preset = key;
			rememberDraft();
		},
	});
	function validateFields(report = false) {
		const nameError = !name.value.trim()
				? SGGI18n.t("asset.nameRequired")
				: [...name.value].length > 80
					? SGGI18n.t("asset.nameLength")
					: "",
			bioError = [...bio.value].length > 500 ? SGGI18n.t("asset.bioLength") : "";
		name.setCustomValidity(nameError);
		bio.setCustomValidity(bioError);
		for (const input of [name, bio])
			input.setAttribute("aria-invalid", String(!input.validity.valid));
		const message = nameError || bioError;
		if (report && message) {
			status.textContent = message;
			status.dataset.errorSource = "validation";
		} else if (!message && status.dataset.errorSource === "validation") {
			SGGControls.clearError(status, "draft");
			SGGControls.clearError(status, "submit");
			status.textContent = "";
			delete status.dataset.errorSource;
		}
		return !message;
	}
	async function save(button, event) {
		if (!validateFields(true)) {
			form.reportValidity();
			return;
		}
		if (!form.reportValidity()) return;
		rememberDraft();
		try {
			await A.submit(button, "profile.save", { name: name.value, bio: bio.value, avatar: preset });
			memoryDraft = null;
			SGGControls.clearError(status, "draft");
			SGGControls.clearError(status, "submit");
			status.textContent = "";
			delete status.dataset.errorSource;
			try {
				localStorage.removeItem(draftKey);
			} catch {}
			if (initial) A.close();
			else showList(event);
		} catch (e) {
			status.dataset.errorSource = "submit";
			SGGControls.showError(status, e.message, "submit");
			rememberDraft();
		}
	}
	for (const input of [name, bio])
		input.addEventListener("input", () => {
			validateFields();
			rememberDraft();
		});
	form.onsubmit = (e) => {
		e.preventDefault();
		const b = toolbar.querySelector(".sg-toolbar-trailing");
		if (b) save(b, e);
	};
	main.addEventListener(
		"scroll",
		(e) => {
			if (!editing) {
				savedScroll = e.target.scrollTop;
				sessionStorage.setItem(scrollKey, savedScroll);
			}
		},
		{ passive: true },
	);
	SGGReading.enhance(dialog);
	dialog.addEventListener("close", () => {
		const id = selected;
		selected = null;
		activityGeneration++;
		activityCleanup();
		const row = [...list.querySelectorAll("[data-person]")].find((n) => n.dataset.person === id);
		(row || filter.querySelector('[aria-pressed="true"]'))?.focus({ preventScroll: true });
	});
	dialog.addEventListener("cancel", () => activityGeneration++);
	dialog.addEventListener("click", (e) => {
		if (e.target === dialog) {
			const r = dialog.getBoundingClientRect();
			if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
				SGGReading.close(dialog);
		}
	});
	addEventListener("message", (event) => {
		if (
			event.source === parent &&
			event.origin === new URL(document.baseURI).origin &&
			event.data?.channel === "q146-app-visibility"
		) {
			appVisible = Boolean(event.data.visible);
			if (appVisible) dispatchEvent(new Event("sgg:app-visible"));
		}
	});
	if (peek) {
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				A.close();
			}
		});
		const person = A.context.people.find((p) => p.id === peek);
		if (person) detail(person);
		else {
			dialog.setAttribute("open", "");
			document
				.querySelector("#detail-body")
				.append(node("p", "profile-error", L("asset.profileUnavailable")));
		}
		const measure = () =>
			parent.postMessage(
				{
					channel: "sgg-profile-size",
					height: Math.ceil(document.body.getBoundingClientRect().height),
				},
				new URL(document.baseURI).origin,
			);
		new ResizeObserver(measure).observe(document.body);
		measure();
	} else {
		let restoreEditor = false;
		try {
			restoreEditor = sessionStorage.getItem(editorKey) === "true";
		} catch {}
		if ((initial || restoreEditor) && canEdit()) edit();
		else showList();
	}
	SGGI18n.bind(list, "asset.playerProfiles", { attr: "aria-label" });
	for (const [input, key] of [
		[name, "asset.name"],
		[bio, "asset.bio"],
	]) {
		const parent = input.closest("label"),
			text = document.createElement("span");
		for (const child of [...parent.childNodes])
			if (child.nodeType === Node.TEXT_NODE) child.remove();
		parent.prepend(text);
		SGGI18n.bind(text, key);
	}
	SGGI18n.bind(bio, "asset.bioPlaceholder", { attr: "placeholder" });
	SGGI18n.bind(document.querySelector("#avatar-picker-title"), "asset.avatar");
	SGGI18n.bind(document.querySelector("#avatar-options"), "asset.avatar", { attr: "aria-label" });
	SGGI18n.subscribe(() => {
		if (editing) validateFields(status.dataset.errorSource === "validation");
	});
	document.documentElement.dataset.sessionReady = "true";
})();
