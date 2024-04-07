import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';

/**
 * Creates an S3 bucket with specified encryption, block public access settings, and removal policy.
 * The bucket is also configured to be versioned.
 *
 * @param stack - The CDK stack to which the S3 bucket will be added.
 * @param bucketName - The name of the S3 bucket to create.
 * @param removalPolicy - The removal policy to apply to the bucket.
 * @returns The created S3 bucket.
 */
export function createS3Bucket(stack: cdk.Stack, bucketName: string, removalPolicy: cdk.RemovalPolicy): s3.Bucket {
    return new s3.Bucket(stack, bucketName, {
        bucketName: bucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        removalPolicy: removalPolicy,
        autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
        accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
        versioned: true, // Enable versioning
    });
}

/**
 * Creates an S3 bucket with a lifecycle rule to automatically delete objects after 3 days.
 * The bucket is configured with encryption, block public access settings, and versioning.
 *
 * @param stack - The CDK stack to which the S3 bucket will be added.
 * @param bucketName - The name of the S3 bucket to create.
 * @returns The created S3 bucket with caching lifecycle rule.
 */
export function createCachedS3Bucket(stack: cdk.Stack, bucketName: string, retainDay: number): s3.Bucket {
    return new s3.Bucket(stack, bucketName, {
        bucketName: bucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
            {
                id: `Delete after ${retainDay} days.`,
                expiration: cdk.Duration.days(retainDay),
                enabled: true,
            },
        ],
        autoDeleteObjects: true,
        accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
        versioned: true, // Enable versioning
    });
}
