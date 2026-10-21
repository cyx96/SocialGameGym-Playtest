const creator = document.querySelector(".dm-create"),
	firstMessage = document.querySelector("#first-message"),
	createSubmit = document.querySelector(".create-submit"),
	memberChoices = document.querySelector(".member-options"),
	memberWrap = document.querySelector(".member-options-wrap");
const workspace = document.querySelector(".dm-workspace"),
	list = document.querySelector(".dm-list-scroll"),
	rows = document.querySelector(".conversation-rows"),
	indicator = document.querySelector(".selection-indicator"),
	chat = document.querySelector(".dm-chat"),
	empty = document.querySelector(".dm-empty"),
	flow = document.querySelector(".message-flow"),
	messages = document.querySelector(".dm-messages"),
	input = document.querySelector("#message-input"),
	error = document.querySelector(".draft-error"),
	send = document.querySelector(".send-message"),
	reduce = matchMedia("(prefers-reduced-motion: reduce)"),
	mobile = matchMedia("(max-width:760px)"),
	back = document.querySelector(".dm-back"),
	newButton = document.querySelector(".new-conversation");
const query = new URLSearchParams(location.search),
	state = query.get("state"),
	key = window.SessionApp
		? SessionApp.scope + ":dm-draft"
		: "sgg-q82-dm-room-trust4-player01-social1-v1:" + (state || "live");
let saved = {};
try {
	saved = JSON.parse(localStorage.getItem(key) || "{}");
} catch {}
let creating = false,
	membersOpen = true,
	createKeyboard = false,
	createDraft = saved.createDraft || { members: [], text: "", scroll: 0 };
let selected = null,
	lastSelected = null,
	drafts = saved.drafts || {},
	positions = saved.positions || {},
	read = new Set(saved.read || []),
	listTop = Number(saved.listTop) || 0,
	activeAnimation = null,
	lastMotion = -Infinity,
	scrollTimer = 0;
let conversations = [
	{
		id: "c1",
		members: ["林舟", "你"],
		initials: ["林"],
		summary: "下一步我会参考实际行动。",
		messages: [
			{ by: "林舟", text: "我愿意先从小额开始，看看彼此的选择。" },
			{ by: "你", text: "可以，我们先把各自的考虑说清楚。" },
			{ by: "林舟", text: "下一步我会参考实际行动。" },
		],
	},
	{
		id: "c2",
		members: ["许知", "你"],
		initials: ["许"],
		summary: "我愿意继续合作。",
		unread: true,
		messages: [
			{ by: "许知", text: "我愿意继续合作，也想听听你的考虑。" },
			{ by: "你", text: "我会参考这一轮的实际结果。" },
		],
	},
	{
		id: "c3",
		members: ["许知", "周遥", "你"],
		initials: ["许", "周"],
		summary: "先了解彼此的选择。",
		messages: [
			{ by: "许知", text: "我们先把各自的考虑说清楚。" },
			{ by: "许知", text: "也想听听大家的想法。" },
			{ by: "周遥", text: "先了解彼此的选择，再决定下一步。" },
			{ by: "你", text: "我会先观察这一轮的结果。" },
		],
	},
];
if (state === "empty") conversations = [];
if (window.SessionApp) {
	const ctx = SessionApp.context,
		name = (id) => (id === ctx.viewer ? "你" : ctx.people.find((p) => p.id === id)?.name || "玩家");
	conversations = ctx.conversations.map((c) => ({
		id: c.id,
		members: c.members.map(name),
		memberIds: c.members,
		unread: (ctx.appNotices?.dm || []).includes(c.id),
		summary: c.messages.at(-1)?.text || "",
		messages: c.messages.map((m) => ({
			id: m.id,
			noticeRecordId: m.noticeRecordId || m.id,
			by: name(m.author),
			authorId: m.author,
			round: m.round,
			step: m.step,
			text: m.text,
		})),
	}));
}
if (state === "long")
	conversations[2].messages = Array.from({ length: 18 }, (_, i) => ({
		by: ["许知", "周遥", "你"][i % 3],
		text:
			i % 4 === 0
				? "我会结合前面的实际选择来判断，而不是只看承诺。\n如果结果与预期不同，我们也可以继续把各自的考虑说清楚。"
				: "先了解彼此的选择，再决定下一步。".repeat((i % 3) + 1),
	}));
const escapeText = (v) =>
	String(v).replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
	);
