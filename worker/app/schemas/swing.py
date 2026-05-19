from datetime import datetime

from pydantic import BaseModel


class SwingUploadResponse(BaseModel):
    swing_id: str
    status: str


class SwingSummary(BaseModel):
    id: str
    created_at: datetime
    status: str
    overall_score: float | None
    handedness: str

    model_config = {"from_attributes": True}


class SwingListResponse(BaseModel):
    items: list[SwingSummary]
    total: int
    page: int
    page_size: int


class ProgressPoint(BaseModel):
    date: datetime
    score: float


class AngleTrend(BaseModel):
    angle_name: str
    values: list[float]
    dates: list[datetime]


class ProgressResponse(BaseModel):
    scores: list[ProgressPoint]
    angle_trends: list[AngleTrend]
