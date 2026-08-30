import datetime
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import SiteModel, SpeciesModel, RecordingModel, DetectionModel

SPECIES_DATA = [
    # Forest-interior indicators — the species that vanish first.
    {"id": "mtbb", "common": "Malabar Trogon", "scientific": "Harpactes fasciatus", "guild": "indicator", "base": 0.42},
    {"id": "gyhb", "common": "Great Hornbill", "scientific": "Buceros bicornis", "guild": "indicator", "base": 0.3},
    {"id": "wcbb", "common": "White-cheeked Barbet", "scientific": "Psilopogon viridis", "guild": "indicator", "base": 0.62},
    {"id": "hclb", "common": "Heart-spotted Woodpecker", "scientific": "Hemicircus canente", "guild": "indicator", "base": 0.34},
    {"id": "orbl", "common": "Orange-headed Thrush", "scientific": "Geokichla citrina", "guild": "indicator", "base": 0.46},
    {"id": "nlfl", "common": "Nilgiri Flycatcher", "scientific": "Eumyias albicaudatus", "guild": "indicator", "base": 0.28},

    # Generalists — present nearly everywhere, weak signal on their own.
    {"id": "rvbu", "common": "Red-vented Bulbul", "scientific": "Pycnonotus cafer", "guild": "generalist", "base": 0.86},
    {"id": "orma", "common": "Oriental Magpie-Robin", "scientific": "Copsychus saularis", "guild": "generalist", "base": 0.78},
    {"id": "asko", "common": "Asian Koel", "scientific": "Eudynamys scolopaceus", "guild": "generalist", "base": 0.7},
    {"id": "prin", "common": "Ashy Prinia", "scientific": "Prinia socialis", "guild": "generalist", "base": 0.74},
    {"id": "pubu", "common": "Purple Sunbird", "scientific": "Cinnyris asiaticus", "guild": "generalist", "base": 0.68},

    # Disturbance-associated — a rising share of these is the warning sign.
    {"id": "hocr", "common": "House Crow", "scientific": "Corvus splendens", "guild": "disturbance", "base": 0.55},
    {"id": "romy", "common": "Common Myna", "scientific": "Acridotheres tristis", "guild": "disturbance", "base": 0.6},
    {"id": "rrpa", "common": "Rose-ringed Parakeet", "scientific": "Psittacula krameri", "guild": "disturbance", "base": 0.5},
    {"id": "bkit", "common": "Black Kite", "scientific": "Milvus migrans", "guild": "disturbance", "base": 0.44},
    {"id": "rodo", "common": "Rock Dove", "scientific": "Columba livia", "guild": "disturbance", "base": 0.4},
]

SITES_DATA = [
    {
        "id": "agumbe",
        "name": "Agumbe Rainforest Plot",
        "region": "Shivamogga, Karnataka",
        "lat": 13.5025,
        "lon": 75.0906,
        "habitat": "Wet evergreen forest",
        "status": "healthy",
        "mapX": 0.22,
        "mapY": 0.7,
    },
    {
        "id": "valparai",
        "name": "Valparai Shade-Coffee Corridor",
        "region": "Coimbatore, Tamil Nadu",
        "lat": 10.3271,
        "lon": 76.9514,
        "habitat": "Shade plantation mosaic",
        "status": "recovering",
        "mapX": 0.34,
        "mapY": 0.88,
    },
    {
        "id": "kanha",
        "name": "Kanha Buffer Edge",
        "region": "Mandla, Madhya Pradesh",
        "lat": 22.3345,
        "lon": 80.6115,
        "habitat": "Sal forest / grassland edge",
        "status": "watch",
        "mapX": 0.55,
        "mapY": 0.4,
    },
    {
        "id": "yamuna",
        "name": "Yamuna Floodplain Scrub",
        "region": "Delhi NCR",
        "lat": 28.6139,
        "lon": 77.209,
        "habitat": "Riparian scrub, peri-urban",
        "status": "alert",
        "mapX": 0.42,
        "mapY": 0.16,
    },
]

