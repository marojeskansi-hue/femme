(() => {
  const C = window.FEMME, T = C.t, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const A = window.anime || null;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || !A;
  const root = document.documentElement;
  const ease = "outExpo";

  /* header: border once the hero leaves the top, floating book button on phones, active nav link */
  const hd = $("#hd"), hero = $(".hero"), fab = $(".fab");
  new IntersectionObserver(([en]) => {
    hd.classList.toggle("scrolled", !en.isIntersecting);
    fab && fab.classList.toggle("show", !en.isIntersecting);
  }, { rootMargin: "-80px 0px 0px 0px", threshold: 0.35 }).observe(hero);
  const links = $$(".nav a");
  const secObs = new IntersectionObserver(ens => ens.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => secObs.observe(s));

  /* mobile menu */
  const burger = $(".burger"), mnav = $("#mnav");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open); mnav.hidden = !open;
  });
  mnav.addEventListener("click", e => { if (e.target.closest("a")) { burger.setAttribute("aria-expanded", "false"); mnav.hidden = true; } });

  /* opening hours: today in the hero and in the table */
  const now = new Date(), wd = (now.getDay() + 6) % 7, h = C.hours[wd];
  const today = $("#today span");
  if (today) today.innerHTML = h ? `${T.today_open} <b>${h[0]}-${h[1]}</b>` : T.today_closed;
  const row = $(`#hours li[data-day="${wd}"]`); row && row.classList.add("now");

  /* price list tabs */
  const tabs = $$('.tabs [role="tab"]');
  const showTab = (btn, focus) => {
    tabs.forEach(b => { const on = b === btn; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; $("#" + b.getAttribute("aria-controls")).hidden = !on; });
    if (focus) btn.focus();
    btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: calm ? "auto" : "smooth" });
    if (!calm) {
      const p = $("#" + btn.getAttribute("aria-controls"));
      A.animate($$(".rows li", p), { opacity: [0, 1], x: [-14, 0], delay: A.stagger(28), duration: 600, ease });
      A.animate($(".panel-img", p), { opacity: [0, 1], scale: [1.04, 1], duration: 900, ease });
    }
  };
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => showTab(b));
    b.addEventListener("keydown", e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return;
      e.preventDefault(); showTab(tabs[(i + k + tabs.length) % tabs.length], true);
    });
  });
  $$(".chips a[data-tab]").forEach(a => a.addEventListener("click", () => { const b = $("#tab-" + a.dataset.tab); b && showTab(b); }));

  /* booking */
  const form = $("#bk"), svc = $("#bk-svc"), daysEl = $("#bk-days"), timesEl = $("#bk-times"), sum = $("#bk-sum");
  const st = { day: null, time: null };
  const pad = n => String(n).padStart(2, "0");
  const fmtDay = d => `${C.days[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${d.getMonth() + 1}.`;
  timesEl.dataset.empty = T.no_slots;
  const days = [];
  for (let i = 0; i < 21; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); days.push(d); }
  const short = C.lang === "hr" ? ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  days.forEach((d, i) => {
    const w = (d.getDay() + 6) % 7, open = !!C.hours[w];
    const b = document.createElement("button");
    b.type = "button"; b.className = "day"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.innerHTML = `<small>${short[w]}</small><b>${d.getDate()}</b><small>${pad(d.getMonth() + 1)}.</small>`;
    b.setAttribute("aria-label", fmtDay(d) + (open ? "" : `, ${T.closed}`));
    if (!open) { b.disabled = true; b.title = T.closed_sun; }
    b.addEventListener("click", () => pickDay(i, b));
    daysEl.appendChild(b);
  });
  const toMin = s => { const [a, b] = s.split(":").map(Number); return a * 60 + b; };
  function pickDay(i, btn) {
    st.day = days[i]; st.time = null;
    $$(".day", daysEl).forEach(b => b.setAttribute("aria-checked", b === btn));
    const [o, c] = C.hours[(st.day.getDay() + 6) % 7];
    let from = toMin(o);
    if (i === 0) { const nowM = now.getHours() * 60 + now.getMinutes() + 60; from = Math.max(from, Math.ceil(nowM / 30) * 30); }
    timesEl.innerHTML = ""; timesEl.classList.add("picked");
    for (let m = from; m <= toMin(c) - 60; m += 30) {
      const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, b = document.createElement("button");
      b.type = "button"; b.className = "tm"; b.textContent = t; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
      b.addEventListener("click", () => { st.time = t; $$(".tm", timesEl).forEach(x => x.setAttribute("aria-checked", x === b)); hideErr("time"); update(); });
      timesEl.appendChild(b);
    }
    if (!calm && timesEl.children.length) A.animate(timesEl.children, { opacity: [0, 1], y: [8, 0], delay: A.stagger(18), duration: 450, ease });
    hideErr("day"); update();
  }
  const err = (k, msg, el) => { const p = $("#e-" + k); p.textContent = msg; p.hidden = false; el && el.setAttribute("aria-invalid", "true"); };
  const hideErr = k => { const p = $("#e-" + k); p.hidden = true; };
  function update() {
    const parts = [];
    if (svc.value) parts.push(`<b>${svc.value}</b>`);
    if (st.day) parts.push(fmtDay(st.day));
    if (st.time) parts.push(st.time);
    sum.innerHTML = parts.join(" · ");
    $$(".st", form).forEach(f => {
      const n = +f.dataset.step;
      f.classList.toggle("done", (n === 1 && !!svc.value) || (n === 2 && !!st.day) || (n === 3 && !!st.time));
    });
  }
  svc.addEventListener("change", () => { svc.removeAttribute("aria-invalid"); hideErr("svc"); update(); });
  ["name", "phone"].forEach(k => $("#bk-" + k).addEventListener("input", e => { e.target.removeAttribute("aria-invalid"); hideErr(k); }));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#bk-name"), phone = $("#bk-phone"), note = $("#bk-note");
    let first = null;
    if (!svc.value) { err("svc", T.err_svc, svc); first = first || svc; }
    if (!st.day) { err("day", T.err_day); first = first || daysEl; }
    if (!st.time) { err("time", T.err_time); first = first || timesEl; }
    if (!name.value.trim()) { err("name", T.err_name, name); first = first || name; }
    if (phone.value.replace(/\D/g, "").length < 6) { err("phone", T.err_phone, phone); first = first || phone; }
    if (first) { (first.focus ? first : first.querySelector("button"))?.focus?.(); return; }
    const msg = [T.wa_intro, "", `${T.wa_svc}: ${svc.value}`, `${T.wa_day}: ${fmtDay(st.day)}`, `${T.wa_time}: ${st.time}`,
      `${T.wa_name}: ${name.value.trim()}`, `${T.wa_phone}: ${phone.value.trim()}`].concat(note.value.trim() ? [`${T.wa_note}: ${note.value.trim()}`] : []).join("\n");
    window.open(`https://wa.me/${C.wa}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    const ok = $("#bk-ok"); ok.hidden = false; ok.focus();
    if (!calm) A.animate(ok, { opacity: [0, 1], scale: [.97, 1], duration: 600, ease });
  });
  $("#bk-again").addEventListener("click", () => {
    form.reset(); st.day = st.time = null; timesEl.innerHTML = ""; timesEl.classList.remove("picked"); $$(".day", daysEl).forEach(b => b.setAttribute("aria-checked", "false"));
    $("#bk-ok").hidden = true; update(); svc.focus();
  });
  $$(".pick").forEach(b => b.addEventListener("click", () => {
    svc.value = b.dataset.svc; svc.dispatchEvent(new Event("change"));
    $("#rezervacija").scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    setTimeout(() => { const first = $(".day:not([disabled])", daysEl); first && first.focus({ preventScroll: true }); }, calm ? 0 : 650);
    if (!calm) A.animate(".bk", { scale: [1, 1.012, 1], duration: 700, delay: 500, ease: "inOutSine" });
  }));

  /* gallery lightbox */
  const lb = $("#lb"), lbImg = $("img", lb);
  $$(".zoom").forEach(z => z.addEventListener("click", () => { lbImg.src = z.dataset.full; lbImg.alt = z.dataset.alt; lb.showModal(); }));
  $(".lb-x").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  /* motion: one hero moment, then reveals as sections arrive */
  if (calm) { root.classList.remove("m"); return; }
  const tl = A.createTimeline({ defaults: { ease, duration: 1100 } });
  tl.add(".hero h1 span", { y: ["0.6em", 0], opacity: [0, 1], delay: A.stagger(120) })
    .add(".slogan", { y: [16, 0], opacity: [0, 1], duration: 900 }, "-=850")
    .add(".chips li", { y: [12, 0], opacity: [0, 1], delay: A.stagger(45), duration: 700 }, "-=700")
    .add(".hero .cta, .today", { y: [12, 0], opacity: [0, 1], delay: A.stagger(80), duration: 800 }, "-=600")
    .add(".ha", { clipPath: ["inset(100% 0% 0% 0% round 18px)", "inset(0% 0% 0% 0% round 18px)"], delay: A.stagger(140), duration: 1300 }, 150)
    .add(".ha img", { scale: [1.18, 1], delay: A.stagger(140), duration: 1700 }, 150)
    .add(".script", { clipPath: ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"], opacity: [1, 1], duration: 1500, ease: "inOutQuart" }, 900);
  requestAnimationFrame(() => root.classList.remove("m"));

  const rv = new IntersectionObserver(ens => ens.forEach(en => {
    if (!en.isIntersecting) return;
    rv.unobserve(en.target);
    A.animate(en.target, { opacity: [0, 1], y: [24, 0], duration: 1000, ease });
  }), { rootMargin: "0px 0px -12% 0px" });
  $$("[data-rv]").forEach(el => { el.style.opacity = 0; rv.observe(el); });

  const gal = new IntersectionObserver(ens => ens.forEach(en => {
    if (!en.isIntersecting) return; gal.disconnect();
    A.animate(".grid .g", { clipPath: ["inset(12% 12% 12% 12% round 18px)", "inset(0% 0% 0% 0% round 18px)"], opacity: [0, 1], delay: A.stagger(90), duration: 1100, ease });
  }), { threshold: 0.15 });
  const grid = $(".grid"); grid && gal.observe(grid);

  const gift = $(".gift-script");
  if (gift) {
    gift.style.clipPath = "inset(0% 100% 0% 0%)";
    new IntersectionObserver(([en], o) => { if (!en.isIntersecting) return; o.disconnect();
      A.animate(gift, { clipPath: ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"], duration: 1600, ease: "inOutQuart" }); }, { threshold: 0.1 }).observe(gift);
  }
})();