const Players = window.SessionApp
	? SessionApp.context.people.filter((p) => p.id !== SessionApp.context.viewer)
	: ["lin", "xu", "zhou"].map((id) => SGGIdentity.people[id]);
function portrait(p) {
	return SGGIdentity.avatar(p.id);
}
function avatar(c) {
	if (window.SessionApp && c.memberIds) {
		const others = c.memberIds.filter((id) => id !== SessionApp.context.viewer);
		return others.length > 1 ? SGGIdentity.group() : SGGIdentity.avatar(others[0]);
	}
	const people = c.members.filter((n) => n !== "你");
	return people.length > 1 ? SGGIdentity.group() : SGGIdentity.avatar(people[0]);
}
function conversationTitle(c) {
	if (window.SessionApp && c.memberIds) {
		const ctx = SessionApp.context;
		return c.memberIds
			.filter((id) => id !== ctx.viewer)
			.map((id) => ctx.people.find((p) => p.id === id)?.name || "该玩家")
			.join("、");
	}
	return c.members.map(memberLabel).join("、");
}
function memberLabel(n) {
	return n === "你"
		? (window.SessionApp
				? SessionApp.context.people.find((p) => p.id === SessionApp.context.viewer).name
				: "玩家 01") + "（你）"
		: n;
}

function snapshot() {
	return { selected, drafts, positions, read: [...read], listTop, creating, createDraft };
}
function showError(node, text, source) {
	node.dataset.errorSource = source;
	node.textContent = text;
	node.hidden = false;
	node.scrollIntoView({ block: "nearest", behavior: "instant" });
}
function clearDraftError(node) {
	if (node.dataset.errorSource === "draft") node.hidden = true;
}
function write() {
	if (window.__SGG_RETIRED__) return true;
	try {
		if (query.get("storage") === "fail") throw Error("blocked");
		localStorage.setItem(key, JSON.stringify(snapshot()));
		clearDraftError(error);
		clearDraftError(creator.querySelector(".create-error"));
		return true;
	} catch {
		const n = creating ? creator.querySelector(".create-error") : selected ? error : null;
		if (n) showError(n, "草稿暂时无法保存，请保留当前页面。", "draft");
		return false;
	}
}
function cache() {
	if (selected) {
		drafts[selected] = input.value;
		positions[selected] = messages.scrollTop;
	}
}
function saveCurrent() {
	cache();
	return write();
}
function resizeInput() {
	input.style.height = "auto";
	const style = getComputedStyle(input);
	input.style.height =
		Math.min(
			parseFloat(style.maxHeight),
			Math.max(parseFloat(style.minHeight), input.scrollHeight),
		) + "px";
	const pendingTarget = window.SessionApp && String(selected).startsWith("pending:");
	input.disabled = !!pendingTarget;
	send.disabled =
		!!pendingTarget ||
		!input.value.trim() ||
		(window.SessionApp && (SessionApp.readonly || SessionApp.context.remaining <= 0));
}
function rowFor(id) {
	return rows.querySelector(`[data-conversation="${id}"]`);
}
function moveIndicator(instant = false) {
	const row = creating ? null : rowFor(selected);
	if (!row) {
		indicator.hidden = true;
		return;
	}
	const first = indicator.hidden;
	indicator.hidden = false;
	indicator.dataset.instant = String(first || instant || reduce.matches);
	indicator.style.height = row.offsetHeight + "px";
	indicator.style.transform = `translateY(${row.offsetTop}px)`;
	if (first || instant || reduce.matches) indicator.offsetHeight;
}
function markRows(instant = false) {
	for (const c of conversations) {
		const row = rowFor(c.id);
		row.setAttribute("aria-current", String(c.id === selected && !creating));
		const unread = !!c.unread && !read.has(c.id);
		row.classList.toggle("unread", unread);
		row.setAttribute(
			"aria-label",
			conversationTitle(c) + "，" + c.summary + (unread ? "，有未读消息" : ""),
		);
		row.querySelector(".unread-dot").hidden = !unread;
	}
	moveIndicator(instant);
}
function animateView(el, instant = false, direction = 1) {
	activeAnimation?.cancel();
	activeAnimation = null;
	const now = performance.now(),
		quick = now - lastMotion < 160;
	lastMotion = now;
	activeAnimation = SGGMotion.scene(el, {
		direction: mobile.matches ? (direction === 1 ? "forward" : "back") : "replace",
		immediate: instant || quick,
	});
	const anim = activeAnimation;
	if (anim)
		anim.finished
			.catch(() => {})
			.finally(() => {
				if (activeAnimation === anim) activeAnimation = null;
			});
}
function renderConversation(c) {
	document.querySelector(".chat-avatar").innerHTML = avatar(c);
	document.querySelector("#conversation-title").textContent = conversationTitle(c);
	const groups = [];
	for (const m of c.messages) {
		const previous = groups.at(-1);
		if (
			previous &&
			(window.SessionApp
				? previous.authorId === m.authorId && previous.round === m.round && previous.step === m.step
				: previous.by === m.by)
		)
			previous.items.push(m);
		else groups.push({ by: m.by, authorId: m.authorId, round: m.round, step: m.step, items: [m] });
	}
	flow.innerHTML = groups
		.map((g, index) => {
			const self = window.SessionApp ? g.authorId === SessionApp.context.viewer : g.by === "你",
				ctx = window.SessionApp?.context,
				stamp = ctx
					? SGGProductLanguage.stamp({ round: g.round, step: g.step, steps: ctx.socialSteps })
					: "第 3 轮 · 社交 1/1 步",
				previous = groups[index - 1],
				showStamp = !previous || previous.round !== g.round || previous.step !== g.step;
			return (
				(showStamp && stamp ? `<p class="step-label">${escapeText(stamp)}</p>` : "") +
				`<div class="message ${self ? "self" : ""}" data-author="${escapeText(g.by)}">${self ? "" : SGGIdentity.avatar(ctx ? g.authorId : g.by, "message")}<div class="message-content">${self ? "" : `<span class="message-name">${ctx ? SGGInlinePerson.html(g.authorId, SGGProductLanguage.identities(ctx)) : escapeText(g.by)}</span>`}${g.items.map((m) => `<div class="bubble" data-notice-record="${escapeText(m.noticeRecordId || m.id || "")}">${escapeText(m.text)}</div>`).join("")}</div></div>`
			);
		})
		.join("");
	input.value = drafts[c.id] || "";
	resizeInput();
	messages.scrollTop = positions[c.id] ?? messages.scrollHeight;
}

