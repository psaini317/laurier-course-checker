import fetchCookieFactory from "fetch-cookie";
import { CookieJar } from "tough-cookie";

const BASE = "https://loris.wlu.ca/register/ssb";

function newSession() {
  const jar = new CookieJar();
  const fetchWithCookies = fetchCookieFactory(fetch, jar);
  return fetchWithCookies;
}

async function setTerm(fetchWithCookies, termCode) {
  // Establishes a session cookie.
  await fetchWithCookies(`${BASE}/courseSearch/courseSearch?mode=courseSearch`);

  const res = await fetchWithCookies(`${BASE}/term/search?mode=courseSearch`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ term: termCode }),
  });
  if (!res.ok) {
    throw new Error(`Failed to set term ${termCode}: HTTP ${res.status}`);
  }
}

// Returns an array of section objects (one per CRN) for a course, e.g. { crn, sequenceNumber,
// courseTitle, seatsAvailable, waitAvailable, maximumEnrollment, enrollment, openSection }.
export async function getSections(courseCode, termCode) {
  const fetchWithCookies = newSession();
  await setTerm(fetchWithCookies, termCode);

  const params = new URLSearchParams({
    txt_subjectcoursecombo: courseCode.replace(/\s/g, ""),
    txt_term: termCode,
    pageOffset: "0",
    pageMaxSize: "50",
    sortColumn: "subjectDescription",
    sortDirection: "asc",
  });

  const res = await fetchWithCookies(`${BASE}/searchResults/searchResults?${params}`);
  if (!res.ok) {
    throw new Error(`Search failed for ${courseCode} ${termCode}: HTTP ${res.status}`);
  }
  const body = await res.json();

  return (body.data ?? []).map((s) => ({
    crn: s.courseReferenceNumber,
    sequenceNumber: s.sequenceNumber,
    courseTitle: s.courseTitle,
    subjectCourse: s.subjectCourse,
    campus: s.campusDescription,
    seatsAvailable: s.seatsAvailable,
    maximumEnrollment: s.maximumEnrollment,
    enrollment: s.enrollment,
    waitAvailable: s.waitAvailable,
    waitCapacity: s.waitCapacity,
    openSection: s.openSection,
  }));
}
