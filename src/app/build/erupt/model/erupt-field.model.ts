import {
    AttachmentEnum,
    ChoiceEnum,
    DateEnum,
    EditType,
    HtmlEditTypeEnum,
    PickerMode,
    TabEnum,
    ViewType
} from "./erupt.enum";


export interface EruptFieldModel {
    modelName: string;
    fieldName: string;
    fieldClassName: string;
    primaryKeyCol: string;
    eruptFieldJson: EruptField;
    choiceMap?: Map<String, VL>;
    componentValue?: any;
    value?: any;
    serialNumber?: number;
}


//field detail
export interface EruptField {
    views?: View[];
    edit?: Edit;
}

export interface Tpl {
    enable: boolean;
    width: string;
}

export interface View {
    className: string;
    column: string;
    title: string;
    width: string;
    desc: string;
    show: boolean;
    highlight: boolean;
    viewType: ViewType;
    template: string;
    sortable: boolean;
    tpl: Tpl;
    //extra
    eruptFieldModel?: EruptFieldModel;
}

export interface Edit {
    title: string;
    notNull: boolean;
    desc: string;
    type: EditType;
    show: boolean;
    editShow: boolean;
    showBy: { dependField: string, expr: string };
    recommendBy: {dependModel:string, dependModelPKey:string, dependField: string, expr: string };
    readOnly: Readonly;
    placeHolder: string;
    searchPlaceHolder: string;
    search: Search;
    tabType: TabType;
    inputType: InputType;
    numberType: NumberType;
    referenceTreeType: ReferenceTreeType;
    referenceTableType: ReferenceTableType;
    attachmentType: AttachmentType;
    autoCompleteType: AutoCompleteType;
    htmlEditorType: HtmlEditorType;
    rateType: RateType;
    boolType: BoolType;
    choiceType: ChoiceType;
    tagsType: TagsType;
    dateType: DateType;
    sliderType: SliderType;
    codeEditType: CodeEditType;
    mapType: MapType;
    $tabTreeViewData?: any;
    $value?: any;
    $initValue?: any;
    tabData?: any;
    $viewValue?: any;
    $tempValue?: any;
    $beforeValue?: any;
    $l_val?: any;
    $r_val?: any;
}

interface Readonly {
    add: boolean;
    edit: boolean;
}

interface HtmlEditorType {
    value: HtmlEditTypeEnum;
}

interface RateType {
    character: string;
    allowHalf: string;
    count: number;
}

interface Search {
    value: boolean;
    vague: boolean;
    notNull: boolean;
}

interface CodeEditType {
    language: string;
    height: number;
}

//Edit Type
interface InputType {
    length: number;
    type: string;
    fullSpan: boolean;
    enableAutoComplete: boolean;
    prefix: VL[];
    suffix: VL[];
    prefixValue?: string;
    suffixValue?: string;
}

interface NumberType {
    min: number;
    max: number;
    step: number;
}

interface AutoCompleteType {
    items: any[];
    triggerLength: number;
}

export interface ReferenceTreeType {
    id: string;
    label: string;
    pid: string;
    dependField: string;
    expandLevel: number;
}

export interface ReferenceTableType {
    id: string;
    label: string;
    dependField: string;
}

interface BoolType {
    trueText: string;
    falseText: string;
}

interface ChoiceType {
    type: ChoiceEnum;
    anewFetch: boolean;
    dependField: string;
    dependExpr: string;
    items: VL[],
    onVLChange(value, oldValue): void;
}


interface TagsType {
    allowExtension: boolean;
    joinSeparator: string;
}


export interface TabType {
    type: TabEnum;
}


interface SliderType {
    min: number;
    max: number;
    step: number;
    markPoints: number[];
    dots: boolean;
    marks?: any;
}

interface DateType {
    type: DateEnum;
    pickerMode: PickerMode;
    isRange: boolean;
}

interface AttachmentType {
    size: number;
    fileTypes: string[];
    path: String;
    maxLimit: number;
    type: AttachmentEnum;
    fileSeparator: string;
    baseUrl: { value: string };
}

export interface MapType {
    draw: boolean;
    drawMaxLayer: number;
}

export interface VL {
    value: string;
    label: string;
    desc: string;
    disable: boolean;
    $viewValue?: any;
}