function syncView() {
	const opened = !!selected;
	workspace.dataset.view = creating ? "create" : opened ? "conversation" : "list";
	chat.hidden = creating || !opened;
	empty.hidden = creating || opened;
	creator.hidden = !creating;
	back.setAttribute(
		"aria-label",
		creating ? "返回私信" : mobile.matches && opened ? "返回会话列表" : "返回应用桌面",
	);
	const readonly = Boolean(window.SessionApp && SessionApp.readonly);
	// A narrow empty list needs its creation action in the App toolbar; the wide
	// workspace offers the same action beside its empty-state message instead.
	newButton.hidden = creating || readonly || (!mobile.matches && conversations.length === 0);
	workspace.classList.toggle("empty-workspace", conversations.length === 0);
	empty.querySelector("p").textContent = conversations.length ? "选择一个会话" : "还没有会话";
	empty.querySelector("button").hidden = conversations.length > 0 || readonly || mobile.matches;
}
function selectConversation(id, instant = false, initial = false) {
	if (creating) {
		if (!saveCreateDraft()) return false;
		creating = false;
		syncView();
		markRows(instant);
	}
	const c = conversations.find((x) => x.id === id);
	if (!c) return false;
	if (selected === id) {
		if (mobile.matches)
			document.querySelector("#conversation-title").focus({ preventScroll: true });
		return true;
	}
	if (selected && !saveCurrent()) return false;
	selected = id;
	lastSelected = id;
	read.add(id);
	error.hidden = true;
	syncView();
	renderConversation(c);
	markRows(instant || initial);
	write();
	if (!initial) {
		animateView(mobile.matches ? chat : flow, instant);
		if (mobile.matches)
			document.querySelector("#conversation-title").focus({ preventScroll: true });
	}
	return true;
}
function returnToList(instant = false) {
	if (!saveCurrent()) return;
	const previous = selected;
	selected = null;
	syncView();
	markRows(true);
	list.scrollTop = listTop;
	write();
	animateView(document.querySelector(".dm-list-pane"), instant, -1);
	rowFor(previous)?.focus({ preventScroll: true });
}
function fixture(action) {
	if (creating && !saveCreateDraft()) return;
	cache();
	if (selected && !write()) return;
	parent.postMessage({ q82: "fixture-action", action }, "*");
}
for (const c of conversations) {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "conversation-row";
	button.dataset.conversation = c.id;
	button.setAttribute("aria-current", "false");
	button.innerHTML =
		avatar(c) +
		`<span class="conversation-copy"><strong>${escapeText(conversationTitle(c))}</strong><p>${escapeText(c.summary)}</p></span><span class="unread-dot" aria-label="有未读消息" hidden></span>`;
	button.onclick = (e) => selectConversation(c.id, e.detail === 0);
	rows.append(button);
}
input.addEventListener("input", () => {
	resizeInput();
	cache();
	write();
});
messages.addEventListener(
	"scroll",
	() => {
		if (!selected) return;
		positions[selected] = messages.scrollTop;
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => write(), 160);
	},
	{ passive: true },
);
list.addEventListener(
	"scroll",
	() => {
		if (mobile.matches && selected) return;
		listTop = list.scrollTop;
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => write(), 160);
	},
	{ passive: true },
);
send.onclick = () => {
	if (!input.value.trim() || !saveCurrent()) return;
	if (window.SessionApp) {
		SessionApp.submit(send, "dm.send", { conversation: selected, text: input.value })
			.then(() => {
				input.value = "";
				cache();
				write();
				SessionApp.refresh();
			})
			.catch((e) => showError(error, e.message, "submit"));
	} else parent.postMessage({ q82: "submit-preview" }, "*");
};
back.onclick = (e) => {
	if (creating) {
		closeCreate(e.detail === 0);
		return;
	}
	if (mobile.matches && selected) returnToList(e.detail === 0);
	else if (window.SessionApp) SessionApp.close();
	else fixture("返回应用桌面");
};
newButton.onclick = (e) => openCreate(e.detail === 0);
empty.querySelector("button").onclick = (e) => openCreate(e.detail === 0);
document
	.querySelectorAll(".reading button")
	.forEach((el) => (el.onclick = () => fixture(el.textContent)));
