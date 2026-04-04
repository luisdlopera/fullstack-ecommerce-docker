import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const minioClient = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:5010',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::nexstore-products/*',
    },
  ],
};

async function setPublicPolicy() {
  try {
    const command = new PutBucketPolicyCommand({
      Bucket: 'nexstore-products',
      Policy: JSON.stringify(bucketPolicy),
    });
    await minioClient.send(command);
    console.log('✓ Bucket policy updated: nexstore-products is now public for read access');
  } catch (error) {
    console.error('Failed to set bucket policy:', error.message);
    process.exit(1);
  }
}

setPublicPolicy();
