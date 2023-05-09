import { got } from 'got'

export async function getVod (appContext, vodId) {
  const { data } = await got.get(`${appContext.env.STRAPI_URL}/api/vods/${vodId}?populate=*`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  return data
} 


export async function updateVod (appContext, vodId, data) {
  const { data: output } = await got.put(`${appContext.env.STRAPI_URL}/api/vods/${vodId}`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    },
    json: {
      data
    }
  }).json()
  return output
}


export async function getFleek (appContext) {
  const { data } = await got.get(`${appContext.env.STRAPI_URL}/api/fleek`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  return data
}