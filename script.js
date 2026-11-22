/* ============================================================
   CONFIGURACIÓN — rellena estos valores y listo.
   ============================================================ */
const CONFIG = {
  // Función propia de la web (api/contact.js) que envía cada solicitud a tu correo
  // corporativo desde tu propio Outlook. Si falla, el formulario abre el correo del
  // visitante con el mensaje ya escrito (plan B).
  formEndpoint: "/api/contact",
  // Respaldo automático si la función propia falla (FormSubmit, ya activado).
  backupEndpoint: "https://formsubmit.co/ajax/tomassobisch@sobtom.com",
  // Tu email de contacto (se muestra en el footer y se usa como alternativa al endpoint).
  email: "tomassobisch@sobtom.com",
  // Enlace a tu calendario (Calendly, Cal.com…). Si está vacío, el enlace no se muestra.
  calendlyUrl: "",
  // ID de medición de Google Analytics 4 (G-XXXXXXXXXX). Vacío = sin analítica.
  // Solo se carga si el visitante acepta las cookies en el banner.
  gaId: "G-GQZBLFT13K",
};

/* ---------- Titular: aparición letra a letra (como en el diseño) ---------- */
(function splitTitle() {
  const h1 = document.querySelector("[data-split]");
  if (!h1) return;
  h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());

  const wrapWords = (node, min, max) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
      const word = document.createElement("span");
      word.className = "w";
      word.setAttribute("aria-hidden", "true");
      for (const ch of part) {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        s.style.animationDelay = (min + Math.random() * (max - min)).toFixed(2) + "s";
        word.appendChild(s);
      }
      frag.appendChild(word);
    });
    node.replaceWith(frag);
  };

  [...h1.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) wrapWords(n, 0.19, 1.4);
    else if (n.nodeType === Node.ELEMENT_NODE) {
      n.setAttribute("aria-hidden", "true");
      [...n.childNodes].forEach((c) => c.nodeType === Node.TEXT_NODE && wrapWords(c, 0.7, 1.9));
    }
  });
})();

/* ---------- Datos de contacto configurables ---------- */
(function applyConfig() {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const cal = document.querySelector("[data-calendly]");
  if (cal && CONFIG.calendlyUrl) {
    cal.href = CONFIG.calendlyUrl;
    cal.target = "_blank";
    cal.rel = "noopener";
    cal.hidden = false;
  }
})();

/* ---------- Cookies y Google Analytics ----------
   - Sin gaId: aviso informativo (la web no usa cookies de seguimiento).
   - Con gaId: banner Aceptar / Rechazar. Analytics SOLO se carga si se acepta. */
function loadAnalytics() {
  if (!CONFIG.gaId || window.__gaLoaded) return;
  window.__gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.gaId);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", CONFIG.gaId);
}

function trackEvent(name, params) {
  if (typeof window.gtag === "function") window.gtag("event", name, params || {});
}

(function cookieConsent() {
  const KEY = CONFIG.gaId ? "cookie-consent" : "cookie-note-ok";
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  const policy = '<a href="politica-de-cookies.html">política de cookies</a>';
  const bar = document.createElement("div");
  bar.className = "cookie-note";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Aviso de cookies");
  bar.hidden = true;
  bar.innerHTML = CONFIG.gaId
    ? '<p>Uso cookies de Google Analytics para saber cuántas personas visitan la web y mejorarla. Solo se activan si las aceptas. Más info en la ' + policy + '.</p>' +
      '<div class="cookie-note__actions"><button type="button" class="btn btn--ghost btn--sm" data-cookie="denied">Rechazar</button>' +
      '<button type="button" class="btn btn--primary btn--sm" data-cookie="granted">Aceptar</button></div>'
    : '<p>Esta web no usa cookies de seguimiento ni publicidad. Más info en la ' + policy + '.</p>' +
      '<button type="button" class="btn btn--primary btn--sm" data-cookie="1">Entendido</button>';
  document.body.appendChild(bar);

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cookie]");
    if (!btn) return;
    save(btn.dataset.cookie);
    bar.hidden = true;
    if (btn.dataset.cookie === "granted") loadAnalytics();
  });

  const choice = read();
  if (CONFIG.gaId && choice === "granted") loadAnalytics();
  if (!choice) bar.hidden = false;

  // Enlace "Configurar cookies" del footer (solo tiene sentido con Analytics)
  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    if (!CONFIG.gaId) return;
    link.hidden = false;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (read() === "granted") {
        // Retirar el consentimiento: borrar cookies _ga y recargar sin Analytics
        document.cookie.split(";").map((c) => c.split("=")[0].trim())
          .filter((n) => n.startsWith("_ga"))
          .forEach((n) => {
            const host = location.hostname;
            document.cookie = n + "=; Max-Age=0; path=/";
            document.cookie = n + "=; Max-Age=0; path=/; domain=." + host.replace(/^www\./, "");
          });
      }
      try { localStorage.removeItem(KEY); } catch (err) {}
      if (window.__gaLoaded) location.reload(); else bar.hidden = false;
    });
  });
})();

