// Q77 B: one inline editing surface; CSS transitions can reverse in place.
const scroller = document.querySelector(".forum-app"),
	surface = document.querySelector(".compose-surface"),
	icon = document.querySelector(".compose-icon"),
	copy = document.querySelector(".compose-copy"),
	hit = document.querySelector(".compose-hit"),
	editor = document.querySelector("#composer"),
	field = editor.querySelector("textarea"),
	reduce = matchMedia("(prefers-reduced-motion: reduce)"),
	error = editor.querySelector(".draft-error"),
	slot = document.querySelector(".entry-spacer"),
	inner = editor.querySelector(".newpost-inner"),
	toolbar = document.querySelector(".forum-toolbar"),
	layer = document.querySelector(".sticky-layer");
let width = 0,
	navigationMounted = false,
	frame = 0,
	progress = 0,
	pressed = false,
	keyboard = false,
	newpostState = "closed",
	motionToken = 0,
	motionTimer = 0,
	returnScroll = 0,
	returnToReading = false,
	clearMotion = () => {},
	scrollTarget = null,
	restoreFrame = 0;
toolbar.addEventListener("sgg:navigation-mounted", () => {
	navigationMounted = true;
	new ResizeObserver(schedule).observe(toolbar);
	schedule();
});
function scrollToTarget(top, instant = false) {
	scrollTarget = top;
	scroller.scrollTo({ top, behavior: instant || reduce.matches ? "instant" : "smooth" });
	if (instant || reduce.matches) scrollTarget = null;
}
scroller.addEventListener("scrollend", () => (scrollTarget = null));
for (const type of ["wheel", "touchstart", "pointerdown"])
	scroller.addEventListener(
		type,
		() => {
			scrollTarget = null;
			cancelAnimationFrame(restoreFrame);
			restoreFrame = 0;
		},
		{ passive: true },
	);
const storageKey = window.SessionApp
	? SessionApp.scope + ":post-draft"
	: "sgg-q82-newpost-draft-round4-v1";
let newDraft = "";
try {
	newDraft = localStorage.getItem(storageKey) || "";
} catch {}
field.value = newDraft;
scroller.dataset.newpostState = "closed";
const composerOpen = () => newpostState !== "closed";
function sync() {
	frame = 0;
	if (composerOpen() || pressed || (keyboard && document.activeElement === hit) || width <= 0)
		return;
	const scroll = Math.max(0, scroller.scrollTop),
		raw = reduce.matches ? (scroll <= 4 ? 0 : 1) : Math.max(0, Math.min(1, (scroll - 4) / 92));
	progress = raw;
	const nav = navigationMounted ? toolbar.getBoundingClientRect() : null,
		origin = navigationMounted ? layer.getBoundingClientRect() : null,
		reading = navigationMounted ? slot.getBoundingClientRect() : null,
		expandedY = nav
			? nav.bottom - origin.top + parseFloat(getComputedStyle(toolbar).marginBottom)
			: 64,
		compactY = nav ? nav.top - origin.top + (nav.height - 44) / 2 : 6,
		shiftX = nav ? (nav.right - reading.right) * raw : 0,
		y = expandedY - (expandedY - compactY) * Math.pow(raw, 1.7),
		w = width - (width - 44) * raw,
		h = 78 - 34 * raw;
	surface.style.transform = `translate(${shiftX}px,${y}px) scale(${w / width},${h / 78})`;
	surface.style.borderRadius = `${16 + (width / 2 - 16) * raw}px / ${16 + 23 * raw}px`;
	icon.style.transform = `translate(${-14 * (1 - raw) + shiftX}px,${expandedY + 17 - (expandedY + 17 - compactY) * raw}px)`;
	copy.style.opacity = Math.max(0, 1 - raw * 8);
	copy.style.top = expandedY + 20 + "px";
	copy.style.transform = `translateY(${-10 * raw}px)`;
	hit.style.top = y + "px";
	// Keep position independent of the shared button's transient press transform.
	hit.style.translate = shiftX + "px";
	hit.style.width = w + "px";
	hit.style.height = h + "px";
	hit.style.borderRadius = 16 + 6 * raw + "px";
	scroller.dataset.composer = raw === 0 ? "expanded" : raw === 1 ? "compact" : "morphing";
	scroller.dataset.progress = raw.toFixed(4);
}
function schedule() {
	if (!frame) frame = requestAnimationFrame(sync);
}
new ResizeObserver((entries) => {
	width = entries[0].contentRect.width;
	schedule();
}).observe(slot);
scroller.addEventListener("scroll", schedule, { passive: true });
document.addEventListener("keydown", () => (keyboard = true), { capture: true });
document.addEventListener("pointerdown", () => (keyboard = false), { capture: true });
hit.addEventListener("pointerdown", () => {
	pressed = true;
	scroller.classList.add("pressed");
});
for (const event of ["pointerup", "pointercancel"])
	hit.addEventListener(event, () => {
		pressed = false;
		scroller.classList.remove("pressed");
		schedule();
	});
