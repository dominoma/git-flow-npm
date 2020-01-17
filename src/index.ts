import util from 'util'
import { exec as execNoPromise } from 'child_process'

const exec = util.promisify(execNoPromise)

async function fetchPackageEnv() {
  const { stdout } = await exec('npm run env')
  const env = Object.fromEntries(
    stdout.split('\n').map((entry) => entry.split('=') as [string, string])
  )
  return env
}

function incrementVersion(version: string, pos: number) {
  return version
    .split('.')
    .map((value, index) => (index === pos ? parseInt(value, 10) + 1 : value))
    .join('.')
}

async function deploy() {
  await exec('git checkout master')
  try {
    await exec('npm run deploy')
  } finally {
    await exec('git checkout develop')
  }
}

async function releaseStart(currentVersion: string) {
  const version = currentVersion
  const nextMinor = incrementVersion(version, 1)
  try {
    await exec(`git flow release start ${nextMinor}`)
    await exec('npm run version minor')
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
  }
}
async function releaseFinish(doDeploy: boolean, releaseVersion?: string) {
  try {
    await exec(`git flow release finish ${releaseVersion || ''} -p`)
    if (doDeploy) {
      await deploy()
    }
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
  }
}

async function hotfixStart(name: string) {
  try {
    await exec(`git flow hotfix start ${name}`)
    await exec('npm run version patch')
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
  }
}
async function hotfixFinish(
  currentVersion: string,
  doDeploy: boolean,
  name?: string
) {
  try {
    await exec(
      `git flow hotfix finish ${name || ''} -p --tagname ${currentVersion}`
    )
    if (doDeploy) {
      await deploy()
    }
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
  }
}

async function cli(argv: string[]) {
  const params = argv.slice(2)
  if (params[0] === 'release') {
    const packageEnv = await fetchPackageEnv()
    if (!params[1] || params[1] === 'start') {
      await releaseStart(packageEnv.npm_package_version)
    }
    if (!params[1] || params[1] === 'finish') {
      await releaseFinish('npm_package_scripts_deploy' in packageEnv, params[2])
    }
  } else if (params[0] === 'hotfix') {
    if (params[1] === 'start') {
      await hotfixStart(params[2])
    } else if (params[1] === 'finish') {
      const packageEnv = await fetchPackageEnv()
      await hotfixFinish(
        packageEnv.npm_package_version,
        'npm_package_scripts_deploy' in packageEnv,
        params[2]
      )
    }
  } else if (params[0] !== '') {
    try {
      await exec(`git flow ${params.join(' ')}`)
    } catch (e) {
      if (e instanceof Error) console.log(e.message)
    }
  }
}
cli(process.argv)
