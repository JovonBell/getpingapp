import * as Crypto from 'expo-crypto';

export function normalizeEmail(email) {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  return e.length ? e : null;
}

export function normalizePhone(phone) {
  if (!phone) return null;
  // Keep digits only; E.164 normalization can be added later with a lib like libphonenumber-js.
  const digits = String(phone).replace(/[^\d]/g, '');
  return digits.length ? digits : null;
}

export function makeInitials(name) {
  const n = String(name || '').trim();
  if (!n) return '??';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function sha256(value) {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(value));
}

export function expoContactsToAppContacts(expoContacts) {
  const list = Array.isArray(expoContacts) ? expoContacts : [];
  return list
    .map((c) => {
      const name = c?.name || [c?.firstName, c?.lastName].filter(Boolean).join(' ') || 'Unknown';
      const emails = (c?.emails || []).map((e) => normalizeEmail(e?.email)).filter(Boolean);
      const phones = (c?.phoneNumbers || []).map((p) => normalizePhone(p?.number)).filter(Boolean);
      return {
        id: String(c?.id || `${name}-${Math.random().toString(16).slice(2)}`),
        name,
        initials: makeInitials(name),
        // Keep first for display
        email: emails[0] || '',
        phone: phones[0] || '',
        // Keep all for matching
        emails,
        phones,
      };
    })
    .filter((c) => !!c?.name);
}

export async function buildIdentifierHashes(contacts) {
  const emails = new Set();
  const phones = new Set();

  (contacts || []).forEach((c) => {
    (c?.emails || []).forEach((e) => e && emails.add(e));
    (c?.phones || []).forEach((p) => p && phones.add(p));
    const e1 = normalizeEmail(c?.email);
    if (e1) emails.add(e1);
    const p1 = normalizePhone(c?.phone);
    if (p1) phones.add(p1);
  });

  const emailList = Array.from(emails);
  const phoneList = Array.from(phones);

  const hashInBatches = async (values) => {
    const out = [];
    const batchSize = 200;
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const hashed = await Promise.all(batch.map((v) => sha256(v)));
      out.push(...hashed);
    }
    return out;
  };

  const [emailHashes, phoneHashes] = await Promise.all([
    hashInBatches(emailList),
    hashInBatches(phoneList),
  ]);

  return { emailHashes, phoneHashes };
}

export async function hashContactsForMatching(contacts) {
  const list = contacts || [];
  const out = {};
  for (const c of list) {
    const emails = new Set((c?.emails || []).filter(Boolean));
    const phones = new Set((c?.phones || []).filter(Boolean));
    const e1 = normalizeEmail(c?.email);
    if (e1) emails.add(e1);
    const p1 = normalizePhone(c?.phone);
    if (p1) phones.add(p1);

    const emailHashes = [];
    const phoneHashes = [];

    for (const e of emails) emailHashes.push(await sha256(e));
    for (const p of phones) phoneHashes.push(await sha256(p));

    out[String(c.id)] = { emailHashes, phoneHashes };
  }
  return out;
}


