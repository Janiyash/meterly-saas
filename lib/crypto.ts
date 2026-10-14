import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SECRET = process.env.API_KEY_SECRET!;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(payload: string) {
  const [ivHex, tagHex, encrypted] = payload.split(":");
  const decipher = crypto.createDecipheriv(
    ALGO,
    Buffer.from(SECRET, "hex"),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
