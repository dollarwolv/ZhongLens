from paddleocr import PaddleOCR
from dotenv import load_dotenv
import pprint

load_dotenv()

ocr = PaddleOCR(
    text_detection_model_name="PP-OCRv5_mobile_det",
    text_recognition_model_name="PP-OCRv5_mobile_rec",
    use_doc_orientation_classify=False,  # Disables document orientation classification model via this parameter
    use_doc_unwarping=False,  # Disables text image rectification model via this parameter
    use_textline_orientation=False,  # Disables text line orientation classification model via this parameter
    text_rec_score_thresh=0.9,
)

print("ocr model made.")


def recognize(img):
    print("starting recognition")
    result = ocr.predict(img)

    for res in result:
        res.save_to_img("output")

    first_img = result[0]
    result_json = dict(first_img.json)

    return result_json
