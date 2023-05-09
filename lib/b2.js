import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import cuid from 'cuid';
import path from 'node:path';
import fs from 'node:fs';
import { getVideoSrcB2LocalFilePath } from './fsCommon.js'
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const urlPrefix = 'https://f000.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId='

export async function downloadVideoSrcB2 (appContext, vod) {
  const localFilePath = getVideoSrcB2LocalFilePath(appContext, vod);
  const key = vod.attributes.videoSrcB2.data.attributes.key

  const s3 = new S3Client({
    endpoint: appContext.env.B2_ENDPOINT,
    region: appContext.env.B2_REGION,
    credentials: {
      accessKeyId: process.env.B2_KEY,
      secretAccessKey: process.env.B2_SECRET,
    },
  });
  var params = {Bucket: appContext.env.B2_BUCKET, Key: key};
  const s3Result = await s3.send(new GetObjectCommand(params));
  if (!s3Result.Body) {
    throw new Error('received empty body from S3');
  }
  await pipeline(s3Result.Body, fs.createWriteStream(localFilePath));

  return localFilePath
}


export async function uploadToB2 (appContext, filePath) {
  const keyName = `${cuid()}-${path.basename(filePath)}`
  const bucketName = appContext.env.B2_BUCKET
  const s3 = new S3Client({
    endpoint: appContext.env.B2_ENDPOINT,
    region: appContext.env.B2_REGION,
    credentials: {
      accessKeyId: process.env.B2_KEY,
      secretAccessKey: process.env.B2_SECRET,
    }
  });
  var params = {Bucket: bucketName, Key: keyName, Body: fs.createReadStream(filePath)};
  const res = await s3.send(new PutObjectCommand(params));
  return {
    uploadId: res.VersionId,
    key: keyName,
    url: `${urlPrefix}${res.VersionId}`
  }
}
