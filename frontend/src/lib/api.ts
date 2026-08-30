import {
  SITES,
  SPECIES,
  RECORDINGS,
  ALL_FLAGS,
  siteById,
  recordingsForSite,
  trendForSite,
  expectedVsObserved,
  siteSummary,
  flagsForSite,
  Site,
  SiteDetailResponse,
  Recording,
  Detection,
  JobStatusResponse,
} from "./data";

const API_BASE = "/api";

export async function fetchSites(): Promise<Site[]> {
  try {
    const res = await fetch(`${API_BASE}/sites`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API offline, using local seeded sites:", err);
  }
  return SITES;
}

export async function fetchSiteDetail(siteId: string): Promise<{
  site: Site | undefined;
  summary: ReturnType<typeof siteSummary>;
  trend: ReturnType<typeof trendForSite>;
  expectedVsObserved: ReturnType<typeof expectedVsObserved>;
  flags: ReturnType<typeof flagsForSite>;
  recordings: Recording[];
}> {
  try {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return {
        site: data.site,
        summary: data.summary,
        trend: data.trend,
        expectedVsObserved: data.expectedVsObserved,
        flags: data.flags,
        recordings: data.recordings,
      };
    }
  } catch (err) {
    console.warn(`Backend API offline, using local seeded site detail for ${siteId}:`, err);
  }

  const site = siteById.get(siteId);
  return {
    site,
    summary: siteSummary(siteId),
    trend: trendForSite(siteId),
    expectedVsObserved: expectedVsObserved(siteId),
    flags: flagsForSite(siteId),
    recordings: recordingsForSite(siteId),
  };
}

export async function updateDetectionReview(
  detectionId: number | string,
  review: "unreviewed" | "confirmed" | "rejected"
): Promise<Detection | null> {
  try {
    const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API error on updateDetectionReview:", err);
  }
  return null;
}

export async function uploadRecording(formData: FormData): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Job status check failed with status ${res.status}`);
  }
  return await res.json();
}
