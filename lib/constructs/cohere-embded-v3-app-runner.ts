import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CdkCohereEmbedV3AppRunnerStackProps } from './CdkAppRunnerStackProps';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';
import { parsingCpuType, parsingMemoryType } from '../../utils/check-hardware-input';

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

        const httpSecGrp = new ec2.SecurityGroup(this, `${props.resourcePrefix}-httpSecGrp`, {
            vpc: existingVpc,
            securityGroupName: `${props.resourcePrefix}-httpSecGrp`,
            allowAllOutbound: true,
            description: `Security group for HTTP in ${props.cdkDeployRegion}.`,
        });
        httpSecGrp.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allow all traffic from internet to the App Runner service via port 80.'
        );
        httpSecGrp.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        const httpsSecGrp = new ec2.SecurityGroup(this, `${props.resourcePrefix}-httpsSecGrp`, {
            vpc: existingVpc,
            securityGroupName: `${props.resourcePrefix}-httpsSecGrp`,
            allowAllOutbound: true,
            description: `Security group for HTTPS in ${props.cdkDeployRegion}.`,
        });
        httpsSecGrp.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            'Allow all traffic from internet to the App Runner service via port 443.'
        );
        httpsSecGrp.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        const vpcConnector = new apprunner.VpcConnector(this, `${props.resourcePrefix}-VpcConnector`, {
            vpc: existingVpc,
            vpcSubnets: existingVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [httpSecGrp, httpsSecGrp],
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

        // apply removal policy to appRunnerTaskRole
        appRunnerTaskRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        const cpu = parsingCpuType(props.cdkDeployCpuType);
        const memory = parsingMemoryType(props.cdkDeployMemoryType);
        const containerPort = parseInt(props.cdkDeployPort);
        const apprunnerService = new apprunner.Service(this, `${props.resourcePrefix}-AppRunner-Service`, {
            cpu: cpu,
            memory: memory,
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