hit.addEventListener("blur", schedule);
function refreshSubmit() {
	editor.querySelector(".submit-newpost").disabled =
		!field.value.trim() || (window.SessionApp && SessionApp.context.remaining <= 0);
}
function persist() {
	if (window.__SGG_RETIRED__) return true;
	newDraft = field.value;
	refreshSubmit();
	try {
		if (new URLSearchParams(location.search).get("storage") === "fail") throw Error("blocked");
		localStorage.setItem(storageKey, newDraft);
		SGGControls.clearError(error, "draft");
		return true;
	} catch {
		SGGControls.showError(error, SGGI18n.t("asset.saveDraft"), "draft");
		return false;
	}
}
function setState(value) {
	newpostState = value;
	scroller.dataset.newpostState = value;
}
function transitionTo(open, instant = false) {
	cancelAnimationFrame(restoreFrame);
	restoreFrame = 0;
	clearMotion();
	const token = ++motionToken;
	clearTimeout(motionTimer);
	const fresh = editor.hidden;
	if (fresh) {
		editor.hidden = false;
		editor.style.height = "78px";
		slot.style.height = "112px";
		editor.offsetHeight;
	}
	const noMotion = instant || reduce.matches;
	scroller.classList.toggle("newpost-instant", noMotion);
	editor.inert = !open;
	hit.setAttribute("aria-expanded", String(open));
	setState(open ? "opening" : "closing");
	const height = open ? inner.scrollHeight : 78,
		target = open ? height + 26 : 112,
		current = slot.getBoundingClientRect().height;
	editor.style.height = height + "px";
	slot.style.height = target + "px";
	const finish = () => {
		if (token !== motionToken) return;
		clearTimeout(motionTimer);
		slot.removeEventListener("transitionend", onEnd);
		if (open) {
			setState("open");
			editor.style.height = inner.scrollHeight + "px";
			slot.style.height = inner.scrollHeight + 26 + "px";
		} else {
			editor.hidden = true;
			editor.inert = true;
			setState("closed");
			if (noMotion) slot.offsetHeight;
			scroller.classList.remove("newpost-instant");
			if (returnToReading) {
				const restore = returnScroll;
				scrollToTarget(restore, noMotion);
				returnToReading = false;
				if (noMotion) {
					cancelAnimationFrame(restoreFrame);
					restoreFrame = requestAnimationFrame(() => {
						restoreFrame = 0;
						if (token === motionToken && newpostState === "closed") {
							scroller.scrollTop = restore;
							sync();
						}
					});
				}
			}
			sync();
			hit.focus({ preventScroll: true });
			parent.postMessage({ q82: "editor-closed" }, "*");
		}
	};
	const onEnd = (e) => {
		if (e.target === slot && e.propertyName === "height") finish();
	};
	slot.addEventListener("transitionend", onEnd);
	clearMotion = () => slot.removeEventListener("transitionend", onEnd);
	if (noMotion || Math.abs(target - current) < 0.5) finish();
	else
		motionTimer = setTimeout(finish, SGGMotion.options(open ? "expand" : "collapse").duration + 80);
}
new ResizeObserver(() => {
	if (newpostState === "open") {
		scroller.classList.add("newpost-instant");
		editor.style.height = inner.scrollHeight + "px";
		slot.style.height = inner.scrollHeight + 26 + "px";
	}
}).observe(inner);
function openEditor(instant = false) {
	if (newpostState === "open" || newpostState === "opening") {
		field.focus({ preventScroll: true });
		return;
	}
	const sourceScroll = scroller.scrollTop;
	for (const reply of document.querySelectorAll(".inline-editor:not([hidden])")) {
		reply.querySelector(".close-inline").click();
		if (!reply.hidden) return;
	}
	if (newpostState === "closed") {
		returnScroll = sourceScroll;
		returnToReading = returnScroll > 96;
	}
	editor.dataset.keyboard = String(instant);
	SGGControls.clearError(error, "draft");
	refreshSubmit();
	transitionTo(true, instant);
	field.focus({ preventScroll: true });
	// Keep native scroll/keyboard handling; do not implement custom inertia.
	if (scroller.scrollTop > 4) scrollToTarget(0, instant);
}
function closeEditor(instant = false) {
	if (!composerOpen() || newpostState === "closing") return;
	if (!persist()) return;
	field.blur();
	transitionTo(false, instant);
}
function closeNewpostForReply() {
	if (!composerOpen()) return true;
	if (!persist()) {
		editor.scrollIntoView({ block: "nearest", behavior: "instant" });
		field.focus({ preventScroll: true });
		return false;
	}
	const oldScroll = scroller.scrollTop,
		removed = slot.getBoundingClientRect().height - 112;
	returnToReading = false;
	field.blur();
	transitionTo(false, true);
	scroller.scrollTop = Math.max(0, oldScroll - removed);
	return true;
}
hit.setAttribute("aria-haspopup", "false");
hit.setAttribute("aria-expanded", "false");
hit.onclick = (e) => openEditor(e.detail === 0);
field.addEventListener("input", persist);
editor.querySelector(".close-newpost").onclick = (e) => closeEditor(e.detail === 0);
editor.querySelector(".submit-newpost").onclick = () => {
	if (!field.value.trim() || !persist()) return;
	if (window.SessionApp) {
		SessionApp.submit(editor.querySelector(".submit-newpost"), "forum.post", { text: field.value })
			.then(() => {
				SGGControls.clearError(error, "submit");
				field.value = "";
				persist();
				SessionApp.refresh();
			})
			.catch((e) => SGGControls.showError(error, e.message, "submit"));
	} else parent.postMessage({ q82: "submit-preview" }, "*");
};
editor.addEventListener("pointerdown", () => (editor.dataset.keyboard = "false"));
editor.addEventListener("keydown", (e) => {
	if (e.key === "Tab") editor.dataset.keyboard = "true";
	if (e.key === "Escape" && !e.isComposing) {
		e.preventDefault();
		closeEditor(true);
	}
});
// The single observer above owns open-composer geometry, including long drafts.
SGGMotion.onSettle(() => {
	if (scrollTarget !== null) scrollToTarget(scrollTarget, true);
	if (newpostState === "opening" || newpostState === "closing")
		transitionTo(newpostState === "opening", true);
});
reduce.addEventListener("change", () => {
	if (reduce.matches && scrollTarget !== null) scrollToTarget(scrollTarget, true);
	if (newpostState === "opening" || newpostState === "closing")
		transitionTo(newpostState === "opening", true);
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden && (newpostState === "opening" || newpostState === "closing"))
		transitionTo(newpostState === "opening", true);
});
document.querySelectorAll(".reading button,.back").forEach(
	(button) =>
		(button.onclick = () =>
			parent.postMessage(
				{
					q72: "fixture-action",
					action: button.textContent || button.getAttribute("aria-label"),
				},
				"*",
			)),
);
window.addEventListener("message", (e) => {
	if (e.source !== parent) return;
	if (e.data?.q72Control === "scroll" && !composerOpen())
		scroller.scrollTo({
			top: Math.max(0, Number(e.data.top) || 0),
			behavior: e.data.instant || reduce.matches ? "instant" : "smooth",
		});
	if (e.data?.q82Control === "open") openEditor(!!e.data.instant);
	if (e.data?.q82Control === "close") closeEditor(!!e.data.instant);
});
if (new URLSearchParams(location.search).get("state") === "compact") scroller.scrollTop = 360;
window.addEventListener("pageshow", schedule);
schedule();

