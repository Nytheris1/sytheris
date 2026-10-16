import { createPublicKey, verify } from "node:crypto";

// Ed25519 raw public key (32 byte) -> DER SPKI prefix
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function verifyDiscordSignature(
  publicKeyHex: string,
  signature: string,
  timestamp: string,
  body: string,
): boolean {
  try {
    const publicKeyBytes = Buffer.from(publicKeyHex, "hex");
    const spki = Buffer.concat([ED25519_SPKI_PREFIX, publicKeyBytes]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    const message = Buffer.from(timestamp + body);
    const sig = Buffer.from(signature, "hex");
    return verify(null, message, key, sig);
  } catch {
    return false;
  }
}