const config = {


    ResourceNamePrefix: "prodstack",
    Environment: "prod",
    OrganizationID: "o-fff51j7kev",
    TargetOU: "ou-8808-hmt4octi",
    
    
    minimumPasswordLength: 14,
    requireSymbols: true,
    requireNumbers: true,
    requireUppercaseCharacters: true,
    requireLowercaseCharacters: true,
    allowUsersToChangePassword: false,
    maxPasswordAge: 90,
    passwordReusePrevention: 1,
    hardExpiry: false,

};

export {
    config,
};