/* Acknowledge visible content IDs from this document's authorized snapshot, never a target alone. */
(() => {
	"use strict";
	const A = window.SessionApp;
	if (!A) return;
	function returnBadge() {
		const count =
			Number.isSafeInteger(A.context.desktopUnread) && A.context.desktopUnread > 0
				? A.context.desktopUnread
				: 0;
		for (const button of document.querySelectorAll(".sg-root-back")) {
			const badge = SGGButtons.badge(button, count);
			if (badge && !badge.classList.contains("sg-desktop-unread"))
				badge.classList.add("sg-desktop-unread");
			if (count) {
				button.dataset.sgDesktopNotice = "";
				button.setAttribute("aria-description", SGGI18n.t("asset.otherAppsUnread", { count }));
			} else if (button.hasAttribute("data-sg-desktop-notice")) {
				delete button.dataset.sgDesktopNotice;
				button.removeAttribute("aria-description");
			}
		}
		// Nested list/editor Back is not a desktop action.
		for (const button of document.querySelectorAll(
			"button[data-sg-desktop-notice]:not(.sg-root-back)",
		)) {
			button.removeAttribute("aria-description");
			delete button.dataset.sgDesktopNotice;
		}

		for (const badge of document.querySelectorAll("button:not(.sg-root-back) > .sg-desktop-unread"))
			badge.remove();
	}
	new MutationObserver(returnBadge).observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["class"],
	});
	addEventListener("sgg:notice-update", returnBadge);
	SGGI18n.observe(document.body, returnBadge);
	returnBadge();
	if (A.app === "profile") return;
	let visible = true,
		scheduled = false;
	const acknowledged = new Set();
	const inView = (node) => {
		if (!node || !node.getClientRects().length) return false;
		const r = node.getBoundingClientRect();
		let left = Math.max(r.left, 0),
			right = Math.min(r.right, innerWidth),
			top = Math.max(r.top, 0),
			bottom = Math.min(r.bottom, innerHeight);
		for (let parent = node.parentElement; parent; parent = parent.parentElement) {
			const style = getComputedStyle(parent),
				box = parent.getBoundingClientRect();
			if (/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) {
				left = Math.max(left, box.left + parent.clientLeft);
				right = Math.min(right, box.left + parent.clientLeft + parent.clientWidth);
			}
			if (/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) {
				top = Math.max(top, box.top + parent.clientTop);
				bottom = Math.min(bottom, box.top + parent.clientTop + parent.clientHeight);
			}
		}
		return (
			right > left &&
			bottom > top &&
			(right - left) * (bottom - top) >=
				Math.min(r.height, innerHeight) * Math.min(r.width, innerWidth) * 0.5
		);
	};
	function inspect() {
		scheduled = false;
		if (!visible || document.hidden) return;
		const events = A.context.appNoticeEvents?.[A.app] || {},
			pendingRecords = new Set(
				Object.values(events)
					.flat()
					.filter((id) => !acknowledged.has(id)),
			),
			visibleRecords = new Set(
				[...document.querySelectorAll("[data-notice-record]")]
					.filter((n) => pendingRecords.has(n.dataset.noticeRecord) && inView(n))
					.map((n) => n.dataset.noticeRecord),
			);
		for (const [target, ids] of Object.entries(events)) {
			let readable = [];
			if (A.app === "forum" || A.app === "dm")
				readable = ids.filter((id) => visibleRecords.has(id));
			else if (A.app === "rating") {
				const app = document.querySelector(".rating-app"),
					selected = document.querySelector("[data-player][aria-current=true]");
				if (
					(!matchMedia("(max-width:760px)").matches || app?.classList.contains("mobile-detail")) &&
					selected?.dataset.player === target &&
					inView(document.querySelector(".rating-summary"))
				)
					readable = ids;
			}
			const fresh = readable.filter((id) => !acknowledged.has(id));
			if (!fresh.length) continue;
			fresh.forEach((id) => acknowledged.add(id));
			A.request("ui.seen", { ids: [target], recordIds: fresh }).catch(() =>
				fresh.forEach((id) => acknowledged.delete(id)),
			);
		}
	}
	function schedule() {
		if (!scheduled) {
			scheduled = true;
			requestAnimationFrame(inspect);
		}
	}
	new MutationObserver(schedule).observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["hidden", "class", "aria-current"],
	});
	addEventListener("scroll", schedule, true);
	addEventListener("resize", schedule);
	addEventListener("sgg:notice-update", () => {
		if (A.app === "dm")
			for (const row of document.querySelectorAll("[data-conversation]")) {
				const dot = row.querySelector(".unread-dot");
				if (dot) dot.hidden = !A.context.appNoticeEvents?.dm?.[row.dataset.conversation]?.length;
			}
		schedule();
	});
	addEventListener("visibilitychange", schedule);
	addEventListener("message", (event) => {
		if (event.source !== parent) return;
		if (event.data?.channel === "q146-app-visibility") visible = Boolean(event.data.visible);
		schedule();
	});
	schedule();
})();
