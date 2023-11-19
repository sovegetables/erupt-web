import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {BuildConfig} from "../../model/build-config";
import {EditType, Scene} from "../../model/erupt.enum";
import {UiBuildService} from "../../service/ui-build.service";
import {I18NService} from "@core";
import {STChange, STColumn, STComponent} from "@delon/abc/st";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
    selector: "tab-table",
    templateUrl: "./tab-table.component.html",
    styles: [],
    styleUrls: ["./tab-table.component.less"]
})
export class TabTableComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() tabErupt: {
        eruptBuildModel: EruptBuildModel;
        eruptFieldModel: EruptFieldModel;
    };

    @Input() mode: "refer-add" | "add" = "add";

    @ViewChild("st", {static: false}) st: STComponent;

    @Input() onlyRead: boolean = false;

    clientWidth = document.body.clientWidth;

    column: STColumn[];

    checkedRow = [];

    stConfig = new BuildConfig().stConfig;

    loading = true;

    editType = EditType;

    data = [];

    tabInitData = []

    constructor(private dataService: DataService,
                private uiBuildService: UiBuildService,
                private dataHandlerService: DataHandlerService,
                private i18n: I18NService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    @Input() set tabEruptTableData(data: any) {
        let values = data
        this.tabInitData = data
        console.log("-tabEruptTableData-values-", values)
        let items = []
        for (let i = 0; i < values.length; i++) {
            let value = values[i]
            this.convertToLineItem(value, items);
        }
        this.data = items
        console.log("-tabEruptTableData-items-", items)
    }

    private convertToLineItem(value: any, items: any[]) {
        const child = {}
        for (let j = 0; j < this.tabErupt.eruptBuildModel.eruptModel.tableColumns.length; j++) {
            let no = items.length + 1;
            const tableColumn = this.tabErupt.eruptBuildModel.eruptModel.tableColumns[j];
            const key = tableColumn.column;
            const view = tableColumn;
            let v = value[key];
            let eruptFieldModel = view.eruptFieldModel;
            let eruptFieldJson = eruptFieldModel.eruptFieldJson;
            let type = eruptFieldJson.edit.type;
            if (type == EditType.DATE) {
                v = v ? v.substr(0, 10) : null;
            } else if (type == EditType.REFERENCE_TABLE) {
                const label = eruptFieldJson.edit.referenceTableType.label;
                const fieldName = eruptFieldModel.fieldName;
                let real_key = fieldName + '_' + label;
                if (real_key != key) {
                    eruptFieldJson.edit.readOnly.edit = true
                    eruptFieldJson.edit.readOnly.add = true
                }
            } else if(type == EditType.SERIAL_NUMBER){
                v = no
            }
            let itemValue = v ? v : null;
            eruptFieldJson.edit.$value = itemValue
            eruptFieldModel.serialNumber = no
            child[key] = {
                type: type,
                value: itemValue,
                eruptFieldModel: eruptFieldModel,
                view: view,
                key: key
            }
        }
        items.push(child)
    }

    onSelectedOption(item: any){
        console.log('onSelectedOption:', item)
        if(item.field.eruptFieldJson.edit.type == EditType.REFERENCE_TABLE){
            let option = item.option;
            item.field.value = option.id
            let tableColumns = this.tabErupt.eruptBuildModel.eruptModel.tableColumns;
            let columnChanged = false
            let dataIndex = 0
            for (let j = 0; j < tableColumns.length; j++) {
                const tableColumn = tableColumns[j];
                const key = tableColumn.column;
                let subColumnKey = key.substr(key.indexOf('_') + 1, key.length);
                let eruptFieldModel = tableColumn.eruptFieldModel;
                if(eruptFieldModel.fieldName == item.field.fieldName
                    && eruptFieldModel.modelName == item.field.modelName
                    && eruptFieldModel.eruptFieldJson.edit.type == EditType.REFERENCE_TABLE
                ){
                    columnChanged = true
                    let serialNumber = item.field.serialNumber;
                    const index = serialNumber - 1
                    dataIndex = index
                    let datum = this.data[index][key];
                    let element = option[subColumnKey];
                    datum.eruptFieldModel.eruptFieldJson.edit.$viewValue = element
                    if (datum.eruptFieldModel.primaryKeyCol){
                        datum.eruptFieldModel.eruptFieldJson.edit.$value = option[eruptFieldModel.primaryKeyCol]
                    }
                    datum.eruptFieldModel.value = element
                    console.log('----------')
                }
            }
            if(columnChanged){
                this.st.setRow(dataIndex, this.data[dataIndex])
            }
            console.log('onSelectedOption:',this.data)
        }
    }

    isReadonly(eruptFieldModel: EruptFieldModel) {
        let ro = eruptFieldModel.eruptFieldJson.edit.readOnly;
        if (this.mode === Scene.ADD) {
            return ro.add;
        } else {
            return ro.edit;
        }
    }

    ngOnInit() {
        this.stConfig.stPage.front = true;
        if(this.mode === Scene.ADD){
            this.stConfig.stPage.show = false
        }
        setTimeout(() => {
            this.loading = false;
        }, 300);
        if (this.onlyRead) {
            this.column = this.uiBuildService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel, false, true, null, null, true);
        } else {
            const viewValue: STColumn[] = [];
            viewValue.push({
                title: "",
                type: "checkbox",
                width: "50px",
                fixed: "left",
                className: "text-center",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
            viewValue.push(...this.uiBuildService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel, false, true, null, null, true));
            // let operators: STColumnButton[] = [];
            // if (this.mode == "add") {
            //     operators.push({
            //         icon: "edit",
            //         click: (record: any, modal: any, comp: STComponent) => {
            //             this.dataHandlerService.objectToEruptValue(record, this.tabErupt.eruptBuildModel);
            //             this.modal.create({
            //                 nzWrapClassName: "modal-lg",
            //                 nzStyle: {top: "20px"},
            //                 nzMaskClosable: false,
            //                 nzKeyboard: false,
            //                 nzTitle: this.i18n.fanyi("global.editor"),
            //                 nzContent: EditTypeComponent,
            //                 nzComponentParams: {
            //                     col: colRules[3],
            //                     eruptBuildModel: this.tabErupt.eruptBuildModel,
            //                     parentEruptName: this.eruptBuildModel.eruptModel.eruptName
            //                 },
            //                 nzOnOk: async () => {
            //                     let obj = this.dataHandlerService.eruptValueToObject(this.tabErupt.eruptBuildModel);
            //                     let result = await this.dataService.eruptTabUpdate(this.eruptBuildModel.eruptModel.eruptName, this.tabErupt.eruptFieldModel.fieldName, obj)
            //                         .toPromise().then(resp => resp);
            //                     if (result.status == Status.SUCCESS) {
            //                         obj = result.data;
            //                         this.objToLine(obj);
            //                         let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
            //                         $value.forEach((val, index) => {
            //                             let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
            //                             if (record[tabPrimaryKeyCol] == val[tabPrimaryKeyCol]) {
            //                                 $value[index] = obj;
            //                             }
            //                         });
            //                         this.st.reload();
            //                         return true;
            //                     } else {
            //                         return false;
            //                     }
            //                 }
            //             });
            //         }
            //     });
            // }
            // operators.push({
            //     icon: {
            //         type: "delete",
            //         theme: "twotone",
            //         twoToneColor: "#f00"
            //     },
            //     type: "del",
            //     click: (record, modal, comp: STComponent) => {
            //         let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
            //         for (let i in <any[]>$value) {
            //             let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
            //             if (record[tabPrimaryKeyCol] == $value[i][tabPrimaryKeyCol]) {
            //                 $value.splice(i, 1);
            //                 break;
            //             }
            //         }
            //         this.st.reload();
            //     }
            // });
            // viewValue.push({
            //     title: this.i18n.fanyi("table.operation"),
            //     fixed: "right",
            //     width: "80px",
            //     className: "text-center",
            //     buttons: operators
            // });
            this.column = viewValue;
        }
        // tabErupt.eruptFieldModel.eruptFieldJson.edit.$value
        // let tabEdit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
        // if (!tabEdit.$value) {
        //     tabEdit.$value = [];
        //     this.data = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value
        // }else {
        //     this.data = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value
        // }
    }

    addData() {
        const length = this.tabInitData.length;
        if(length > 0){
            let value =  this.tabInitData[0]
            this.convertToLineItem(value, this.data);
            // this.st.addRow() todo
            this.st.reload()
        }
    }

    addDataByRefer() {
        // this.modal.create({
        //     nzStyle: {top: "20px"},
        //     nzWrapClassName: "modal-xxl",
        //     nzMaskClosable: false,
        //     nzKeyboard: false,
        //     nzTitle: this.i18n.fanyi("global.new"),
        //     nzContent: ReferenceTableComponent,
        //     nzComponentParams: {
        //         eruptBuild: this.eruptBuildModel,
        //         eruptField: this.tabErupt.eruptFieldModel,
        //         mode: SelectMode.checkbox,
        //         tabRef: true
        //     },
        //     nzOkText: this.i18n.fanyi("global.add"),
        //     nzOnOk: () => {
        //         let tabEruptModel = this.tabErupt.eruptBuildModel.eruptModel;
        //         let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
        //         if (!edit.$tempValue) {
        //             this.msg.warning(this.i18n.fanyi("global.select.one"));
        //             return false;
        //         }
        //         if (!edit.$value) {
        //             edit.$value = [];
        //         }
        //
        //         for (let v of edit.$tempValue) {
        //             for (let key in v) {
        //                 let eruptFieldModel = tabEruptModel.eruptFieldModelMap.get(key);
        //                 if (eruptFieldModel) {
        //                     let ed = eruptFieldModel.eruptFieldJson.edit;
        //                     switch (ed.type) {
        //                         case EditType.BOOLEAN:
        //                             v[key] = v[key] === ed.boolType.trueText;
        //                             break;
        //                         case EditType.CHOICE:
        //                             for (let vl of eruptFieldModel.componentValue) {
        //                                 if (vl.label == v[key]) {
        //                                     v[key] = vl.value;
        //                                     break;
        //                                 }
        //                             }
        //                             break;
        //                     }
        //                 }
        //                 if (key.indexOf("_") != -1) {
        //                     let kk = key.split("_");
        //                     v[kk[0]] = v[kk[0]] || {};
        //                     v[kk[0]][kk[1]] = v[key];
        //                 }
        //             }
        //         }
        //         edit.$value.push(...edit.$tempValue);
        //         edit.$value = [...new Set(edit.$value)]; //去重
        //         return true;
        //     }
        // });
    }

    objToLine(obj: any) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                for (let ii in <any>obj[key]) {
                    obj[key + "_" + ii] = obj[key][ii];
                }
            }
        }
    }

    stChange(event: STChange) {
        if (event.type === "checkbox") {
            this.checkedRow = event.checkbox;
        }
    }

    resetSerialNumber(){
        let values = this.data;
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            Object.entries(value).forEach(([k, v]) => {
                let item = value[k];
                let edit = item.eruptFieldModel.eruptFieldJson.edit;
                const type = edit.type;
                if(type == EditType.SERIAL_NUMBER){
                    item.value = i + 1
                    return
                }
            });
        }
        // this.st.removeRow() todo
        this.st.reload()
    }

    deleteData() {
        if (this.checkedRow.length) {
            let values = this.data;
            for (let i = 0; i < values.length; i++) {
                let value = values[i];
                let serialNumberValue = null
                let serialNumberValueKey = null
                Object.entries(value).forEach(([k, v]) => {
                    let item = value[k];
                    let edit = item.eruptFieldModel.eruptFieldJson.edit;
                    const type = edit.type;
                    if(type == EditType.SERIAL_NUMBER){
                        serialNumberValue = item.value
                        serialNumberValueKey = k
                        return
                    }
                });
                if(serialNumberValue != null){
                    let canSplice = false
                    this.checkedRow.forEach((cr) => {
                        if(cr[serialNumberValueKey].value == serialNumberValue){
                            values.splice(i, 1);
                            canSplice = true
                        }
                    });
                    if(canSplice) this.resetSerialNumber()
                }
            }
            this.st.reload();
            this.checkedRow = [];
        } else {
            this.msg.warning(this.i18n.fanyi("global.delete.hint.check"));
        }
    }
}
