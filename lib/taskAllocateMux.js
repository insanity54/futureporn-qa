import { got } from 'got';
import EleventyFetch from "@11ty/eleventy-fetch";


export async function getPatreonCampaign() {
  return EleventyFetch('https://www.patreon.com/api/campaigns/8012692', {
    duration: "1d",
    type: "json",
  })
}


export async function getPatreonCampaignPledgeSum() {
  const campaign = await getPatreonCampaign()
  return campaign.data.attributes.pledge_sum
}


/**
 * Calculate how many mux allocations the site should have, based on the dollar amount of pledges from patreon
 * 
 * @param {Number} pledgeSum - USD cents
 */
export function getMuxAllocationCount(pledgeSum) {
  const dollarAmount = pledgeSum / 100; // convert USD cents to USD dollars
  const muxAllocationCount = Math.floor(dollarAmount / 50); // calculate the number of mux allocations required
  return muxAllocationCount;
}

export async function getAllPublishedVodsSortedByDate(appContext) {
    const { data } = await got.get(`${appContext.env.STRAPI_URL}/api/vods?sort[0]=date%3Adesc&populate[0]=muxAsset&populate[1]=backup`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  return data
}

export async function idempotentlyAddMuxToVod(appContext, vod) {
  console.log(vod.attributes)
  if (!vod?.attributes?.backup?.data?.attributes?.url) throw new Error(`vod is missing backup url which is required to add to Mux`);
  const isActNeeded = (!vod?.attributes?.muxAsset?.data?.attributes?.playbackId) ? true : false


  if (isActNeeded) {
    // const { data: muxData } = await got.post(`${appContext.env.STRAPI_API_KEY}/mux-video-uploader/submitRemoteUpload`, {
    //   headers: {
    //     'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    //   },
    //   form: {
    //     title: vod.attributes.date,
    //     url: vod.attributes.backup.url
    //   }
    // }).json()


    appContext.logger.log({ level: 'debug', message: `Creating Mux asset for vod ${vod.id} (${vod.attributes.backup.data.attributes.url})` })
    const { data: muxData } = await got.post('https://api.mux.com/video/v1/assets', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${appContext.env.MUX_TOKEN_ID}:${appContext.env.MUX_TOKEN_SECRET}`).toString('base64')}`
      },
      json: {
        "input": vod.attributes.backup.data.attributes.url,
        "playback_policy": [
          "signed"
        ]
      }
    }).json()

    console.log(muxData)

    appContext.logger.log({level: 'debug', message: `Adding Mux Asset to strapi`})
    const { data: muxAssetData } = await got.post(`${appContext.env.STRAPI_URL}/api/mux-assets`, {
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      },
      json: {
        data: {
          playbackId: muxData.playback_ids.find((p) => p.policy === 'signed').id,
          assetId: muxData.id
        }
      }
    }).json()


    appContext.logger.log({ level: 'debug', message: `Relating Mux Asset to Vod ${vod.id}` })
    const { data: strapiData } = await got.put(`${appContext.env.STRAPI_URL}/api/vods/${vod.id}`, {
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      },
      json: {
        data: {
          muxAsset: muxAssetData.id
        }
      }
    }).json()
  }
}

export async function idempotentlyRemoveMuxFromVod(appContext, vodId) {
  // first see if a Mux playback ID is already absent
  // second, optionally act to ensure that the Mux playback ID is absent.
  // if we acted, also delete the Mux asset

  // if (actNeeded)
  //   remove Mux playback ID from Vod
  //   delete Mux asset
}


export function getMuxTargetVods(appContext, muxAllocationCount, vods) {
  // get last N published vods
  // where N is muxAllocationCount
  return {
    vodsForMux: vods.slice(0, muxAllocationCount),
    vodsNotForMux: vods.slice(muxAllocationCount)
  }
}


export async function createMuxAsset(appContext, videoUrl) {
  const { data } = await got.post('https://api.mux.com/video/v1/assets', {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${appContext.env.MUX_TOKEN_ID}:${appContext.env.MUX_TOKEN_SECRET}`).toString('base64')}`
    },
    json: {
      input: videoUrl,
      playback_policy: ['signed']
    }
  }).json()
}

export async function taskAllocateMux(appContext, body) {
  appContext.logger.log({ level: 'info', message: 'taskAllocateMux begin' })
  const pledgeSum = await getPatreonCampaignPledgeSum()
  const muxAllocationCount = getMuxAllocationCount(pledgeSum)
  appContext.logger.log({ level: 'debug', message: `pledgeSum:${pledgeSum}, muxAllocationCount:${muxAllocationCount}` })

  const vods = await getAllPublishedVodsSortedByDate(appContext)
  console.log('here be a vod')
  console.log(vods[0])
  const { vodsForMux, vodsNotForMux } = getMuxTargetVods(appContext, muxAllocationCount, vods)
  appContext.logger.log({ level: 'debug', message: `vodsForMux:${vodsForMux.map((v)=>v.id)}, vodsNotForMux:${vodsNotForMux.map((v)=>v.id)}`})
  for (const vod of vodsForMux) { await idempotentlyAddMuxToVod(appContext, vod) };
  for (const vod of vodsNotForMux) { await idempotentlyRemoveMuxFromVod(appContext, vod) }

}