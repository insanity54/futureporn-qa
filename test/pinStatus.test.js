import dotenv from 'dotenv'
import Cluster from '../lib/Cluster.js'

// if (process.env.IPFS_CLUSTER_HTTP_API_MULTIADDR === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_MULTIADDR undef in env');
if (process.env.IPFS_CLUSTER_HTTP_API_USERNAME === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_USERNAME undef in env');
if (process.env.IPFS_CLUSTER_HTTP_API_PASSWORD === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_PASSWORD undef in env');


async function main() {
  const cluster = new Cluster({
    username: process.env.IPFS_CLUSTER_HTTP_API_USERNAME,
    password: process.env.IPFS_CLUSTER_HTTP_API_PASSWORD
  })
  // const statuses = await cluster.getPinCount('bafybeiclkyiomuru53rapmaekxyzyuiicc2ddtqx3el5pxaq2apqwdpnr4')
  // console.log(statuses)
  const eeeeee = await idempotentlyPinIpfsContent(cluster, {
    entry: {
      videoSrcHash: 'bafkreibsuow7tcfweysasilsslt2h3rlxa4deud43p7kx2fc25tw6urfcu'
    } 
  })
  console.log(eeeeee)
}


async function idempotentlyPinIpfsContent(cluster, data) {
  let results = []
  const cids = [
    data?.entry?.videoSrcHash, 
    data?.entry?.video240Hash, 
    data?.entry?.thiccHash
  ]
  const validCids = cids.filter((c) => c !== '' && c !== undefined)
  console.log(`Here are the valid CIDs:${JSON.stringify(validCids)}`)
  if (validCids.length === 0) return results
  for (const vc of validCids) {
    const pinCount = await cluster.getPinCount(vc)
    if (pinCount < 1) {
      const pinnedCid = await cluster.pinAdd(vc)
      results.push(pinnedCid)
    }
  }
  return results
}


main()