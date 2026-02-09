from fastapi import FastAPI, UploadFile
from ocr import recognize
import numpy as np
import cv2

app = FastAPI()


@app.post("/ocr/")
async def receive_ocr(raw_img: UploadFile):
    print("request received.")
    data = await raw_img.read()
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        return {"ok": False, "error": "cv2.imdecode failed"}

    result = recognize(img)

    return {"result": result}
