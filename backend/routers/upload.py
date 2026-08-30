import os
import uuid
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, AsyncSessionLocal
from models import JobModel, SiteModel, SpeciesModel, RecordingModel, DetectionModel
import schemas
from bioacoustics.aci import compute_aci, get_audio_duration
from bioacoustics.detector import detector
from analytics import compute_site_analytics

router = APIRouter(prefix="/api", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_audio_job(
    job_id: str,
    file_path: str,
    site_id: str,
    recorded_at: str,
    uploader: str
):
    async with AsyncSessionLocal() as db:
        try:
            # 1. Update job stage to analysing
            job_stmt = select(JobModel).where(JobModel.id == job_id)
            res = await db.execute(job_stmt)
            job = res.scalar_one_or_none()
            if not job:
                return

            job.stage = "analysing"
            job.progress = 30
            await db.commit()

            # Fetch species pool
            sp_stmt = select(SpeciesModel)
            sp_res = await db.execute(sp_stmt)
            species_pool = [{"id": s.id, "common": s.common, "guild": s.guild, "base": s.base} for s in sp_res.scalars().all()]

            # Perform species detection over 3s windows
            detections_raw = detector.analyze_recording(file_path, species_pool)

            # 2. Update job stage to indexing (ACI calculation & database recording)
            job.stage = "indexing"
            job.progress = 75
            await db.commit()

            aci_val = compute_aci(file_path)
            duration_sec = get_audio_duration(file_path)

            rec_id = f"{site_id}-{recorded_at}-{str(uuid.uuid4())[:6]}"
            accepted_richness = len(detections_raw)

            # Save recording
            recording = RecordingModel(
                id=rec_id,
                site_id=site_id,
                date=recorded_at,
                duration_sec=duration_sec,
                aci=aci_val,
                richness=accepted_richness,
                uploader=uploader or "Anonymous Field User",
                file_path=file_path
            )
            db.add(recording)

            # Save detections
            for det in detections_raw:
                db.add(DetectionModel(
                    recording_id=rec_id,
                    species_id=det["speciesId"],
                    windows=det["windows"],
                    confidence=det["confidence"],
                    review=det["review"]
                ))

            await db.commit()

            # Re-compute site status
            site_stmt = select(SiteModel).where(SiteModel.id == site_id)
            site_res = await db.execute(site_stmt)
            site = site_res.scalar_one_or_none()
            if site:
                summary, trend, expected_vs_obs, flags = await compute_site_analytics(db, site)
                if len(flags) >= 2 or any(f.severity == "high" for f in flags):
                    site.status = "alert"
                elif len(flags) == 1:
                    site.status = "watch"
                else:
                    site.status = "healthy"
                await db.commit()

            # 3. Mark job done
            job.stage = "done"
            job.status = "done"
            job.progress = 100
            job.result_json = rec_id
            await db.commit()

        except Exception as e:
            print(f"Error processing upload job {job_id}: {e}")
            job.stage = "error"
            job.status = "error"
            job.error_message = str(e)
            await db.commit()


@router.post("/upload", response_model=schemas.JobStatusResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    siteId: str = Form(...),
    recordedAt: str = Form(...),
    uploader: Optional[str] = Form("Field Worker"),
    db: AsyncSession = Depends(get_db)
):
    # Verify site exists
    stmt = select(SiteModel).where(SiteModel.id == siteId)
    res = await db.execute(stmt)
    site = res.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    job_id = f"job-{uuid.uuid4().hex[:8]}"
    file_ext = os.path.splitext(file.filename)[1] or ".wav"
    saved_filename = f"{job_id}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as f:
        content = await file.read()
        f.write(content)

    job = JobModel(
        id=job_id,
        status="queued",
        progress=10,
        stage="queued"
    )
    db.add(job)
    await db.commit()

    background_tasks.add_task(
        process_audio_job,
        job_id=job_id,
        file_path=saved_path,
        site_id=siteId,
        recorded_at=recordedAt,
        uploader=uploader
    )

    return schemas.JobStatusResponse(
        id=job_id,
        status="queued",
        progress=10,
        stage="queued",
        siteId=siteId
    )


@router.get("/jobs/{job_id}", response_model=schemas.JobStatusResponse)
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(JobModel).where(JobModel.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return schemas.JobStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        stage=job.stage,  # type: ignore
        recordingId=job.result_json if job.stage == "done" else None,
        error=job.error_message
    )
