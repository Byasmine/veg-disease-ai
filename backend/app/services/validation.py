from PIL import Image

MAX_SIZE_MB = 10
MIN_DIM = 50

def validate_image(image: Image.Image):

    # Ensure RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Check dimensions
    w, h = image.size
    if w < MIN_DIM or h < MIN_DIM:
        raise ValueError("Image resolution too small")

    return image