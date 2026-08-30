from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import DetectionModel, RecordingModel, SiteModel
import schemas
from analytics import compute_site_analytics

router = APIRouter(prefix="/api", tags=["recordings"])

@router.patch("/detections/{detection_id}", response_model=schemas.Detection)
async def update_detection_review(
    detection_id: int,
    payload: schemas.ReviewUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DetectionModel).where(DetectionModel.id == detection_id)
    res = await db.execute(stmt)
    det = res.scalar_one_or_none()

    if not det:
        raise HTTPException(status_code=404, detail="Detection not found")

    det.review = payload.review
    await db.commit()
    await db.refresh(det)

    # Recalculate recording richness
    rec_stmt = select(RecordingModel).where(RecordingModel.id == det.recording_id)
    rec_res = await db.execute(rec_stmt)
    rec = rec_res.scalar_one_or_none()

    if rec:
        det_all_stmt = select(DetectionModel).where(DetectionModel.recording_id == rec.id)
        det_all_res = await db.execute(det_all_stmt)
        all_dets = det_all_res.scalars().all()
        rec.richness = sum(1 for d in all_dets if d.review != "rejected")
        await db.commit()

        # Update site status dynamically
        site_stmt = select(SiteModel).where(SiteModel.id == rec.site_id)
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

    return schemas.Detection(
        speciesId=det.species_id,
        windows=det.windows,
        confidence=det.confidence,
        review=det.review
    )
