/* ============================================================
   CONFIGURACIÓN — rellena estos valores y listo.
   ============================================================ */
const CONFIG = {
  // Servicio que reenvía cada solicitud del formulario a tu correo (FormSubmit.co, gratis).
  // Tras activarlo, puedes cambiar el email de la URL por el alias aleatorio que te da
  // FormSubmit para no exponer tu dirección. Si falla, el formulario abre el correo del
  // visitante con el mensaje ya escrito (plan B).
  formEndpoint: "https://formsubmit.co/ajax/tomassobisch@sobtom.com",
  // Tu email de contacto (se muestra en el footer y se usa como alternativa al endpoint).
  email: "tomassobisch@sobtom.com",
  // Enlace a tu calendario (Calendly, Cal.com…). Si está vacío, el enlace no se muestra.
  calendlyUrl: "",
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

/* ---------- Aviso de cookies (informativo) ----------
   La web no instala cookies propias. Recordamos que el aviso se cerró
   con localStorage, que es técnico y no requiere consentimiento. */
(function cookieNote() {
  const note = document.querySelector("[data-cookie-note]");
  if (!note) return;
  const KEY = "cookie-note-ok";
  let seen = false;
  try { seen = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (seen) return;
  note.hidden = false;
  note.querySelector("[data-cookie-ok]").addEventListener("click", () => {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    note.hidden = true;
  });
})();

/* ---------- Formulario ---------- */
(function leadForm() {
  const form = document.getElementById("lead-form");
  const ok = document.getElementById("lead-ok");
  const reset = document.getElementById("lead-reset");
  if (!form) return;
  const note = form.querySelector(".form__note");
  const btn = form.querySelector("button[type=submit]");
  const defaultNote = note.textContent;

  const setNote = (text, isError) => {
    note.textContent = text;
    note.classList.toggle("is-error", !!isError);
  };

  const showDone = () => {
    form.hidden = true;
    ok.hidden = false;
    ok.focus();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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

    const sendByMail = () => {
      const body = [
        "Nombre: " + data.nombre,
        "Negocio: " + (data.negocio || "-"),
        "Email: " + data.email,
        "WhatsApp: " + (data.whatsapp || "-"),
        "",
        "¿Qué me gustaría automatizar?",
        data.mensaje || "-",
      ].join("\n");
      window.location.href =
        "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Llamada gratis de 15 min — " + data.nombre) +
        "&body=" + encodeURIComponent(body);
    };

    if (CONFIG.formEndpoint) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: "Nuevo cliente potencial: " + data.nombre + (data.negocio ? " (" + data.negocio + ")" : ""),
            _template: "table",
            _replyto: data.email,
            Nombre: data.nombre,
            Negocio: data.negocio || "-",
            Email: data.email,
            WhatsApp: data.whatsapp || "-",
            "Qué quiere automatizar": data.mensaje || "-",
            Página: location.href,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== "true") throw new Error(json.message || "HTTP " + res.status);
        showDone();
      } catch (err) {
        console.error("[form]", err);
        // Plan B para no perder nunca un cliente: abrir su correo con el mensaje ya escrito.
        if (CONFIG.email) {
          setNote("No se pudo enviar automáticamente. Se abrirá tu correo con el mensaje listo: solo dale a enviar.", true);
          sendByMail();
        } else {
          setNote("No se pudo enviar. Inténtalo de nuevo o escríbeme por Instagram.", true);
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Quiero mi llamada gratis";
      }
      return;
    }

    if (CONFIG.email) {
      sendByMail();
      showDone();
      return;
    }

    setNote("El formulario aún no está activo. Escríbeme por Instagram @tomassobisch.ai.", true);
  });

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) {
      e.target.setAttribute("aria-invalid", "false");
    }
    if (note.classList.contains("is-error")) setNote(defaultNote, false);
  });

  reset.addEventListener("click", () => {
    form.reset();
    ok.hidden = true;
    form.hidden = false;
    setNote(defaultNote, false);
    form.querySelector("input").focus();
  });
})();
