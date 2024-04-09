import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, DockerImageAssetProps } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrDeploy from 'cdk-ecr-deployment';
import { CdkErcDeploymentStackProps } from './CdkEcrDeploymentStackProps';

export class CdkEcrDeploymentStack extends cdk.NestedStack {
    public readonly ecrRepository: cdk.aws_ecr.Repository;

    /**
     * Constructor for CdkEcrDeploymentStack.
     *
     * @param {Construct} scope - The scope in which to define this construct.
     * @param {string} id - The scoped construct ID. Must be unique amongst siblings in the same scope.
     * @param {CdkErcDeploymentStackProps} props - The stack properties.
     */
    constructor(scope: Construct, id: string, props: CdkErcDeploymentStackProps) {
        super(scope, id, props);

        console.log(`cdkDeployPlatform: ${props.cdkDeployPlatform.toLowerCase()}`);
        this.ecrRepository = new ecr.Repository(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ERCRepository`, {
            repositoryName: `${props.ecrRepositoryName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            emptyOnDelete: true,
            encryption: ecr.RepositoryEncryption.AES_256,
        });

        const dockerImageAssetProps: DockerImageAssetProps = {
            directory: path.join(__dirname, `../../src/coreservices/cohere-embed-v3`),
            file: props.dockerfileName,
            platform: props.cdkDeployPlatform === `LINUX_ARM64` ? cdk.aws_ecr_assets.Platform.LINUX_ARM64 : cdk.aws_ecr_assets.Platform.LINUX_AMD64,
            buildArgs: props.dockerBuildArgs === undefined ? undefined : {
                ...props.dockerBuildArgs
            },
            cacheDisabled: true, // always build the image from scratchs
        };
        const dockerImageAsset = new DockerImageAsset(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-DockerImageAsset`, dockerImageAssetProps);

        new ecrDeploy.ECRDeployment(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRDeployment`, {
            src: new ecrDeploy.DockerImageName(dockerImageAsset.imageUri),
            dest: new ecrDeploy.DockerImageName(`${this.ecrRepository.repositoryUri}:${props.ecrRepositoryImageTag}`),
        });

        // print out ecrRepository arn
        new cdk.CfnOutput(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryArn`, {
            value: this.ecrRepository.repositoryArn,
            exportName: `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryArn`,
        });

        // print out ecrRepository uri
        new cdk.CfnOutput(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryUri`, {
            value: this.ecrRepository.repositoryUri,
            exportName: `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryUri`,
        });

        // print out ecrRepository respository name
        new cdk.CfnOutput(this, `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryName`, {
            value: this.ecrRepository.repositoryName,
            exportName: `${props.resourcePrefix}-${props.cdkDeployPlatform.toLowerCase()}-ECRRepositoryName`,
        });
    }
}