SGGMotion.onSettle(() => {
	activeAnimation?.cancel();
	moveIndicator(true);
	if (creating) setMembersOpen(membersOpen, true);
});
new ResizeObserver(resizeInput).observe(input.parentElement);
mobile.addEventListener("change", () => {
	activeAnimation?.cancel();
	syncView();
	moveIndicator(true);
	resizeInput();
});
new ResizeObserver(() => moveIndicator(true)).observe(rows);
reduce.addEventListener("change", () => {
	activeAnimation?.cancel();
	moveIndicator(true);
	if (creating) setMembersOpen(membersOpen, true);
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		activeAnimation?.cancel();
		cache();
		write();
	}
});
let initial =
	state === "list" || state === "empty"
		? null
		: conversations.some((c) => c.id === saved.selected)
			? saved.selected
			: state === "conversation"
				? "c1"
				: state === "group" || state === "long"
					? "c3"
					: null;
syncView();
markRows(true);
list.scrollTop = listTop;
if (initial) selectConversation(initial, true, true);
workspace.dataset.ready = "true";

function renderRoster() {
	const ids = new Set(createDraft.members);
	document.querySelector(".recipient-chips").innerHTML =
		'<span class="self-chip">' +
		SGGIdentity.avatar(window.SessionApp ? SessionApp.context.viewer : "self", "reply") +
		"<span>" +
		escapeText(
			window.SessionApp
				? SessionApp.context.people.find((p) => p.id === SessionApp.context.viewer).name
				: "玩家 01",
		) +
		'</span><span class="sg-self">你</span></span>' +
		Players.filter((p) => ids.has(p.id))
			.map(
				(p) =>
					`<span class="recipient-chip" data-id="${p.id}">${SGGIdentity.avatar(p.id, "reply")}<span>${escapeText(p.name)}</span><button type="button" data-remove="${p.id}" aria-label="移除${escapeText(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></span>`,
			)
			.join("");
	for (const box of creator.querySelectorAll("[data-player]"))
		box.checked = ids.has(box.dataset.player);
	createSubmit.disabled =
		!ids.size ||
		!firstMessage.value.trim() ||
		(window.SessionApp && (SessionApp.readonly || SessionApp.context.remaining <= 0));
	creator.querySelector(".create-note").textContent = "创建后成员固定；消息在本步结束后送达。";
}
function setMembersOpen(value, instant = false) {
	membersOpen = value;
	memberWrap.inert = !value;
	memberWrap.style.transition =
		instant || reduce.matches
			? "none"
			: "height " +
				SGGMotion.options(value ? "expand" : "collapse").duration +
				"ms " +
				SGGMotion.options().easing;
	memberWrap.style.height = value ? memberChoices.scrollHeight + "px" : "0px";
	creator.querySelector(".edit-members").textContent = value ? "收起" : "编辑";
	creator.querySelector(".edit-members").setAttribute("aria-expanded", String(value));
	creator
		.querySelector(".edit-members")
		.setAttribute("aria-label", value ? "收起成员" : "选择成员");
	if (instant || reduce.matches) memberWrap.offsetHeight;
}
function saveCreateDraft() {
	createDraft.text = firstMessage.value;
	createDraft.scroll = creator.querySelector(".create-body").scrollTop;
	return write();
}
function openCreate(instant = false) {
	if (creating) return true;
	if (selected && !saveCurrent()) return false;
	creating = true;
	syncView();
	markRows(true);
	firstMessage.value = createDraft.text;
	renderRoster();
	setMembersOpen(!createDraft.members.length, true);
	creator.querySelector(".create-body").scrollTop = createDraft.scroll || 0;
	creator.querySelector(".create-error").hidden = true;
	write();
	animateView(creator, instant);
	return true;
}
function closeCreate(instant = false) {
	if (!saveCreateDraft()) return false;
	creating = false;
	syncView();
	markRows(true);
	write();
	newButton.focus({ preventScroll: true });
	animateView(
		selected ? chat : mobile.matches ? document.querySelector(".dm-list-pane") : empty,
		instant,
		-1,
	);
	return true;
}
memberChoices.innerHTML = Players.map(
	(p) =>
		`<label class="member-option"><input type="checkbox" data-player="${p.id}" value="${p.id}">${portrait(p)}<span class="member-name">${escapeText(p.name)}</span><span class="member-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span></label>`,
).join("");
creator.addEventListener("pointerdown", () => (createKeyboard = false));
creator.addEventListener("keydown", (e) => {
	createKeyboard = true;
	if (e.key === "Escape" && !e.isComposing) {
		e.preventDefault();
		closeCreate(true);
	}
});
memberChoices.addEventListener("change", (e) => {
	const box = e.target.closest("[data-player]");
	if (!box) return;
	const values = new Set(createDraft.members);
	if (box.checked) values.add(box.value);
	else values.delete(box.value);
	createDraft.members = Players.filter((p) => values.has(p.id)).map((p) => p.id);
	renderRoster();
	saveCreateDraft();
});
creator.querySelector(".recipient-chips").addEventListener("click", (e) => {
	const remove = e.target.closest("[data-remove]");
	if (!remove) return;
	createDraft.members = createDraft.members.filter((id) => id !== remove.dataset.remove);
	renderRoster();
	saveCreateDraft();
});
creator.querySelector(".edit-members").onclick = (e) => {
	createKeyboard = e.detail === 0;
	setMembersOpen(!membersOpen, createKeyboard);
};
firstMessage.addEventListener("focus", () => setMembersOpen(false, SGGMotion.instant()));
firstMessage.addEventListener("input", () => {
	createDraft.text = firstMessage.value;
	renderRoster();
	saveCreateDraft();
});
createSubmit.onclick = () => {
	if (!createDraft.members.length || !firstMessage.value.trim() || !saveCreateDraft()) return;
	if (window.SessionApp) {
		SessionApp.submit(createSubmit, "dm.send", {
			members: createDraft.members,
			text: firstMessage.value,
		})
			.then((ctx) => {
				selected =
					ctx.conversations.find(
						(c) =>
							c.messages.some(
								(m) =>
									m.delivered === false && m.author === ctx.viewer && m.text === createDraft.text,
							) && createDraft.members.every((id) => c.members.includes(id)),
					)?.id || null;
				createDraft = { members: [], text: "", scroll: 0 };
				creating = false;
				firstMessage.value = "";
				write();
				SessionApp.refresh();
			})
			.catch((e) => showError(creator.querySelector(".create-error"), e.message, "submit"));
	} else parent.postMessage({ q82: "create-preview" }, "*");
};
new ResizeObserver(() => {
	if (creating && membersOpen) setMembersOpen(true, true);
}).observe(memberChoices);
if (state === "new-ready" && !saved.createDraft) {
	createDraft.members = ["xu", "zhou"];
	createDraft.text = "我们先把各自的考虑说清楚，再决定下一步。";
}
if (["new", "new-ready"].includes(state) || saved.creating) openCreate(true);
