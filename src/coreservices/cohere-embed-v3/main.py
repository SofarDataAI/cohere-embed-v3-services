import os
from fastapi import FastAPI
from llama_index.embeddings.cohere import CohereEmbedding

app = FastAPI()

# extract the environment variables
COHERE_API_KEY = os.environ['COHERE_API_KEY']
COHERE_EMBED_MODEL = os.environ['COHERE_EMBED_MODEL']


@app.get("/")
def hello_world() -> dict:
    """
    A simple function to return a Hello World message.

    Returns:
        dict: A dictionary with a greeting.
    """
    return {"Hello": "World"}


@app.post("/embed")
def embed_text(request: dict) -> dict:
    text = request['text']
    input_type = request['input_type']
    embedding_type = request.get('embedding_type', 'float')
    """
        A function to embed text using the Cohere API.

        Args:
            text (str): The text to embed.
            input_type (str): The type of input data.
            embedding_type (str): The type of embedding to return.

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
