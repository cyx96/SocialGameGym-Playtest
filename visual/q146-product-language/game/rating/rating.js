/* A6 isolated design proposal. Public fixtures never mutate; no business submission or quota spending. */
(() => {
	"use strict";
	const data = window.Q93Fixture,
		params = new URLSearchParams(location.search),
		scenario = window.SessionApp ? "default" : params.get("state") || "default";
	const self = window.SessionApp ? SessionApp.context.viewer : "self",
		phase = window.SessionApp
			? SessionApp.context.phase
			: params.get("phase") === "game"
				? "game"
				: "social",
		readOnly = window.SessionApp ? SessionApp.readonly : phase !== "social";
	const reduce = matchMedia("(prefers-reduced-motion: reduce)"),
		compact = matchMedia("(max-width:760px)"),
		app = document.querySelector(".rating-app"),
		list = document.querySelector("#player-list"),
		detail = document.querySelector("#detail-scroll"),
		storageMessage = document.querySelector("#storage-message");
	const palette = data.palettes[params.get("theme")] || data.palettes.trust;
	for (const [k, v] of Object.entries(palette))
		document.documentElement.style.setProperty("--" + k, v);
	document.querySelector('meta[name="theme-color"]').content = palette.canvas;
	if (readOnly) {
		document.querySelector("#phase-name").textContent = "游戏";
		document.querySelector("#phase-step").textContent = "1/1 步";
		document.querySelector("#phase-note").hidden = false;
	}
	const people = structuredClone(data.people),
		person = (id) => people.find((p) => p.id === id) || { id, name: "该玩家", art: "neutral" };
	if (scenario === "long") {
		people[1].name = "林舟与很长很长的中文名字";
		people[2].name = "Alexandra Chen-Montgomery";
	}
	const publicReviews = scenario === "empty" ? [] : structuredClone(data.publishedReviews);
	if (scenario === "long") {
		const r = publicReviews.find((r) => r.author === "xu" && r.target === "lin");
		if (r)
			r.text =
				"我想把这一轮的考虑说得更完整一些。\n" +
				"信息需要结合实际行动来理解，也可以继续听取其他人的想法。".repeat(8) +
				"\n<这段文字只作为文字展示，不执行任何内容。>";
	}
	const summaries =
		scenario === "empty"
			? Object.fromEntries(
					people.map((p) => [
						p.id,
						{ mean: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
					]),
				)
			: data.summaries;
	const pending = scenario === "pending" ? data.pending : null,
		quota = window.SessionApp
			? SessionApp.context.remaining
			: pending || scenario === "quota"
				? 0
				: 1;
	const key = window.SessionApp
		? SessionApp.scope + ":rating-drafts"
		: "sgg-q117-rating:" + scenario + ":" + phase + ":self:social-2-1";
	let state = {
		selected: self,
		mobileDetail: false,
		edit: null,
		noteOpen: false,
		drafts: {},
		scroll: {},
		listScroll: 0,
	};
	let storageUnsafe = false,
		keyboard = false;
	const esc = (value) =>
		String(value ?? "").replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
		);
	const icon = (name) => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;
	const avatar = (id, size = 44) =>
		SGGAvatar.html({
			preset: person(id).avatarPreset || person(id).art || "default",
			person: id,
			size: size === 52 ? "profile" : size === 32 ? "message" : size === 30 ? "reply" : "row",
		});
	const ownPublished = (id) =>
		window.SessionApp
			? data.myFeedback[id] || null
			: scenario === "empty"
				? null
				: data.myFeedback[id] || null;
	let editorMotion = null,
		returnField = "score",
		editorOrigin = 0;
	const activeAnimations = new Set();
	function animate(el, direction) {
		if (!el) return;
		const a = SGGMotion.scene(el, { direction, immediate: keyboard });
		if (a) {
			activeAnimations.add(a);
			a.finished.catch(() => {}).finally(() => activeAnimations.delete(a));
		}
	}
	function stopAnimations() {
		for (const a of activeAnimations) a.cancel();
		activeAnimations.clear();
	}
	function readStorage() {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return;
			const s = JSON.parse(raw);
			if (!s || typeof s !== "object") return;
			if (people.some((p) => p.id === s.selected)) state.selected = s.selected;
			state.mobileDetail = !!s.mobileDetail;
			state.edit = people.some((p) => p.id === s.edit) && s.edit !== self ? s.edit : null;
			state.noteOpen = !!s.noteOpen;
			state.drafts = {};
			for (const [id, d] of Object.entries(s.drafts || {})) {
				if (id === self || !people.some((p) => p.id === id) || !d || typeof d.text !== "string")
					continue;
				if (d.score !== null && (!Number.isInteger(d.score) || d.score < 1 || d.score > 5))
					continue;
				state.drafts[id] = { score: d.score, text: d.text };
			}
			state.scroll = s.scroll && typeof s.scroll === "object" ? s.scroll : {};
			state.listScroll = Number.isFinite(s.listScroll) ? Math.max(0, s.listScroll) : 0;
		} catch {
			storageMessage.textContent = "未能恢复草稿，请检查本机存储后重试。";
			storageMessage.hidden = false;
		}
	}
	function persist() {
		if (window.__SGG_RETIRED__) return true;
		try {
			if (params.get("storage") === "fail") throw Error("fixture storage failure");
			localStorage.setItem(key, JSON.stringify(state));
			storageUnsafe = false;
			storageMessage.hidden = true;
			return true;
		} catch {
			storageUnsafe = true;
			storageMessage.innerHTML =
				'草稿未能保存，请留在当前页面重试。<button type="button" id="retry-storage">重试</button>';
			storageMessage.hidden = false;
			return false;
		}
	}
	function rememberScroll() {
		state.scroll[state.selected] = detail.scrollTop;
		state.listScroll = list.scrollTop;
	}
	function canLeave() {
		rememberScroll();
		return persist();
	}
	readStorage();
	if (readOnly) {
		state.edit = null;
		state.noteOpen = false;
	}
	if (params.get("player") && people.some((p) => p.id === params.get("player"))) {
		state.selected = params.get("player");
		state.mobileDetail = true;
	}
	if (params.get("mode") === "edit" && !readOnly && quota > 0 && state.selected !== self) {
		state.edit = state.selected;
		state.noteOpen = params.get("field") !== "score";
	}
	if (readOnly || (!window.SessionApp && quota === 0)) {
		state.edit = null;
		state.noteOpen = false;
	}
	if (scenario === "failure" && state.selected === self) {
		state.selected = "lin";
		state.mobileDetail = true;
		state.edit = "lin";
		state.noteOpen = true;
	}
	function draftFor(id) {
		return (
			state.drafts[id] || {
				score: ownPublished(id)?.score ?? null,
				text: ownPublished(id)?.text ?? "",
			}
		);
	}
	function hasChange(id) {
		const d = draftFor(id),
			old = ownPublished(id);
		return d.score !== (old?.score ?? null) || d.text !== (old?.text ?? "");
	}
	function listMarkup() {
		return people
			.map((p) => {
				const s = summaries[p.id],
					score = s.count ? NumberUI.text(s.mean) : "",
					count = NumberUI.text(s.count),
					meta = s.count
						? `<span class="rating-value">${stars(s.mean, "list-stars", true)}<span class="list-score">${score}</span></span><span class="rating-count">${count}\u202f人评分</span>`
						: '<span class="rating-unrated">暂无评分</span>',
					description = s.count ? `${score}星，${count}人评分` : "暂无评分";
				return `<button type="button" class="player-row" data-player="${p.id}" aria-current="${state.selected === p.id}" aria-label="查看${esc(p.name)}的公开评分，${description}">${avatar(p.id)}<span class="player-label"><span class="player-name">${esc(p.name)}${p.id === self ? '<span class="you">你</span>' : ""}</span><span class="player-meta player-rating">${meta}<span class="draft-flag" data-draft-for="${p.id}">${!readOnly && state.drafts[p.id] && hasChange(p.id) ? "草稿" : ""}</span></span></span><svg class="player-chevron" aria-hidden="true"><use href="#arrow"/></svg></button>`;
			})
			.join("");
	}
	function distributionMarkup(id) {
		const s = summaries[id],
			denom = Math.max(1, s.count);
		return `<div class="distribution" id="distribution" role="img" aria-label="评分分布：${[5, 4, 3, 2, 1].map((n) => n + " 星 " + (s.distribution[n] || 0) + " 人").join("，")}">${[5, 4, 3, 2, 1].map((n) => `<div class="distribution-row" aria-hidden="true"><span class="distribution-score">${n}${icon("star")}</span><div class="bar-track"><div class="bar-fill" style="width:${(100 * (s.distribution[n] || 0)) / denom}%"></div></div><span class="distribution-count">${NumberUI.text(s.distribution[n] || 0)}</span></div>`).join("")}</div>`;
	}
	function stars(value, cls = "", decorative = false) {
		return `<span class="stars ${cls}" ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${value} 星，满分 5 星"`}>${[1, 2, 3, 4, 5].map((n) => `<span class="star-unit">${icon("star")}<span class="star-fill" style="width:${Math.max(0, Math.min(1, Number(value) - n + 1)) * 100}%">${icon("star")}</span></span>`).join("")}</span>`;
	}
	function paintStars(preview = null) {
		const value =
			preview ?? Number(document.querySelector('input[name="score"]:checked')?.value || 0);
		for (const label of detail.querySelectorAll(".score-option"))
			label.classList.toggle("filled", Number(label.dataset.star) <= value);
	}
	function editorMarkup(id) {
		const d = draftFor(id);
		return `<form class="editor" id="editor" novalidate><header class="composer-toolbar"><h3>${ownPublished(id) ? "编辑评价" : "写评价"}</h3><button class="icon-button" type="button" id="close-editor" aria-label="收起编辑">${icon("close")}</button></header><div class="composer-writing"><div class="composer-byline">${avatar(self, 30)}<span>${SGGInlinePerson.html(self, Object.fromEntries(people.map((p) => [p.id, p])), { viewerId: self, selfMarker: true })}</span></div><fieldset class="score-options" aria-label="给${esc(person(id).name)}的评分"><legend class="sr-only">评分，必填</legend>${[1, 2, 3, 4, 5].map((n) => `<label class="score-option${n <= d.score ? " filled" : ""}" data-star="${n}"><input type="radio" name="score" value="${n}"${d.score === n ? " checked" : ""} aria-label="${n} 星"><span>${icon("star")}</span></label>`).join("")}</fieldset><label class="sr-only" for="review-text">评价（选填）</label><textarea data-sg-auto-size id="review-text" name="review" rows="3" placeholder="写下你的看法（选填）…">${esc(d.text)}</textarea></div><footer class="editor-footer"><p class="quota">${SGGProductLanguage.quota(quota)}</p><button class="primary" id="submit-feedback" type="submit" aria-label="提交反馈"${!validDraft(id) ? " disabled" : ""}>提交</button></footer><p class="editor-timing">本步结束后，所有玩家可见。</p><p class="submit-error" id="submit-error" role="alert" hidden></p></form>`;
	}
	function validDraft(id) {
		const d = draftFor(id);
		return (
			!readOnly &&
			(quota > 0 ||
				(window.SessionApp && (!d.text.trim() || d.text === (ownPublished(id)?.text || "")))) &&
			id !== self &&
			Number.isInteger(d.score) &&
			d.score >= 1 &&
			d.score <= 5 &&
			hasChange(id)
		);
	}
	function myMarkup(id) {
		if (id === self) return "";
		const saved = ownPublished(id),
			isPending = pending?.target === id;
		if (readOnly) {
			const awaiting = window.SessionApp
				? SessionApp.context.reviews.some(
						(r) => r.author === self && r.target === id && !r.delivered,
					)
				: isPending;
			if (!saved || !awaiting) return "";
			return `<section class="my-section" id="my-feedback"><div class="my-row"><p class="my-label">我的反馈</p><div class="pending-score">${stars(saved.score)}<span class="status">待公开</span></div></div>${saved.text ? `<p class="pending-note">${esc(saved.text)}</p>` : ""}</section>`;
		}
		if (isPending || (!window.SessionApp && quota <= 0))
			return `<section class="my-section is-pending" id="my-feedback"><div class="my-row"><p class="my-label">我的反馈</p>${isPending ? `<div class="pending-score">${stars(pending.score)}<span class="status">待公开</span></div>` : '<span class="readonly-note">本步次数已用完</span>'}</div>${isPending ? `<p class="pending-note">${esc(pending.text)}</p><p class="pending-explainer">本步结束后公开，不计入当前均分。</p>` : ""}</section>`;
		return `<section class="my-section" id="my-feedback"><div class="inline-slot"><div class="compose-launch" style="height:auto"><div class="my-row"><div><p class="my-label">我的反馈</p>${saved ? stars(saved.score) : ""}</div><div class="action-group" id="edit-actions"><button class="text-action" type="button" data-edit="score" aria-label="编辑数字评分">评分</button><button class="text-action" type="button" data-edit="text" aria-label="写文字评价">评价</button></div></div>${saved?.text ? `<p class="pending-note">${esc(saved.text)}</p>` : ""}</div><div class="feedback-shell" hidden><div class="feedback-inner"></div></div></div></section>`;
	}
	function reviewMarkup(id) {
		const records = publicReviews
			.filter((r) => r.target === id)
			.sort(
				(a, b) =>
					b.publishedRound - a.publishedRound || b.publishedSocialStep - a.publishedSocialStep,
			);
		return `<section class="public-section"><h3 class="section-heading">评价</h3><div id="public-reviews">${records.length ? records.map((r) => `<article class="review"><div class="review-author">${avatar(r.author, 32)}<div class="review-identity"><span class="review-name">${esc(person(r.author).name)}${r.author === self ? '<span class="you">你</span>' : ""}</span>${stars(r.score, "review-stars")}</div><span class="review-time">${SGGProductLanguage.stamp({ round: r.publishedRound, step: r.publishedSocialStep, steps: window.SessionApp ? SessionApp.context.socialSteps : 3 })}</span></div><p class="review-text">${esc(r.text)}</p></article>`).join("") : '<p class="empty">暂无评价。</p>'}</div></section>`;
	}
	function detailMarkup() {
		const p = person(state.selected),
			s = summaries[p.id];
		return `<header class="person-heading"><div class="person-main">${avatar(p.id, 52)}<h2>${esc(p.name)}${p.id === self ? '<span class="you">你</span>' : ""}</h2></div></header><section class="rating-summary" aria-label="${esc(p.name)}的评分概览">${s.count ? `<div class="average"><span class="mean" id="public-mean">${s.mean}</span>${stars(s.mean, "summary-stars")}<span class="count">${NumberUI.text(s.count)}\u202f人评分</span></div>${distributionMarkup(p.id)}` : '<p class="no-mean" id="public-mean">暂无评分</p>'}</section>${myMarkup(p.id)}${reviewMarkup(p.id)}`;
	}
	function render({ motion = false, restore = true, direction = "replace" } = {}) {
		editorMotion?.destroy();
		editorMotion = null;
		stopAnimations();
		const oldScroll = detail.scrollTop;
		list.innerHTML = listMarkup();
		list.scrollTop = state.listScroll;
		detail.innerHTML = detailMarkup();
		const mean = detail.querySelector(".mean");
		if (mean)
			mean.replaceChildren(NumberUI.element(summaries[state.selected].mean, { role: "primary" }));
		detail.dataset.self = String(state.selected === self);
		detail.dataset.readonly = String(readOnly);
		app.classList.toggle("mobile-detail", state.mobileDetail);
		document.querySelector(".app-toolbar").classList.toggle("mobile-detail", state.mobileDetail);
		const slot = detail.querySelector(".inline-slot");
		if (slot) {
			const surface = slot.querySelector(".feedback-shell"),
				inner = slot.querySelector(".feedback-inner"),
				launch = slot.querySelector(".compose-launch");
			editorMotion = window.createInlineFeedbackEditor({
				slot,
				surface,
				inner,
				launch,
				instant: () => reduce.matches || keyboard,
				changed: (phase) => {
					if (phase === "open") ensureEditorVisible();
				},
				closed: () => {
					if (!state.edit) {
						detail.scrollTop = editorOrigin;
						detail.querySelector(`[data-edit="${returnField}"]`)?.focus({ preventScroll: true });
					}
				},
			});
			if (state.edit === state.selected) {
				inner.innerHTML = editorMarkup(state.selected);
				editorMotion.set(true, { immediate: true });
			}
		}
		detail.scrollTop = restore ? Number(state.scroll[state.selected]) || 0 : oldScroll;
		if (motion) animate(detail, direction);
		if (scenario === "failure" && state.edit === state.selected) showSubmitError();
	}
	function showSubmitError(message = "提交未完成，草稿已保留。") {
		SGGControls.showError(document.querySelector("#submit-error"), message, "submit");
	}
	function ensureEditorVisible() {
		const box = document.querySelector("#editor");
		if (!box || !state.edit) return;
		const viewport = detail.getBoundingClientRect(),
			rect = box.getBoundingClientRect(),
			bottom = viewport.bottom - 16,
			top = viewport.top + 16;
		if (rect.bottom > bottom) detail.scrollTop += rect.bottom - bottom;
		const adjusted = box.getBoundingClientRect();
		if (adjusted.height <= detail.clientHeight - 32 && adjusted.top < top)
			detail.scrollTop -= top - adjusted.top;
	}
	function focusEditor(field) {
		const el =
			field === "text"
				? document.querySelector("#review-text")
				: document.querySelector('input[name="score"]:checked') ||
					document.querySelector('input[name="score"]');
		el?.focus({ preventScroll: true });
		if (editorMotion?.phase === "open") ensureEditorVisible();
	}
	function openEditor(field) {
		if (readOnly || (!window.SessionApp && quota <= 0) || state.selected === self || !editorMotion)
			return;
		if (editorMotion.phase === "closed") editorOrigin = detail.scrollTop;
		returnField = field;
		state.edit = state.selected;
		state.noteOpen = true;
		const inner = detail.querySelector(".feedback-inner");
		if (!inner.querySelector("#editor")) inner.innerHTML = editorMarkup(state.selected);
		editorMotion.set(true);
		persist();
		focusEditor(field);
	}
	function closeEditor() {
		if (!canLeave()) return;
		state.edit = null;
		state.noteOpen = false;
		editorMotion?.set(false);
		persist();
	}
	function captureDraft() {
		if (state.edit !== state.selected) return;
		const checked = document.querySelector('input[name="score"]:checked'),
			d = draftFor(state.selected);
		const text = document.querySelector("#review-text")?.value ?? d.text;
		state.drafts[state.selected] = { score: checked ? Number(checked.value) : null, text };
		if (!hasChange(state.selected)) delete state.drafts[state.selected];
		rememberScroll();
		persist();
		const submit = document.querySelector("#submit-feedback");
		if (submit) submit.disabled = !validDraft(state.selected);
		const marker = document.querySelector(`[data-draft-for="${state.selected}"]`);
		if (marker) marker.textContent = state.drafts[state.selected] ? "草稿" : "";
		SGGControls.clearError(document.querySelector("#submit-error"), "draft");
	}
	function selectPlayer(id) {
		if (!people.some((p) => p.id === id) || !canLeave()) return;
		if (id !== state.selected) {
			state.selected = id;
			state.edit = null;
			state.noteOpen = false;
		}
		state.mobileDetail = true;
		render({ motion: true, direction: compact.matches ? "forward" : "replace" });
		persist();
		if (keyboard) detail.focus({ preventScroll: true });
	}
	document.addEventListener(
		"keydown",
		(e) => {
			keyboard = true;
			document.documentElement.classList.add("keyboard-focus");
			if (e.key === "Escape" && state.edit) {
				e.preventDefault();
				closeEditor();
			}
		},
		{ capture: true },
	);
	document.addEventListener(
		"pointerdown",
		() => {
			keyboard = false;
			document.documentElement.classList.remove("keyboard-focus");
		},
		{ capture: true },
	);
	list.addEventListener("click", (e) => {
		const row = e.target.closest("[data-player]");
		if (row) selectPlayer(row.dataset.player);
	});
	detail.addEventListener("click", (e) => {
		const edit = e.target.closest("[data-edit]");
		if (edit) {
			openEditor(edit.dataset.edit);
			return;
		}
		if (e.target.closest("#close-editor")) closeEditor();
	});
	detail.addEventListener("pointerover", (e) => {
		if (e.pointerType !== "mouse" || !matchMedia("(hover:hover) and (pointer:fine)").matches)
			return;
		const label = e.target.closest("[data-star]");
		if (label) paintStars(Number(label.dataset.star));
	});
	detail.addEventListener("pointerout", (e) => {
		if (e.target.closest(".score-options") && !e.relatedTarget?.closest?.(".score-options"))
			paintStars();
	});
	detail.addEventListener("input", (e) => {
		if (e.target.matches("#review-text")) captureDraft();
	});
	detail.addEventListener("change", (e) => {
		if (e.target.matches('input[name="score"]')) {
			captureDraft();
			paintStars();
		}
	});
	detail.addEventListener("submit", (e) => {
		e.preventDefault();
		if (e.target.id !== "editor") return;
		captureDraft();
		if (!validDraft(state.selected) || storageUnsafe) return;
		if (window.SessionApp) {
			const d = draftFor(state.selected);
			SessionApp.submit(document.querySelector("#submit-feedback"), "rating.save", {
				target: state.selected,
				score: d.score,
				text: d.text,
			})
				.then(() => {
					delete state.drafts[state.selected];
					state.edit = null;
					state.noteOpen = false;
					persist();
					SessionApp.refresh();
				})
				.catch((e) => showSubmitError(e.message));
		} else showSubmitError();
	});
	document.querySelector("#back-list").addEventListener("click", () => {
		if (!canLeave()) return;
		state.mobileDetail = false;
		render();
		if (compact.matches) animate(document.querySelector(".players-pane"), "back");
		persist();
		document.querySelector(`[data-player="${state.selected}"]`)?.focus({ preventScroll: true });
	});
	storageMessage.addEventListener("click", (e) => {
		if (e.target.closest("#retry-storage")) persist();
	});
	let scrollFrame = 0;
	function saveScroll() {
		cancelAnimationFrame(scrollFrame);
		scrollFrame = requestAnimationFrame(() => {
			rememberScroll();
			if (!storageUnsafe) persist();
		});
	}
	detail.addEventListener("scroll", saveScroll, { passive: true });
	list.addEventListener("scroll", saveScroll, { passive: true });
	window.addEventListener("pagehide", () => {
		rememberScroll();
		persist();
	});
	SGGMotion.onSettle(() => {
		stopAnimations();
		editorMotion?.complete();
	});
	reduce.addEventListener("change", () => {
		stopAnimations();
		editorMotion?.complete();
	});
	compact.addEventListener("change", () => {
		stopAnimations();
		app.classList.toggle("mobile-detail", state.mobileDetail);
	});
	render();
	window.Q93Preview = {
		open: openEditor,
		close: closeEditor,
		snapshot: () => ({
			selected: state.selected,
			drafts: structuredClone(state.drafts),
			edit: state.edit,
			editorPhase: editorMotion?.phase,
			readonly: readOnly,
			quota,
			storageUnsafe,
			publishedCount: publicReviews.length,
			paletteRevision: data.paletteRevision,
		}),
	};
})();
