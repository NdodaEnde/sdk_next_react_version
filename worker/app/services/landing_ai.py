from typing import Dict, Any, Optional
import os
from PIL import Image
import asyncio
from loguru import logger
from landingai.pipeline import inference
from landingai.common.types import BoundingBox, InferenceResult, Prediction, Score
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

# Configure LandingAI credentials
os.environ["LANDINGAI_API_KEY"] = settings.LANDINGAI_API_KEY
os.environ["LANDINGAI_CLIENT_ID"] = settings.LANDINGAI_CLIENT_ID

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def get_prediction_from_landingai(image: Image.Image, model_id: str) -> Dict[str, Any]:
    """
    Get a prediction from LandingAI
    
    Args:
        image: PIL Image to analyze
        model_id: LandingAI model ID
        
    Returns:
        Dict containing the prediction results
    """
    try:
        # Run in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            lambda: inference.infer(
                model_id=model_id,
                image=image
            )
        )
        
        # Convert the LandingAI result to a serializable dict
        prediction_dict = inference_result_to_dict(result)
        logger.info(f"LandingAI prediction successful for model {model_id}")
        
        return prediction_dict
    except Exception as e:
        logger.error(f"Error getting prediction from LandingAI: {str(e)}")
        raise

def inference_result_to_dict(result: InferenceResult) -> Dict[str, Any]:
    """Convert LandingAI InferenceResult to a serializable dict"""
    if not result or not result.predictions:
        return {"predictions": []}
    
    # Process each prediction
    predictions = []
    for pred in result.predictions:
        prediction_dict = {
            "label": pred.label,
            "score": pred.score.value if pred.score else None,
            "boundingBox": None,
            "text": pred.text if hasattr(pred, 'text') else None,
        }
        
        # Add bounding box if available
        if pred.bounding_box:
            prediction_dict["boundingBox"] = {
                "xmin": pred.bounding_box.xmin,
                "ymin": pred.bounding_box.ymin,
                "xmax": pred.bounding_box.xmax,
                "ymax": pred.bounding_box.ymax,
            }
        
        predictions.append(prediction_dict)
    
    # Extract OCR text if available
    ocr_text = ""
    for pred in result.predictions:
        if hasattr(pred, 'text') and pred.text:
            if pred.label:
                ocr_text += f"{pred.label}: {pred.text}\n"
            else:
                ocr_text += f"{pred.text}\n"
    
    return {
        "predictions": predictions,
        "ocrText": ocr_text.strip(),
        "modelId": result.model_id,
        "imageSize": {
            "width": result.image_size.width if result.image_size else None,
            "height": result.image_size.height if result.image_size else None,
        }
    }