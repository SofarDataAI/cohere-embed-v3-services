import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { CohereEmbedV3ServicesStackProps } from './CohereEmbedV3ServicesStackProps';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';

export class CohereEmbedV3ServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CohereEmbedV3ServicesStackProps) {
    super(scope, id, props);

    // lambda function to start a Textract job for analyzing tables in a document (Python version)
    const cohereEmbedV3LambdaFn = new PythonFunction(this, `${props.resourcePrefix}-${props.cdkDeployRegion}-cohereEmbedV3LambdaFn`, {
      functionName: `${props.resourcePrefix}-${props.cdkDeployRegion}-cohereEmbedV3LambdaFn`,
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, '../../coreservices'),
      handler: "handler",
      architecture: lambda.Architecture.ARM_64,
      runtimeManagementMode: lambda.RuntimeManagementMode.AUTO,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60), // 60 seconds
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      environment: {
        COHERE_API_KEY: props.cohereApiKey,
        COHERE_EMBED_MODEL: props.cohereEmbedModel,
        DATA_INGESTION_API_KEY: props.dataIngestionApiKey,
      },
    });

    // Configure Lambda Function URL
    const cohereEmbedV3LambdaFnUrl = new cdk.aws_lambda.FunctionUrl(this, `${props.resourcePrefix}-${props.cdkDeployRegion}-cohereEmbedV3LambdaFnUrl`, {
      function: cohereEmbedV3LambdaFn,
      invokeMode: cdk.aws_lambda.InvokeMode.BUFFERED,
      cors: {
          allowedOrigins: ['*'],
          allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.GET],
          allowedHeaders: ['*'],
          allowCredentials: true,
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    // export the URL of the Lambda Function
    new cdk.CfnOutput(this, `${props.resourcePrefix}-${props.cdkDeployRegion}-messageIngestionLambdaFn-Url-Export`, {
        value: cohereEmbedV3LambdaFnUrl.url,
        exportName: `${props.resourcePrefix}-${props.cdkDeployRegion}-messageIngestionLambdaFn-Url-Export`,
        description: `The URL of the cohere embed v3 lambda function.`,
    });
  }
}

