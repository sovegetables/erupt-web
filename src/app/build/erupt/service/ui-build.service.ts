import {EruptBuildModel} from "../model/erupt-build.model";
import {DateEnum, EditType, FormSize, Scene, ViewType} from "../model/erupt.enum";
import {ViewTypeComponent} from "../components/view-type/view-type.component";
import {MarkdownComponent} from "../components/markdown/markdown.component";
import {CodeEditorComponent} from "../components/code-editor/code-editor.component";
import {DataService} from "@shared/service/data.service";
import {Inject, Injectable} from "@angular/core";
import {I18NService} from "@core";
import {STColumn, STData} from "@delon/abc/st";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzImageService} from "ng-zorro-antd/image";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {EditComponent} from "../view/edit/edit.component";
import {Status} from "../model/erupt-api.model";
import {DataHandlerService} from "./data-handler.service";
import {ModalButtonOptions} from "ng-zorro-antd/modal/modal-types";
import {Drill} from "../model/erupt.model";
import {TableComponent, TableRefreshing} from "../view/table/table.component";


@Injectable()
export class UiBuildService {

    constructor(
        private imageService: NzImageService,
        private i18n: I18NService,
        private dataService: DataService,
        @Inject(NzModalService) private modal: NzModalService,
        @Inject(NzMessageService) private msg: NzMessageService) {
    }


