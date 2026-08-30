import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base

class SiteModel(Base):
    __tablename__ = "sites"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    habitat = Column(String, nullable=False)
    status = Column(String, nullable=False, default="healthy")
    mapX = Column(Float, nullable=False)
    mapY = Column(Float, nullable=False)

    recordings = relationship("RecordingModel", back_populates="site", cascade="all, delete-orphan")
    flags = relationship("FlagModel", back_populates="site", cascade="all, delete-orphan")


class SpeciesModel(Base):
    __tablename__ = "species"

    id = Column(String, primary_key=True, index=True)
    common = Column(String, nullable=False)
    scientific = Column(String, nullable=False)
    guild = Column(String, nullable=False)  # indicator, generalist, disturbance
    base = Column(Float, nullable=False, default=0.5)

    detections = relationship("DetectionModel", back_populates="species")


class RecordingModel(Base):
    __tablename__ = "recordings"

    id = Column(String, primary_key=True, index=True)
    site_id = Column(String, ForeignKey("sites.id"), nullable=False, index=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    duration_sec = Column(Integer, nullable=False)
    aci = Column(Float, nullable=False)
    richness = Column(Integer, nullable=False, default=0)
    uploader = Column(String, nullable=False)
    file_path = Column(String, nullable=True)

    site = relationship("SiteModel", back_populates="recordings")
    detections = relationship("DetectionModel", back_populates="recording", cascade="all, delete-orphan")


class DetectionModel(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recording_id = Column(String, ForeignKey("recordings.id"), nullable=False, index=True)
    species_id = Column(String, ForeignKey("species.id"), nullable=False, index=True)
    windows = Column(Integer, nullable=False, default=1)
    confidence = Column(Float, nullable=False)
    review = Column(String, nullable=False, default="unreviewed")  # unreviewed, confirmed, rejected

    recording = relationship("RecordingModel", back_populates="detections")
    species = relationship("SpeciesModel", back_populates="detections")


class FlagModel(Base):
    __tablename__ = "flags"

    id = Column(String, primary_key=True, index=True)
    site_id = Column(String, ForeignKey("sites.id"), nullable=False, index=True)
    kind = Column(String, nullable=False)  # silent-indicator, disturbance-rise, aci-decline, richness-drop
    severity = Column(String, nullable=False)  # high, medium, low
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    raised = Column(String, nullable=False)  # ISO date string

    site = relationship("SiteModel", back_populates="flags")


class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False, default="queued")  # queued, analysing, indexing, done, error
    progress = Column(Integer, nullable=False, default=0)
    stage = Column(String, nullable=False, default="queued")
    result_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