/* ---------- Formulario ---------- */
(function leadForm() {
  const form = document.getElementById("lead-form");
  const ok = document.getElementById("lead-ok");
  const fb = document.getElementById("lead-fallback");
  if (!form) return;
  const note = form.querySelector(".form__note");
  const btn = form.querySelector("button[type=submit]");
  const btnLabel = btn.textContent;
  const defaultNote = note.textContent;
  const TIMEOUT_MS = 6000; // cada intento; máximo ~12 s en total

  const setNote = (text, isError) => {
    note.textContent = text;
    note.classList.toggle("is-error", !!isError);
  };
  const show = (el) => {
    [form, ok, fb].forEach((x) => x && (x.hidden = x !== el));
    el.focus();
  };
  const setBusy = (busy) => {
    btn.disabled = busy;
    btn.classList.toggle("is-loading", busy);
    btn.textContent = busy ? "Enviando…" : btnLabel;
  };

  const postJSON = async (url, payload) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== "true") throw new Error(json.message || "HTTP " + res.status);
    } catch (e) {
      throw new Error(e.name === "AbortError" ? "Tiempo de espera agotado" : e.message);
    } finally {
      clearTimeout(timer);
    }
  };

  // Panel de respaldo: el visitante envía su mensaje con un clic, sin perder lo escrito.
  const showFallback = (data) => {
    const text = [
      "Hola Tomás, quiero agendar la llamada gratis de 15 min.",
      "",
      "Nombre: " + data.nombre,
      "Negocio: " + (data.negocio || "-"),
      "Email: " + data.email,
      "WhatsApp: " + (data.whatsapp || "-"),
      "",
      "¿Qué me gustaría automatizar?",
      data.mensaje || "-",
    ].join("\n");
    fb.querySelector("[data-fb-mail]").href =
      "mailto:" + CONFIG.email +
      "?subject=" + encodeURIComponent("Llamada gratis de 15 min — " + data.nombre) +
      "&body=" + encodeURIComponent(text);
    fb.querySelector("[data-fb-address]").textContent = CONFIG.email;
    const copyBtn = fb.querySelector("[data-fb-copy]");
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "¡Mensaje copiado!";
      } catch (e) {
        copyBtn.textContent = "Copia el email de arriba";
      }
    };
    show(fb);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    // Validación
    let firstInvalid = null;
    form.querySelectorAll("input[required], input[type=email]").forEach((el) => {
      const valid = el.checkValidity() && (!el.required || el.value.trim() !== "");
      el.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      setNote("Revisa tu nombre y un email válido para que pueda responderte.", true);
      firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // bot
    delete data._honey;

    setBusy(true);
    try {
      try {
        // 1º: función propia (envía desde tu Outlook corporativo)
        await postJSON(CONFIG.formEndpoint, {
          nombre: data.nombre, negocio: data.negocio, email: data.email,
          whatsapp: data.whatsapp, mensaje: data.mensaje, pagina: location.href,
        });
      } catch (primaryErr) {
        console.warn("[form] envío principal falló:", primaryErr.message);
        if (!CONFIG.backupEndpoint) throw primaryErr;
        // 2º: respaldo automático (FormSubmit)
        await postJSON(CONFIG.backupEndpoint, {
          _subject: "Nuevo cliente potencial: " + data.nombre + (data.negocio ? " (" + data.negocio + ")" : ""),
          _template: "table",
          _replyto: data.email,
          Nombre: data.nombre,
          Negocio: data.negocio || "-",
          Email: data.email,
          WhatsApp: data.whatsapp || "-",
          "Qué quiere automatizar": data.mensaje || "-",
          Página: location.href,
        });
      }
      trackEvent("generate_lead", { form: "agendar_llamada" });
      show(ok);
    } catch (err) {
      console.error("[form]", err.message);
      trackEvent("form_fallback", { form: "agendar_llamada" });
      showFallback(data);
    } finally {
      setBusy(false);
    }
  });

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) {
      e.target.setAttribute("aria-invalid", "false");
    }
    if (note.classList.contains("is-error")) setNote(defaultNote, false);
  });

  document.querySelectorAll("[data-lead-back]").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.hasAttribute("data-lead-reset")) form.reset();
      setNote(defaultNote, false);
      show(form);
      form.querySelector("input").focus();
    })
  );
})();
