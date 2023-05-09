import path from 'node:path';
import fs from 'node:fs';

export function getVideoSrcB2LocalFilePath (appContext, vod) {
  if (!vod?.attributes?.videoSrcB2?.data?.attributes?.key) throw new Error(`vod is missing videoSrcB2.key which is required to download`)
  const key = vod.attributes.videoSrcB2.data.attributes.key
  const localFilePath = path.join(appContext.env.TMPDIR, key)
  return localFilePath
}