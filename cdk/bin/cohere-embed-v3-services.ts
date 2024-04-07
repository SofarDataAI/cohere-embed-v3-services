#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { checkEnvVariables } from '../utils/check-environment-variables';
import { CohereEmbedV3ServicesStack } from '../lib/cohere-embed-v3-services-stack';

dotenv.config(); // Load environment variables from .env file

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;

// check variables
checkEnvVariables('APP_NAME',
    'ENVIRONMENT',
    'ECR_REPOSITORY_NAME',
    'IMAGE_VERSION',
    'DOCKERFILE_NAME',
    'PLATFORM',
    'PORT',
    'COHERE_API_KEY',
    'COHERE_EMBED_MODEL',
    'DATA_INGESTION_API_KEY',
);

const appName = process.env.APP_NAME!;
const deployEnvironment = process.env.ENVIRONMENT!;
const deployRegion = process.env.CDK_DEPLOY_REGION!;
const cohereApiKey = process.env.COHERE_API_KEY!;
const cohereEmbedModel = process.env.COHERE_EMBED_MODEL!;
const imageVersion = process.env.IMAGE_VERSION!;
const ecrRepositoryName = process.env.ECR_REPOSITORY_NAME!;
const dockerfileName = process.env.DOCKERFILE_NAME!;
const port = process.env.PORT!;
const platform = process.env.PLATFORM!;
const dataIngestionApiKey = process.env.DATA_INGESTION_API_KEY!;

const app = new cdk.App();
new CohereEmbedV3ServicesStack(app, `${appName}-${deployRegion}-${deployEnvironment}-CohereEmbedV3ServicesStack`, {
  resourcePrefix: `${appName}-${deployRegion}-${deployEnvironment}`,
  cdkDeployRegion: deployRegion,
  cdkDeployEnvironment: deployEnvironment,
  env: {
      account,
      region: deployRegion,
  },
  appName,
  cohereApiKey,
  cohereEmbedModel,
  dataIngestionApiKey,
  imageVersion,
  ecrRepositoryName,
  dockerfileName,
  cdkDeployPort: port,
  cdkDeployPlatform: platform,
  description: `${appName}-${deployRegion}-${deployEnvironment}-CohereEmbedV3ServicesStack`,
  stackName: `${appName}-${deployRegion}-${deployEnvironment}-CohereEmbedV3ServicesStack`,
});

app.synth();
