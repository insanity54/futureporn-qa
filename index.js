/**

Quality Assurance

  * [ ] serve a webhook
  * [ ] when webhook is hit, do a thing
  * [ ] when doing a thing, GET /api/vods
  * [ ] for each vod, `ipfs pin add` the 
  * [ ] videoSrcHash
  * [ ] video240Hash
  * [ ] thiccHash
  * [ ] post message on Discord channel when task is accomplished

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

  const channel = client.channels.cache.get(process.env.DISCORD_CHATOPS_CHANNEL_ID);
  // channel.send('Hello Worldy!');
});

client.login(process.env.DISCORD_BOT_TOKEN)

const cluster = new Cluster({
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



function myFunction(data) {
  // implement your webhook processing logic here
  console.log(data)
}



const webhookBodyJsonSchema = S.object()
  .prop('event', S.string()).required()
  .prop('model', S.string()).required()
  .prop('entry', S.object()).required()
  .valueOf()


const schema = {
  body: webhookBodyJsonSchema,
}

fastify.post('/webhook', { schema }, async (request, reply) => {
  reply.type('application/json')
  // we can use the `request.body` object to get the data sent by the client
  // const result = await collection.insertOne({ animal: request.body.animal })
  // return result
  console.log(request.body)
  return {
    message: 'hi'
  }
})

// Declare a webhook route
// This is used by Strapi.
// When a new VOD is created, Strapi GETs the route
// QA responds by adding the IPFS hash
// fastify.post('/webhook', async function (request, reply) {
//   reply.type('application/json')
//   logger.log({ level: 'info', message: `/webhook visited` });
//   const validationResult = isValidWebhook(request.body)
//   if (!validationResult.valid) {
//     return reply.code(400).send({ message: validationResult.message })
//   }
//   // Run your function with the valid webhook data
//   myFunction(body)
//   reply.send({ message: 'Webhook received successfully' })
// })