from paddleocr import PaddleOCR
import cv2
from matplotlib import pyplot as plt

ocr = PaddleOCR(
    use_doc_orientation_classify=False,  # Disables document orientation classification model via this parameter
    use_doc_unwarping=False,  # Disables text image rectification model via this parameter
    use_textline_orientation=False,  # Disables text line orientation classification model via this parameter
)
image_path = "jia.jpg"
img = cv2.imread(image_path)

# this is my comment
result = ocr.predict(img)
for res in result:
    res.print()
    res.save_to_img("output")
    res.save_to_json("output")
