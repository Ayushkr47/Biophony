from typing import Literal, List, Optional
from pydantic import BaseModel, ConfigDict

Guild = Literal["indicator", "generalist", "disturbance"]
SiteStatus = Literal["healthy", "watch", "alert", "recovering"]
ReviewState = Literal["unreviewed", "confirmed", "rejected"]
FlagKind = Literal["silent-indicator", "disturbance-rise", "aci-decline", "richness-drop"]
FlagSeverity = Literal["high", "medium", "low"]
JobStage = Literal["idle", "queued", "analysing", "indexing", "done", "error"]

class Species(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    common: str
    scientific: str
    guild: Guild
    base: float

class Detection(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    speciesId: str
    windows: int
    confidence: float
    review: ReviewState

class Recording(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    siteId: str
    date: str
    durationSec: int
    aci: float
    richness: int
    detections: List[Detection]
    uploader: str

class Site(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    region: str
    lat: float
    lon: float
    habitat: str
    status: SiteStatus
    mapX: float
    mapY: float

class Flag(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    siteId: str
    kind: FlagKind
    severity: FlagSeverity
    title: str
    detail: str
    raised: str

class TrendPoint(BaseModel):
    date: str
    label: str
    richness: int
    aci: float
    indicator: int
    disturbance: int
    detections: int

class ExpectedRow(BaseModel):
    species: Species
    expected: bool
    recent: int
    prior: int
    lastHeard: Optional[str] = None

class AciSummary(BaseModel):
    recent: float
    prior: float
    delta: float

class SiteSummary(BaseModel):
    recordings: int
    latestDate: Optional[str] = None
    richness: int
    totalDetections: int
    aci: AciSummary
    missingCount: int
    missing: List[ExpectedRow]
    silentCount: int
    wentSilent: List[ExpectedRow]
    disturbanceShare: int

class SiteDetailResponse(BaseModel):
    site: Site
    summary: SiteSummary
    trend: List[TrendPoint]
    expectedVsObserved: List[ExpectedRow]
    flags: List[Flag]
    recordings: List[Recording]

class ReviewUpdateRequest(BaseModel):
    review: ReviewState

class JobStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    stage: JobStage
    recordingId: Optional[str] = None
    siteId: Optional[str] = None
    error: Optional[str] = None
