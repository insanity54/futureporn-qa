import { got } from 'got';
import dotenv from 'dotenv';
dotenv.config()

if (process.env.PORT === 'undefined') throw new Error('PORT must be defined in process.env')

async function main() {
  await got.post(`https://futureporn-qa.loca.lt/webhook`, {
    json: {
      "event": "entry.create",
      "createdAt": "2020-01-10T08:47:36.649Z",
      "model": "vod",
      "entry": {
        "id": 1,
        "backup": {
          "url": "https://f000.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_zfd1367af11f33a3973a30b18_f226a2d1743f4e230_d20220907_m223453_c000_v0001077_t0027_u01662590093450"
        },
        "videoSrcHash": '',
        "video240Hash": '',
        "date": null,
        "thiccHash": '',
        "createdAt": "2020-01-10T08:47:36.264Z",
        "updatedAt": "2020-01-10T08:47:36.264Z",
      }
    }
  }).json()
}

main()
