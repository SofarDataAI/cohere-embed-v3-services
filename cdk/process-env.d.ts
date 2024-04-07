declare module NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
        CDK_DEPLOY_REGION: string;
        ENVIRONMENT: string;
        ECR_REPOSITORY_NAME: string;
        APP_NAME: string;
        IMAGE_VERSION: string;
        DOCKERFILE_NAME: string;
        PLATFORM: string;
        PORT: string | undefined;
        COHERE_API_KEY: string | undefined;
        COHERE_EMBED_MODEL: string | undefined;
    }
}
