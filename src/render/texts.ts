import chalk from 'chalk'

export const conditionsAndPolicyMessage = `
    Please confirm that you agree with:
    Terms and Conditions: ${chalk.blue(
      'https://build.affinidi.com/console-landing-terms-of-use.pdf',
    )}
    Cookie Policy: ${chalk.blue('https://build.affinidi.com/console-landing-cookie-policy.pdf')}
    Privacy Policy: ${chalk.blue('https://build.affinidi.com/console-landing-privacy-policy.pdf')}
    [y/n]
`

export const listCommandDescription = chalk`
  Use the ${chalk.bgCyanBright('list')} command if you want to display some of your resources
  like schemas or the projects that you've created.
  The current available ressources are:
      - ${chalk.cyanBright('projects')}
      - ${chalk.cyanBright('schemas')}
  See the command examples below ⬇️
`
