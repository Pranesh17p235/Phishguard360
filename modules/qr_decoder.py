"""
QR Code decoder with multiple fallback methods
Method 1: pyzbar (requires zbar system library)
Method 2: opencv QRCodeDetector (pure Python, no system deps)
Method 3: zxing-cpp if available
"""

from PIL import Image
from io import BytesIO

def decode_qr(image_bytes):
    """
    Try multiple QR decoding methods.
    Returns (urls, method_used, error_message)
    """
    img_pil = None
    try:
        img_pil = Image.open(BytesIO(image_bytes))
    except Exception as e:
        return [], None, f"Could not open image: {str(e)}"

    # ── Method 1: pyzbar ──
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        decoded = pyzbar_decode(img_pil)
        if decoded:
            urls = []
            for obj in decoded:
                data = obj.data.decode("utf-8", "ignore")
                if data.startswith("http"):
                    urls.append(data)
                else:
                    urls.append(data)
            return urls, "pyzbar", None
    except Exception as e:
        pass

    # ── Method 2: OpenCV ──
    try:
        import cv2
        import numpy as np
        img_array = np.array(img_pil.convert("RGB"))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(img_bgr)
        if data:
            return [data], "opencv", None
        # Try with grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        data, bbox, _ = detector.detectAndDecode(gray)
        if data:
            return [data], "opencv", None
    except Exception as e:
        pass

    # ── Method 3: zxingcpp ──
    try:
        import zxingcpp
        import numpy as np
        img_array = np.array(img_pil.convert("RGB"))
        results = zxingcpp.read_barcodes(img_array)
        if results:
            return [r.text for r in results], "zxingcpp", None
    except Exception:
        pass

    # ── Nothing worked ──
    return [], None, (
        "QR code could not be decoded. On macOS, run: brew install zbar "
        "then pip install pyzbar. Alternatively: pip install opencv-python"
    )
