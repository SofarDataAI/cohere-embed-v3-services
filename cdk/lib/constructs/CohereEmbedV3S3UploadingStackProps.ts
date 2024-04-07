import * as cdk from "aws-cdk-lib";
import { NestedStackProps, RemovalPolicy } from "aws-cdk-lib";
import { CohereEmbedV3Services } from "../CohereEmbedV3ServicesStackProps";

export interface CohereEmbedV3S3UploadingStackProps extends CohereEmbedV3Services, NestedStackProps {
    readonly removalPolicy: RemovalPolicy;
    readonly uploadingS3Bucket: cdk.aws_s3.Bucket;
    readonly DATA_INGESTION_API_KEY: string;
}
