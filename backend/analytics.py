import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import SiteModel, SpeciesModel, RecordingModel, DetectionModel, FlagModel
import schemas

def format_date_label(iso_str: str) -> str:
    try:
        dt = datetime.datetime.strptime(iso_str, "%Y-%m-%d")
        return dt.strftime("%d %b")
    except Exception:
        return iso_str

def calculate_aci_summary(recordings: List[RecordingModel]) -> Dict[str, float]:
    if not recordings:
        return {"recent": 0.0, "prior": 0.0, "delta": 0.0}

    sorted_recs = sorted(recordings, key=lambda r: r.date)
    acis = [r.aci for r in sorted_recs]

    def median(xs: List[float]) -> float:
        if not xs:
            return 0.0
        s = sorted(xs)
        m = len(s) // 2
        return s[m] if len(s) % 2 == 1 else round((s[m - 1] + s[m]) / 2.0, 1)

    recent_slice = acis[-4:]
    prior_slice = acis[-8:-4]

    recent_med = median(recent_slice)
    prior_med = median(prior_slice) if prior_slice else recent_med

    delta = ((recent_med - prior_med) / prior_med * 100.0) if prior_med > 0 else 0.0
    return {"recent": round(recent_med, 1), "prior": round(prior_med, 1), "delta": round(delta, 1)}

