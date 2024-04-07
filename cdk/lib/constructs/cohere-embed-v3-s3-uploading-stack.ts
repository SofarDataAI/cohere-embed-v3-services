import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { NestedStack } from "aws-cdk-lib";
import { CohereEmbedV3S3UploadingStackProps } from "./CohereEmbedV3S3UploadingStackProps";
import { Construct } from "constructs";
import { LlrtFunction } from "cdk-lambda-llrt";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export class CohereEmbedV3S3UploadingStack extends NestedStack {
    constructor(scope: Construct, id: string, props: CohereEmbedV3S3UploadingStackProps) {
        super(scope, id, props);

        // lambda function to create a s3 presigned url
        const createPresignedUrlLambdaFn = new LlrtFunction(this, `${props.resourcePrefix}-createPresignedUrlLambdaFn`, {
            functionName: `${props.resourcePrefix}-createPresignedUrlLambdaFn`,
            runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../src/lambdas/create-presigned-url/index.ts'),
            handler: 'handler',
            environment: {
                UPLOADING_BUCKET_NAME: props.uploadingS3Bucket.bucketName,
                DATA_INGESTION_API_KEY: props.DATA_INGESTION_API_KEY,
            },
            llrtVersion: 'latest',
            role: new cdk.aws_iam.Role(this, `${props.resourcePrefix}-createPresignedUrlLambdaFn-Role`, {
                assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                ],
            }),
            timeout: cdk.Duration.seconds(60), // 60 seconds
            architecture: lambda.Architecture.ARM_64,
            logGroup: new cdk.aws_logs.LogGroup(this, `${props.resourcePrefix}-createPresignedUrlLambdaFn-LogGroup`, {
                logGroupName: `${props.resourcePrefix}-createPresignedUrlLambdaFn-LogGroup`,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
            }),
            memorySize: 1024,
            bundling: {
                minify: true,
                sourceMap: true,
                sourcesContent: false,
                esbuildVersion: '0.20.2',
                target: 'es2020',
                format: OutputFormat.ESM,
                forceDockerBundling: true,
            },
            awsSdkConnectionReuse: false, // https://speedrun.nobackspacecrew.com/blog/2024/03/13/lambda-environment-variables-impact-on-coldstarts.html#does-it-impact-you
            projectRoot: path.join(__dirname, '../src/lambdas/create-presigned-url'),
            depsLockFilePath: path.join(__dirname, '../src/lambdas/create-presigned-url/package-lock.json'),
        });

        // Configure Lambda Function URL
        const createPresignedUrlLambdaFnUrl = new cdk.aws_lambda.FunctionUrl(this, `${props.resourcePrefix}-${props.cdkDeployRegion}-createPresignedUrlLambdaFn-Url`, {
            function: createPresignedUrlLambdaFn,
            invokeMode: cdk.aws_lambda.InvokeMode.BUFFERED,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [lambda.HttpMethod.POST],
                allowedHeaders: ['*'],
                allowCredentials: true,
            },
            authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        });

        // export the URL of the Lambda Function
        new cdk.CfnOutput(this, `${props.resourcePrefix}-${props.cdkDeployRegion}-messageIngestionLambdaFn-Url-Export`, {
            value: createPresignedUrlLambdaFnUrl.url,
            exportName: `${props.resourcePrefix}-${props.cdkDeployRegion}-messageIngestionLambdaFn-Url-Export`,
            description: `The URL of the s3 presigned url lambda function.`,
        });
    }
}
