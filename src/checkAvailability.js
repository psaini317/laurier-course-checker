import { readFile, writeFile, appendFile } from "node:fs/promises";
import { COURSES, STATE_FILE } from "./config.js";
import { getSections } from "./lorisClient.js";
import { sendAvailabilityEmail } from "./notify.js";

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const prevState = await loadState();
  const nextState = {};
  const opened = [];

  for (const { courseCode, termCode, termName } of COURSES) {
    const sections = await getSections(courseCode, termCode);
    for (const s of sections) {
      const key = `${termCode}:${s.crn}`;
      nextState[key] = { seatsAvailable: s.seatsAvailable, waitAvailable: s.waitAvailable };

      const prev = prevState[key];
      const wasClosed = !prev || (prev.seatsAvailable <= 0 && prev.waitAvailable <= 0);
      const isOpenNow = s.seatsAvailable > 0 || s.waitAvailable > 0;

      if (wasClosed && isOpenNow) {
        opened.push({ ...s, termName });
      }
      console.log(
        `${s.subjectCourse} ${s.sequenceNumber} (CRN ${s.crn}): ` +
          `${s.seatsAvailable}/${s.maximumEnrollment} seats, ${s.waitAvailable}/${s.waitCapacity} waitlist`
      );
    }
  }

  if (opened.length > 0) {
    console.log(`Seats opened: ${opened.map((s) => s.subjectCourse).join(", ")} — sending email`);
    await sendAvailabilityEmail(opened);
  }

  const stateChanged = JSON.stringify(prevState) !== JSON.stringify(nextState);
  if (stateChanged) {
    await writeFile(STATE_FILE, JSON.stringify(nextState, null, 2) + "\n");
  }

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `state_changed=${stateChanged}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
