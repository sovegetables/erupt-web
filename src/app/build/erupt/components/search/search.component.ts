import {Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum, DateEnum, EditType} from "../../model/erupt.enum";
import {colRules} from "@shared/model/util.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {ChoiceComponent} from "../choice/choice.component";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {QueryCondition} from "../../model/erupt.vo";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'erupt-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.less']
})
export class SearchComponent implements OnInit {

    @Input() searchEruptModel: EruptModel;

    @Output() search = new EventEmitter();

    @Input() size: "large" | "small" | "default" = "large";
    
    @ViewChildren('choice') choices: QueryList<ChoiceComponent>;

    editType = EditType;

    col = colRules[4];

    choiceEnum = ChoiceEnum;

    dateEnum = DateEnum;

    constructor(private dataHandlerService: DataHandlerService, private dataService: DataService) {
    }

    // ngDoCheck(): void {
    //     if (this.choices && this.choices.length > 0) {
    //         for (let choice of this.choices) {
    //             this.dataHandlerService.eruptFieldModelChangeHook(this.searchEruptModel, choice.eruptField, (value) => {
    //                 for (let choice of this.choices) {
    //                     choice.dependChange(value);
    //                 }
    //             });
    //         }
    //     }
    // }

    ngOnInit(): void {
        // this.autoCompleteOptions.push({value: "test", id: '1'})
    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }

    autoCompleteOptions: Array<{value: string, id: string}> = [];

    onSelectionChange(field: EruptFieldModel, event: any){
    }

    onChange(e: string, field: EruptFieldModel) {
        const conditions: QueryCondition[] = [];
        let body = {
            condition: conditions
        };
        let label = field.fieldName;
        conditions.push({key: label, value: e})
        this.dataService.queryEruptTableData(field.modelName,
            {pageIndex: 1, pageSize: 10}, body).subscribe(data => {
            this.autoCompleteOptions = []
            data.list.forEach(i => {
                this.autoCompleteOptions.push({value: i[label], id:i["id"]})
            })
        })
    }

    onSearch() {
        this.search.emit();
    }
}
