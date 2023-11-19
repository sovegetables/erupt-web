### 1. table.component.ts
触发eruptName方法, 调用init方法

```
@Input() set eruptName(value: string) {
    this.init(this.dataService.getEruptBuild(value), {
        url: RestPath.data + "/table/" + value,
        header: {
            erupt: value
        }
    }, (eb: EruptBuildModel) => {
        this.appViewService.setRouterViewDesc(eb.eruptModel.eruptJson.desc);
    });
}
```
接着看init方法, 调用/data/build/{eruptName}接口获取eruptBuildModel
/data/table/{eruptName}赋值给
```
export interface EruptBuildModel {
    eruptModel: EruptModel;
    power?: Power;  //权限
    tabErupts?: { [key: string]: EruptBuildModel };
    combineErupts?: { [key: string]: EruptModel };
    referenceErupts?: { [key: string]: EruptModel };
    operationErupts?: { [key: string]: EruptModel };
}

this.stConfig.url = req.url;
observable.subscribe(eb => {
        ....
        this.dataHandler.initErupt(eb);
        callback && callback(eb);
        this.eruptBuildModel = eb;
        this.buildTableConfig(); //初始化表格column
        for (let it of this.eruptBuildModel.eruptModel.eruptFieldModels) {
            if (it.eruptFieldJson.edit.search.value) {
                this.searchErupt = <EruptModel>deepCopy(this.eruptBuildModel.eruptModel);
                break;
            }
        }
        this.extraRowFun();
    }
);
```
### 2. edit.component.ts
ngOnInit方法、分两种情况：1. 新增 2. 编辑
```
ngOnInit() {
    this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
    if (this.behavior == Scene.ADD) {
        this.loading = true;
        //调用/data/init-value/{eruptName}接口获取初始值
        this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
            //调用objectToEruptValue方法去处理初始值
            this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        });
    } else {
        this.loading = true;
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.id).subscribe(data => {
            this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        });
    }
    this.eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
}
```
