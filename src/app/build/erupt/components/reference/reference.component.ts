import {Component, Inject, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {NzSizeLDSType} from "ng-zorro-antd/core/types";
import {TreeSelectComponent} from "../tree-select/tree-select.component";
import {EditType, SelectMode} from "../../model/erupt.enum";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {EruptModel} from "../../model/erupt.model";
import {I18NService} from "@core";
import {TableComponent} from "../../view/table/table.component";

@Component({
    selector: 'erupt-reference',
    templateUrl: './reference.component.html',
    styleUrls: ['./reference.component.less']
})
export class ReferenceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() field: EruptFieldModel

    @Input() size: NzSizeLDSType;

    @Input() readonly: boolean = false;

    @Input() parentEruptName: string

    editType = EditType;

    constructor(@Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService,
                private i18n: I18NService,) {
    }

    ngOnInit(): void {
    }

    createReferenceModal(field: EruptFieldModel) {
        if (field.eruptFieldJson.edit.type == EditType.REFERENCE_TABLE) {
            this.createRefTableModal(field);
        } else if (field.eruptFieldJson.edit.type == EditType.REFERENCE_TREE) {
            this.createRefTreeModal(field);
        }
    }

    createRefTreeModal(field: EruptFieldModel) {
        let depend = field.eruptFieldJson.edit.referenceTreeType.dependField;
        let dependVal = null;
        if (depend) {
            const dependField: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(depend);
            if (dependField.eruptFieldJson.edit.$value) {
                dependVal = dependField.eruptFieldJson.edit.$value;
            } else {
                this.msg.warning("请先选择" + dependField.eruptFieldJson.edit.title);
                return;
            }
        }
        this.modal.create({
            nzWrapClassName: "modal-xs",
            nzKeyboard: true,
            nzStyle: {top: "5vh"},
            nzTitle: field.eruptFieldJson.edit.title + (field.eruptFieldJson.edit.$viewValue ? "【" + field.eruptFieldJson.edit.$viewValue + "】" : ""),
            nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
            nzContent: TreeSelectComponent,
            nzComponentParams: {
                parentEruptName: this.parentEruptName,
                eruptModel: this.eruptModel,
                eruptField: field,
                dependVal: dependVal
            }, nzOnOk: () => {
                const tempVal = field.eruptFieldJson.edit.$tempValue;
                if (!tempVal) {
                    this.msg.warning("请选中一条数据");
                    return false;
                }
                if (tempVal.id != field.eruptFieldJson.edit.$value) {
                    this.clearReferValue(field);
                }
                field.eruptFieldJson.edit.$viewValue = tempVal.label;
                field.eruptFieldJson.edit.$value = tempVal.id;
                field.eruptFieldJson.edit.$tempValue = null;
                return true;
            }
        });
    }

    createRefTableModal(field: EruptFieldModel) {
        let edit = field.eruptFieldJson.edit;
        let dependVal: string;
        if (edit.referenceTableType.dependField) {
            const dependField: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(edit.referenceTableType.dependField);
            if (dependField.eruptFieldJson.edit.$value) {
                dependVal = dependField.eruptFieldJson.edit.$value;
            } else {
                this.msg.warning(this.i18n.fanyi("global.pre_select") + dependField.eruptFieldJson.edit.title);
                return;
            }
        }
        // @ts-ignore
        this.modal.create({
            nzWrapClassName: "modal-xxl",
            nzKeyboard: true,
            nzStyle: {top: "5vh"},
            nzBodyStyle: {padding: "16px"},
            nzTitle: edit.title + (field.eruptFieldJson.edit.$viewValue ? "【" + field.eruptFieldJson.edit.$viewValue + "】" : ""),
            nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
            nzContent: TableComponent,
            nzComponentParams: {
                referenceTable: {
                    eruptBuild: {
                        eruptModel: this.eruptModel
                    },
                    eruptField: field,
                    mode: SelectMode.radio,
                    dependVal: dependVal,
                    parentEruptName: this.parentEruptName,
                    tabRef: false
                }
            }, nzOnOk: () => {
                let radioValue = edit.$tempValue;
                if (!radioValue) {
                    this.msg.warning("请选中一条数据");
                    return false;
                }
                if (radioValue[edit.referenceTableType.id] != field.eruptFieldJson.edit.$value) {
                    this.clearReferValue(field);
                }
                edit.$value = radioValue[edit.referenceTableType.id];
                edit.$viewValue = radioValue[edit.referenceTableType.label
                    .replace(".", "_")] || '-----';
                edit.$tempValue = radioValue;
                return true;
            }
        });
    }

    clearReferValue(field: EruptFieldModel) {
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$viewValue = null;
        field.eruptFieldJson.edit.$tempValue = null;
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            let edit = eruptFieldModel.eruptFieldJson.edit;
            if (edit.type == EditType.REFERENCE_TREE) {
                if (edit.referenceTreeType.dependField == field.fieldName) {
                    this.clearReferValue(eruptFieldModel);
                }
            }
            if (edit.type == EditType.REFERENCE_TABLE) {
                if (edit.referenceTableType.dependField == field.fieldName) {
                    this.clearReferValue(eruptFieldModel);
                }
            }
        }
    }

}
