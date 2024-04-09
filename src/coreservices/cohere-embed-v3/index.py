import os
import uuid

# extract the environment variables
COHERE_API_KEY = os.environ['COHERE_API_KEY']
COHERE_EMBED_MODEL = os.environ['COHERE_EMBED_MODEL']
DATA_INGESTION_API_KEY = os.environ['DATA_INGESTION_API_KEY']


def handler(event, context):
    correlation_id = uuid.uuid4()
    method = 'cohere-embed-v3.handler'
    prefix = f'{correlation_id} - {method}'

    print(f'{prefix} - started.')
    # print out the event
    print(f'{prefix} - event: {event}')

    # print out COHERE_EMBED_MODEL
    print(f'{prefix} - COHERE_EMBED_MODEL: {COHERE_EMBED_MODEL}')
    return {"message": "Hello World", "statusCode": 200}
