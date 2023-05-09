import Prevvy from 'prevvy';
import fs from 'node:fs';
import path from 'node:path';
import { got } from 'got';
import { getVod } from './strapi.js';
import { getVideoSrcB2LocalFilePath } from './fsCommon.js';
import { uploadToB2 } from './b2.js'


export default async function taskGenerateThumbnail (appContext, body) {
  if (body.model === 'vod') {
    const vod = await getVod(appContext, body.entry.id)
    appContext.logger.log({ level: 'info', message: 'taskGenerateThumbnail begin' })
    const thumbnailKey = vod?.attributes?.thumbnail?.data?.attributes?.key
    if (!thumbnailKey) {
      const fileName = `vod-${vod?.id}-thumb.png`
      const thumbnailFilePath = path.join(appContext.env.TMPDIR, fileName)
      const videoSrcLocalFilePath = 
      appContext.logger.log({ level: 'info', message: `Creating thumbnail from ${thumbnailFilePath}`})
      const thumb = new Prevvy({
        input: getVideoSrcB2LocalFilePath(appContext, vod),
        output: thumbnailFilePath,
        throttleTimeout: 2000,
        width: 128,
        cols: 5,
        rows: 5,
      })
      await thumb.generate();

      // upload thumbnail to B2
      const uploadData = await uploadToB2(appContext, thumbnailFilePath);


      // create b2-file in Strapi
      const { data: thumbData } = await got.post(`${appContext.env.STRAPI_URL}/api/b2-files`, {
        headers: {
          'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
        },
        json: {
          data: {
            key: uploadData.key,
            uploadId: uploadData.uploadId,
            url: uploadData.url
          }
        }
      }).json()

      // associate b2-file with vod in strapi
      const { data: vodData } = await got.put(`${appContext.env.STRAPI_URL}/api/vods/${vod.id}`, {
        headers: {
          'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
        },
        json: {
          data: {
            thumbnail: thumbData.id
          }
        }
      }).json()

    } else {
      appContext.logger.log({ level: 'debug', message: 'Doing nothing-- thumbnail already exists.'})
    }
  } else {
    appContext.logger.log({ level: 'debug', message: 'Doing nothing-- entry is not a vod.'})
  }
}