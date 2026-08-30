"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileAudio,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

import { SITES } from "@/lib/data";
import Spectrogram from "@/components/ui/Spectrogram";

const MAX_SECONDS = 60;
const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPTED = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];

type Stage = "idle" | "queued" | "analysing" | "indexing" | "done" | "error";

type Errors = Partial<Record<"file" | "site" | "lat" | "lon" | "recordedAt", string>>;

const STAGE_COPY: Record<Exclude<Stage, "idle" | "error" | "done">, string> = {
  queued: "Queued — waiting for a worker",
  analysing: "Running BirdNET over 3-second windows",
  indexing: "Computing acoustic complexity and updating the site trend",
};

/**
 * Upload form + simulated async job.
 *
 * Mirrors the real contract: the request returns a job id immediately and the
 * client polls a status endpoint, so a slow free-tier worker never blocks the
 * page. Swap `runJob` for a poll against /jobs/{id} when the API is live.
 */
export default function UploadFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [siteId, setSiteId] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusSummary, setFocusSummary] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  /* Move focus to the error summary after a failed submit. This runs in an
     effect rather than inside the submit handler so the summary is guaranteed
     to be in the DOM, and so it does not depend on requestAnimationFrame —
     which is suspended in a background tab. */
  useEffect(() => {
    if (!focusSummary) return;
    summaryRef.current?.focus();
    setFocusSummary(false);
  }, [focusSummary]);

  /* -------------------------------------------------------------- */

  const validate = (): Errors => {
    const e: Errors = {};
    if (!file) {
      e.file = "Choose an audio file to upload.";
    } else if (file.size > MAX_BYTES) {
      e.file = `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 12 MB — trim the clip to ${MAX_SECONDS} seconds or less.`;
    }
    if (!siteId) e.site = "Pick the site this recording belongs to.";
    if (!recordedAt) e.recordedAt = "A timestamp is required — it is what places this sample on the trend.";

    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (lat && (Number.isNaN(latN) || latN < -90 || latN > 90)) {
      e.lat = "Latitude must be between -90 and 90.";
    }
    if (lon && (Number.isNaN(lonN) || lonN < -180 || lonN > 180)) {
      e.lon = "Longitude must be between -180 and 180.";
    }
    return e;
  };

  const pickSite = (id: string) => {
    setSiteId(id);
    const site = SITES.find((s) => s.id === id);
    if (site) {
      setLat(String(site.lat));
      setLon(String(site.lon));
    }
    setErrors((prev) => ({ ...prev, site: undefined }));
  };

  const acceptFile = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const runJob = () => {
    setStage("queued");
    setProgress(6);

    const steps: Array<[number, Stage, number]> = [
      [700, "analysing", 34],
      [2100, "indexing", 78],
      [3300, "done", 100],
    ];
    steps.forEach(([ms, s, p]) => {
      timers.current.push(
        window.setTimeout(() => {
          setStage(s);
          setProgress(p);
        }, ms),
      );
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setTouched({ file: true, site: true, lat: true, lon: true, recordedAt: true });

    if (Object.keys(found).length > 0) {
      // Focus moves to the summary in an effect, once React has actually
      // rendered it — see below.
      setFocusSummary(true);
      return;
    }
    runJob();
  };

  const reset = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setStage("idle");
    setProgress(0);
    setFile(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const errorList = Object.entries(errors).filter(([, v]) => v) as Array<
    [keyof Errors, string]
  >;
  const busy = stage === "queued" || stage === "analysing" || stage === "indexing";

  /* -------------------------------------------------------------- */
  /* Result                                                          */
  /* -------------------------------------------------------------- */

  if (stage === "done") {
    const site = SITES.find((s) => s.id === siteId);
    return (
      <div className="hb-glass rounded-3xl p-7 sm:p-9 text-center">
        <span
          className="mx-auto grid place-items-center size-16 rounded-2xl"
          style={{
            background: "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary-lo))",
            boxShadow: "var(--hb-shadow-glow)",
          }}
        >
          <CheckCircle2 className="size-8" strokeWidth={2.25} color="#fff" aria-hidden="true" />
        </span>

        <h2
          className="mt-5 font-[family-name:var(--font-heading)] font-bold text-[24px] tracking-[-0.02em]"
          tabIndex={-1}
        >
          Recording processed
        </h2>
        <p className="mt-2 text-[15px] text-[var(--hb-ink-soft)] max-w-[46ch] mx-auto">
          {file?.name} was analysed and added to{" "}
          <strong className="font-semibold text-[var(--hb-ink)]">{site?.name}</strong>.
          Detections are unreviewed — confirm or reject them on the site page.
        </p>

        <Spectrogram className="mt-6" height={90} seed={file?.name.length ?? 11} bars={76} />

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          {site && (
            <Link
              href={`/sites/${site.id}`}
              className="hb-sheen inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[48px]
                         font-semibold text-white text-[15px] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
                boxShadow: "var(--hb-shadow-glow)",
              }}
            >
              Review detections
            </Link>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[48px]
                       font-semibold text-[15px] text-[var(--hb-primary-lo)] bg-white/70
                       border border-[var(--hb-border-strong)] hover:bg-white transition-colors duration-200"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /* Processing                                                      */
  /* -------------------------------------------------------------- */

  if (busy) {
    return (
      <div className="hb-glass rounded-3xl p-7 sm:p-9">
        <div className="flex items-center gap-3">
          <Loader2
            className="size-5 animate-spin text-[var(--hb-primary)]"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-[20px] tracking-[-0.02em]">
            Processing
          </h2>
        </div>

        {/* Progress is announced politely — never steals focus mid-task. */}
        <p aria-live="polite" className="mt-3 text-[15px] text-[var(--hb-ink-soft)]">
          {STAGE_COPY[stage as keyof typeof STAGE_COPY]}
        </p>

        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Analysis progress"
          className="mt-5 h-2.5 rounded-full overflow-hidden"
          style={{ background: "var(--hb-bg-deep)" }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--hb-primary), var(--hb-glow))",
              transitionTimingFunction: "var(--hb-ease-out)",
            }}
          />
        </div>

        <ol className="mt-6 space-y-2.5">
          {(["queued", "analysing", "indexing"] as const).map((s, i) => {
            const order = ["queued", "analysing", "indexing"];
            const current = order.indexOf(stage);
            const done = i < current;
            const active = i === current;
            return (
              <li key={s} className="flex items-center gap-3 text-[14px]">
                <span
                  className="grid place-items-center size-6 rounded-full shrink-0 text-[11px] font-bold tabular"
                  style={{
                    background: done || active ? "var(--hb-primary)" : "var(--hb-bg-deep)",
                    color: done || active ? "#fff" : "var(--hb-ink-muted)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  style={{
                    color: active ? "var(--hb-ink)" : "var(--hb-ink-muted)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {STAGE_COPY[s]}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-[12.5px] text-[var(--hb-ink-muted)]">
          Processing runs asynchronously against a job status endpoint. You can
          leave this page — the result is attached to the site either way.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /* Form                                                            */
  /* -------------------------------------------------------------- */

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Error summary — focused after a failed submit, links to each field. */}
      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl p-5 border"
          style={{ background: "rgba(179,38,30,0.06)", borderColor: "rgba(179,38,30,0.28)" }}
        >
          <h2 className="flex items-center gap-2 font-semibold text-[15px] text-[var(--hb-danger)]">
            <AlertCircle className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
            {errorList.length} {errorList.length === 1 ? "problem" : "problems"} to fix
          </h2>
          <ul className="mt-2.5 space-y-1.5 text-[14px]">
            {errorList.map(([key, msg]) => (
              <li key={key}>
                <a
                  href={`#field-${key}`}
                  className="underline underline-offset-2 text-[var(--hb-danger)] hover:no-underline"
                >
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- File ---- */}
      <fieldset className="hb-glass rounded-2xl p-5 sm:p-6">
        <legend className="font-[family-name:var(--font-heading)] font-bold text-[17px] px-1">
          Audio file
        </legend>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            acceptFile(e.dataTransfer.files?.[0]);
          }}
          className="mt-4 rounded-2xl border-2 border-dashed p-7 text-center transition-colors duration-200"
          style={{
            borderColor: dragging
              ? "var(--hb-primary)"
              : errors.file
                ? "rgba(179,38,30,0.5)"
                : "var(--hb-border-strong)",
            background: dragging ? "rgba(11,110,90,0.05)" : "var(--hb-card-sunk)",
          }}
        >
          {file ? (
            <div className="flex items-center gap-3 text-left">
              <span
                className="grid place-items-center size-11 rounded-xl shrink-0"
                style={{ background: "rgba(11,110,90,0.1)" }}
              >
                <FileAudio className="size-5 text-[var(--hb-primary)]" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14.5px] truncate">{file.name}</p>
                <p className="text-[12.5px] text-[var(--hb-ink-muted)] tabular">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="grid place-items-center size-11 rounded-lg shrink-0 text-[var(--hb-ink-muted)]
                           hover:text-[var(--hb-danger)] hover:bg-white transition-colors duration-150"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4.5" strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud
                className="mx-auto size-9 text-[var(--hb-primary)]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="mt-3 text-[15px] font-medium">
                Drop an audio file here, or
              </p>
            </>
          )}

          <div className="mt-4">
            <label
              htmlFor="field-file"
              className="inline-flex items-center justify-center rounded-xl px-5 min-h-[44px]
                         text-[14px] font-semibold text-[var(--hb-primary-lo)] bg-white
                         border border-[var(--hb-border-strong)] cursor-pointer
                         hover:bg-[var(--hb-bg-deep)] transition-colors duration-150"
            >
              {file ? "Choose a different file" : "Browse files"}
            </label>
            <input
              ref={fileInputRef}
              id="field-file"
              name="file"
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              aria-describedby={errors.file ? "err-file help-file" : "help-file"}
              aria-invalid={!!errors.file}
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>
        </div>

        <p id="help-file" className="mt-3 text-[13px] text-[var(--hb-ink-muted)]">
          {ACCEPTED.join(", ")} · up to {MAX_SECONDS} seconds · 12 MB max.
          Longer clips are rejected rather than truncated.
        </p>
        {errors.file && (
          <p id="err-file" className="mt-2 text-[13.5px] font-medium text-[var(--hb-danger)]">
            {errors.file}
          </p>
        )}
      </fieldset>

      {/* ---- Where and when ---- */}
      <fieldset className="hb-glass rounded-2xl p-5 sm:p-6">
        <legend className="font-[family-name:var(--font-heading)] font-bold text-[17px] px-1">
          Where and when
        </legend>
        <p className="mt-1.5 text-[13.5px] text-[var(--hb-ink-muted)] px-1">
          Without these, the clip is an identification. With them, it is a data
          point.
        </p>

        <div className="mt-5 space-y-5">
          {/* Site */}
          <div>
            <label htmlFor="field-site" className="block text-[14px] font-semibold">
              Site <span className="text-[var(--hb-danger)]" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <select
              id="field-site"
              value={siteId}
              onChange={(e) => pickSite(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, site: true }))}
              aria-invalid={!!errors.site}
              aria-describedby={errors.site ? "err-site" : undefined}
              className="mt-2 w-full min-h-[48px] rounded-xl px-3.5 text-[15px] bg-white
                         border transition-colors duration-150"
              style={{
                borderColor: errors.site ? "var(--hb-danger)" : "var(--hb-border-strong)",
              }}
            >
              <option value="">Select a site…</option>
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.region}
                </option>
              ))}
            </select>
            {errors.site && (
              <p id="err-site" className="mt-1.5 text-[13.5px] font-medium text-[var(--hb-danger)]">
                {errors.site}
              </p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="field-lat" className="block text-[14px] font-semibold">
                Latitude
              </label>
              <div className="relative mt-2">
                <MapPin
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--hb-ink-muted)] pointer-events-none"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                <input
                  id="field-lat"
                  type="text"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, lat: true }));
                    setErrors(validate());
                  }}
                  placeholder="13.5025"
                  aria-invalid={!!errors.lat}
                  aria-describedby={errors.lat ? "err-lat help-coords" : "help-coords"}
                  className="w-full min-h-[48px] rounded-xl pl-10 pr-3.5 text-[15px] bg-white
                             font-[family-name:var(--font-mono)] tabular border"
                  style={{
                    borderColor: errors.lat ? "var(--hb-danger)" : "var(--hb-border-strong)",
                  }}
                />
              </div>
              {errors.lat && touched.lat && (
                <p id="err-lat" className="mt-1.5 text-[13.5px] font-medium text-[var(--hb-danger)]">
                  {errors.lat}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="field-lon" className="block text-[14px] font-semibold">
                Longitude
              </label>
              <div className="relative mt-2">
                <MapPin
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--hb-ink-muted)] pointer-events-none"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                <input
                  id="field-lon"
                  type="text"
                  inputMode="decimal"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, lon: true }));
                    setErrors(validate());
                  }}
                  placeholder="75.0906"
                  aria-invalid={!!errors.lon}
                  aria-describedby={errors.lon ? "err-lon help-coords" : "help-coords"}
                  className="w-full min-h-[48px] rounded-xl pl-10 pr-3.5 text-[15px] bg-white
                             font-[family-name:var(--font-mono)] tabular border"
                  style={{
                    borderColor: errors.lon ? "var(--hb-danger)" : "var(--hb-border-strong)",
                  }}
                />
              </div>
              {errors.lon && touched.lon && (
                <p id="err-lon" className="mt-1.5 text-[13.5px] font-medium text-[var(--hb-danger)]">
                  {errors.lon}
                </p>
              )}
            </div>
          </div>
          <p id="help-coords" className="text-[13px] text-[var(--hb-ink-muted)]">
            Pre-filled from the selected site. Override if the recording was made
            away from the site marker — GBIF range lookup uses these values.
          </p>

          {/* Timestamp */}
          <div>
            <label htmlFor="field-recordedAt" className="block text-[14px] font-semibold">
              Recorded at{" "}
              <span className="text-[var(--hb-danger)]" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <div className="relative mt-2">
              <Clock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--hb-ink-muted)] pointer-events-none"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <input
                id="field-recordedAt"
                type="datetime-local"
                value={recordedAt}
                onChange={(e) => {
                  setRecordedAt(e.target.value);
                  setErrors((p) => ({ ...p, recordedAt: undefined }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, recordedAt: true }))}
                aria-invalid={!!errors.recordedAt}
                aria-describedby={errors.recordedAt ? "err-recordedAt help-time" : "help-time"}
                className="w-full min-h-[48px] rounded-xl pl-10 pr-3.5 text-[15px] bg-white tabular border"
                style={{
                  borderColor: errors.recordedAt
                    ? "var(--hb-danger)"
                    : "var(--hb-border-strong)",
                }}
              />
            </div>
            <p id="help-time" className="mt-1.5 text-[13px] text-[var(--hb-ink-muted)]">
              Dawn and dusk recordings are not comparable to midday ones — time
              of day is part of the sample, not metadata.
            </p>
            {errors.recordedAt && (
              <p id="err-recordedAt" className="mt-1.5 text-[13.5px] font-medium text-[var(--hb-danger)]">
                {errors.recordedAt}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="field-notes" className="block text-[14px] font-semibold">
              Field notes{" "}
              <span className="font-normal text-[var(--hb-ink-muted)]">(optional)</span>
            </label>
            <textarea
              id="field-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Weather, disturbance observed, equipment…"
              aria-describedby="help-notes"
              className="mt-2 w-full rounded-xl px-3.5 py-3 text-[15px] bg-white border resize-y"
              style={{ borderColor: "var(--hb-border-strong)" }}
            />
            <p id="help-notes" className="mt-1.5 text-[13px] text-[var(--hb-ink-muted)]">
              Context that helps a reviewer judge a borderline detection.
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          className="hb-sheen inline-flex items-center justify-center gap-2 rounded-xl px-7 min-h-[52px]
                     font-semibold text-white text-[15px]
                     transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          style={{
            background: "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
            boxShadow: "var(--hb-shadow-glow)",
            transitionTimingFunction: "var(--hb-ease-out)",
          }}
        >
          <UploadCloud className="size-4.5" strokeWidth={2.25} aria-hidden="true" />
          Upload and analyse
        </button>
        <Link
          href="/sites"
          className="inline-flex items-center justify-center rounded-xl px-7 min-h-[52px]
                     font-semibold text-[15px] text-[var(--hb-primary-lo)] bg-white/70
                     border border-[var(--hb-border-strong)] hover:bg-white transition-colors duration-200"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
