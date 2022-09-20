#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { lambdaStack } from '../lib/lambdastack';
import { snsstack } from '../lib/snsstack';
import {PasswordPolicyStack} from '../lib/stackset';
import { StacksetProps } from '../lib/stackset';
import { PasswordPolicyProps } from '../lib/account-pwd-policy-resource';
import {config} from '../config';



const app = new cdk.App();

const passwordPolicyProps: PasswordPolicyProps = {
  minimumPasswordLength: config.minimumPasswordLength,
  requireSymbols: config.requireSymbols,
  requireNumbers: config.requireNumbers,
  requireUppercaseCharacters: config.requireUppercaseCharacters,
  requireLowercaseCharacters: config.requireLowercaseCharacters,
  allowUsersToChangePassword: config.allowUsersToChangePassword,
  maxPasswordAge: config.maxPasswordAge,
  passwordReusePrevention: config.passwordReusePrevention,
  hardExpiry: config.hardExpiry,
}


const props: StacksetProps = {
  ResourceNamePrefix: config.ResourceNamePrefix,
  Environment: config.Environment,
  OrganizationID: config.OrganizationID,
  TargetOU: config.TargetOU,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  PasswordPolicyProps: passwordPolicyProps
}


const lambda =new lambdaStack(app, 'stagelambdastack', props);

const sns = new snsstack(app, 'stagesnsstack', props);

const passwordpolicy = new PasswordPolicyStack (app, 'stagePasswordPolicyStack', props);
passwordpolicy.addDependency(lambda)
passwordpolicy.addDependency(sns)
