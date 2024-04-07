import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { CohereEmbedV3S3StackProps } from './CohereEmbedV3S3StackProps';
import { createCachedS3Bucket, createS3Bucket } from '../../utils/cx-create-s3-bucket';
import { ServerlessClamscan } from 'cdk-serverless-clamscan';
import { EventBridgeDestination, SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { EventBus } from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { LlrtFunction } from 'cdk-lambda-llrt';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CohereEmbedV3S3Stack extends cdk.NestedStack {
    public readonly masterS3Bucket: cdk.aws_s3.Bucket;

    constructor(scope: Construct, id: string, props: CohereEmbedV3S3StackProps) {
        super(scope, id, props);
        const removalPolicy = props.cdkDeployEnvironment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;
        const uploadingS3Bucket = createCachedS3Bucket(this, `${props.resourcePrefix}-uploading-bucket`, 7);
        this.masterS3Bucket = createS3Bucket(this, `${props.resourcePrefix}-master-bucket`, removalPolicy);
        const eventBridgeDestination = new EventBridgeDestination(new EventBus(this, `${props.resourcePrefix}-EventBus`));
        // lambda function to transfer s3 object from uploadingS3Bucket to masterS3Bucket
        const s3ObjectTransferLambdaFn = new LlrtFunction(this, `${props.resourcePrefix}-s3ObjectTransferLambdaFn`, {
            functionName: `${props.resourcePrefix}-s3ObjectTransferLambdaFn`,
            runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../src/lambdas/s3-file-transfer/index.ts'),
            handler: 'handler',
            llrtVersion: 'latest',
            environment: {
                MASTER_BUCKET_NAME: this.masterS3Bucket.bucketName,
            },
            role: new cdk.aws_iam.Role(this, `${props.resourcePrefix}-s3ObjectTransferLambdaFnRole`, {
                assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                ],
                inlinePolicies: {
                    // define policy to allow lambda to getObject and getObjectAcl from masterS3Bucket
                    uploadingS3BucketPolicy: new cdk.aws_iam.PolicyDocument({
                        statements: [
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:ListBucket'],
                                resources: [uploadingS3Bucket.bucketArn],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObject'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObjectAcl'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObjectTagging'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObjectVersion'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObjectVersionAcl'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:GetObjectVersionTagging'],
                                resources: [`${uploadingS3Bucket.bucketArn}/*`],
                            }),
                        ],
                    }),
                    // define policy to allow lambda to putObject and putObjectAcl to uploadingS3Bucket
                    masterS3BucketPolicy: new cdk.aws_iam.PolicyDocument({
                        statements: [
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:ListBucket'],
                                resources: [this.masterS3Bucket.bucketArn],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:PutObject'],
                                resources: [`${this.masterS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:PutObjectAcl'],
                                resources: [`${this.masterS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:PutObjectTagging'],
                                resources: [`${this.masterS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:PutObjectVersionAcl'],
                                resources: [`${this.masterS3Bucket.bucketArn}/*`],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['s3:PutObjectVersionTagging'],
                                resources: [`${this.masterS3Bucket.bucketArn}/*`],
                            }),
                        ],
                    }),
                },
            }),
            timeout: cdk.Duration.seconds(60), // one minute
            architecture: lambda.Architecture.ARM_64,
            logGroup: new cdk.aws_logs.LogGroup(this, `${props.resourcePrefix}-s3ObjectTransferLambdaFnLogGroup`, {
                logGroupName: `${props.resourcePrefix}-s3ObjectTransferLambdaFnLogGroup`,
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
                externalModules: [],
            },
            awsSdkConnectionReuse: false, // https://speedrun.nobackspacecrew.com/blog/2024/03/13/lambda-environment-variables-impact-on-coldstarts.html#does-it-impact-you
            projectRoot: path.join(__dirname, '../../src/lambdas/s3-file-transfer'),
            depsLockFilePath: path.join(__dirname, '../../src/lambdas/s3-file-transfer/package-lock.json'),
        });
        eventBridgeDestination.bind(this, s3ObjectTransferLambdaFn); // bind the eventBridgeDestination to the lambda function

        // this queue is used to store the s3 file transfer error messages
        const s3FileErrorQueue = new sqs.Queue(this, `${props.resourcePrefix}-s3FileErrorQueue`, {
            visibilityTimeout: cdk.Duration.seconds(60), // 60 seconds
            queueName: `${props.resourcePrefix}-${props.cdkDeployEnvironment}-s3FileErrorQueue`,
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            retentionPeriod: cdk.Duration.days(3), // 3 days
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // lambda function to handle the s3 file transfer error messages, send email to administrators
        const s3ObjectFailureLambdaFn = new LlrtFunction(this, `${props.resourcePrefix}-s3ObjectFailureLambdaFn`, {
            functionName: `${props.resourcePrefix}-s3ObjectFailureLambdaFn`,
            runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../src/lambdas/s3-file-failure/index.ts'),
            handler: 'handler',
            llrtVersion: 'latest',
            role: new cdk.aws_iam.Role(this, `${props.resourcePrefix}-s3ObjectFailureLambdaFnRole`, {
                assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                ],
                inlinePolicies: {
                    s3FileTransferQueuePolicy: new cdk.aws_iam.PolicyDocument({
                        statements: [
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['sqs:ReceiveMessage'],
                                resources: [s3FileErrorQueue.queueArn],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['sqs:ChangeMessageVisibility', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
                                resources: [s3FileErrorQueue.queueArn],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['sqs:DeleteMessage'],
                                resources: [s3FileErrorQueue.queueArn],
                            }),
                            new cdk.aws_iam.PolicyStatement({
                                actions: ['sqs:SendMessage'],
                                resources: [s3FileErrorQueue.queueArn],
                            }),
                        ],
                    }),
                },
            }),
            timeout: cdk.Duration.seconds(60), // one minute
            architecture: lambda.Architecture.ARM_64,
            logGroup: new cdk.aws_logs.LogGroup(this, `${props.resourcePrefix}-s3ObjectFailureLambdaFnLogGroup`, {
                logGroupName: `${props.resourcePrefix}-s3ObjectFailureLambdaFnLogGroup`,
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
                externalModules:[],
            },
            awsSdkConnectionReuse: false, // https://speedrun.nobackspacecrew.com/blog/2024/03/13/lambda-environment-variables-impact-on-coldstarts.html#does-it-impact-you
            projectRoot: path.join(__dirname, '../../src/lambdas/s3-file-failure'),
            depsLockFilePath: path.join(__dirname, '../../src/lambdas/s3-file-failure/package-lock.json'),
        });

        // grant permission for s3FileErrorQueue to invoke s3ObjectFailureLambdaFn
        s3ObjectFailureLambdaFn.addPermission('AllowSQSInvocation', {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('sqs.amazonaws.com'),
            sourceArn: s3FileErrorQueue.queueArn,
        });

        // Add the SQS queue as an event source for the s3ObjectFailureLambdaFn function
        s3ObjectFailureLambdaFn.addEventSource(new lambdaEventSources.SqsEventSource(s3FileErrorQueue, {
            batchSize: 10, // Set the batch size to 10
            reportBatchItemFailures: true, // Allow functions to return partially successful responses for a batch of records.
            enabled: true,
            maxBatchingWindow: cdk.Duration.seconds(60), // 60 seconds
        }));

        // serverless clamscan
        const serverlessClamscan = new ServerlessClamscan(this, `${props.resourcePrefix}-ServerlessClamscan`, {
            scanFunctionMemorySize: 1024,
            onError: new SqsDestination(s3FileErrorQueue),
            onResult: eventBridgeDestination,
        });
        // add the uploadingS3Bucket as a source bucket for serverlessClamscan
        serverlessClamscan.addSourceBucket(uploadingS3Bucket);
    }
}