const ThreadData = window.SessionApp
	? SessionApp.context.posts
			.filter((p) => !p.parent)
			.map((p) => ({
				id: p.id,
				name:
					SessionApp.context.people.find((w) => w.id === p.author)?.name ||
					SGGI18n.t("asset.unknownPerson"),
				initial: "",
				author: p.author,
				round: p.round,
				step: p.step,
				text: p.text,
				replies: SessionApp.context.posts
					.filter((r) => r.parent === p.id)
					.map((r) => ({
						id: r.id,
						name:
							SessionApp.context.people.find((w) => w.id === r.author)?.name ||
							SGGI18n.t("asset.unknownPerson"),
						initial: "",
						author: r.author,
						round: r.round,
						step: r.step,
						text: r.text,
					})),
			}))
	: [
			{
				id: "p1",
				name: "林舟",
				initial: "林",
				round: 1,
				text: "大家好，希望我们能找到对彼此都合适的合作方式。",
				replies: [
					{ name: "许知", initial: "许", round: 2, text: "我愿意先从小额开始，看看实际结果。" },
					{ name: "周遥", initial: "周", round: 2, text: "先了解彼此的选择，再考虑下一轮。" },
					{
						name: "玩家 01",
						initial: "你",
						round: 2,
						text: "我也会参考实际行动，不只看口头承诺。",
					},
					{ name: "林舟", initial: "林", round: 2, text: "可以，我们先把各自的考虑说清楚。" },
					{ name: "许知", initial: "许", round: 3, text: "上一轮的选择让我更愿意继续合作。" },
					{
						name: "周遥",
						initial: "周",
						round: 3,
						text: "我会保持自己的选择，也愿意继续听听大家的想法。",
					},
				],
			},
			{
				id: "p2",
				name: "许知",
				initial: "许",
				round: 1,
				text: "比起承诺，我更关注实际行动。",
				replies: [{ name: "林舟", initial: "林", round: 3, text: "同意，保持一致的行动很重要。" }],
			},
			{
				id: "p3",
				name: "周遥",
				initial: "周",
				round: 1,
				text: "我会先从小额开始，逐步了解大家。",
				replies: [],
			},
			{
				id: "p4",
				name: "玩家 01",
				initial: "你",
				round: 1,
				text: "先了解彼此，再一起做决定。",
				replies: [],
			},
		];
