export class WindowModel {

    private static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] ? WindowModel.config["domain"] + "/" : '';

    public static fileDomain: string = WindowModel.config["fileDomain"] || undefined;

    public static r_tools: CustomerTool[] = WindowModel.config["r_tools"] || [];

    public static amapKey: string = WindowModel.config["amapKey"];

    public static amapSecurityJsCode: string = WindowModel.config["amapSecurityJsCode"];

    public static title: string = WindowModel.config["title"] || 'Erupt Framework';

    public static desc: string = WindowModel.config["desc"] || undefined;

    public static logoPath: string = WindowModel.config["logoPath"] === '' ? null : (WindowModel.config["logoPath"]);

    public static loginLogoPath: string = WindowModel.config["loginLogoPath"] === '' ? null : (WindowModel.config["loginLogoPath"] || WindowModel.logoPath);

    public static logoText: string = WindowModel.config["logoText"] || "";
    //注册页面地址
    public static registerPage: string = WindowModel.config["registerPage"] || undefined;

    public static dialogLogin: boolean = WindowModel.config["dialogLogin"] || false;

    public static copyright: boolean = WindowModel.config["copyright"] !== false;

    public static login: Function = WindowModel.config["login"] || false;

    public static logout: Function = WindowModel.config["logout"] || false;
}


export interface CustomerTool {

    icon: string;

    text: string;

    mobileHidden: boolean;

    load(): void;

    click(event: Event): void;
}
