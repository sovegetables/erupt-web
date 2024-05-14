import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {BuildConfig} from "../../model/build-config";
import {EditType, Scene, SelectMode} from "../../model/erupt.enum";
import {UiBuildService} from "../../service/ui-build.service";
import {I18NService} from "@core";
import {STChange, STColumn, STComponent} from "@delon/abc/st";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import { deepCopy } from "@delon/util";
import { ReferenceTableComponent } from "../reference-table/reference-table.component";

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

    constructor(private dataService: DataService,
                private uiBuildService: UiBuildService,
                private dataHandlerService: DataHandlerService,
                private i18n: I18NService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    @Input() set tabEruptTableData(data: any) {
        console.log("-eruptBuildModel-", this.eruptBuildModel)
        console.log("-eruptBuildModel tabErupt eruptBuildModel -", this.tabErupt.eruptBuildModel)
        console.log("-eruptBuildModel tabErupt eruptFieldModel -", this.tabErupt.eruptFieldModel)
        let values = data
        console.log("-tabEruptTableData-values-", values)
        let items = []
        for (let i = 0; i < values.length; i++) {
            let value = values[i]
            this.convertToLineItem(value, items);
        }
        this.data = items
        console.log("-tabEruptTableData-items-", items)
        if(this.eruptBuildModel){
            let map = this.eruptBuildModel.eruptModel.eruptFieldModelMap
            console.log("-tabEruptTableData-map-", map)
            let fieldName = this.tabErupt.eruptFieldModel.fieldName
            console.log("-tabEruptTableData-fieldName-", fieldName)
            let fieldModel =  map.get(fieldName) as EruptFieldModel
            console.log("-tabEruptTableData-fieldModel-", fieldModel)
            if(fieldModel){
                console.log('$value:', fieldModel.eruptFieldJson.edit.$value)
                fieldModel.eruptFieldJson.edit.$tempValue = this.data
            }
        }
    }

    private convertToLineItem(value: any, items: any[], indexNo: number = -1) {
        const child = {}
        const tableColumns = this.tabErupt.eruptBuildModel.eruptModel.tableColumns;
        console.log('tableColumns', tableColumns)
        for (let j = 0; j < tableColumns.length; j++) {
            var no: number;
            if(indexNo == -1){
                no = items.length + 1;
            }else{
                no = indexNo
            }
            const tableColumn = tableColumns[j];
            const key = tableColumn.column;
            const view = tableColumn;
            let v = value[key];
            let eruptFieldModel = deepCopy(view.eruptFieldModel);
            // let eruptFieldModel = view.eruptFieldModel;
            let eruptFieldJson = eruptFieldModel.eruptFieldJson;
            let type = eruptFieldJson.edit.type;
            if (type == EditType.DATE) {
                v = v ? v.substr(0, 10) : null;
                eruptFieldJson.edit.$value = v
                eruptFieldJson.edit.$viewValue = v
            } else if (type == EditType.REFERENCE_TABLE) {
                const label = eruptFieldJson.edit.referenceTableType.label;
                const fieldName = eruptFieldModel.fieldName;
                let real_key = fieldName + '_' + label;
                if (real_key != key) {
                    eruptFieldJson.edit.readOnly.edit = true
                    eruptFieldJson.edit.readOnly.add = true
                }
                if(value[fieldName]){
                    eruptFieldJson.edit.$value = value[fieldName][eruptFieldModel.primaryKeyCol]
                }
                eruptFieldJson.edit.$viewValue = v? v : value[real_key]
            } else if(type == EditType.SERIAL_NUMBER){
                v = no
                eruptFieldJson.edit.$value = v
                eruptFieldJson.edit.$viewValue = v
            } else{
                eruptFieldJson.edit.$value = v ? v : null
                eruptFieldJson.edit.$viewValue = v
            }
            eruptFieldModel.serialNumber = no
            child[key] = {
                type: type,
                value: eruptFieldJson.edit.$value,
                eruptFieldModel: eruptFieldModel,
                view: view,
                key: key
            }
        }
        items.push(child)
    }

    onInputChange(index: number, field: EruptFieldModel, event: Event){
        console.log('index:', index)
        console.log('field:', field)
        console.log('event:', event)
        let value = (event.target as HTMLInputElement).value
        let dataItem = this.data[index];
        console.log('dataItem:', dataItem)
        dataItem[field.fieldName].value = value
        dataItem[field.fieldName].eruptFieldModel.eruptFieldJson.edit.$viewValue = value
        console.log('onSelectedOption final data:', this.data)
    }

    onSelectedOption(item: any){
        console.log('onSelectedOption:', item)
        if(item.field.eruptFieldJson.edit.type == EditType.REFERENCE_TABLE){
            let option = item.option;
            item.field.value = option.id
            let tableColumns = this.tabErupt.eruptBuildModel.eruptModel.tableColumns;
            console.log('onSelectedOption tableColumns:', tableColumns)
            console.log('onSelectedOption data:', this.data)
            let columnChanged = false
            let dataIndex = 0
            for (let j = 0; j < tableColumns.length; j++) {
                const tableColumn = tableColumns[j];
                const key = tableColumn.column;
                let eruptFieldModel = tableColumn.eruptFieldModel;
                let recommendBy = eruptFieldModel.eruptFieldJson.edit.recommendBy
                let dependModel = recommendBy.dependModel
                let serialNumber = item.field.serialNumber;
                const index = serialNumber - 1

                if(eruptFieldModel.fieldName == item.field.fieldName
                    && eruptFieldModel.modelName == item.field.modelName
                    && eruptFieldModel.eruptFieldJson.edit.type == EditType.REFERENCE_TABLE
                ){
                    columnChanged = true
                    dataIndex = index
                    let dataItem = this.data[index][key];
                    let subColumnKey = key.substr(key.indexOf('_') + 1, key.length);
                    console.log('subColumnKey:', subColumnKey)
                    let element = option[subColumnKey];
                    dataItem.eruptFieldModel.eruptFieldJson.edit.$viewValue = element
                    if (dataItem.eruptFieldModel.primaryKeyCol){
                        dataItem.eruptFieldModel.eruptFieldJson.edit.$value = option[eruptFieldModel.primaryKeyCol]
                    }
                    dataItem.eruptFieldModel.value = element
                    dataItem.value = element
                    console.log('----------')
                }else if(dependModel == item.field.fieldName){
                    columnChanged = true
                    dataIndex = index
                    let dataItem = this.data[index][key];
                    let element = option[recommendBy.dependField];
                    dataItem.eruptFieldModel.eruptFieldJson.edit.$viewValue = element
                    dataItem.eruptFieldModel.eruptFieldJson.edit.$value = option[recommendBy.dependModelPKey]
                    dataItem.eruptFieldModel.value = element
                    dataItem.value = element
                    console.log('----------')
                }
            }
            if(columnChanged){
                this.st.setRow(dataIndex, this.data[dataIndex])
            }
            console.log('onSelectedOption final data:', this.data)
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
            this.column = viewValue;
        }
        // let tabEdit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
        // if (!tabEdit.$value) {
        //     tabEdit.$value = [];
        //     this.data = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value
        // }else {
        //     this.data = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value
        // }
    }

    addData() {
        let value =  <any>deepCopy(this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$initValue)
        console.log("addData:", value)
        let item = []
        this.convertToLineItem(value, item, this.st._data.length + 1);
        item.forEach(i => {
            this.data.push(i)
        })
        this.st.addRow(item, {index: this.st._data.length + 1} )
        // this.st.reload()
    }

    addDataByRefer() {
        this.modal.create({
            nzStyle: {top: "20px"},
            nzWrapClassName: "modal-xxl",
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: ReferenceTableComponent,
            nzComponentParams: {
                eruptBuild: this.eruptBuildModel,
                eruptField: this.tabErupt.eruptFieldModel,
                mode: SelectMode.checkbox,
                tabRef: true
            },
            nzOkText: this.i18n.fanyi("global.add"),
            nzOnOk: () => {
                let tabEruptModel = this.tabErupt.eruptBuildModel.eruptModel;
                let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
                if (!edit.$tempValue) {
                    this.msg.warning(this.i18n.fanyi("global.select.one"));
                    return false;
                }
                if (!edit.$value) {
                    edit.$value = [];
                }

                for (let v of edit.$tempValue) {
                    for (let key in v) {
                        let eruptFieldModel = tabEruptModel.eruptFieldModelMap.get(key);
                        if (eruptFieldModel) {
                            let ed = eruptFieldModel.eruptFieldJson.edit;
                            switch (ed.type) {
                                case EditType.BOOLEAN:
                                    v[key] = v[key] === ed.boolType.trueText;
                                    break;
                                case EditType.CHOICE:
                                    for (let vl of eruptFieldModel.componentValue) {
                                        if (vl.label == v[key]) {
                                            v[key] = vl.value;
                                            break;
                                        }
                                    }
                                    break;
                            }
                        }
                        if (key.indexOf("_") != -1) {
                            let kk = key.split("_");
                            v[kk[0]] = v[kk[0]] || {};
                            v[kk[0]][kk[1]] = v[key];
                        }
                    }
                }
                edit.$value.push(...edit.$tempValue);
                edit.$value = [...new Set(edit.$value)]; //去重
                return true;
            }
        });
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
