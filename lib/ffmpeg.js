import { execa } from 'execa';
import path from 'node:path';



const reportInterval = 60000


async function getTotalFrameCount (filename) {
  const { exitCode, killed, stdout, stderr } = await execa('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_frames',
    '-of', 'default=nokey=1:noprint_wrappers=1',
    filename
  ])
  if (exitCode !== 0 || killed !== false) {
    throw new Error(`problem while getting frame count. exitCode:${exitCode}, killed:${killed}, stdout:${stdout}, stderr:${stderr}`);
  }
  return parseInt(stdout)
}


/**
 * @param {string} input
 * @resolves {string} output
 */
export async function get240Transcode (appContext, filename) {
  if (typeof filename === 'undefined') throw new Error('filename is undefined');
  const progressFilePath = path.join(appContext.env.TMPDIR, 'ffmpeg-progress.log')
  const outputFilePath = path.join(appContext.env.TMPDIR, path.basename(filename, '.mp4')+'_240p.mp4')
  const totalFrames = await getTotalFrameCount(filename)

  appContext.logger.log({ level: 'debug', message: `transcoding ${filename} to ${outputFilePath} and saving progress log to ${progressFilePath}` })
  let progressReportTimer = setInterval(async () => {
    try {
      const frame = await getLastFrameNumber(progressFilePath)
      appContext.logger.log({ level: 'info', message: `transcoder progress-- ${(frame/totalFrames*100).toFixed(2)}%` })
    } catch (e) {
      appContext.logger.log({ level: 'info', message: 'we got an error thingy while reading the ffmpeg-progress log but its ok we can just ignore and try again later.' })
    }
  }, reportInterval)
  const { exitCode, killed, stdout, stderr } = await execa('ffmpeg', [
    '-y',
    '-i', filename,
    '-vf', 'scale=w=-2:h=240',
    '-b:v', '386k',
    '-b:a', '45k',
    '-progress', progressFilePath,
    outputFilePath
  ]);
  if (exitCode !== 0 || killed !== false) {
    throw new RemuxError(`exitCode:${exitCode}, killed:${killed}, stdout:${stdout}, stderr:${stderr}`);
  }
  appContext.logger.log({ level: 'info', message: 'transcode COMPLETE!' })
  clearInterval(progressReportTimer)
  return outputFilePath
}
