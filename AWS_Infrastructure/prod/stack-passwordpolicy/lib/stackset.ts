import * as cdk from 'aws-cdk-lib';
import { Resource, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudformation from 'aws-cdk-lib/aws-cloudformation';
import { AccountPasswordPolicyResourceStack, PasswordPolicyProps } from './account-pwd-policy-resource';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3 from 'aws-cdk-lib/aws-s3';


var path = require('path');

export interface StacksetProps extends StackProps {
  ResourceNamePrefix: string;
  Environment: string;
  TargetOU: string;
  OrganizationID: string;
  PasswordPolicyProps: PasswordPolicyProps;
}

export class PasswordPolicyStack extends cdk.Stack {
  declare stackBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StacksetProps) {
    super(scope, id, props);


    const app = new cdk.App({ 'outdir': 'resource.out' });

    props.PasswordPolicyProps.ResourceNamePrefix = props.ResourceNamePrefix
    props.PasswordPolicyProps.Environment = props.Environment
    //synthesize the password policy resource stack
    const accountPasswordPolicyResourceStack = new AccountPasswordPolicyResourceStack(app, 'AccountPasswordPolicyResourceStack', props.PasswordPolicyProps)

    const outfilePath = app.synth().getStackByName('AccountPasswordPolicyResourceStack').templateFullPath;

    //get the s3 bucket
    this.stackBucket = new s3.Bucket(this, 'PasswordPolicyResourceStackBucket', {
      enforceSSL: true,
      versioned: true
    });

    //Deploy the stack to S3 bucket
    const deployment = new s3deploy.BucketDeployment(this, 'PasswordPolicyResourceStackBucketDeploy', {
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      sources: [s3deploy.Source.asset(path.join('resource.out'))],
      destinationBucket: this.stackBucket,
    });

    //Store the s3 bucket details
    // new cdk.CfnOutput(this, "PasswordPolicyResourceStackBucketOutput", {
    //   value: deployment.deployedBucket.urlForObject('PasswordPolicyResourceStackBucket'),
    //   exportName: "s3bucketurl",
    // });

    //Stackset creation
    const cfnStackSet = new cloudformation.CfnStackSet(this, 'MyCfnStackSet', {
      permissionModel: 'SERVICE_MANAGED',
      stackSetName: props.ResourceNamePrefix,
      autoDeployment: {
        enabled: true,
        retainStacksOnAccountRemoval: false,
      },
      description: 'description',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      stackInstancesGroup: [{
        deploymentTargets: {
          organizationalUnitIds: [props.TargetOU],
        },
        regions: [cdk.Fn.sub('${AWS::Region}')],
      }],



      templateUrl: deployment.deployedBucket.urlForObject('AccountPasswordPolicyResourceStack.template.json')
    });


  }
}