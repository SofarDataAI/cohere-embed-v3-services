import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CdkCohereEmbedV3AppRunnerStackProps } from './CdkCohereEmbedV3AppRunnerStackProps';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';

/**
 * The CdkCohereEmbedV3AppRunnerStack class is responsible for deploying an AWS App Runner service
 * with a VPC connector, allowing the service to interact with other AWS resources within a VPC.
 * It sets up the necessary roles, security groups, and network configurations required for the service
 * to operate within the VPC. It also builds and deploys a Docker image to the App Runner service.
 */
export class CdkCohereEmbedV3AppRunnerStack extends cdk.NestedStack {
    public readonly APP_RUNNER_SERVICE_URL: string;

    /**
     * Constructs a new instance of the CdkCohereEmbedV3AppRunnerStack class.
     *
     * @param {Construct} scope - The scope in which to define this construct.
     * @param {string} id - The scoped construct ID. Must be unique amongst siblings in the same scope.
     * @param {CdkCohereEmbedV3AppRunnerStackProps} props - The stack properties, including the VPC ID, ECR repository, and other configurations.
     */
    constructor(scope: Construct, id: string, props: CdkCohereEmbedV3AppRunnerStackProps) {
        super(scope, id, props);

        const existingVpc = props.vpc;

        const postgresSecGrpID = props.POSTGRES_DB_SG_ID;
        // retrerive the security group for the postgres database
        const postgresSecGrp = ec2.SecurityGroup.fromSecurityGroupId(this, `${props.resourcePrefix}-PostgresSecGrp`, postgresSecGrpID);

        const httpSecGrpID = props.HTTP_SG_ID;
        // retrieve the security group for the HTTP traffic
        const httpSecGrp = ec2.SecurityGroup.fromSecurityGroupId(this, `${props.resourcePrefix}-HttpSecGrp`, httpSecGrpID);

        const httpsSecGrpID = props.HTTPS_SG_ID;
        // retrieve the security group for the HTTPS traffic
        const httpsSecGrp = ec2.SecurityGroup.fromSecurityGroupId(this, `${props.resourcePrefix}-HttpsSecGrp`, httpsSecGrpID);

        // define a security group named appRunnerSecGrp
        const appRunnerSecGrp = new ec2.SecurityGroup(this, `${props.resourcePrefix}-appRunnerSecGrp-cx-feature-extract`, {
            vpc: existingVpc,
            securityGroupName: `${props.resourcePrefix}-appRunnerSecGrp-cx-feature-extract`,
            allowAllOutbound: true,
            description: `${props.resourcePrefix}-appRunnerSecGrp`,
        });
        appRunnerSecGrp.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        // allow all traffic from appRunnerSecGrp to postgresSecGrp via port 5432
        postgresSecGrp.addIngressRule(
            appRunnerSecGrp,
            ec2.Port.tcp(5432),
            'Allow all traffic from appRunnerSecGrp to postgresSecGrp via port 5432.',
        );

        const vpcConnector = new apprunner.VpcConnector(this, `${props.resourcePrefix}-VpcConnector`, {
            vpc: existingVpc,
            vpcSubnets: existingVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [httpSecGrp, httpsSecGrp, appRunnerSecGrp],
        });

        // define apprunner role to access ecr
        const appRunnerRole = new iam.Role(
            this,
            `${props.resourcePrefix}-apprunner-role`,
            {
                assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
                description: `${props.resourcePrefix}-apprunner-role`,
                inlinePolicies: {
                    apprunnerpolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: ['ecr:GetAuthorizationToken'],
                                resources: [props.ecrRepository.repositoryArn],
                            }),
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: [
                                    'ecr:BatchCheckLayerAvailability',
                                    'ecr:GetDownloadUrlForLayer',
                                    'ecr:GetRepositoryPolicy',
                                    'ecr:DescribeRepositories',
                                    'ecr:ListImages',
                                    'ecr:DescribeImages',
                                    'ecr:BatchGetImage',
                                    'ecr:GetLifecyclePolicy',
                                    'ecr:GetLifecyclePolicyPreview',
                                    'ecr:ListTagsForResource',
                                    'ecr:DescribeImageScanFindings',
                                ],
                                resources: [props.ecrRepository.repositoryArn],
                            }),
                        ],
                    }),
                },
            }
        );

        // define an iam role to allow ecs fargate task read/write access to the dynamodb table
        const appRunnerTaskRole = new cdk.aws_iam.Role(this, `${props.resourcePrefix}-feature-extract-AppRunnerTaskRole`, {
            assumedBy: new cdk.aws_iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        });
        appRunnerTaskRole.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));

        // add inline policy to allow ecs task to write and read from dynamodb table
        const dynamoDBPolicyStatement = new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            resources: [props.DYNAMODB_CUSTOMER_DOCUMENT_TABLE_RESOURCE_ARN, props.DYNAMODB_CUSTOMER_PROFILE_TABLE_RESOURCE_ARN],
            actions: [
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:DeleteItem',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
            ],
        });
        // define a new IAM PolicyStatement for PostgreSQL access
        const postgresPolicyStatement = new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            resources: [props.POSTGRES_DB_ARN],
            actions: [
                'rds-data:BatchExecuteStatement',
                'rds-data:BeginTransaction',
                'rds-data:CommitTransaction',
                'rds-data:ExecuteStatement',
                'rds-data:RollbackTransaction',
            ],
        });

        // define a new iam policy statement to read/write from the S3 bucket, props.S3_CX_CACHED_TEXT_FILES_BUCKET_ARN
        const s3PolicyStatement = new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            resources: [props.S3_CX_CACHED_TEXT_FILES_BUCKET_ARN, `${props.S3_CX_CACHED_TEXT_FILES_BUCKET_ARN}/*`],
            actions: [
                's3:AbortMultipartUpload',
                's3:GetBucketLocation',
                's3:GetObject',
                's3:GetObjectAcl',
                's3:GetObjectTagging',
                's3:GetObjectVersion',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
                's3:PutObject',
                's3:PutObjectAcl',
                's3:PutObjectTagging',
                's3:PutObjectVersionAcl',
                's3:PutObjectTagging',
                's3:DeleteObject',
                's3:DeleteObjectVersion',
                's3:DeleteObjectTagging',
                's3:PutObjectVersionTagging',
                's3:ListBucket',
            ],
        });

        // add ecsTaskPolicy to ecsTaskRole
        appRunnerTaskRole.addToPolicy(dynamoDBPolicyStatement);

        // add PostgreSQL access policy to appRunnerTaskRole
        appRunnerTaskRole.addToPolicy(postgresPolicyStatement);

        // add S3 access policy to appRunnerTaskRole
        appRunnerTaskRole.addToPolicy(s3PolicyStatement);

        // apply removal policy to appRunnerTaskRole
        appRunnerTaskRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        const containerPort = parseInt(props.dockerRunArgs.PORT);
        const apprunnerService = new apprunner.Service(this, `${props.resourcePrefix}-AppRunner-Service`, {
            cpu: Cpu.ONE_VCPU,
            memory: Memory.TWO_GB,
            autoDeploymentsEnabled: true,
            vpcConnector,
            source: apprunner.Source.fromEcr({
                repository: props.ecrRepository,
                tagOrDigest: props.ecrRepositoryImageTag,
                imageConfiguration: {
                    port: containerPort,
                    environmentVariables: {
                        ...props.dockerRunArgs,
                    },
                }
            }),
            accessRole: appRunnerRole,
            instanceRole: appRunnerTaskRole,
        });

        // print out apprunnerService url
        this.APP_RUNNER_SERVICE_URL = `https://${apprunnerService.serviceUrl}`;
    }
}
