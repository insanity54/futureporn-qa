import { getVod, updateVod } from './strapi.js'
import { getVideoSrcB2LocalFilePath } from './fsCommon.js'
import { get240Transcode } from './ffmpeg.js'

export default async function taskAddVideo240Hash(appContext, body) {
  appContext.logger.log({ level: 'info', message: `[TASK] AddVideo240Hash begin` })
  if (body.model === 'vod') {
    if (body?.entry?.publishedAt) {
      const vod = await getVod(appContext, body.entry.id)
      const video240Hash = vod?.attributes?.video240Hash
      if (!video240Hash) {
        const videoSrcB2LocalFilePath = getVideoSrcB2LocalFilePath(appContext, vod)
        const video240LocalFilePath = await get240Transcode(appContext, videoSrcB2LocalFilePath)
        const cid = await appContext.cluster.add(video240LocalFilePath)
        const data = await updateVod(appContext, vod.id, { video240Hash: cid })
        appContext.changed = true
        appContext.logger.log({ level: 'info', message: `Added ${cid} as video240Hash` })
      } else {
        appContext.logger.log({ level: 'debug', message: 'Doing nothing-- video240Hash already exists'})
      }
    } else {
      appContext.logger.log({ level: 'debug', message: 'Doing nothing-- vod is not published.'})
    }
  } else {
    appContext.logger.log({ level: 'debug', message: 'Doing nothing-- entry is not a vod.'})
  }
}