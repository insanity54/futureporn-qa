import { downloadVideoSrcB2 } from './b2.js';
import { getVod } from './strapi.js';
import fs from 'node:fs';
import { getVideoSrcB2LocalFilePath } from './fsCommon.js';



export default async function taskDownloadVideoSrcB2 (appContext, body) {
  appContext.logger.log({ level: 'info', message: 'taskDownloadVideoSrcB2 started.' })
  if (body.model === 'vod') {
    const vod = await getVod(appContext, body.entry.id)
    // download is only necessary when thumbnail or videoSrcHash is missing
    const hasThumbnail = (vod?.attributes?.thumbnailB2?.data?.attributes?.url) ? true : false
    const hasVideoSrcHash = (vod?.attributes?.videoSrcHash) ? true : false
    if (!hasThumbnail || !hasVideoSrcHash) {
      await downloadVideoSrcB2(appContext, vod)
    } else {
      appContext.logger.log({ level: 'info', message: 'Doing nothing-- No need for downloading videoSrcB2.' })
    }
  } else {
    appContext.logger.log({ level: 'info', message: 'Doing nothing-- entry is not a vod.'})
  }
}