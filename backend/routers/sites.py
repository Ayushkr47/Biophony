from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import SiteModel, RecordingModel, DetectionModel
import schemas
from analytics import compute_site_analytics

router = APIRouter(prefix="/api/sites", tags=["sites"])

@router.get("", response_model=List[schemas.Site])
async def list_sites(db: AsyncSession = Depends(get_db)):
    stmt = select(SiteModel)
    res = await db.execute(stmt)
    sites = res.scalars().all()
    return [schemas.Site.model_validate(s) for s in sites]

@router.get("/{site_id}", response_model=schemas.SiteDetailResponse)
async def get_site_details(site_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(SiteModel).where(SiteModel.id == site_id)
    res = await db.execute(stmt)
    site = res.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    summary, trend, expected_vs_obs, flags = await compute_site_analytics(db, site)

    # Fetch recordings with detections for response
    rec_stmt = select(RecordingModel).where(RecordingModel.site_id == site_id)
    rec_res = await db.execute(rec_stmt)
    recordings = list(rec_res.scalars().all())

    rec_schemas: List[schemas.Recording] = []
    for r in sorted(recordings, key=lambda x: x.date, reverse=True):
        det_stmt = select(DetectionModel).where(DetectionModel.recording_id == r.id)
        det_res = await db.execute(det_stmt)
        dets = det_res.scalars().all()

        det_schemas = [
            schemas.Detection(
                speciesId=d.species_id,
                windows=d.windows,
                confidence=d.confidence,
                review=d.review
            )
            for d in dets
        ]

        rec_schemas.append(schemas.Recording(
            id=r.id,
            siteId=r.site_id,
            date=r.date,
            durationSec=r.duration_sec,
            aci=r.aci,
            richness=r.richness,
            detections=det_schemas,
            uploader=r.uploader
        ))

    return schemas.SiteDetailResponse(
        site=schemas.Site.model_validate(site),
        summary=summary,
        trend=trend,
        expectedVsObserved=expected_vs_obs,
        flags=flags,
        recordings=rec_schemas
    )