    /**
     * 将view数据转换为alain table组件配置信息
     * @param eruptBuildModel ebm
     * @param lineData
     *     true   数据形式为一整行txt
     *     false  数据形式为：带有层级的json
     * @param dataConvert 是否需要数据转换,如bool转换，choice转换
     * @param dataHandler
     * @param refreshing
     * @param lineEdit 是否是行编辑
     */
    viewToAlainTableConfig(eruptBuildModel: EruptBuildModel, lineData: boolean, dataConvert?: boolean,
                           dataHandler?: DataHandlerService, refreshing?: TableRefreshing,
                           lineEdit: boolean = false): STColumn[] {
        let cols: STColumn[] = [];
        const views = eruptBuildModel.eruptModel.tableColumns;
        let layout = eruptBuildModel.eruptModel.eruptJson.layout;
        let i = 0;
        for (let view of views) {
            let titleWidth = view.title.length * 16 + 30;
            if (titleWidth > 280) {
                titleWidth = 280;
            }
            if (titleWidth < 100) {
                titleWidth = 100;
            }
            if (view.sortable) {
                titleWidth += 20;
            }
            if (view.desc) {
                titleWidth += 18;
            }
            let edit = view.eruptFieldModel.eruptFieldJson.edit;
            let obj: STColumn = {
                title: {
                    text: view.title,
                    // optional: "",
                    optionalHelp: view.desc
                }
            };
            obj["show"] = view.show;
            if (lineData) {
                //修复表格显示子类属性时无法正确检索到属性值的缺陷
                obj.index = view.column.replace(/\./g, "_");
            } else {
                obj.index = view.column;
            }
            if(lineEdit){
                //行编辑
                obj["render"] = 'lineInputRow'
            }
            if(!view.show){
                continue
            }
            if (view.sortable) {
                obj.sort = {
                    reName: {
                        ascend: "asc",
                        descend: "desc"
                    },
                    key: view.column,
                    compare: ((a: STData, b: STData) => {
                        return a[view.column] > b[view.column] ? 1 : -1;
                    })
                };
            }
            if (dataConvert) {
                switch (view.eruptFieldModel.eruptFieldJson.edit.type) {
                    case EditType.CHOICE:
                        obj.format = (item: any) => {
                            console.log('view.column:', view.column)
                            console.log('item view.column:', item[view.column])
                            console.log('choiceMap view.column:', view.eruptFieldModel.choiceMap)
                            if (item[view.column]) {
                                let label
                                try{
                                    label = view.eruptFieldModel.choiceMap.get(item[view.column] + "").label;
                                }catch(e){
                                    console.log(e)
                                    let value = item[view.column].eruptFieldModel.eruptFieldJson.edit.$value
                                    label = item[view.column].eruptFieldModel.choiceMap.get(value + "").label;
                                }
                                return label;
                            } else {
                                return "";
                            }
                        };
                        break;
                }
            }

            switch (view.eruptFieldModel.eruptFieldJson.edit.type) {
                case EditType.TAGS:
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        let value = item[view.column];
                        if (value) {
                            let result = "";
                            for (let ele of value.split(view.eruptFieldModel.eruptFieldJson.edit.tagsType.joinSeparator)) {
                                result += "<span class='e-tag'>" + ele + "</span>";
                            }
                            return result;
                        } else {
                            return value;
                        }
                    };
                    break;
            }

            obj.width = titleWidth;
            //展示类型
            switch (view.viewType) {
                case ViewType.SERIAL_NUMBER:
                    obj.className = "text-col";
                    obj.width = 60;
                    break;
                case ViewType.TEXT:
                    obj.className = "text-col";
                    obj.width = titleWidth + 20;
                    break;
                case ViewType.NUMBER:
                    obj.className = "text-right";
                    obj.width = view.title.length;
                    break;
                case ViewType.DATE:
                    obj.className = "date-col";
                    obj.width = 110;
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            if (view.eruptFieldModel.eruptFieldJson.edit.dateType.type == DateEnum.DATE) {
                                if(lineEdit){
                                    let value = item[view.column].value;
                                    return value?value.substr(0, 10):null;
                                }else {
                                    return item[view.column].substr(0, 10);
                                }
                            } else {
                                return item[view.column];
                            }
                        } else {
                            return "";
                        }
                    };
                    break;
                case ViewType.DATE_TIME:
                    obj.className = "date-col";
                    obj.width = 180;
                    break;
                case ViewType.BOOLEAN:
                    obj.className = "text-center";
                    obj.width += 15;
                    obj.type = "tag";
                    if (dataConvert) {
                        obj.tag = {
                            true: {text: edit.boolType.trueText, color: 'green'},
                            false: {text: edit.boolType.falseText, color: 'red'},
                        };
                    } else {
                        if (edit.title) {
                            if (edit.boolType) {
                                obj.tag = {
                                    [edit.boolType.trueText]: {
                                        text: edit.boolType.trueText,
                                        color: 'green'
                                    },
                                    [edit.boolType.falseText]: {
                                        text: edit.boolType.falseText,
                                        color: 'red'
                                    },
                                };
                            }
                        } else {
                            obj.tag = {
                                true: {text: this.i18n.fanyi('是'), color: 'green'},
                                false: {text: this.i18n.fanyi('否'), color: 'red'},
                            };
                        }
                    }
                    break;
                case ViewType.LINK:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.click = (item) => {
                        window.open(item[view.column]);
                    };
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-link' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    break;
                case ViewType.LINK_DIALOG:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-dot-circle-o' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "20px"},
                            nzMaskClosable: false,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.QR_CODE:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-qrcode' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-sm",
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.MARKDOWN:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-file-text' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "24px"},
                            nzBodyStyle: {padding: "0"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: MarkdownComponent,
                            nzComponentParams: {
                                value: item[view.column]
                            }
                        });
                    };
                    break;
                case ViewType.CODE:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-code' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        let codeEditType = view.eruptFieldModel.eruptFieldJson.edit.codeEditType;
                        // @ts-ignore
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzBodyStyle: {padding: "0"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: CodeEditorComponent,
                            nzComponentParams: {
                                height: 500,
                                readonly: true,
                                language: codeEditType ? codeEditType.language : 'text',
                                // @ts-ignore
                                edit: {
                                    $value: item[view.column]
                                }
                            }
                        });
                    };
                    break;
                case ViewType.MAP:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-map' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzBodyStyle: {
                                padding: "0"
                            },
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.IMAGE:
                    obj.type = "link";
                    obj.className = "text-center p-mini";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            const attachmentType = view.eruptFieldModel.eruptFieldJson.edit.attachmentType;
                            let img;
                            if (attachmentType) {
                                img = (<string>item[view.column]).split(attachmentType.fileSeparator)[0];
                            } else {
                                img = (<string>item[view.column]).split("|")[0];
                            }
                            let imgs;
                            if (attachmentType) {
                                imgs = (<string>item[view.column]).split(attachmentType.fileSeparator);
                            } else {
                                imgs = (<string>item[view.column]).split("|");
                            }
                            let imgElements = [];
                            for (let i in imgs) {
                                imgElements[i] = `<img width="100%" class="e-table-img" src="${DataService.previewAttachment(imgs[i])}" alt=""/>`;
                            }
                            return `<div style="text-align: center;display:flex;justify-content: center;">
                                        ${imgElements.join(" ")}
                                    </div>`;
                        } else {
                            return '';
                        }
                    };
                    obj.click = (item) => {
                        this.imageService.preview(item[view.column].split("|").map(it => {
                            return {
                                src: DataService.previewAttachment(it.trim())
                            }
                        }))
                    };
                    break;
                case ViewType.HTML:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-file-text' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.MOBILE_HTML:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-file-text' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-xs",
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.SWF:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-file-image-o' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "40px"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.IMAGE_BASE64:
                    obj.type = "link";
                    obj.width = "90px";
                    obj.className = "text-center p-sm";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<img width="100%" src="${item[view.column]}" />`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px", textAlign: 'center'},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.ATTACHMENT_DIALOG:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-dot-circle-o' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "30px"},
                            nzKeyboard: true,
                            nzFooter: null,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.DOWNLOAD:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-download' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        window.open(DataService.downloadAttachment(item[view.column]));
                    };
                    break;
                case ViewType.ATTACHMENT:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-window-restore' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        window.open(DataService.previewAttachment(item[view.column]));
                    };
                    break;
                case ViewType.TAB_VIEW:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        return `<i class='fa fa-adjust' aria-hidden='true'></i>`;
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px"},
                            nzMaskClosable: false,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                                eruptBuildModel: eruptBuildModel,
                                view: view
                            }
                        });
                    };
                    break;
                default:
                    obj.width = null;
                    break;
            }
            if (view.template) {
                obj.format = (item: any) => {
                    try {
                        let value = item[view.column];
                        return eval(view.template);
                    } catch (e) {
                        console.error(e);
                        this.msg.error(e.toString());
                    }
                };
            }
            if (view.className) {
                obj.className += " " + view.className;
            }
            if (view.width) {
                obj.width = isNaN(Number(view.width)) ? view.width : view.width + "px";
            }
            if (view.tpl && view.tpl.enable) {
                obj.type = "link"
                obj.click = (item) => {
                    let url = this.dataService.getEruptViewTpl(eruptBuildModel.eruptModel.eruptName,
                        view.eruptFieldModel.fieldName,
                        item[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]);
                    this.modal.create({
                        nzKeyboard: true,
                        nzMaskClosable: false,
                        nzTitle: view.title,
                        nzWidth: view.tpl.width,
                        nzStyle: {top: "20px"},
                        nzWrapClassName: view.tpl.width || "modal-lg",
                        nzBodyStyle: {
                            padding: "0"
                        },
                        nzFooter: null,
                        nzContent: EruptIframeComponent,
                        nzComponentParams: {
                            url: url,
                        }
                    });
                };
            }
            if (layout) {
                if (i < layout.tableLeftFixed) {
                    obj.fixed = 'left';
                }
                if (i >= views.length - layout.tableRightFixed) {
                    obj.fixed = 'right';
                }
            }

            if (null != obj.fixed && null == obj.width) {
                obj.width = titleWidth + 50;
            }
            cols.push(obj);
            if(view.highlight){
                //高亮,可编辑
                obj.type = 'link'
                obj.click = (item) => {
                    let fullLine = false;
                    let layout = eruptBuildModel.eruptModel.eruptJson.layout;
                    if (layout && layout.formSize == FormSize.FULL_LINE) {
                        fullLine = true;
                    }
                    if (eruptBuildModel.eruptModel.eruptJson.power.edit) {
                        this.editItem(eruptBuildModel, fullLine, item, dataHandler, refreshing);
                    }else if(eruptBuildModel.eruptModel.eruptJson.power.viewDetails){
                        this.viewItem(fullLine, eruptBuildModel, item);
                    }
                }
            }
            i++;
        }
        return cols;
    }

    public viewItem(fullLine: boolean, eruptBuildModel: EruptBuildModel, item: any) {
        this.modal.create({
            nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
            nzWidth: fullLine ? 550 : null,
            nzStyle: { top: "60px" },
            nzMaskClosable: true,
            nzKeyboard: true,
            nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
            nzOkText: null,
            nzTitle: this.i18n.fanyi("global.view"),
            nzContent: EditComponent,
            nzComponentParams: {
                readonly: true,
                eruptBuildModel: eruptBuildModel,
                id: item[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                behavior: Scene.EDIT,
            }
        });
    }

    public editItem(eruptBuildModel: EruptBuildModel, fullLine: boolean, item: any, dataHandler: DataHandlerService, refreshing: TableRefreshing) {
        let editButtons: ModalButtonOptions[] = [];
        const that = this;
        let exprEval = (expr, item) => {
            try {
                if (expr) {
                    return eval(expr);
                } else {
                    return true;
                }
            } catch (e) {
                // this.msg.error(e);
                return false;
            }
        };
        //drill
        const eruptJson = eruptBuildModel.eruptModel.eruptJson;
        let createDrillModel = (drill: Drill, id) => {
            this.modal.create({
                nzWrapClassName: "modal-xxl",
                nzStyle: { top: "30px" },
                nzBodyStyle: { padding: "18px" },
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: drill.title,
                nzFooter: null,
                nzContent: TableComponent,
                nzComponentParams: {
                    drill: {
                        code: drill.code,
                        val: id,
                        erupt: drill.link.linkErupt,
                        eruptParent: eruptBuildModel.eruptModel.eruptName
                    }
                }
            });
        };
        for (let i in eruptJson.drills) {
            let drill = eruptJson.drills[i];
            editButtons.push({
                label: drill.title,
                type: 'dashed',
                onClick(options: ModalButtonOptions<any>) {
                    createDrillModel(drill, options['id']);
                }
            });
        }
        let getEditButtons = (record): ModalButtonOptions[] => {
            for (let editButton of editButtons) {
                editButton['id'] = record[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
                editButton['data'] = record;
            }
            return editButtons;
        };
        const model = this.modal.create({
            nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
            nzWidth: fullLine ? 550 : null,
            nzStyle: { top: "60px" },
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.editor"),
            nzOkText: this.i18n.fanyi("global.update"),
            nzContent: EditComponent,
            nzComponentParams: {
                eruptBuildModel: eruptBuildModel,
                id: item[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                behavior: Scene.EDIT,
            },
            nzFooter: [
                {
                    label: this.i18n.fanyi("global.cancel"),
                    onClick: () => {
                        model.close();
                    }
                },
                ...getEditButtons(item),
                {
                    label: this.i18n.fanyi("global.update"),
                    type: "primary",
                    onClick: () => {
                        return model.triggerOk();
                    }
                },
            ],
            nzOnOk: async () => {
                let validateResult = model.getContentComponent().beforeSaveValidate();
                if (validateResult && dataHandler) {
                    console.log('eruptBuildModel:', eruptBuildModel)
                    let obj = dataHandler.eruptValueToObject(eruptBuildModel);
                    let res = await this.dataService.updateEruptData(eruptBuildModel.eruptModel.eruptName, obj).toPromise().then(res => res);
                    if (res.status === Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi("global.update.success"));
                        refreshing?.refresh();
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        });
    }
}