const threadDraftKey = window.SessionApp
	? SessionApp.scope + ":reply-draft"
	: "sgg-q74-inline-replies-round4-v1";
let threadDrafts = {};
try {
	threadDrafts = JSON.parse(localStorage.getItem(threadDraftKey) || "{}");
} catch {}
const escapeText = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
	);
const stateName = new URLSearchParams(location.search).get("state");
if (stateName === "empty") ThreadData[0].replies = [];
if (stateName === "one") ThreadData[0].replies = ThreadData[0].replies.slice(-1);

if (window.SessionApp) {
	const feed = document.querySelector(".feed"),
		template = feed.querySelector(".thread").cloneNode(true);
	feed.querySelectorAll(".thread").forEach((n) => n.remove());
	for (const post of ThreadData) {
		const article = template.cloneNode(true);
		article.dataset.post = post.id;
		article.querySelector(".author h2").replaceChildren(
			SGGInlinePerson.label(post.author, SGGProductLanguage.identities(SessionApp.context), {
				viewerId: SessionApp.context.viewer,
				selfMarker: true,
			}),
		);
		const face = article.querySelector(".author .avatar");
		face.innerHTML = SGGIdentity.avatar(post.author, "context");
		face.dataset.identityReady = "true";
		article.querySelector(".author small").textContent = SGGProductLanguage.stamp({
			round: post.round,
			step: post.step,
			steps: SessionApp.context.socialSteps,
		});
		article.querySelector(":scope > p").textContent = post.text;
		article.querySelector(":scope > p").dataset.noticeRecord = post.id;
		const area = article.querySelector(".inline-editor textarea");
		area.id = "text-" + post.id;
		article.querySelector(".inline-editor").id = "editor-" + post.id;
		article.querySelector(".inline-editor label").htmlFor = area.id;
		SGGInlinePerson.render(
			article.querySelector(".inline-editor label"),
			[
				...SGGI18n.t("asset.replyTo")
					.split("{name}")
					.flatMap((text, i) => (i ? [{ personId: post.author }, text] : [text])),
			],
			{
				identities: SGGProductLanguage.identities(SessionApp.context),
				viewerId: SessionApp.context.viewer,
			},
		);
		article.querySelector(".reply-root").setAttribute("aria-controls", "editor-" + post.id);
		article.querySelector(".reply-region").id = "replies-" + post.id;
		SGGI18n.bind(article.querySelector(".reply-region"), "asset.replyThread", {
			attr: "aria-label",
			values: { name: post.name },
		});
		article.querySelector(".reply-count").setAttribute("aria-controls", "replies-" + post.id);
		feed.append(article);
	}
	if (!ThreadData.length) {
		const empty = document.createElement("p");
		empty.className = "preview-empty";
		SGGI18n.bind(empty, "asset.noPosts");
		feed.append(empty);
	}
}

