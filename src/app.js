var start = true;
window.eruptSiteConfig = {
    domain: "",
    fileDomain: "",
    title: "数据同步系统",
    desc: "",
    dialogLogin: false,
    copyright: false, //是否保留显示版权信息
    logoPath: '/assets/logo.png',
    loginLogoPath: '/assets/logo.png',
    logoText: "数据同步",
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
    upload: function (files) {
        return {
            url: "",
            headers: {}
        }
    }
};

window.eruptRouterEvent = {
    login: {
        load() {
            console.log("in login page");
        },
        unload() {
            console.log("out login page");
        }
    },
    $: {
        load(e) {
            // console.log('load', e)
        },
        unload(e) {
            // console.log("unload ", e)
        }
    },
    EruptDict: {
        load(e) {
            console.log(e)
        },
        unload(e) {
            console.log("unload ", e)
        }
    }
}

let eruptEvent = {
    login() {

    },
    logout() {

    },
    upload() {

    }
}
