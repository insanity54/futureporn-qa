


export async function idempotentlyPinIpfsContent(appContext, body) {
  let results = []
  const cids = [
    body?.entry?.videoSrcHash, 
    body?.entry?.video240Hash, 
    body?.entry?.thiccHash
  ]
  appContext.logger.log({ level: 'info', message: `Here are the CIDs yoinked fresh from the webhook:${JSON.stringify(cids)}` })

  const validCids = cids.filter((c) => c !== '' && c !== null && c !== undefined)
  appContext.logger.log({ level: 'info', message: `Here are the valid CIDs:${JSON.stringify(validCids)}` })
  if (validCids.length === 0) return results
  for (const vc of validCids) {
    appContext.logger.log({ level: 'info', message: `checking to see if ${vc} is pinned` })
    const pinCount = await appContext.cluster.getPinCount(vc)
    if (pinCount < 1) {
      appContext.logger.log({ level: 'info', message: `${vc} is pinned on ${pinCount} appContext.cluster peers.` })
      const pinnedCid = await appContext.cluster.pinAdd(vc)
      results.push(pinnedCid)
    }
  }
  return results
}

export async function taskPinIpfsContent(appContext, body) {
  appContext.logger.log({ level: 'info', message: `idempotentlyPinIpfsContent` })
  appContext.logger.log({ level: 'info', message: JSON.stringify(body) })
  const pins = await idempotentlyPinIpfsContent(appContext, body, appContext.cluster)
  appContext.logger.log({ level: 'info', message: `${JSON.stringify(pins)}` })

  if (pins.length > 0) {
    const discordChannel = appContext.discordClient.channels.cache.get(appContext.env.DISCORD_CHATOPS_CHANNEL_ID);
    if (appContext.env.NODE_ENV === 'production') discordChannel.send(`addPin task complete! ${pins}`);
    appContext.logger.log({ level: 'info', message: `Pinned ${pins}` })
    return {
      message: `Pinned ${pins}`
    }
  } else {
    appContext.logger.log({ level: 'info', message: `Nothing to pin!` })
    return {
      message: `Nothing to pin`
    }
  }
}