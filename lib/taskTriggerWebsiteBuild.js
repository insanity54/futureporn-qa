import { triggerWebsiteBuild } from './fleek.js'

export default async function taskTriggerWebsiteBuild (appContext) {

  if (appContext.changed) {
    await triggerWebsiteBuild(appContext) // this function gets debounced so we can call it as fast as we want
  }
}
