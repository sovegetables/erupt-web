import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzFormatEmitEvent} from "ng-zorro-antd/core/tree";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EditType, Scene} from "../../model/erupt.enum";
import {deepCopy} from "@delon/util";
import {EditComponent} from "../edit/edit.component";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {EruptBuildModel} from "../../model/erupt-build.model";

@Component({
    selector: 'layout-tree',
    templateUrl: './layout-tree.component.html',
    styles: []
})
export class LayoutTreeComponent implements OnInit {

    constructor(private data: DataService,
                public settingSrv: SettingsService,
                public settingService: SettingsService,
                private i18n: I18NService,
                private modal: NzModalService,
                private msg: NzMessageService,
                private dataHandler: DataHandlerService) {
    }

    @Input() eruptModel: EruptModel;

    @Output() trigger = new EventEmitter();

    searchValue: string;

    treeLoading: boolean;

    list: any;

    eruptTreeModel: EruptBuildModel;

    ngOnInit() {
        this.eruptTreeModel = this.eruptModel.eruptJson.linkTree.model
        this.getTreeList();
    }

    private getTreeList() {
        this.treeLoading = true;
        this.data.queryDependTreeData(this.eruptModel.eruptName).subscribe(data => {
            let eruptFieldModel = this.eruptModel.eruptFieldModelMap.get(this.eruptModel.eruptJson.linkTree.field);
            if (eruptFieldModel && eruptFieldModel.eruptFieldJson.edit && eruptFieldModel.eruptFieldJson.edit.referenceTreeType) {
                this.list = this.dataHandler.dataTreeToZorroTree(data, eruptFieldModel.eruptFieldJson.edit.referenceTreeType.expandLevel);
            } else {
                this.list = this.dataHandler.dataTreeToZorroTree(data, this.eruptModel.eruptJson.tree.expandLevel);
            }
            if (!this.eruptModel.eruptJson.linkTree.dependNode) {
                this.list.unshift({
                    key: undefined,
                    title: this.i18n.fanyi('global.all'),
                    isLeaf: true
                });
            }
            this.treeLoading = false;
        });
    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        if (event.node.origin.key == null) {
            this.trigger.emit(null);
        } else {
            let dt = this.eruptModel.eruptJson.linkTree;
            if (!event.node.origin.selected && !dt.dependNode) {
                this.trigger.emit(null);
            } else {
                this.trigger.emit(event.node.origin.key);
            }
        }
        this.selectId = event.node.origin.key
        this.selectTitle = event.node.origin.title
    }

    deleting: boolean;
    loading: boolean;
    adding: boolean = false;
    selectId: string;
    selectTitle: string

    delRows() {
        if (this.selectId == null) {
            return
        }
        this.data.deleteEruptData(this.eruptTreeModel.eruptModel.eruptName,
            this.selectId)
            .subscribe(result => {
                if (result.status === Status.SUCCESS) {
                    this.msg.success(this.i18n.fanyi('global.delete.success'));
                    this.getTreeList();
                }
            });
    }

    edit() {
        if (this.selectId == null) {
            return
        }
        const model = this.modal.create({
            nzWrapClassName: "modal-lg edit-modal-lg",
            nzStyle: {top: "60px"},
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.editor"),
            nzOkText: this.i18n.fanyi("global.update"),
            nzContent: EditComponent,
            nzComponentParams: {
                eruptBuildModel: this.eruptTreeModel,
                id: this.selectId,
                behavior: Scene.EDIT,
            },
            nzOnOk: async () => {
                let validateResult = model.getContentComponent().beforeSaveValidate();
                if (validateResult) {
                    let obj = this.dataHandler.eruptValueToObject(this.eruptTreeModel);
                    let res = await this.data.updateEruptData(this.eruptTreeModel.eruptModel.eruptName, obj).toPromise().then(res => res);
                    if (res.status === Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi("global.update.success"));
                        this.getTreeList();
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

    addRow() {
        let buildModel = this.eruptTreeModel
        let eruptFieldModelMap = new Map<String, EruptFieldModel>()
        if (this.selectId != null) {
            let indexOf = -1
            for (let i = 0; i < buildModel.eruptModel.eruptFieldModels.length; i++) {
                if (buildModel.eruptModel.eruptFieldModels[i].eruptFieldJson.edit.type == EditType.REFERENCE_TREE) {
                    indexOf = i
                    break
                }
            }
            if (indexOf > 0) {
                let eruptFieldModel = deepCopy(this.eruptModel.eruptFieldModels[indexOf]);
                eruptFieldModel.eruptFieldJson.edit.$value = this.selectId
                eruptFieldModel.eruptFieldJson.edit.$viewValue = this.selectTitle
                eruptFieldModelMap.set(this.eruptModel.eruptJson.tree.pid.split(".")[0], eruptFieldModel)
            }
        }

        const modal = this.modal.create({
            nzStyle: {top: "60px"},
            nzWrapClassName: "modal-lg edit-modal-lg",
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: EditComponent,
            nzComponentParams: {
                eruptBuildModel: buildModel,
                initEruptFieldModelMap: eruptFieldModelMap
            },
            nzOkText: this.i18n.fanyi("global.add"),
            nzOnOk: async () => {
                if (!this.adding) {
                    this.adding = true;
                    setTimeout(() => {
                        this.adding = false;
                    }, 500);
                    let res: EruptApiModel;
                    let header = {};
                    if (buildModel.eruptModel.eruptJson.linkTree) {
                        let lt = buildModel.eruptModel.eruptJson.linkTree;
                        if (lt.dependNode && lt.value) {
                            header["link"] = buildModel.eruptModel.eruptJson.linkTree.value;
                        }
                    }
                    res = await this.data.addEruptData(buildModel.eruptModel.eruptName,
                        this.dataHandler.eruptValueToObject(buildModel), header).toPromise().then(res => res);
                    if (res.status === Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi("global.add.success"));
                        this.getTreeList();
                        return true;
                    }
                }
                return false;
            }
        });
    }

}