PROFILES = {
    "agumbe": {"seed": 1001, "aciStart": 1642, "aciEnd": 1698, "indStart": 1.62, "indEnd": 1.68, "distStart": 0.62, "distEnd": 0.6, "uploaders": ["R. Kamath", "Forest Dept. — Agumbe", "A. Pillai"]},
    "valparai": {"seed": 2002, "aciStart": 1381, "aciEnd": 1524, "indStart": 0.86, "indEnd": 1.45, "distStart": 1.12, "distEnd": 0.74, "uploaders": ["NCF Field Team", "S. Muthu", "Estate Watch"]},
    "kanha": {"seed": 3003, "aciStart": 1588, "aciEnd": 1462, "indStart": 1.55, "indEnd": 0.72, "distStart": 0.7, "distEnd": 1.15, "uploaders": ["Buffer Patrol 3", "D. Verma", "Volunteer — Mocha"]},
    "yamuna": {"seed": 4004, "aciStart": 1298, "aciEnd": 1109, "indStart": 0.42, "indEnd": 0.1, "distStart": 1.3, "distEnd": 1.55, "uploaders": ["Yamuna Citizen Watch", "P. Sharma", "K. Nair"]},
}

def mulberry32(seed: int):
    def rand():
        nonlocal seed
        seed = (seed + 0x6d2b79f5) & 0xFFFFFFFF
        t = Math_imul(seed ^ (seed >> 15), 1 | seed)
        t = (t + Math_imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rand

def Math_imul(a, b):
    a = a & 0xFFFFFFFF
    b = b & 0xFFFFFFFF
    ah = (a >> 16) & 0xFFFF
    al = a & 0xFFFF
    bh = (b >> 16) & 0xFFFF
    bl = b & 0xFFFF
    return ((al * bl) + (((ah * bl + al * bh) & 0xFFFF) << 16)) & 0xFFFFFFFF

def lerp(a, b, t):
    return a + (b - a) * t

def iso_weeks_before(weeks_ago: int) -> str:
    base = datetime.date(2026, 8, 24)
    target = base - datetime.timedelta(days=weeks_ago * 7)
    return target.isoformat()

async def seed_database(db: AsyncSession):
    # Check if sites exist
    res = await db.execute(select(func.count()).select_from(SiteModel))
    count = res.scalar()
    if count and count > 0:
        return  # DB already seeded

    print("Seeding database with initial sites, species, and historical recordings...")

    # Insert species
    for sp in SPECIES_DATA:
        db.add(SpeciesModel(**sp))

    # Insert sites
    for site in SITES_DATA:
        db.add(SiteModel(**site))

    await db.commit()

    # Generate 12 weekly recordings per site
    weeks = 12
    for site in SITES_DATA:
        p = PROFILES[site["id"]]
        rand = mulberry32(p["seed"])

        for w in range(weeks - 1, -1, -1):
            t = (weeks - 1 - w) / (weeks - 1)
            date_str = iso_weeks_before(w)

            ind_mul = lerp(p["indStart"], p["indEnd"], t)
            dist_mul = lerp(p["distStart"], p["distEnd"], t)

            rec_id = f"{site['id']}-{date_str}"
            dur = 45 + int(round(rand() * 15))
            aci = int(round(lerp(p["aciStart"], p["aciEnd"], t) + (rand() - 0.5) * 46))
            uploader = p["uploaders"][int(rand() * len(p["uploaders"]))]

            detections_to_add = []
            for sp in SPECIES_DATA:
                mul = ind_mul if sp["guild"] == "indicator" else (dist_mul if sp["guild"] == "disturbance" else 0.9)
                presence = sp["base"] * mul * (0.72 + rand() * 0.56)
                if presence < 0.36:
                    continue

                windows = max(1, int(round(presence * 14 * (0.6 + rand() * 0.8))))
                conf = min(0.97, max(0.32, presence * 0.82 + rand() * 0.2))

                if w > 3:
                    review = "confirmed" if conf > 0.55 else ("rejected" if rand() > 0.7 else "confirmed")
                else:
                    review = "unreviewed"

                detections_to_add.append({
                    "species_id": sp["id"],
                    "windows": windows,
                    "confidence": round(conf, 2),
                    "review": review
                })

            accepted_count = sum(1 for d in detections_to_add if d["review"] != "rejected")

            rec_model = RecordingModel(
                id=rec_id,
                site_id=site["id"],
                date=date_str,
                duration_sec=dur,
                aci=float(aci),
                richness=accepted_count,
                uploader=uploader,
                file_path=None
            )
            db.add(rec_model)

            for d in detections_to_add:
                det_model = DetectionModel(
                    recording_id=rec_id,
                    species_id=d["species_id"],
                    windows=d["windows"],
                    confidence=d["confidence"],
                    review=d["review"]
                )
                db.add(det_model)

    await db.commit()
    print("Database seeding completed successfully.")
