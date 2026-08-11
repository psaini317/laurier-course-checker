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
    .map((s) => {
      const kinds = [];
      if (s.seatOpened) kinds.push(`${s.seatsAvailable} class seat(s)`);
      if (s.waitlistOpened) kinds.push(`${s.waitAvailable} waitlist spot(s)`);
      return (
        `<li><b>${s.subjectCourse} (${s.sequenceNumber})</b> — ${s.courseTitle}: ` +
        `${kinds.join(" and ")} just opened up ` +
        `(CRN ${s.crn}, ${s.termName})</li>`
      );
    })
    .join("");

  const anySeat = opened.some((s) => s.seatOpened);
  const anyWaitlist = opened.some((s) => s.waitlistOpened);
  const subjectKind = anySeat && anyWaitlist ? "Seat/waitlist" : anySeat ? "Seat" : "Waitlist spot";

  await resend.emails.send({
    from,
    to,
    subject: `${subjectKind} open: ${opened.map((s) => s.subjectCourse).join(", ")}`,
    html: `<p>Availability just changed:</p><ul>${rows}</ul><p>Register on <a href="https://loris.wlu.ca">LORIS</a> now.</p>`,
  });
}
