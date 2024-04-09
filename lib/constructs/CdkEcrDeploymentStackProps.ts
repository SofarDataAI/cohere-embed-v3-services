import { NestedStackProps } from 'aws-cdk-lib';
import { CohereEmbedV3Services } from '../CohereEmbedV3ServicesStackProps';

/**
 * Properties for CdkEcrDeploymentStack.
 */
export interface CdkErcDeploymentStackProps extends NestedStackProps, CohereEmbedV3Services {
    /**
     * The build arguments for the Docker image.
     */
    readonly dockerBuildArgs?: Record<string, string> | undefined;
}
