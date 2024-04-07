import { NestedStackProps, RemovalPolicy } from "aws-cdk-lib";
import { CohereEmbedV3Services } from "../CohereEmbedV3ServicesStackProps";

export interface CohereEmbedV3S3StackProps extends CohereEmbedV3Services, NestedStackProps {
    readonly removalPolicy: RemovalPolicy;
}
