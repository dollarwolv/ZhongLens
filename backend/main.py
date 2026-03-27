from fastapi import FastAPI, UploadFile, File, HTTPException
from ocr import recognize
import numpy as np
import cv2

app = FastAPI()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/ocr/")
async def receive_ocr(raw_img: UploadFile):
    print("request received.")
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
        return {"result": result}
    except Exception as e:
        print("OCR error:", e)
        raise HTTPException(status_code=500, detail="OCR failed")
