import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { CohereEmbedVpcStackProps } from './CohereEmbedVpcStackProps';

/**
 * The `CxInfrastructureVpcStack` class is a nested stack responsible for creating
 * a VPC (Virtual Private Cloud) within AWS using the CDK (Cloud Development Kit).
 * It utilizes the `createVPC` utility function to provision the VPC and outputs
 * the VPC ID for other parts of the infrastructure to use.
 *
 * @property {Vpc} cxVpc - An instance of the VPC that is created within this stack.
 * @param {Construct} scope - The scope in which to define this construct.
 * @param {string} id - The scoped construct ID.
 * @param {CohereEmbedVpcStackProps} props - Stack properties that include configuration and resource names.
 */

export class CohereEmbedVpcStack extends cdk.NestedStack {
    public cxVpc: cdk.aws_ec2.IVpc;

    constructor(scope: Construct, id: string, props: CohereEmbedVpcStackProps) {
        super(scope, id, props);

        // create vpc
        const vpcName = `${props.resourcePrefix}-VPC`;
        const cohereVpc = new ec2.Vpc(this, vpcName, {
                ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), //IPs in Range - 65,536
                natGateways: 3, // for high availability
                maxAzs: 3, // for high availability
                subnetConfiguration: [
                    {
                        name: `${props.resourcePrefix}-PUBLIC`,
                        subnetType: ec2.SubnetType.PUBLIC,
                        cidrMask: 24, //IPs in Range - 256
                    },
                    {
                        name: `${props.resourcePrefix}-PRIVATE_WITH_EGRESS`,
                        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                        cidrMask: 24, //IPs in Range - 256
                    },
                ],
                enableDnsHostnames: true,
                enableDnsSupport: true,
        });

        // apply removal policy to all vpc and subnet resources
        cohereVpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        for (const subnet of cohereVpc.privateSubnets) {
            subnet.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
        for (const subnet of cohereVpc.isolatedSubnets) {
            subnet.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
        for (const subnet of cohereVpc.publicSubnets) {
            subnet.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }

        const vpcFlowLogRole = new iam.Role(this, `${props.resourcePrefix}-RoleVpcFlowLogs`, {
            assumedBy: new iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
            ],
        });

        const vpcFlowLogGroup = new logs.LogGroup(this, `${props.resourcePrefix}-VpcFlowLogGroup`, {
            retention: RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        new logs.LogStream(this, `${props.resourcePrefix}-VpcFlowLogStream`, {
            logGroup: vpcFlowLogGroup,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        new ec2.FlowLog(this, `${props.resourcePrefix}-VpcFlowLog`, {
            resourceType: ec2.FlowLogResourceType.fromVpc(cohereVpc),
            destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
            trafficType: ec2.FlowLogTrafficType.ALL,
        });

        // print out vpc id
        new cdk.CfnOutput(this, `${props.resourcePrefix}-VPC-ID-Export`, {
            value: this.cxVpc.vpcId,
            exportName: `${props.resourcePrefix}-VPC-ID-Export`,
            description: 'Infrastructure VPC ID.',
        });
    }
}
