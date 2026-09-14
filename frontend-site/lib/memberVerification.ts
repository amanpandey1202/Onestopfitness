/**
 * "Verified" = the admin has captured the documents/details needed for a
 * physical front-desk verification: Aadhaar card number, full address, and at
 * least one emergency/parent phone. Aka the fields shown in the "Required for
 * verification" section of the admin member form. Single source of truth for
 * both the server (list badges / dashboard banner) and the admin UI.
 */

export type VerificationFields = {
  aadhaarNumber?: string | null;
  address?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
};

export function isMemberVerified(profile: VerificationFields | null | undefined): boolean {
  return (
    !!profile &&
    !!profile.aadhaarNumber &&
    !!profile.address &&
    !!(profile.parentPhone || profile.emergencyContact)
  );
}

/** Human list of what's still missing (for the form helper text / banner). */
export function verificationMissing(profile: VerificationFields | null | undefined): string[] {
  if (!profile) return ["Aadhaar number", "Address", "Emergency/parent phone"];
  const missing: string[] = [];
  if (!profile.aadhaarNumber) missing.push("Aadhaar number");
  if (!profile.address) missing.push("Address");
  if (!profile.parentPhone && !profile.emergencyContact) missing.push("Emergency/parent phone");
  return missing;
}