const ThreadControllers = new Map();
for (const post of ThreadData) {
	const article = document.querySelector(`[data-post="${post.id}"]`),
		region = article.querySelector(".reply-region"),
		list = article.querySelector(".reply-list"),
		toggle = article.querySelector(".reply-count"),
		bottom = article.querySelector(".reply-bottom"),
		editor = article.querySelector(".inline-editor"),
		area = editor.querySelector("textarea"),
		open = article.querySelector(".reply-root"),
		localError = article.querySelector(".inline-error");
	let expanded = stateName === "expanded" && post.id === "p1";
	function draw(animate = false) {
		const replies = expanded ? post.replies : post.replies.slice(-2);
		region.hidden = post.replies.length === 0;
		if (!list.children.length)
			list.innerHTML = post.replies
				.map(
					(r) =>
						`<li class="thread-reply" data-notice-record="${escapeText(r.id || "")}"><span class="avatar" aria-hidden="true">${window.SessionApp ? SGGIdentity.avatar(r.author, "reply") : escapeText(r.initial)}</span><div class="reply-content"><div class="reply-heading"><strong>${window.SessionApp ? SGGInlinePerson.html(r.author, SGGProductLanguage.identities(SessionApp.context), { viewerId: SessionApp.context.viewer, selfMarker: true }) : escapeText(r.name)}</strong><small>${window.SessionApp ? SGGProductLanguage.stamp({ round: r.round, step: r.step, steps: SessionApp.context.socialSteps }) : "第 " + r.round + " 轮 · 社交 1/1 步"}</small></div><p>${escapeText(r.text)}</p></div></li>`,
				)
				.join("");
		if (toggle) {
			toggle.hidden = post.replies.length <= 2;
			toggle.setAttribute("aria-expanded", String(expanded));
			SGGI18n.bind(
				toggle.querySelector("span"),
				expanded ? "asset.collapseDiscussion" : "asset.replyCount",
				{ values: { count: post.replies.length } },
			);
		}
		bottom.hidden = !expanded || post.replies.length <= 2;
		[...list.children].forEach((item, i) => {
			const show = expanded || i >= post.replies.length - 2,
				wasHidden = item.hidden;
			item.hidden = !show;
			SGGMotion.cancel(item);
			if (animate && !reduce.matches && show && wasHidden)
				SGGMotion.reveal(item, { role: "state" });
		});
		article.dataset.expanded = String(expanded);
		SGGI18n.bindAllAnnotated(article);
	}
	toggle?.addEventListener("click", (e) => {
		toggle.style.setProperty("--reply-turn", e.detail === 0 ? "0ms" : "160ms");
		expanded = !expanded;
		draw(e.detail !== 0);
	});
	bottom.onclick = (e) => {
		expanded = false;
		draw(false);
		toggle.focus({ preventScroll: true });
		toggle.scrollIntoView({ block: "nearest", behavior: "instant" });
	};
	draw();
	SGGI18n.observe(article, () => {
		SGGI18n.bindAllAnnotated(article);
		if (window.SessionApp) {
			article.querySelector(".author small").textContent = SGGProductLanguage.stamp({
				round: post.round,
				step: post.step,
				steps: SessionApp.context.socialSteps,
			});
			SGGInlinePerson.render(
				editor.querySelector("label"),
				SGGI18n.t("asset.replyTo")
					.split("{name}")
					.flatMap((text, i) => (i ? [{ personId: post.author }, text] : [text])),
				{
					identities: SGGProductLanguage.identities(SessionApp.context),
					viewerId: SessionApp.context.viewer,
				},
			);
			for (const [i, row] of [...list.children].entries()) {
				const reply = post.replies[i];
				if (reply)
					row.querySelector("small").textContent = SGGProductLanguage.stamp({
						round: reply.round,
						step: reply.step,
						steps: SessionApp.context.socialSteps,
					});
			}
		}
	});
	ThreadControllers.set(post.id, {
		article,
		isExpanded: () => expanded,
		collapse: () => {
			expanded = false;
			draw(false);
		},
	});
	article.dataset.expandable = String(post.replies.length > 2);
	if (toggle)
		SGGI18n.bind(toggle, "asset.toggleReplies", {
			attr: "aria-label",
			values: { name: post.name, count: post.replies.length },
		});
	area.value = threadDrafts[post.id] || "";
	function saveDraft() {
		if (window.__SGG_RETIRED__) return true;
		threadDrafts[post.id] = area.value;
		try {
			if (new URLSearchParams(location.search).get("storage") === "fail") throw Error("blocked");
			localStorage.setItem(threadDraftKey, JSON.stringify(threadDrafts));
			SGGControls.clearError(localError, "draft");
			return true;
		} catch {
			SGGControls.showError(localError, SGGI18n.t("asset.saveDraft"), "draft");
			return false;
		}
	}
	area.oninput = saveDraft;
	if (String(post.id).startsWith("pending:")) {
		open.disabled = true;
		open.hidden = true;
	}
	open.onclick = (e) => {
		if (!closeNewpostForReply()) return;
		for (const other of document.querySelectorAll(".inline-editor")) {
			if (other !== editor) {
				SGGMotion.cancel(other);
				other.hidden = true;
				other
					.closest(".thread")
					.querySelector(".reply-root")
					.setAttribute("aria-expanded", "false");
			}
		}
		editor.hidden = false;
		open.setAttribute("aria-expanded", "true");
		SGGMotion.cancel(editor);
		editor.scrollIntoView({ block: "nearest", behavior: "instant" });
		area.focus({ preventScroll: true });
		if (e.detail !== 0 && !reduce.matches) SGGMotion.reveal(editor, { role: "state" });
	};
	editor.querySelector(".close-inline").onclick = () => {
		if (!saveDraft()) return;
		SGGMotion.cancel(editor);
		editor.hidden = true;
		open.setAttribute("aria-expanded", "false");
		open.focus({ preventScroll: true });
		open.scrollIntoView({ block: "nearest", behavior: "instant" });
		schedule();
	};
	editor.querySelector(".send-reply").onclick = () => {
		if (!saveDraft()) return;
		if (window.SessionApp) {
			SessionApp.submit(editor.querySelector(".send-reply"), "forum.post", {
				text: area.value,
				parent: post.id,
			})
				.then(() => {
					SGGControls.clearError(localError, "submit");
					area.value = "";
					saveDraft();
					SessionApp.refresh();
				})
				.catch((e) => SGGControls.showError(localError, e.message, "submit"));
		} else parent.postMessage({ q74: "submit-preview" }, "*");
	};
}
if (["preview", "expanded", "one", "empty"].includes(stateName)) scroller.scrollTop = 96;

