import util from 'util'
import { exec as execNoPromise } from 'child_process'
import readline from 'readline'

const rlInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const exec = util.promisify(execNoPromise)

function fetchInput(question: string) {
  return new Promise<string>((resolve) => {
    rlInterface.question(question, (answer) => {
      rlInterface.close()
      resolve(answer)
    })
  })
}

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
    .map((value, index) => {
      if (index < pos) {
        return value
      } else if (index > pos) {
        return 0
      } else {
        return (parseInt(value, 10) + 1).toString()
      }
    })
    .join('.')
}

async function deploy() {
  await exec('git checkout master')
  try {
    console.log('Running deploy script on master branch...')
    await exec('npm run deploy')
  } finally {
    await exec('git checkout develop')
    console.log('You are now on the develop branch')
  }
}

async function releaseStart(currentVersion: string) {
  const version = currentVersion
  const nextMinor = incrementVersion(version, 1)
  console.log(`Creating branch for release ${nextMinor}`)
  await exec(`git flow release start ${nextMinor}`)
  await exec('npm version minor')
  console.log(`You are now on branch release/${nextMinor}`)
}
async function releaseFinish(doDeploy: boolean, releaseVersion?: string) {
  const message = await fetchInput('Release tag message: ')
  console.log('Pushing release to remote...')
  await exec(
    `git flow release finish ${releaseVersion || ''} -p -m ${JSON.stringify(
      message
    )}`
  )
  console.log('Pushed release to remote')
  if (doDeploy) {
    await deploy()
  }
}

async function hotfixStart(name: string) {
  console.log(`Creating hotfix branch...`)
  await exec(`git flow hotfix start ${name}`)
  const { stdout } = await exec('npm version patch')
  console.log(`Created hotfix branch with version ${stdout}`)
}
async function hotfixFinish(
  currentVersion: string,
  doDeploy: boolean,
  name?: string
) {
  const message = await fetchInput('Hotfix tag message: ')
  console.log('Pushing hotfix to remote...')
  await exec(
    `git flow hotfix finish ${name ||
      ''} -p --tagname ${currentVersion} -m ${JSON.stringify(message)}`
  )
  console.log('Pushed hotfix to remote')
  if (doDeploy) {
    await deploy()
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
    await exec(`git flow ${params.join(' ')}`)
  }
}
cli(process.argv).catch((e) => {
  if (e instanceof Error) console.log(e.message)
})
