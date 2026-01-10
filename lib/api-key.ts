import crypto from "crypto";

const SECRET = process.env.API_KEY_SECRET as string;

// 🔐 HARD FAIL if secret is wrong
if (!SECRET) {
  throw new Error("❌ API_KEY_SECRET is missing in .env");
}

if (Buffer.from(SECRET, "hex").length !== 32) {
  throw new Error("❌ API_KEY_SECRET must be 32 bytes (64 hex characters)");
}

/* =========================
   GENERATE RAW API KEY
========================= */
export function generateRawApiKey() {
  return "meterly_" + crypto.randomBytes(32).toString("hex");
}

/* =========================
   ENCRYPT
========================= */
export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/* =========================
   DECRYPT  ✅ FIXED
========================= */
export function decrypt(payload: string) {
  const [ivHex, encryptedHex] = payload.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET, "hex"),
    iv
  );

  // ✅ FIX: force string output
  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
