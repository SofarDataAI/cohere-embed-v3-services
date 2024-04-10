import os
from fastapi import FastAPI
from llama_index.embeddings.cohere import CohereEmbedding

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


@app.post("/embed")
def embed_text(text: str, input_type: str, embedding_type: str = "float") -> dict:
    """
    A function to embed text using the Cohere API.

    Args:
        text (str): The text to embed.

    Returns:
        dict: A dictionary with the embeddings.
    """
    embed_model = CohereEmbedding(
        cohere_api_key=COHERE_API_KEY,
        model_name=COHERE_EMBED_MODEL,
        input_type=input_type,
        embedding_type=embedding_type
    )

    embeddings = embed_model.get_text_embedding(text)
    return {"embeddings": embeddings}
