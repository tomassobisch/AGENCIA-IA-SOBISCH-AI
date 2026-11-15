// Función serverless de Vercel: recibe el formulario de la web y lo envía
// por correo desde la cuenta corporativa de Microsoft 365 (SMTP de Outlook).
//
// Variables de entorno (Vercel → Project → Settings → Environment Variables):
//   SMTP_USER  correo que envía, p. ej. tomassobisch@sobtom.com
//   SMTP_PASS  contraseña (o contraseña de aplicación) de ese correo
//   LEAD_TO    (opcional) a dónde llegan las solicitudes; por defecto SMTP_USER
//   SMTP_HOST  (opcional) por defecto smtp.office365.com
//   SMTP_PORT  (opcional) por defecto 587
const nodemailer = require("nodemailer");

const LIMITS = { nombre: 120, negocio: 160, email: 200, whatsapp: 40, mensaje: 4000, pagina: 300 };
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const ALLOWED_ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?sobtom\.com$/i, /^https:\/\/tomassobisch[a-z0-9-]*\.vercel\.app$/i, /^http:\/\/localhost(:\d+)?$/];

// Límite simple por IP (por instancia): máx. 5 envíos cada 10 minutos.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clean = (v, max) => String(v == null ? "" : v).replace(/\r/g, "").trim().slice(0, max);
const oneLine = (v) => v.replace(/\n/g, " ");
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  const origin = req.headers.origin || "";
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    return res.status(403).json({ success: false, message: "Origen no permitido" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Honeypot: los bots rellenan el campo oculto. Respondemos OK sin enviar nada.
  if (body._honey) return res.status(200).json({ success: true });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconocida";
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, message: "Demasiados envíos. Inténtalo en unos minutos." });
  }

  const d = {};
  for (const k of Object.keys(LIMITS)) d[k] = clean(body[k], LIMITS[k]);
  d.nombre = oneLine(d.nombre);
  d.negocio = oneLine(d.negocio);
  d.email = oneLine(d.email);
  d.whatsapp = oneLine(d.whatsapp);

  if (!d.nombre || !EMAIL_RE.test(d.email)) {
    return res.status(400).json({ success: false, message: "Faltan el nombre o un email válido." });
  }

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[contact] Faltan SMTP_USER / SMTP_PASS en las variables de entorno");
    return res.status(500).json({ success: false, message: "El envío de correo no está configurado." });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.office365.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const rows = [
    ["Nombre", d.nombre],
    ["Negocio", d.negocio || "-"],
    ["Email", d.email],
    ["WhatsApp", d.whatsapp || "-"],
    ["Qué quiere automatizar", d.mensaje || "-"],
    ["Página", d.pagina || "-"],
  ];
  const text = rows.map(([k, v]) => k + ": " + v).join("\n");
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">' +
    '<h2 style="margin:0 0 12px">Nuevo cliente potencial desde la web</h2>' +
    '<table cellpadding="8" style="border-collapse:collapse">' +
    rows.map(([k, v]) =>
      '<tr><td style="border:1px solid #ddd;background:#f6f6f6;font-weight:bold;vertical-align:top">' + esc(k) +
      '</td><td style="border:1px solid #ddd;white-space:pre-wrap">' + esc(v) + "</td></tr>").join("") +
    "</table><p style=\"color:#666;font-size:13px\">Responde a este correo para escribir directamente al cliente.</p></div>";

  try {
    await transporter.sendMail({
      from: { name: "Web · Tomás Sobisch", address: SMTP_USER },
      to: process.env.LEAD_TO || SMTP_USER,
      replyTo: { name: d.nombre, address: d.email },
      subject: "Nuevo cliente potencial: " + d.nombre + (d.negocio ? " (" + d.negocio + ")" : ""),
      text,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[contact] Error SMTP:", err && (err.response || err.message));
    return res.status(502).json({ success: false, message: "No se pudo enviar el correo." });
  }
};
