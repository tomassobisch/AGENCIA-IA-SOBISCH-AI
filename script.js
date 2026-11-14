/* ============================================================
   CONFIGURACIÓN — rellena estos valores y listo.
   ============================================================ */
const CONFIG = {
  // Endpoint que recibe el formulario (p. ej. Formspree: https://formspree.io/f/xxxxxxx).
  // Si lo dejas vacío, el formulario abre el email del visitante con el mensaje ya escrito.
  formEndpoint: "",
  // Tu email de contacto (se muestra en el footer y se usa como alternativa al endpoint).
  email: "",
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

  const mail = document.querySelector("[data-email]");
  if (mail && CONFIG.email) {
    mail.href = "mailto:" + CONFIG.email;
    mail.textContent = CONFIG.email;
    mail.hidden = false;
  }
  const cal = document.querySelector("[data-calendly]");
  if (cal && CONFIG.calendlyUrl) {
    cal.href = CONFIG.calendlyUrl;
    cal.target = "_blank";
    cal.rel = "noopener";
    cal.hidden = false;
  }
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
    if (data._gotcha) return; // bot

    if (CONFIG.formEndpoint) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        showDone();
      } catch (err) {
        setNote("No se pudo enviar. Inténtalo de nuevo o escríbeme por Instagram.", true);
      } finally {
        btn.disabled = false;
        btn.textContent = "Quiero mi llamada gratis";
      }
      return;
    }

    if (CONFIG.email) {
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
      showDone();
      return;
    }

    setNote("El formulario aún no está activo. Escríbeme por Instagram @tomassobisch.ai.", true);
    console.warn("[form] Configura CONFIG.formEndpoint o CONFIG.email en script.js");
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
