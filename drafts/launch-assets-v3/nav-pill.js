// Shared nav pill — auto-inserts itself at top of body, highlights current page.
// Single source of truth for the tab list.

(function () {
  const TABS = [
    { href: "index.html",            label: "assets" },
    { href: "agent-icons.html",      label: "icons" },
    { href: "launch-posts-v2.html",  label: "posts v2" },
    { href: "support-pfp.html",      label: "pfp" },
    { href: "hireon-logo.html",      label: "logo" },
    { href: "lockin-collab.html",    label: "× lock-in" },
    { href: "v3.html",               label: "v3 ★" },
    { href: "v3-agent-page.html",    label: "agent page" },
    { href: "alt-fonts.html",        label: "fonts" },
  ];

  function currentPath() {
    const p = window.location.pathname;
    const m = p.match(/[^/]+$/);
    return m ? m[0] : "index.html";
  }

  function buildPill() {
    const cur = currentPath();
    const wrap = document.createElement("div");
    wrap.className = "nav-pill";

    TABS.forEach((t, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "sep";
        wrap.appendChild(sep);
      }
      const isCurrent = t.href === cur;
      const node = document.createElement(isCurrent ? "span" : "a");
      if (isCurrent) {
        node.className = "active";
        const dot = document.createElement("span");
        dot.className = "dot";
        node.appendChild(dot);
        node.appendChild(document.createTextNode(t.label));
      } else {
        node.href = t.href;
        node.textContent = t.label;
      }
      wrap.appendChild(node);
    });

    // Remove any pre-existing static pill (from earlier versions)
    document.querySelectorAll(".nav-pill").forEach((el) => el.remove());
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPill);
  } else {
    buildPill();
  }
})();
