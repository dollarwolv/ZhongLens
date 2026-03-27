from paddleocr import PaddleOCR
from dotenv import load_dotenv
import pprint

load_dotenv()

ocr = PaddleOCR(
    text_detection_model_name="PP-OCRv5_mobile_det",
    text_recognition_model_name="PP-OCRv5_mobile_rec",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    text_rec_score_thresh=0.9,
)

print("ocr model made.")


def recognize(img):
    print("starting recognition")
    result = ocr.predict(img)
    first_img = result[0]
    return dict(first_img.json)
