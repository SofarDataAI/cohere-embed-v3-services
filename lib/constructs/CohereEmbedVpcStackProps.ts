import { NestedStackProps } from 'aws-cdk-lib';
import { CohereEmbedV3Services } from '../CohereEmbedV3ServicesStackProps';

/**
 * Properties for CohereEmbedVpcStack.
 */
export interface CohereEmbedVpcStackProps extends NestedStackProps, CohereEmbedV3Services {
}
