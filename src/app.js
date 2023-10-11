var start = true;
window.eruptSiteConfig = {
    domain: "",
    fileDomain: "",
    title: "全塑智联MES",
    desc: "",
    dialogLogin: false,
    copyright: true, //是否保留显示版权信息
    logoPath: '/assets/logo.png',
    loginLogoPath: '/assets/logo.png',
    logoText: "全塑智联MES",
    registerPage: null,
    amapKey: '',
    amapSecurityJsCode: "",
    r_tools: [
        // {
        //     text: "qq",
        //     mobileHidden: true,
        //     icon: "fa-qq",
        //     click: function (event) {
        //         window.open("https://jq.qq.com/?_wv=1027&k=MCd4plZ0")
        //     }
        // },
    ],
    login: function (e) {

    },
    upload: function (eruptName, eruptFieldName) {
        return {
            url: "",
            headers: {}
        }
    }
};
