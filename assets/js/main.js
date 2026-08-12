/* ==========================================================================
   Think Chauffeurs Melbourne — site scripts
   No dependencies. Progressive enhancement only.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) closeMenu();
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Highlight current nav item ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach(function (link) {
    var target = link.getAttribute("href");
    if (!target || target.charAt(0) === "#") return;
    if (target.split("/").pop() === here) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (!("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealables.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
        io.observe(el);
      });
    }
  }

  /* ---------- Date inputs: never allow a past pickup ---------- */
  var today = new Date();
  var minDate = today.toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach(function (input) {
    if (!input.min) input.min = minDate;
  });

  /* ---------- Current year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(today.getFullYear());
  });

  /* ---------- Formspree AJAX submission ---------- */
  var ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>'
  };

  function setStatus(box, type, message) {
    if (!box) return;
    box.className = "form-status is-visible " + (type === "ok" ? "is-ok" : "is-err");
    box.innerHTML = ICONS[type === "ok" ? "ok" : "err"] + "<span></span>";
    box.querySelector("span").textContent = message;
  }

  document.querySelectorAll("form[data-formspree]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button ? button.innerHTML : "";

    form.addEventListener("submit", function (event) {
      var action = form.getAttribute("action") || "";

      // Endpoint not configured yet — fail loudly instead of silently posting.
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        event.preventDefault();
        setStatus(
          status,
          "err",
          "Booking form is not connected yet. Replace YOUR_FORM_ID with your Formspree form ID, or call us directly."
        );
        return;
      }

      if (!form.checkValidity()) return; // let the browser show native messages

      event.preventDefault();

      if (button) {
        button.disabled = true;
        button.innerHTML = "Sending…";
      }
      if (status) status.className = "form-status";

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            setStatus(
              status,
              "ok",
              "Thank you — your request has been received. We reply to every enquiry within 30 minutes during business hours."
            );
            return;
          }
          var detail =
            result.data && Array.isArray(result.data.errors) && result.data.errors.length
              ? result.data.errors.map(function (e) { return e.message; }).join(" ")
              : "We could not send that just now. Please call us on 0424 136 433 and we will book you in.";
          setStatus(status, "err", detail);
        })
        .catch(function () {
          setStatus(
            status,
            "err",
            "Network error — please check your connection or call us on 0424 136 433."
          );
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.innerHTML = buttonText;
          }
          if (status) status.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
    });
  });
})();
