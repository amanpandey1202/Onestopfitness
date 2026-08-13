/**
 * Optional Airtable sync — appends a new row to your Airtable table every time
 * a membership is created (i.e. a member pays). Disabled unless configured.
 *
 * Set in .env / hosting dashboard:
 *   AIRTABLE_TOKEN    = personal access token (Airtable → Account → Tokens)
 *   AIRTABLE_BASE_ID  = base id, e.g. appXxxxxxx
 *   AIRTABLE_TABLE_ID = table id or encoded table name, e.g. tblXxxxxxx
 *
 * Expected column names (create them in Airtable first):
 *   Name, Phone, Email, Plan, Amount, Start Date, End Date, Status
 */

export interface AirtableMember {
  name: string;
  phone?: string | null;
  email?: string | null;
  planName?: string | null;
  amount?: number | null;
  startDate: Date;
  endDate: Date;
}

export function airtableConfigured(): boolean {
  return Boolean(
    process.env.AIRTABLE_TOKEN &&
      process.env.AIRTABLE_BASE_ID &&
      process.env.AIRTABLE_TABLE_ID
  );
}

/** Appends a member row. Never throws — a failed sync must not block sales. */
export async function syncMemberToAirtable(m: AirtableMember): Promise<void> {
  if (!airtableConfigured()) return;

  const fields: Record<string, unknown> = {
    Name: m.name,
    Phone: m.phone ?? "",
    Email: m.email ?? "",
    Plan: m.planName ?? "",
    Amount: m.amount ?? "",
    "Start Date": m.startDate.toISOString().slice(0, 10),
    "End Date": m.endDate.toISOString().slice(0, 10),
    Status: "Active",
  };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }] }),
      }
    );
    if (!res.ok) {
      console.error("[airtable] sync failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[airtable] sync error", err);
  }
}
