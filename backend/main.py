from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from ocr import recognize
import numpy as np
import cv2
import os
from dotenv import load_dotenv

from supabase import create_client
from supabase.client import ClientOptions

load_dotenv()


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise RuntimeError(f"Missing required environment variable: {name}")


SUPABASE_URL: str = require_env("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str = require_env("SUPABASE_SERVICE_ROLE_KEY")
MAX_FREE_REQUESTS = int(os.getenv("MAX_FREE_REQUESTS", "50"))

app = FastAPI()
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(auto_refresh_token=False, persist_session=False),
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def get_cloud_request_count(anon_install_id: str) -> int:
    check_usage_response = (
        supabase.table("browser_id_cloud_requests")
        .select("request_count")
        .eq("anon_install_id", anon_install_id)
        .execute()
    )

    rows = check_usage_response.data or []
    first_row = rows[0] if rows else None

    if not isinstance(first_row, dict):
        return 0

    raw_request_count = first_row.get("request_count", 0)

    if isinstance(raw_request_count, (int, float, str)):
        return int(raw_request_count)

    return 0


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/ocr/usage/")
async def get_ocr_usage(anon_install_id: str = Form(...)):
    current_request_count = get_cloud_request_count(anon_install_id)
    return {
        "request_count": current_request_count,
        "max_free_requests": MAX_FREE_REQUESTS,
        "remaining_requests": max(MAX_FREE_REQUESTS - current_request_count, 0),
    }


@app.post("/ocr/")
async def receive_ocr(
    raw_img: UploadFile = File(...),
    anon_install_id: str = Form(...),
    jwt: str | None = Form(None),
):
    print("request received.")

    is_supporter = False
    current_request_count = 0

    if jwt:
        user_response = supabase.auth.get_user(jwt)

        if user_response:
            user_id = user_response.user.id

            supabase.table("browser_id_cloud_requests").upsert(
                {"anon_install_id": anon_install_id, "linked_user_id": user_id}
            ).execute()

            supporter_status_response = (
                supabase.table("stripe_customers")
                .select("plan")
                .eq("id", user_id)
                .execute()
            )
            rows = supporter_status_response.data or []
            first_row = rows[0] if rows else None

            if not isinstance(first_row, dict):
                is_supporter = False
            else:
                plan = first_row.get("plan", "")
                if plan == "supporter":
                    is_supporter = True

    if not is_supporter:
        current_request_count = get_cloud_request_count(anon_install_id)

        if current_request_count >= MAX_FREE_REQUESTS:
            raise HTTPException(
                status_code=403,
                detail="Free Cloud OCR limit reached. Become a ZhongLens supporter to get unlimited Cloud OCR.",
            )

    # read image data
    data = await raw_img.read()

    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="cv2.imdecode failed")

    try:
        result = recognize(img)

        if not is_supporter:
            new_request_count = current_request_count + 1
            (
                supabase.table("browser_id_cloud_requests")
                .upsert(
                    {
                        "anon_install_id": anon_install_id,
                        "request_count": new_request_count,
                    }
                )
                .execute()
            )
            return {
                "result": result,
                "request_count": new_request_count,
            }
        else:
            return {"result": result}
    except Exception as e:
        print("OCR error:", e)
        raise HTTPException(status_code=500, detail="OCR failed")
