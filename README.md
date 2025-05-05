# DineDiscover: AI Restaurant Finder

DineDiscover is a web application that allows users to find restaurants using natural language queries. It leverages a Large Language Model (LLM) via the Together AI API to understand user requests and the Foursquare API to fetch relevant restaurant data. The frontend is built with Next.js, while the backend uses Python with FastAPI.

## Features

*   **Natural Language Search:** Ask for restaurants like "Find cheap sushi near downtown LA" or "Italian places open now in Seattle".
*   **LLM-Powered Parameter Extraction:** Uses an LLM (Llama 3.3 70B via Together AI) to intelligently convert user requests into Foursquare API search parameters.
*   **Foursquare Integration:** Fetches real-time restaurant data using the Foursquare Places API.
*   **Visual Results:** Displays restaurant results in clear, informative cards.
*   **Error Handling:** Provides user-friendly feedback for invalid locations or API issues.

## Tech Stack

*   **Frontend:**
    *   Next.js
    *   React
    *   TypeScript
    *   Tailwind CSS
    *   Framer Motion (for animations)
*   **Backend:**
    *   Python 3.x
    *   FastAPI
    *   Pydantic (for data validation)
*   **APIs:**
    *   Together AI (for LLM access)
    *   Foursquare Places API (for restaurant data)

## Setup and Installation

### Prerequisites

*   Node.js and pnpm (or npm/yarn)
*   Python 3.8+ and pip
*   `virtualenv` (recommended for Python environment management)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd dinediscover
    ```

2.  **API Keys:**
    *   Sign up for an account at [Together AI](https://www.together.ai/) and obtain an API key.
    *   Sign up for a developer account at [Foursquare for Developers](https://location.foursquare.com/developer/) and create an app to get an API key.

3.  **Environment Variables:**
    *   Create a file named `.env.local` in the root directory.
    *   Copy the contents of `.env.example` (if it exists) or add the following, replacing the placeholder values with your actual API keys:
        ```env
        # .env.local
        TOGETHER_API_KEY=your_together_ai_api_key
        FOURSQUARE_API_KEY=your_foursquare_api_key

        ```

4.  **Install Frontend Dependencies:**
    ```bash
    pnpm install
    ```

5.  **Setup Backend Environment:**
    ```bash
    # Create a virtual environment
    python -m venv venv
    # Activate it (Linux/macOS)
    source venv/bin/activate
    # Or (Windows)
    # .\venv\Scripts\activate
    ```

6.  **Install Backend Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

7.  **Run the Development Server:**
    *   This command starts both the Next.js frontend and the FastAPI backend concurrently (assuming `pnpm dev` is configured in `package.json` to do so, often using `concurrently`).
    ```bash
    pnpm dev
    ```
    *   Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1.  **User Input:** The user types a request into the chat interface (e.g., "Find pizza near me").
2.  **Frontend:** The Next.js app sends the message to the backend API endpoint (`/api/execute`).
3.  **Backend (LLM Call):** The FastAPI backend receives the message, constructs a prompt for the LLM (via Together AI), and asks it to generate Foursquare API parameters based on the user's request using a defined tool schema.
4.  **Backend (Tool Execution):**
    *   The LLM returns the desired function call (`restaurant_search`) and its arguments (e.g., `{"query": "pizza", "near": "user's current location"}`).
    *   The backend validates these arguments using Pydantic.
    *   The backend calls the `get_restaurants` function, which queries the Foursquare API with the validated parameters.
5.  **Backend (Foursquare API):** Foursquare returns a list of matching restaurants.
6.  **Backend (Response):** The FastAPI endpoint returns the raw Foursquare results to the Vercel AI SDK handler.
7.  **Vercel AI SDK:** The SDK likely makes a *second* call to the LLM (configured via `experimental_toolImpls` or similar in `useChat`), providing the Foursquare results as context. The LLM generates a user-friendly text summary based on the results.
8.  **Frontend Display:** The Vercel AI SDK streams the LLM's final text response (`message.content`) to the frontend. The `PreviewMessage` component parses this text response (expecting a list format) and renders the `RestaurantResults` component. Error messages from the backend (e.g., invalid location) are also displayed as assistant messages.

## Deploy Your Own

You can deploy this application to Vercel. Ensure your environment variables (`TOGETHER_API_KEY`, `FOURSQUARE_API_KEY`) are set in your Vercel project settings.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repository-url>&env=TOGETHER_API_KEY,FOURSQUARE_API_KEY&envDescription=API%20keys%20needed%20for%20application)
*(Replace `<your-repository-url>` with your actual GitHub repository URL)*

## Learn More

*   [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
*   [Next.js Documentation](https://nextjs.org/docs)
*   [FastAPI Documentation](https://fastapi.tiangolo.com/)
*   [Together AI Documentation](https://docs.together.ai/)
*   [Foursquare Places API Documentation](https://location.foursquare.com/developer/reference/place-search)


