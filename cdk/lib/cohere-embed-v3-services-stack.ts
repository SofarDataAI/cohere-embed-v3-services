import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CohereEmbedV3ServicesStackProps } from './CohereEmbedV3ServicesStackProps';

export class CohereEmbedV3ServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CohereEmbedV3ServicesStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CohereEmbedV3ServicesQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
