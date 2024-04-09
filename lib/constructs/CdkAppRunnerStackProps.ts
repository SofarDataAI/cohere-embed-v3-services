import { NestedStackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { CohereEmbedV3Services } from "../CohereEmbedV3ServicesStackProps";

export interface CdkCohereEmbedV3AppRunnerStackProps extends NestedStackProps, CohereEmbedV3Services {
    /**
     * The VPC where the database should be deployed.
     */
    readonly vpc: cdk.aws_ec2.IVpc;
    /**
     * The ECR repository
     */
    readonly ecrRepository: cdk.aws_ecr.Repository;
    readonly dockerRunArgs: CdkCohereEmbedV3DockerRunArgTyped,
}

export interface CdkCohereEmbedV3DockerRunArgTyped {
    /**
     * The API key for Cohere services.
     */
    readonly COHERE_API_KEY: string;
    /**
     * The model for Cohere services.
     */
    readonly COHERE_EMBED_MODEL: string;
    /**
     * The API key for data ingestion services.
     */
    readonly DATA_INGESTION_API_KEY: string;
}
