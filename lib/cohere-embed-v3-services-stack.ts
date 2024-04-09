import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CohereEmbedV3ServicesStackProps } from './CohereEmbedV3ServicesStackProps';
import { CohereEmbedVpcStack } from './constructs/cohere-embed-v3-vpc';
import { CdkEcrDeploymentStack } from './constructs/cohere-embed-v3-ecr';
import { CdkCohereEmbedV3AppRunnerStack } from './constructs/cohere-embded-v3-app-runner';

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
      description: 'VPC for Cohere Embed V3.',
    });
    const vpc = vpcStack.cohereVpc;

    const ecrStack = new CdkEcrDeploymentStack(this, `${props.resourcePrefix}-EcrStack`, {
      ...props,
      description: 'ECR repository for Cohere Embed V3.',
    });
    const ecrRepository = ecrStack.ecrRepository;

    const appRunnerStack = new CdkCohereEmbedV3AppRunnerStack(this, `${props.resourcePrefix}-AppRunnerStack`, {
      ...props,
      vpc,
      ecrRepository,
      dockerRunArgs: {
        COHERE_API_KEY: props.cohereApiKey,
        COHERE_EMBED_MODEL: props.cohereEmbedModel,
        DATA_INGESTION_API_KEY: props.dataIngestionApiKey,
      },
      description: 'App Runner service for Cohere Embed V3.',
    });

    // export the App Runner service URL
    new cdk.CfnOutput(this, 'AppRunnerServiceURL', {
      value: appRunnerStack.APP_RUNNER_SERVICE_URL,
      description: 'The URL of the App Runner service.',
      exportName: `${props.resourcePrefix}-AppRunnerServiceURL`,
    });
  }
}
