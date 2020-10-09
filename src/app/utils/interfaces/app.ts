export interface App {
    _id?: string;
    type?: string;
    description?: string;
    appCenterStyle?: AppCenterStyle;
    logo?: Logo;
    users?: Array<string>;
    groups?: Array<string>;
    selected?: boolean;
    headers?: Array<Header>;
    serviceVersionValidity?: {
        validityValue?: any;
        validityType?: string
    };
    workflowConfig?: {
        user: boolean,
        bot: boolean,
        group: boolean
    };
    agentIPWhitelisting?: {
        list?: Array<string>;
        enabled?: boolean;
    };
}

export interface AppCenterStyle {
    theme?: string;
    bannerColor?: boolean;
    primaryColor?: string;
    textColor?: string;
}

export interface Logo {
    full?: string;
    thumbnail?: string;
}

export interface Header {
    key?: string;
    value?: string;
    header?: string;
}
