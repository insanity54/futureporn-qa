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
  const statuses = await cluster.getPinCount('bafybeiclkyiomuru53rapmaekxyzyuiicc2ddtqx3el5pxaq2apqwdpnr4')
  console.log(statuses)
}

main()