import { StackProps } from "aws-cdk-lib";

export interface CohereEmbedV3ServicesStackProps extends StackProps, CohereEmbedV3Services, CohereEmbedV3ServiceArgs {
}

export interface CohereEmbedV3Services {
    /**
     * The name of the application.
     */
    readonly appName: string;
    /**
     * Prefix used for naming AWS resources.
     */
    readonly resourcePrefix: string;
    /**
     * The version of the Docker image.
     */
    readonly ecrRepositoryImageTag: string;
    /**
     * The name of the Dockerfile.
     */
    readonly dockerfileName: string;
    /**
     * The name of the ECR repository.
     */
    readonly ecrRepositoryName: string;
    /**
     * The environment where the CDK stack will be deployed.
     */
    readonly cdkDeployEnvironment: string;
    /**
     * The platform for the deployment.
     */
    readonly cdkDeployPlatform: string;
    /**
     * The port number for the application.
     */
    readonly cdkDeployPort: string;
    /**
     * The AWS region where the stack will be deployed.
     */
    readonly cdkDeployRegion: string;
}

export interface CohereEmbedV3ServiceArgs {
    /**
     * The API key for Cohere services.
     */
    readonly cohereApiKey: string;
    /**
     * The model for Cohere services.
     */
    readonly cohereEmbedModel: string;
    /**
     * The API key for data ingestion services.
     */
    readonly dataIngestionApiKey: string;
}