// Pointer/touch card affordance delegates to the native disclosure button.
for (const controller of ThreadControllers.values()) {
	const article = controller.article,
		toggle = article.querySelector(".reply-count");
	article.addEventListener("click", (event) => {
		if (
			event.target.closest(
				"button,a,input,textarea,select,label,.author,.reply-region,.inline-editor",
			)
		)
			return;
		if (!toggle || toggle.hidden || !getSelection()?.isCollapsed) return;
		toggle.dispatchEvent(new MouseEvent("click", { detail: event.detail, bubbles: false }));
	});
}
let foldIntent = false,
	foldDirection = 0,
	foldTimer = 0,
	foldGeneration = 0,
	foldMutating = false,
	foldHeld = false,
	foldLastScroll = scroller.scrollTop;
const nativeScrollEnd = "onscrollend" in scroller;
function cancelFold() {
	clearTimeout(foldTimer);
	foldTimer = 0;
}
function selectedIn(article) {
	const selection = getSelection();
	return (
		selection &&
		!selection.isCollapsed &&
		(article.contains(selection.anchorNode) || article.contains(selection.focusNode))
	);
}
function tryFold(token) {
	foldTimer = 0;
	if (
		token !== foldGeneration ||
		!foldIntent ||
		foldDirection <= 0 ||
		foldHeld ||
		foldMutating ||
		document.hidden ||
		composerOpen() ||
		document.querySelector(".inline-editor:not([hidden])")
	)
		return;
	const rect = scroller.getBoundingClientRect(),
		top = rect.top + 56,
		bottom = rect.bottom,
		readingLine = top + Math.min(80, (bottom - top) * 0.25);
	const controllers = [...ThreadControllers.values()];
	const visible =
		controllers.find((c) => {
			const r = c.article.getBoundingClientRect();
			return r.top <= readingLine && r.bottom > readingLine;
		}) ||
		controllers.find((c) => {
			const r = c.article.getBoundingClientRect();
			return r.bottom > top && r.top < bottom;
		});
	if (!visible) {
		foldIntent = false;
		return;
	}
	const candidates = controllers.filter(
		(c) =>
			c !== visible &&
			c.isExpanded() &&
			c.article.getBoundingClientRect().bottom < top - 24 &&
			!selectedIn(c.article) &&
			!(keyboard && c.article.contains(document.activeElement)),
	);
	if (!candidates.length) {
		foldIntent = false;
		return;
	}
	// Collapse only after native scrolling has settled; keep the current post fixed.
	const before = visible.article.getBoundingClientRect().top;
	foldMutating = true;
	foldIntent = false;
	for (const c of candidates) {
		c.collapse();
		c.article.dataset.autoCollapsed = "true";
	}
	const delta = visible.article.getBoundingClientRect().top - before;
	scroller.scrollTop += delta;
	scroller.dataset.lastAnchorShift = String(visible.article.getBoundingClientRect().top - before);
	scroller.dataset.autoFoldCount = String(
		Number(scroller.dataset.autoFoldCount || 0) + candidates.length,
	);
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			foldMutating = false;
			foldLastScroll = scroller.scrollTop;
			schedule();
		}),
	);
}
function armFold() {
	cancelFold();
	if (foldIntent && foldDirection > 0 && !foldMutating) {
		const token = foldGeneration;
		foldTimer = setTimeout(() => tryFold(token), 160);
	}
}
scroller.addEventListener(
	"wheel",
	(event) => {
		if (event.deltaY) {
			foldIntent = true;
			foldDirection = Math.sign(event.deltaY);
			cancelFold();
		}
	},
	{ passive: true },
);
let touchY = null;
scroller.addEventListener(
	"touchstart",
	(event) => {
		touchY = event.touches[0]?.clientY;
		cancelFold();
	},
	{ passive: true },
);
scroller.addEventListener(
	"touchmove",
	(event) => {
		const y = event.touches[0]?.clientY;
		if (y != null && touchY != null && Math.abs(touchY - y) > 1) {
			foldIntent = true;
			foldDirection = Math.sign(touchY - y);
			cancelFold();
		}
		touchY = y;
	},
	{ passive: true },
);
scroller.addEventListener("keydown", (event) => {
	const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key),
		up = ["ArrowUp", "PageUp", "Home"].includes(event.key);
	if ((down || up) && !event.target.closest("input,textarea,select")) {
		foldIntent = true;
		foldDirection = up || event.shiftKey ? -1 : 1;
		cancelFold();
	}
});
scroller.addEventListener(
	"pointerdown",
	() => {
		foldHeld = true;
		foldIntent = false;
		cancelFold();
	},
	{ passive: true },
);
for (const type of ["pointerup", "pointercancel"])
	document.addEventListener(
		type,
		() => {
			foldHeld = false;
			armFold();
		},
		{ passive: true },
	);
