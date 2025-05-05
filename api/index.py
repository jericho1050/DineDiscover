import os
import json
from typing import List, Dict, Any
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
from openai import OpenAI
from requests.exceptions import HTTPError
from .utils.tools import *

load_dotenv(".env.local")

app = FastAPI()

client = OpenAI(
    api_key=os.environ.get("TOGETHER_API_KEY"),
    base_url="https://api.together.xyz/v1",
)


class Request(BaseModel):
    message: str


# Define the Foursquare tool schema based on PlaceSearchParams
# Note: LLMs work best with simpler schemas. Include only the most common/useful fields.
restaurant_search_tool_schema = {
    "type": "function",
    "function": {
        "name": "restaurant_search",
        "description": "Search for restaurants using various criteria like location, query, price, opening hours, etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The type of food or restaurant name (e.g., 'sushi', 'italian', 'Pizza Hut').",
                },
                "ll": {
                    "type": "string",
                    "description": "Latitude,longitude coordinates (e.g., '40.7,-74.0'). Use this OR near, not both.",
                },
                "near": {
                    "type": "string",
                    "description": "A location name to search near (e.g., 'downtown Los Angeles', 'Seattle, WA'). Use this OR ll, not both.",
                },
                "radius": {
                    "type": "integer",
                    "description": "Search radius in meters. Only used with 'll'. Max 100000.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default 10, max 50).",
                },
                "open_now": {
                    "type": "boolean",
                    "description": "Set to true to only find places currently open.",
                },
                "price": {
                    "type": "string",
                    "description": "Comma-separated list of price tiers (1=cheap, 2=moderate, 3=expensive, 4=very expensive). E.g., '1,2'.",
                },
                "sort": {
                    "type": "string",
                    "enum": ["RELEVANCE", "DISTANCE"],
                    "description": "How to sort results. Defaults to RELEVANCE.",
                },
            },
            "required": [],  # Let the LLM decide which location field to use based on context
        },
    },
}

# Map tool name to the actual function
available_tools = {
    "restaurant_search": get_restaurants,
}


@app.post("/api/execute")
async def handle_chat_data(request: Request):
    user_message = request.message

    messages: List[Dict[str, str]] = (
        [
            {
                "role": "system",
                "content": "You are a helpful assistant that converts user requests into Foursquare API search parameters. Call the restaurant_search function with the extracted parameters. Determine location from the user query ('near' field is usually best unless coordinates are given). Only use parameters explicitly mentioned or strongly implied by the user. Do NOT attempt to filter by minimum rating, as it is not supported.",
            },
            {"role": "user", "content": user_message},
        ]
    )

    try:

        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",  # Or your preferred model
            messages=messages,
            tools=[restaurant_search_tool_schema],
            tool_choice={
                "type": "function",
                "function": {"name": "restaurant_search"},
            },  # Force tool use
        )

        response_message = response.choices[0].message

        # Check if the LLM decided to call the tool
        if response_message.tool_calls:
            tool_call = response_message.tool_calls[0]  # Assuming one tool call
            function_name = tool_call.function.name
            function_args_str = tool_call.function.arguments

            if function_name == "restaurant_search":
                # Parse the arguments string into a dictionary
                try:
                    function_args: Dict[str, Any] = json.loads(function_args_str)
                except json.JSONDecodeError:
                    raise HTTPException(
                        status_code=500,
                        detail="LLM returned invalid JSON for tool arguments.",
                    )
                    
                # we're just validating search params here below
                try:
                    search_params = PlaceSearchParams(**function_args)

                except ValidationError as e:
                    # Potentially inform the user or LLM about the validation error
                    # return a more user-friendly error here
                    error_detail = "I couldn't understand the search parameters."

                    is_location_error = any(
                        err.get("type") == "value_error"
                        and "Must specify either ll and radius, or near, or both ne and sw"
                        in err.get("msg", "")
                        for err in e.errors()
                    )
                    if is_location_error:
                        error_detail = "Please specify a location for the search (e.g., 'near downtown LA', or provide coordinates)."
                    else:
                        # Generic message for other validation errors
                        # You could add more checks here for other common errors if needed
                        first_error = e.errors()[0] if e.errors() else {}
                        field = (
                            first_error.get("loc", ["unknown"])[0]
                            if first_error.get("loc")
                            else "unknown"
                        )
                        msg = first_error.get("msg", "Invalid value")
                        error_detail = f"Invalid parameter for '{field}': {msg}. Please check your request."

                    raise HTTPException(status_code=400, detail=error_detail)

                # Specific try-except block for the Foursquare API call, this is where we invoke now the get restaurants
                try:
                    foursquare_results = get_restaurants(params=search_params)
                    
                    print("THE foursquare results", json.dumps(foursquare_results, indent=2))
                    # Return the raw Foursquare results directly
                    return JSONResponse(content=foursquare_results)

                # Catch HTTP errors from the Foursquare API call
                except HTTPError as http_err:
                    status_code = http_err.response.status_code if http_err.response else 500
                    error_detail = "An error occurred while contacting the restaurant service."

                    # Handle client errors (like 400 Bad Request) specifically
                    if 400 <= status_code < 500:
                        # Try to get a more specific error from Foursquare response if available
                        try:
                            fs_error = http_err.response.json().get("message", "Invalid request parameters.")
                            error_detail = f"Restaurant search failed: {fs_error}"
                        except (json.JSONDecodeError, AttributeError):
                             error_detail = "Could not process the request. Please check the location or search terms."

                        # Add specific check for location-related issues based on args
                        if "near" in function_args and status_code == 400: # Check status_code too
                             error_detail = f"Could not find results for the location: '{function_args['near']}'. Please check the location name or try a different one."
                        elif "ll" in function_args and status_code == 400:
                             error_detail = f"Could not find results for the provided coordinates: '{function_args['ll']}'. Please check the coordinates."

                        # Raise a FastAPI HTTPException - this will be handled by your chat framework
                        # The 'detail' will likely become the error message shown to the user
                        raise HTTPException(status_code=400, detail=error_detail)
                    # Handle server errors from Foursquare
                    else:
                        print(f"Foursquare API server error: {http_err}") # Log server-side
                        raise HTTPException(status_code=502, detail="The restaurant service (Foursquare) is currently unavailable. Please try again later.")
                # Catch other potential errors during the Foursquare call
                except Exception as e:
                     print(f"Error calling get_restaurants: {str(e)}") # Log server-side
                     raise HTTPException(status_code=400, detail="An unexpected error occurred while fetching restaurant data. Your prompt location probably doesn't exist, lol.")

            else:
                # Handle cases where the LLM didn't call the tool
                llm_content = response_message.content or "Sorry, I couldn't determine the search parameters from your request. Could you please rephrase?"
                # Return a 400 Bad Request as the user request wasn't processable into a search
                raise HTTPException(status_code=400, detail=llm_content)

        else:
            # Handle case where LLM didn't call tool
            llm_content = response_message.content or "Sorry, I couldn't determine the search parameters from your request. Could you please rephrase?"
            raise HTTPException(status_code=400, detail=llm_content)

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        # Catch potential API errors (LLM or Foursquare) or other issues
        # Log the error for debugging on the server side
        print(f"An unexpected error occurred in handle_chat_data: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An internal server error occurred."
        )
