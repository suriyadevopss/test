import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';



export interface SNSprops extends cdk.StackProps {
  ResourceNamePrefix: string,
  Environment: string,
  OrganizationID: string,
}


export class snsstack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SNSprops) {
    super(scope, id,);


    //KMS Policy
    const Kmskeypolicy = new iam.PolicyDocument({
      statements: [

        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['kms:*',],
          principals: [new iam.AccountRootPrincipal()],
          effect: iam.Effect.ALLOW,
        }),


        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Encrypt*',
            'kms:Decrypt*',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          principals: [new iam.AnyPrincipal()],
          resources: ['*'],
          conditions: {
            'StringEquals': {
              'aws:PrincipalOrgID': [props.OrganizationID],
            },
          }
        })

      ],
    });
    //KMS Key
    const SNSTopicEncryptionKey = new kms.Key(this, 'MyKey', {
      description: "SNS topic encryption key",
      policy: Kmskeypolicy,
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(20),
    });
    const SNSTopicEncryptionKeyAlias = new kms.Alias(this, 'ReplicationAlias', {
      aliasName: "alias/SNSTopicEncryption"+ props.Environment,
      targetKey: SNSTopicEncryptionKey,
    });

    //SNS Topic
    const PasswordPolicyTopic = new sns.Topic(this, 'PasswordPolicyTopic', {
      displayName: props.ResourceNamePrefix + "-topic-" + props.Environment,
      topicName: props.ResourceNamePrefix + "-topic-" + props.Environment,
      masterKey: SNSTopicEncryptionKeyAlias,
    });
    const PasswordPolicyTopicPolicy = new sns.TopicPolicy(this, 'TopicPolicy', {
      topics: [PasswordPolicyTopic],
    });

    PasswordPolicyTopicPolicy.document.addStatements(new iam.PolicyStatement({
      sid: "allow-publish-from-organization-accounts",
      effect: iam.Effect.ALLOW,
      actions: ["sns:Publish"],
      principals: [new iam.AnyPrincipal()],
      resources: [PasswordPolicyTopic.topicArn],
      conditions: {
        'StringEquals': {
          'aws:PrincipalOrgID': [props.OrganizationID],
        },
      }
    }));

    const Lambdaarn = lambda.Function.fromFunctionArn(this, 'lambdaarn', cdk.Fn.importValue('PolicyProviderFunction'+ props.Environment))

    PasswordPolicyTopic.addSubscription(new subscriptions.LambdaSubscription(Lambdaarn));


  }
}
