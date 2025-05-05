from fastapi import HTTPException
from httpx import HTTPError
import requests
import os
from dotenv import load_dotenv
from pydantic import BaseModel, model_validator
from typing import Optional, Any

load_dotenv(".env.local")

url = "https://api.foursquare.com/v3/places/search"
FOURSQUARE_API_KEY=os.getenv('FOURSQUARE_API_KEY')

class PlaceSearchParams(BaseModel):
    ll: Optional[str] = None           # latitude,longitude for circular boundary
    near: Optional[str] = None         # geocodable place name
    radius: Optional[int] = None       # meters for circular boundary
    ne: Optional[str] = None           # northeast corner lat,lng for rectangular boundary
    sw: Optional[str] = None           # southwest corner lat,lng for rectangular boundary
    query: Optional[str] = None        # search term
    limit: Optional[int] = None        # max number of results
    sort: Optional[str] = None         # RELEVANCE or DISTANCE
    categories: Optional[str] = None   # comma-separated list of category IDs
    chain_ids: Optional[str] = None    # comma-separated list of chain IDs
    open_now: Optional[bool] = None    # only currently open venues
    price: Optional[str] = None        # comma-separated price tiers (1-4)
    fields: Optional[str] = None       # comma-separated response fields to include

    @model_validator(mode="before")
    def validate_location(cls, values):
        ll, near, ne, sw, radius = values.get('ll'), values.get('near'), values.get('ne'), values.get('sw'), values.get('radius')
        # require either circular (ll+radius), or near, or rectangular (ne+sw)
        if not ((ll and radius) or near or (ne and sw)):
            raise ValueError('Must specify either ll and radius, or near, or both ne and sw')
        return values

def get_restaurants(params: PlaceSearchParams) -> Any:
    if not FOURSQUARE_API_KEY:
         raise HTTPException(status_code=500, detail="Foursquare API key is not configured.")

    headers = {
      "accept": "application/json",
      "Authorization": FOURSQUARE_API_KEY
    }
    try:
        # Make the request
        response = requests.get(url, headers=headers, params=params.model_dump(exclude_none=True))
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status() 
        # Return the JSON response if successful
        return response.json()
    except HTTPError as http_err:
        # Handle HTTP errors from Foursquare (e.g., 400 Bad Request, 401 Unauthorized, 429 Rate Limit)
        status_code = http_err.response.status_code
        detail = f"Foursquare API error: {http_err}"
        # Try to get more specific error detail from Foursquare response if possible
        try:
            error_json = http_err.response.json()
            detail = f"Foursquare API error ({status_code}): {error_json.get('message', http_err)}"
        except ValueError: # If response is not JSON
            pass 
        # Use 502 Bad Gateway if Foursquare gives an error, or the original status if it's a client error like 401/403
        api_error_status = 502 if status_code >= 500 else status_code 
        raise HTTPException(status_code=api_error_status, detail=detail)
    except requests.RequestException as req_err:
        # Handle network-related errors (DNS failure, connection refused, timeout, etc.)
        raise HTTPException(status_code=503, detail=f"Could not connect to Foursquare API: {req_err}")
    except Exception as e:
        # Catch any other unexpected errors during the request/response handling
        print(f"Unexpected error calling Foursquare: {e}") # Log for debugging
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching data from Foursquare.")
