import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel, VL} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum} from "../../model/erupt.enum";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "@core";

@Component({
    selector: 'erupt-choice',
    templateUrl: './choice.component.html',
    styles: []
})
export class ChoiceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() size;

    @Input() eruptParentName: string;

    @Input() vagueSearch: boolean = false;

    @Input() readonly: boolean = false;

    @Input() checkAll: boolean = false;

    isLoading = false;

    choiceEnum = ChoiceEnum;

    choiceVL: VL[] = [];

    constructor(private dataService: DataService, private msg: NzMessageService, private i18n: I18NService) {
    }

    ngOnInit() {
        if (this.vagueSearch) {
            return;
        }
        if (this.eruptField.eruptFieldJson.edit.choiceType.anewFetch) {
            if (this.eruptField.eruptFieldJson.edit.choiceType.type == ChoiceEnum.RADIO) {
                this.load(true);
            }
        }
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        choiceType.onVLChange = (dependValue, oldValue) => {
            if (choiceType.dependField) {
                for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
                    if (eruptFieldModel.fieldName == choiceType.dependField) {
                        this.choiceVL = this.eruptField.componentValue.filter(vl => {
                            return eval(choiceType.dependExpr);
                        })
                        break;
                    }
                }
            }
        }
    }

    load(open) {
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        if (open) {
            if (choiceType.anewFetch) {
                this.isLoading = true;
                this.dataService.findChoiceItem(this.eruptModel.eruptName, this.eruptField.fieldName, this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    this.isLoading = false;
                });
            }
            if (choiceType.dependField) {
                for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
                    if (eruptFieldModel.fieldName == choiceType.dependField) {
                        let dependValue = eruptFieldModel.eruptFieldJson.edit.$value;
                        if (null == dependValue || "" == dependValue) {
                            this.msg.warning(this.i18n.fanyi("global.pre_select") + eruptFieldModel.eruptFieldJson.edit.title)
                            this.choiceVL = [];
                        }
                    }
                }
            }
        }
    }

    changeTagAll($event) {
        for (let vl of this.eruptField.componentValue) {
            vl.$viewValue = $event;
        }
    }

}
