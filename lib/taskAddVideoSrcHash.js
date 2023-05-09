import { getVod, updateVod } from './strapi.js'
import { getVideoSrcB2LocalFilePath } from './fsCommon.js'


export default async function taskAddVideoSrcHash(appContext, body) {
  // if vod
  //   if published
  //     if missing videoSrcHash
  //       ipfs add vod.videoSrcB2 => videoSrcHash
  //       logger.info added
  //     else
  //       logger.debug doing nothing-- videoSrcHash already exists
  //     //if missing video240Hash // too slow, adding in a different task
  //     //  transcode
  //     //  ipfs add /tmp/vod-1-240.mp4 => video240Hash
  //     //else
  //     //  logger.debug doing nothing-- video240Hash already exists
  //   else
  //     logger.debug "doing nothing-- not published"
  // else
  //   logger.debug "doing nothing-- not a vod"
  appContext.logger.log({ level: 'info', message: `[TASK] AddVideoSrcHash begin` })
  if (body.model === 'vod') {
    if (body?.entry?.publishedAt) {
      const vod = await getVod(appContext, body.entry.id)
      const videoSrcHash = vod?.attributes?.videoSrcHash
      appContext.logger.log({ level: 'debug', message: `>>>>>>here is the videoSrcHash:${videoSrcHash}`})
      if (!videoSrcHash) {
        const cid = await appContext.cluster.add(getVideoSrcB2LocalFilePath(appContext, vod))
        const data = await updateVod(appContext, vod.id, { videoSrcHash: cid })
        appContext.changed = true
        appContext.logger.log({ level: 'info', message: `Added ${cid} as videoSrcHash` })
      } else {
        appContext.logger.log({ level: 'debug', message: 'Doing nothing-- videoSrcHash already exists'})
      }
    } else {
      appContext.logger.log({ level: 'debug', message: 'Doing nothing-- entry is not published.'})
    }
  } else {
    appContext.logger.log({ level: 'debug', message: 'Doing nothing-- entry is not a vod.'})
  }
}