scroller.addEventListener(
	"scroll",
	() => {
		if (foldMutating) return;
		const delta = scroller.scrollTop - foldLastScroll;
		foldLastScroll = scroller.scrollTop;
		if (foldHeld && Math.abs(delta) > 1) {
			foldIntent = true;
			foldDirection = Math.sign(delta);
		}
		foldGeneration++;
		cancelFold();
		if (!nativeScrollEnd) armFold();
	},
	{ passive: true },
);
if (nativeScrollEnd) scroller.addEventListener("scrollend", armFold, { passive: true });
document.addEventListener("visibilitychange", () => {
	cancelFold();
	foldIntent = false;
});
window.addEventListener("message", (event) => {
	if (
		event.source === parent &&
		event.data?.q76Control === "next" &&
		!composerOpen() &&
		!document.querySelector(".inline-editor:not([hidden])")
	) {
		const next = document.querySelector("[data-post=p2]"),
			rect = scroller.getBoundingClientRect();
		foldIntent = true;
		foldDirection = 1;
		scroller.scrollBy({
			top: next.getBoundingClientRect().top - (rect.top + 16),
			behavior: reduce.matches || event.data.instant ? "instant" : "smooth",
		});
	}
});

if (stateName === "editing") {
	field.value = "我愿意先从小额开始，看看彼此的实际选择，再决定下一步。";
	refreshSubmit();
	openEditor(false);
}

