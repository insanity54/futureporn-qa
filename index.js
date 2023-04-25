/**

Quality Assurance

  * [x] serve a webhook
  * [x] when webhook is hit, do a thing
  * [x] `ipfs pin add` the 
  * [x] videoSrcHash
  * [x] video240Hash
  * [x] thiccHash
  * [x] post message on Discord channel when task is accomplished

*/


import * as dotenv from 'dotenv'
dotenv.config()
import { Client, GatewayIntentBits } from 'discord.js'
import { loggerFactory } from "./lib/logger.js"
import Fastify from 'fastify'
import Cluster from './lib/Cluster.js'
import S from 'fluent-json-schema'
import { ipfsHashRegex } from './lib/constants.js'
import * as data from './package.json' assert { type: "json" }
const version = data.default.version

if (process.env.DISCORD_CLIENT_ID === undefined) throw new Error('DISCORD_CLIENT_ID undefined in env');
if (process.env.DISCORD_CLIENT_SECRET === undefined) throw new Error('DISCORD_CLIENT_SECRET undefined in env');
if (process.env.DISCORD_BOT_TOKEN === undefined) throw new Error('DISCORD_BOT_TOKEN undefined in env');
if (process.env.DISCORD_CHATOPS_CHANNEL_ID === undefined) throw new Error('DISCORD_CHATOPS_CHANNEL_ID undefined in env');
if (process.env.IPFS_CLUSTER_HTTP_API_MULTIADDR === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_MULTIADDR undef in env');
if (process.env.IPFS_CLUSTER_HTTP_API_USERNAME === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_USERNAME undef in env');
if (process.env.IPFS_CLUSTER_HTTP_API_PASSWORD === undefined) throw new Error('IPFS_CLUSTER_HTTP_API_PASSWORD undef in env');


const logger = loggerFactory({
  service: 'futureporn/qa'
})

const fastify = Fastify({
  logger: false
})

const client = new Client({ intents: [GatewayIntentBits.Guilds] });



client.on('ready', () => {
  logger.log({ level: 'info', message: `Logged in as ${client.user.tag}!` });

  
  // channel.send('Hello Worldy!');
});

client.login(process.env.DISCORD_BOT_TOKEN)

const cluster = new Cluster({
  uri: 'https://cluster.sbtp.xyz:9094',
  username: process.env.IPFS_CLUSTER_HTTP_API_USERNAME,
  password: process.env.IPFS_CLUSTER_HTTP_API_PASSWORD
})
// channel.send('Task complete!');



// Run the server!
fastify.listen({ 
  port: process.env.PORT || 5000,
  host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    logger.log({ level: 'error', message: err })
    process.exit(1)
  }
  logger.log({ level: 'info', message: `QA server ${version} listening on ${address}` })
})



async function idempotentlyPinIpfsContent(cluster, data) {
  let results = []
  const cids = [
    data?.entry?.videoSrcHash, 
    data?.entry?.video240Hash, 
    data?.entry?.thiccHash
  ]
  logger.log({ level: 'info', message: `Here are the CIDs yoinked fresh from the webhook:${JSON.stringify(cids)}` })

  const validCids = cids.filter((c) => c !== '' && c !== null && c !== undefined)
  logger.log({ level: 'info', message: `Here are the valid CIDs:${JSON.stringify(validCids)}` })
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



const webhookBodyJsonSchema = S.object()
  .prop('event', S.string()).required()
  .prop('model', S.string()).required()
  .prop('entry', S.object()).required()
  .valueOf()


const schema = {
  body: webhookBodyJsonSchema,
}

// Declare a webhook route
// This is used by Strapi.
// When a new VOD is created, Strapi GETs the route
// QA responds by adding the IPFS hash
fastify.post('/webhook', { schema }, async (request, reply) => {

  logger.log({ level: 'info', message: `Webhook was hit!` })

  reply.type('application/json')
  // we can use the `request.body` object to get the data sent by the client
  // const result = await collection.insertOne({ animal: request.body.animal })
  // return result
  const body = request?.body
  if (body === undefined) {
    reply.code(400)
    return {
      message: 'body must be defined, but it was undefined'
    }
  }
  logger.log({ level: 'info', message: `idempotentlyPinIpfsContent` })
  logger.log({ level: 'info', message: JSON.stringify(body) })
  const pins = await idempotentlyPinIpfsContent(cluster, body)
  logger.log({ level: 'info', message: `${JSON.stringify(pins)}` })

  if (pins.length > 0) {
    const discordChannel = client.channels.cache.get(process.env.DISCORD_CHATOPS_CHANNEL_ID);
    discordChannel.send(`addPin task complete! ${pins}`);
    logger.log({ level: 'info', message: `Pinned ${pins}` })
    return {
      message: `Pinned ${pins}`
    }
  } else {
    logger.log({ level: 'info', message: `Nothing to pin!` })
    return {
      message: `Nothing to pin`
    }
  }
})

