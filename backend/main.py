from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from ocr import recognize
import numpy as np
import cv2
import os
from dotenv import load_dotenv

from supabase import create_client
from supabase.client import ClientOptions

load_dotenv()
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MAX_FREE_REQUESTS: str = os.environ["MAX_FREE_REQUESTS"]

app = FastAPI()
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(auto_refresh_token=False, persist_session=False),
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@app.get("/health")
async def health():
    return {"ok": True}


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
        print("jwt received: ", jwt)
        user_response = supabase.auth.get_user(jwt)

        if user_response:
            user_id = user_response.user.id
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
        # check usage response in supabase
        check_usage_response = (
            supabase.table("browser_id_cloud_requests")
            .select("request_count")
            .eq("anon_install_id", anon_install_id)
            .execute()
        )

        # cast as empty List if there is no data or check data
        rows = check_usage_response.data or []
        first_row = rows[0] if rows else None

        # if the first row is not a dict (-> it is empty)...
        if not isinstance(first_row, dict):
            current_request_count = 0

        # all this monkey business is just to satisfy the type checking, don't worry about it
        else:
            raw_request_count = first_row.get("request_count", 0)

            # check if the request count is castable to int, otherwise it will just be set to 0, because it might be JSON and
            # then the type checker will cry
            if isinstance(raw_request_count, (int, float, str)):
                current_request_count = int(raw_request_count)
            else:
                current_request_count = 0

        if current_request_count >= int(MAX_FREE_REQUESTS):
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
