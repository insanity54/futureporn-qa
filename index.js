/**

Quality Assurance

  * [x] serve a webhook
  * [x] when webhook is hit, run a series of tasks
  * [x] `ipfs pin add` the 
  * [x] videoSrcHash
  * [x] video240Hash
  * [x] thiccHash
  * [x] post message on Discord channel when task is accomplished

*/


import * as dotenv from 'dotenv'
dotenv.config()
import { Client, GatewayIntentBits } from 'discord.js'
const DiscordClient = Client
import { loggerFactory } from "./lib/logger.js"
import Fastify from 'fastify'
import Cluster from './lib/Cluster.js'
import S from 'fluent-json-schema'
import { ipfsHashRegex } from './lib/constants.js'
import fs from 'node:fs';
import { taskAllocateMux } from './lib/taskAllocateMux.js'
import { taskPinIpfsContent } from './lib/taskPinIpfsContent.js'
import fastq from 'fastq'


const version = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf-8' })).version
const appEnv = new Array(
  'NODE_ENV',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'DISCORD_CHATOPS_CHANNEL_ID',
  'IPFS_CLUSTER_HTTP_API_MULTIADDR',
  'IPFS_CLUSTER_HTTP_API_USERNAME',
  'IPFS_CLUSTER_HTTP_API_PASSWORD',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
  'STRAPI_URL',
  'STRAPI_API_KEY',
)


const logger = loggerFactory({
  service: 'futureporn/qa'
})

const appContext = {
  env: appEnv.reduce((acc, ev) => {
    if (typeof process.env[ev] === 'undefined') throw new Error(`${ev} is undefined in env`);
    acc[ev] = process.env[ev];
    return acc;
  }, {}),
  logger
};

const workQueue = fastq(tasks, 1)


const fastify = Fastify({
  logger: false
})

const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds] });



discordClient.on('ready', () => {
  logger.log({ level: 'info', message: `Logged in as ${discordClient.user.tag}!` });
});

discordClient.login(process.env.DISCORD_BOT_TOKEN)

const cluster = new Cluster({
  uri: 'https://cluster.sbtp.xyz:9094',
  username: process.env.IPFS_CLUSTER_HTTP_API_USERNAME,
  password: process.env.IPFS_CLUSTER_HTTP_API_PASSWORD
})





const webhookBodyJsonSchema = S.object()
  .prop('event', S.string()).required()
  .prop('model', S.string())
  .prop('entry', S.object()).required()
  .valueOf()


const schema = {
  body: webhookBodyJsonSchema,
}



async function tasks (body) {
  try {
    await taskAllocateMux(appContext, body)
    await taskPinIpfsContent(appContext, body, discordClient, cluster)
  } catch (err) {
    logger.error('Error while running QA tasks')
    logger.error(err.message)
    console.error(err)
  }
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
  console.log(body)
  if (body === undefined) {
    reply.code(400)
    return {
      message: 'body must be defined, but it was undefined'
    }
  }

  workQueue.push(body)

})




// Run the server!
fastify.listen({ 
  port: process.env.PORT || 5000,
  host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    logger.log({ level: 'error', message: err })
    process.exit(1)
  }
  logger.log({ level: 'info', message: `QA server ${version} in NODE_ENV ${appContext.env.NODE_ENV} listening on ${address}` })
})


