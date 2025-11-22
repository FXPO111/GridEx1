from fastapi import APIRouter
from backend.services.rates import get_effective_rate

router = APIRouter(prefix="/api/rates")

@router.get("/current")
def get_rate():
    return {"rate": get_effective_rate()}
