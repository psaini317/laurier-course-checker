import { Resend } from "resend";

export async function sendAvailabilityEmail(opened) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL;
  if (!apiKey || !to) {
    throw new Error("RESEND_API_KEY and ALERT_EMAIL must be set");
  }

  const resend = new Resend(apiKey);
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";

  const rows = opened
    .map(
      (s) =>
        `<li><b>${s.subjectCourse} (${s.sequenceNumber})</b> — ${s.courseTitle}: ` +
        `${s.seatsAvailable} seat(s) open, ${s.waitAvailable} waitlist spot(s) open ` +
        `(CRN ${s.crn}, ${s.termName})</li>`
    )
    .join("");

  await resend.emails.send({
    from,
    to,
    subject: `Seat open: ${opened.map((s) => s.subjectCourse).join(", ")}`,
    html: `<p>A seat just opened up:</p><ul>${rows}</ul><p>Register on <a href="https://loris.wlu.ca">LORIS</a> now.</p>`,
  });
}