// Reading state is local to this participation and window, independent of drafts and service errors.
if (window.SessionApp) {
	const c = SessionApp.context,
		key = ["q146.forum-reading", c.room, c.viewer, c.participation, c.window].join(":");
	let saved = null,
		ready = false,
		visible = true,
		restorePending = true,
		readingFrame = 0,
		lastTop = 0;
	try {
		const value = JSON.parse(sessionStorage.getItem(key) || "null");
		if (
			value &&
			Number.isFinite(value.top) &&
			value.top >= 0 &&
			Array.isArray(value.expanded) &&
			value.expanded.every((id) => typeof id === "string")
		)
			saved = value;
	} catch {}
	lastTop = saved?.top || 0;
	function rememberReading() {
		if (!ready || window.__SGG_RETIRED__) return;
		saved = {
			top: lastTop,
			expanded: [...ThreadControllers.entries()]
				.filter(([, item]) => item.isExpanded())
				.map(([id]) => id),
		};
		try {
			sessionStorage.setItem(key, JSON.stringify(saved));
		} catch {}
	}
	function restoreReading() {
		if (!visible || window.__SGG_RETIRED__ || scroller.clientHeight <= 0) return;
		// A hidden/rebuilt iframe can report zero before it has a layout. Restore only once measurable.
		restorePending = true;
		if (saved) {
			for (const id of saved.expanded) {
				const item = ThreadControllers.get(id);
				if (item && !item.isExpanded()) item.article.querySelector(".reply-count")?.click();
			}
			scroller.scrollTop = saved.top;
		}
		lastTop = scroller.scrollTop;
		ready = true;
		restorePending = false;
		schedule();
	}
	for (const [, item] of ThreadControllers) {
		item.article.querySelector(".reply-count")?.addEventListener("click", () => {
			if (!restorePending) rememberReading();
		});
		item.article.querySelector(".reply-bottom")?.addEventListener("click", rememberReading);
	}
	scroller.addEventListener(
		"scroll",
		() => {
			if (!ready || restorePending || !visible || scroller.clientHeight <= 0) return;
			lastTop = scroller.scrollTop;
			cancelAnimationFrame(readingFrame);
			readingFrame = requestAnimationFrame(rememberReading);
		},
		{ passive: true },
	);
	new ResizeObserver(() => {
		if (scroller.clientHeight <= 0) {
			restorePending = true;
			return;
		}
		if (restorePending) restoreReading();
	}).observe(scroller);
	addEventListener("pagehide", rememberReading);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) rememberReading();
	});
	addEventListener("message", (event) => {
		if (event.source !== parent || event.data?.channel !== "q146-app-visibility") return;
		if (!event.data.visible) {
			rememberReading();
			visible = false;
			restorePending = true;
		} else {
			visible = true;
			restoreReading();
		}
	});
	requestAnimationFrame(restoreReading);
}