async def compute_site_analytics(
    db: AsyncSession, site: SiteModel
) -> Tuple[schemas.SiteSummary, List[schemas.TrendPoint], List[schemas.ExpectedRow], List[schemas.Flag]]:
    
    # 1. Fetch species pool
    sp_stmt = select(SpeciesModel)
    sp_res = await db.execute(sp_stmt)
    species_pool = list(sp_res.scalars().all())
    species_map = {sp.id: sp for sp in species_pool}

    # 2. Fetch site recordings with detections
    rec_stmt = select(RecordingModel).where(RecordingModel.site_id == site.id)
    rec_res = await db.execute(rec_stmt)
    recordings = list(rec_res.scalars().all())
    
    # Fetch all detections for these recordings
    rec_ids = [r.id for r in recordings]
    detections_map: Dict[str, List[DetectionModel]] = {r_id: [] for r_id in rec_ids}
    
    if rec_ids:
        det_stmt = select(DetectionModel).where(DetectionModel.recording_id.in_(rec_ids))
        det_res = await db.execute(det_stmt)
        for det in det_res.scalars().all():
            detections_map[det.recording_id].append(det)

    sorted_recs = sorted(recordings, key=lambda r: r.date)
    recent_recs = sorted_recs[-4:]
    prior_recs = sorted_recs[-8:-4]

    # Helper: count valid detections in rec list for a species
    def count_species_in_recs(rec_list: List[RecordingModel], species_id: str) -> int:
        count = 0
        for r in rec_list:
            dets = detections_map.get(r.id, [])
            if any(d.species_id == species_id and d.review != "rejected" for d in dets):
                count += 1
        return count

    # 3. Build Expected vs Observed
    expected_rows: List[schemas.ExpectedRow] = []
    peri_urban = site.id == "yamuna"

    for sp in species_pool:
        expected = False if (peri_urban and sp.guild == "indicator" and sp.base <= 0.5) else True
        recent_cnt = count_species_in_recs(recent_recs, sp.id)
        prior_cnt = count_species_in_recs(prior_recs, sp.id)

        # Last heard date
        last_heard = None
        for r in reversed(sorted_recs):
            dets = detections_map.get(r.id, [])
            if any(d.species_id == sp.id and d.review != "rejected" for d in dets):
                last_heard = r.date
                break

        expected_rows.append(schemas.ExpectedRow(
            species=schemas.Species.model_validate(sp),
            expected=expected,
            recent=recent_cnt,
            prior=prior_cnt,
            lastHeard=last_heard
        ))

    # Order expected rows by guild (indicator, disturbance, generalist) and recent count
    guild_order = {"indicator": 0, "disturbance": 1, "generalist": 2}
    expected_rows.sort(key=lambda r: (guild_order.get(r.species.guild, 3), -r.recent))

    # 4. Build Trend Points
    trend_points: List[schemas.TrendPoint] = []
    for r in sorted_recs:
        dets = detections_map.get(r.id, [])
        accepted = [d for d in dets if d.review != "rejected"]
        
        ind_cnt = sum(1 for d in accepted if species_map.get(d.species_id) and species_map[d.species_id].guild == "indicator")
        dist_cnt = sum(1 for d in accepted if species_map.get(d.species_id) and species_map[d.species_id].guild == "disturbance")
        window_sum = sum(d.windows for d in accepted)

        trend_points.append(schemas.TrendPoint(
            date=r.date,
            label=format_date_label(r.date),
            richness=r.richness,
            aci=r.aci,
            indicator=ind_cnt,
            disturbance=dist_cnt,
            detections=window_sum
        ))

    # 5. Site Summary Calculations
    aci_summary_data = calculate_aci_summary(sorted_recs)
    gaps = [r for r in expected_rows if r.expected and r.recent == 0]
    went_silent = [r for r in gaps if r.prior > 0]

    recent_detected_species = set()
    recent_disturbance_species = set()
    for r in recent_recs:
        dets = detections_map.get(r.id, [])
        for d in dets:
            if d.review != "rejected":
                recent_detected_species.add(d.species_id)
                if species_map.get(d.species_id) and species_map[d.species_id].guild == "disturbance":
                    recent_disturbance_species.add(d.species_id)

    disturbance_share = (
        len(recent_disturbance_species) / max(1, len(recent_detected_species)) * 100.0
        if recent_detected_species else 0.0
    )

    total_dets_count = sum(
        sum(1 for d in detections_map.get(r.id, []) if d.review != "rejected")
        for r in sorted_recs
    )

    latest_date = sorted_recs[-1].date if sorted_recs else None
    latest_richness = sorted_recs[-1].richness if sorted_recs else 0

    summary = schemas.SiteSummary(
        recordings=len(sorted_recs),
        latestDate=latest_date,
        richness=latest_richness,
        totalDetections=total_dets_count,
        aci=schemas.AciSummary(**aci_summary_data),
        missingCount=len(gaps),
        missing=gaps,
        silentCount=len(went_silent),
        wentSilent=went_silent,
        disturbanceShare=int(round(disturbance_share))
    )

    # 6. Generate Flags
    flags: List[schemas.Flag] = []
    ref_date = latest_date or datetime.date.today().isoformat()

    # Flag 1: Silent indicator species
    for row in expected_rows:
        if row.species.guild == "indicator" and row.expected and row.recent == 0 and row.prior >= 2:
            flags.append(schemas.Flag(
                id=f"{site.id}-silent-{row.species.id}",
                siteId=site.id,
                kind="silent-indicator",
                severity="high" if row.prior >= 3 else "medium",
                title=f"{row.species.common} has gone quiet",
                detail=f"Detected in {row.prior} of the previous 4 recordings, then absent from all 4 most recent. Last heard {row.lastHeard or 'unknown'}.",
                raised=ref_date
            ))

    # Flag 2: Disturbance rise
    if summary.disturbanceShare >= 30:
        flags.append(schemas.Flag(
            id=f"{site.id}-disturbance",
            siteId=site.id,
            kind="disturbance-rise",
            severity="high" if summary.disturbanceShare >= 40 else "medium",
            title="Disturbance-associated species rising",
            detail=f"{summary.disturbanceShare}% of species detected in recent recordings are associated with degraded or human-modified habitat.",
            raised=ref_date
        ))

    # Flag 3: ACI decline
    if aci_summary_data["delta"] <= -4.0:
        flags.append(schemas.Flag(
            id=f"{site.id}-aci",
            siteId=site.id,
            kind="aci-decline",
            severity="high" if aci_summary_data["delta"] <= -8.0 else "medium",
            title="Acoustic complexity declining",
            detail=f"Median ACI fell {abs(aci_summary_data['delta'])}% versus the previous four recordings.",
            raised=ref_date
        ))

    # Flag 4: Richness drop
    if len(sorted_recs) >= 8:
        early_rich = sum(r.richness for r in sorted_recs[:4]) / 4.0
        late_rich = sum(r.richness for r in sorted_recs[-4:]) / 4.0
        if late_rich < early_rich - 1.5:
            flags.append(schemas.Flag(
                id=f"{site.id}-richness",
                siteId=site.id,
                kind="richness-drop",
                severity="high" if late_rich < early_rich - 3.0 else "low",
                title="Species richness trending down",
                detail=f"Mean richness fell from {early_rich:.1f} to {late_rich:.1f} species per recording across the sampled window.",
                raised=ref_date
            ))

    # Sort flags by severity
    sev_rank = {"high": 0, "medium": 1, "low": 2}
    flags.sort(key=lambda f: sev_rank.get(f.severity, 3))

    return summary, trend_points, expected_rows, flags
