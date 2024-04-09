import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CohereEmbedV3ServicesStackProps } from './CohereEmbedV3ServicesStackProps';
import { CohereEmbedVpcStack } from './constructs/cohere-embed-v3-vpc';

/**
 * The `CohereEmbedV3ServicesStack` class defines the AWS infrastructure as code for the Cohere Embed V3 Services.
 * It sets up a Lambda function configured to use the Cohere API for natural language processing tasks.
 */
export class CohereEmbedV3ServicesStack extends cdk.Stack {
  /**
   * Constructs a new instance of the CohereEmbedV3ServicesStack.
   * @param scope The scope in which to define this construct. Usually an `App` or a `Stage`.
   * @param id A unique identifier for the stack.
   * @param props The stack properties, including the Cohere API key, model, and other AWS resource configurations.
   */
  constructor(scope: Construct, id: string, props: CohereEmbedV3ServicesStackProps) {
    super(scope, id, props);

    const vpcStack = new CohereEmbedVpcStack(this, `${props.resourcePrefix}-VpcStack`, {
      ...props,
    });

    const vpc = vpcStack.cohereVpc;
  }
}
