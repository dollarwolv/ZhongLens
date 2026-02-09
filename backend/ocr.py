from paddleocr import PaddleOCR
from dotenv import load_dotenv
import pprint

load_dotenv()


def recognize(img):
    ocr = PaddleOCR(
        use_doc_orientation_classify=False,  # Disables document orientation classification model via this parameter
        use_doc_unwarping=False,  # Disables text image rectification model via this parameter
        use_textline_orientation=False,  # Disables text line orientation classification model via this parameter
        text_rec_score_thresh=0.9,
    )
    result = ocr.predict(img)
    first_img = result[0]
    result_json = dict(first_img.json)

    return result_json
