# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


* `npm run lambda` cdk deploy lambdastack --require-approval never
* `npm run sns` cdk deploy snsstack --require-approval never
* `npm run passwordpolicy` cdk deploy PasswordPolicyStack --require-approval never
* `npm run all` cdk deploy lambdastack snsstack PasswordPolicyStack --require-approval never
