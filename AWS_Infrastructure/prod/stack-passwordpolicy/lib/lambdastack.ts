import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnPermission } from 'aws-cdk-lib/aws-lambda';

export interface LambdaProps extends cdk.StackProps {
  ResourceNamePrefix: string,
  Environment: string,
}

export class lambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    //Lambda Policy
    const lambdapolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          effect: iam.Effect.ALLOW,
        }),
        new iam.PolicyStatement({
          resources: [cdk.Fn.sub("arn:${AWS::Partition}:iam::*:role/" + props.ResourceNamePrefix + "-role-" + props.Environment + "")],
          actions: [
            'sts:AssumeRole',
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    //Lambda Role
    const roleforlambda = new iam.Role(this, 'example-iam-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: props.ResourceNamePrefix + "-role-" + props.Environment,
      description: 'An example IAM role in AWS CDK',
      inlinePolicies: {
        IAMPermissions: lambdapolicy,
      },
    });

    //Lambda Funchtion
    const PolicyProviderFunction = new lambda.Function(this, 'PolicyProviderLambdaFunction', {
      functionName: props.ResourceNamePrefix + "-function-" + props.Environment,
      handler: 'app.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, '../password_policy')),
      role: roleforlambda,
      timeout: cdk.Duration.minutes(10),
      environment: {
        "AWS_PARTITION": cdk.Fn.sub('${AWS::Partition}'),
        "AWS_ACCOUNT": cdk.Fn.sub('${AWS::AccountId}'),
        "TARGET_ROLE": props.ResourceNamePrefix + "-role-" + props.Environment,
      }
    });

    //Lambda Premission
    const lambdapremission = new CfnPermission(this, 'LambdaPermission', {
      action: 'lambda:InvokeFunction',
      functionName: props.ResourceNamePrefix + "-function-" + props.Environment,
      principal: 'sns.amazonaws.com',
      sourceArn: cdk.Fn.sub('arn:aws:sns:${AWS::Region}:${AWS::AccountId}:' + props.ResourceNamePrefix + "-topic-" + props.Environment)
    });
    lambdapremission.node.addDependency(PolicyProviderFunction);


    //Export Lambda Function arn
    new cdk.CfnOutput(this, "LambdaPolicyProviderFunction", {
      value: PolicyProviderFunction.functionArn,
      exportName: "PolicyProviderFunction"+ props.Environment,
    });
  }
}

