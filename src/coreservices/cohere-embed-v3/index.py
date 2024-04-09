import os
from fastapi import FastAPI

# extract the environment variables
COHERE_API_KEY = os.environ['COHERE_API_KEY']
COHERE_EMBED_MODEL = os.environ['COHERE_EMBED_MODEL']
DATA_INGESTION_API_KEY = os.environ['DATA_INGESTION_API_KEY']

app = FastAPI()


@app.get("/")
def hello_world() -> dict:
    """
    A simple function to return a Hello World message.

    Returns:
        dict: A dictionary with a greeting.
    """
    return {"Hello": "World"}
