import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppProps, aws_cloudformation as cf, CfnCustomResourceProps, CfnResource, Reference, StackProps } from 'aws-cdk-lib';
import { CfnCustomResource } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Environment } from "aws-cdk-lib/core";

const env: Environment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
};


export interface PasswordPolicyProps extends StackProps {
    minimumPasswordLength: number;
    requireSymbols: boolean;
    requireNumbers: boolean;
    requireUppercaseCharacters: boolean;
    requireLowercaseCharacters: boolean;
    allowUsersToChangePassword: boolean;
    maxPasswordAge: number;
    passwordReusePrevention: number;
    hardExpiry: boolean;
    ResourceNamePrefix?: string;
    Environment?: string;

}

export class AccountPasswordPolicyResourceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PasswordPolicyProps) {
        super(scope, id, props);
        const accountPasswordPolicyResource = new AccountPasswordPolicyResource(this, 'PasswordPolicy', props);
    }
}

export class AccountPasswordPolicyResource extends CfnCustomResource {

    constructor(scope: Construct, id: string, props: PasswordPolicyProps) {
        const cfnPasswordPolicyCRProps: cf.CfnCustomResourceProps = {
            serviceToken: cdk.Fn.sub('arn:aws:sns:${AWS::Region}:' + env.account + ':' + props.ResourceNamePrefix + "-topic-" + props.Environment)


        };
        super(scope, id, cfnPasswordPolicyCRProps);

        //Custom Policy
        const AssumeRolePolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
                actions: [
                    'sts:AssumeRole'
                ],
                principals: [new iam.ArnPrincipal(cdk.Fn.sub('arn:aws:iam::' + env.account + ':role/' + props.ResourceNamePrefix + "-role-" + props.Environment))],
                effect: iam.Effect.ALLOW,
            })],
        });
        const PolicyDocument = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['iam:DeleteAccountPasswordPolicy', 'iam:UpdateAccountPasswordPolicy'],
                    effect: iam.Effect.ALLOW,
                }),
            ],
        });

        //Custum Role
        const cfnRole = new iam.CfnRole(this, 'MyCfnRole', {
            assumeRolePolicyDocument: AssumeRolePolicyDocument,
            roleName: props.ResourceNamePrefix + "-role-" + props.Environment,
            policies: [{
                policyDocument: PolicyDocument,
                policyName: 'IAMPermissions',
            }],
        });
        this.addDependsOn(cfnRole);
        this.addPropertyOverride('MinimumPasswordLength', props.minimumPasswordLength);
        this.addPropertyOverride('RequireSymbols', props.requireSymbols);
        this.addPropertyOverride('RequireNumbers', props.requireNumbers);
        this.addPropertyOverride('RequireUppercaseCharacters', props.requireUppercaseCharacters);
        this.addPropertyOverride('RequireLowercaseCharacters', props.requireLowercaseCharacters);
        this.addPropertyOverride('AllowUsersToChangePassword', props.allowUsersToChangePassword);
        this.addPropertyOverride('MaxPasswordAge', props.maxPasswordAge);
        this.addPropertyOverride('PasswordReusePrevention', props.passwordReusePrevention);
        this.addPropertyOverride('HardExpiry', props.hardExpiry);
    }
}