# backend/models/request_models.py
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    direction: str
    amount_rub: float
    usdt_address: str
    email: str | None = None
    telegram: str | None = None
    rate: float | None = None

class UpdateStatusRequest(BaseModel):
    status: str = Field(example="confirmed")  # confirmed / completed / canceled
