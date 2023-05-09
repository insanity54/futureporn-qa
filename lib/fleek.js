import { request, gql } from 'graphql-request';
import { getFleek } from './strapi.js';
import { debounce } from 'lodash-es';


export async function triggerWebsiteBuild(appContext) {
  appContext.logger.log({ level: 'info', message: 'fleek.triggerWebsiteBuild() was executed. Will it actually run? that\'s up to debounce.' })
  appContext.build = (appContext.build) ? appContext.build : debounce(() => {
    __triggerWebsiteBuild(appContext)
  }, 1000*60*30, { leading: true })
  appContext.build()
}

export async function __triggerWebsiteBuild(appContext) {
  const fleek = await getFleek(appContext)
  const { jwt, siteId, endpoint, lastBuild } = fleek.attributes
  console.log(`jwt:${jwt}, siteId:${siteId}, endpoint:${endpoint}`)
  const document = gql`
    mutation triggerDeploy($siteId: ID!) {
      triggerDeploy(siteId: $siteId) {
        ...DeployDetail
        __typename
      }
    }

    fragment DeployDetail on Deploy {
      id
      startedAt
      completedAt
      status
      ipfsHash
      log
      published
      previewImage
      repository {
        url
        name
        owner
        branch
        commit
        message
        __typename
      }
      gitEvent
      pullRequestUrl
      taskId
      __typename
    }
  `
  const headers = {
    'authorization': `Bearer ${jwt}`
  }

  const variables = {
    siteId,
  }
    
  await request(
    endpoint,
    document,
    variables,
    headers
  )
}