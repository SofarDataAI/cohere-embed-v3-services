# CDK Infrastructure Configuration

- `bin/cohere-embed-v3-services.ts`: Entry point for CDK deployment. It reads environment variables, checks them, and initializes the CDK stack for deployment.
- `lib/CohereEmbedV3ServicesStackProps.ts` and related files in `lib/constructs`: Define AWS infrastructure as code, including VPC, ECR, and App Runner configurations.
- `package.json` and `package-lock.json`: Define Node.js project dependencies, including AWS CDK libraries, TypeScript, and Jest for testing.
- `tsconfig.json`: TypeScript configuration file.

# FastAPI Application

- Located in `src/coreservices/cohere-embed-v3`, it includes a FastAPI application `main.py` that exposes endpoints for embedding text with Cohere's API.
- `Dockerfile` and `docker-compose.yml`: Docker configurations for building and running the FastAPI application. Run on your local machine with command `docker compose up --build -d` and then checkout via: `localhost:8090/docs`
- `requirements.txt`: Python dependencies for the FastAPI application, including FastAPI, Uvicorn, and Cohere's SDK.

# Configuring Your Local Environment

Before running the application locally, you need to configure your environment variables:

1. Copy the `.env.example` file to a new file named `.env` in the same directory.
2. Open the `.env` file and fill in the values for the environment variables as per your setup. This includes setting up the `COHERE_API_KEY`, `DATA_INGESTION_API_KEY`, and any other variables you might need to customize for your local development environment.
3. Ensure the `.env` file is correctly referenced in your application's configuration to load these environment variables.
