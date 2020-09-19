
/**********
 * 定数クラス
 **********/

class ConstClass {
    TYPE_TEXT;
    TYPE_NUMBER;
    TYPE_DATE;
    PARTS_TEXT;
    PARTS_CHECK;
    PARTS_BUTTON;
    PARTS_SELECT;
    PARTS_HTML;
    constructor() {
        this.TYPE_TEXT = "text";
        this.TYPE_NUMBER = "num";
        this.TYPE_DATE = "date";
        this.PARTS_TEXT = "text";
        this.PARTS_CHECK = "checkbox";
        this.PARTS_BUTTON = "button";
        this.PARTS_SELECT = "select";
        this.PARTS_HTML = "html";
    }
}


/**********
 * 表データクラス
 **********/

// クラス：表データ
class TableData {
    tableCode;
    tableName;
    tableColumnArray;
    tableRecordMap;
    tableColumnOption;
    errorElementArray;

    constructor() {
        this.tableColumnArray = new Array();
        this.tableRecordMap = new Map();
        this.errorElementArray = new Array();
    }

    toString() {
        let tostr;
        tostr = this.tableCode + ":" + this.tableName;
        tostr = tostr + "\r\n" + "---- COLUMN ----";
        this.tableColumnArray.forEach(value => {
            tostr = tostr + "\r\n" + value.toString();
        });
        tostr = tostr + "\r\n" + "---- COLUMN ----";
        tostr = tostr + "\r\n" + "---- RECORD ----";
        this.tableRecordMap.forEach((value, key) => {
            tostr = tostr + "\r\n" + value.toString();
        });
        tostr = tostr + "\r\n" + "---- RECORD ----";

        return tostr;
    }
}

// クラス：カラム
class TableColumn {
    id;
    eventDisplayId;
    index;
    name;
    type;
    dateFormat;
    option;

    createId(index) {
        this.index = index;
        this.id = "cl_" + StringUtil.paddingZero3(index);
        this.eventDisplayId = "table_" + this.id;
    }

    toString() {
        return "id=" + this.id + ",index=" + this.index
            + ",name=" + this.name + ",type=" + this.type + ",option=" + this.option;
    }
}

// クラス：レコード
class TableRecord {
    id;
    eventDisplayId;
    valueArray;
    displayArray;

    createId(index) {
        this.id = "rc_" + StringUtil.paddingZero6(index);
        this.eventDisplayId = "table_" + this.id;
    }

    toString() {
        return this.id + ":" + this.displayArray;
    }
}


/**********
 * フレームワーククラス
 * （継承するクラスより先に宣言すること）
 **********/

class PartsPolicy {

    tableConfig;
    tableState;

    id;
    type;
    valueRule;
    valueFunctionOption;
    valueFunction;
    eventFunctionOption;
    eventFunction;

    constructor(
        tableConfig,
        tableState,
        id,
        type,
        valueRule,
        valueFunctionOption,
        valueFunction,
        eventFunctionOption,
        eventFunction) {

        this.tableConfig = tableConfig;
        this.tableState = tableState;
        this.id = id;
        this.type = type;
        this.valueRule = valueRule;
        this.valueFunctionOption = valueFunctionOption;
        this.valueFunction = valueFunction;
        this.eventFunctionOption = eventFunctionOption;
        this.eventFunction = eventFunction;
    }
}

class AreaControl {

    tableConfig;
    tableState;

    constructor(viewControl, tableConfig, tableState) {
        this.viewControl = viewControl;
        this.tableConfig = tableConfig;
        this.tableState = tableState;
    }

    display() {
        this.partsPolicyArray.forEach((value, index) => {
            if (value.valueFunction == null) {
                return;
            }

            let displayElement = document.getElementById(value.id);
            let displayValue = value.valueFunction(value.valueFunctionOption);
            if (value.type == Const.PARTS_TEXT) {
                displayElement.value = displayValue;
            } else if (value.type == Const.PARTS_CHECK) {
                displayElement.checked = displayValue;
            } else if (value.type == Const.PARTS_BUTTON) {
                ;
            } else if (value.type == Const.PARTS_SELECT) {
                // SELECTのdisplayValueは2次元配列
                displayValue.forEach((value, index) => {
                    var option = document.createElement("option");
                    option.value = value[0];
                    option.text = value[1];
                    displayElement.appendChild(option);
                 });
            } else if (value.type == Const.PARTS_HTML) {
                displayElement.innerHTML = displayValue;
            }
        });
    }

    registEvent() {
        this.partsPolicyArray.forEach((value, index) => {
            if (value.eventFunction == null) {
                return;
            }

            let displayElement = document.getElementById(value.id);
            let eventAction = "click";
            if (value.type == Const.PARTS_TEXT) {
                eventAction = "blur";
            } else if (value.type == Const.PARTS_CHECK) {
                eventAction = "change";
            } else if (value.type == Const.PARTS_BUTTON) {
                eventAction = "click";
            } else if (value.type == Const.PARTS_SELECT) {
                eventAction = "change";
            } else if (value.type == Const.PARTS_HTML) {
                eventAction = "click";
            }
            displayElement.addEventListener(eventAction, {
                viewControl: this.viewControl,
                tableConfig: this.tableConfig,
                tableState: this.tableState,
                option: value.eventFunctionOption,
                handleEvent: value.eventFunction,
            });
        });
    }
}


/**********
 * 画面制御クラス
 **********/

Log.level = Log.ERROR;
const Const = new ConstClass();

// クラス：画面制御（全体の処理）
class ViewControl {

    tableConfig;
    tableState;
    menuAreaControl;
    tableControl;
    configAreaControl;
    displayChangeAreaControl;
    pagingAreaControl;

    init(tableDataSource, tableColumnOption) {
        // 定数定義
        Object.freeze(Const);

        this.tableState = new TableState();
        this.tableConfig = new TableConfig();


        /**** 初期データの取得と設定 ****/

        // 表データより、表コードと表明を先に取得（設定の読み込みで使用するため）
        this.tableControl = new TableControl(
            this, this.tableConfig, this.tableState, tableDataSource, tableColumnOption);
        this._getInitialData();
        this.tableControl.tableConfig.key = this.tableControl.tableData.tableCode;

        // 設定の読み込み
        this.tableControl.tableConfig.load();


        /**** 各エリア制御オブジェクトの生成 ****/

        this.menuAreaControl = new MenuAreaControl(this, this.tableConfig, this.tableState);
        this.configAreaControl = new ConfigAreaControl(this, this.tableConfig, this.tableState);
        this.displayChangeAreaControl = new DisplayChangeAreaControl(this, this.tableConfig, this.tableState);
        this.pagingAreaControl = new PagingAreaControl(this, this.tableConfig, this.tableState);


        // 表データの解析
        this.tableControl.parseTableData();

        // 表状態の初期化
        this.tableState.init(this.tableConfig, this.tableControl.tableData);


        /**** 各エリアの表示 ****/

        this.menuAreaControl.display();
        this.configAreaControl.display();
        this.displayChangeAreaControl.display();
        this.tableControl.createTable();
        this.tableControl.display();
        this.pagingAreaControl.display();


        /**** 各エリアのイベント登録 ****/

        this.menuAreaControl.registEvent();
        this.configAreaControl.registEvent();
        this.displayChangeAreaControl.registEvent();
        this.tableControl.registEvent();
        this.pagingAreaControl.registEvent();


        // データエラーメッセージの表示
        if (this.tableControl.tableConfig.parseErrorDisplay &&
            0 < this.tableControl.tableData.errorElementArray.length) {
            let errorMessage = "";
            this.tableControl.tableData.errorElementArray.forEach((value, index) => {
                errorMessage = errorMessage + value + "\r\n";
            });
            alert(errorMessage);
        }
    }

    redisplay() {
        this.tableControl.createTable();
        this.tableControl.display();
        this.pagingAreaControl.display();
        this.tableControl.registEvent();
    }

    _getInitialData() {
        this.tableControl.parseTableDataCodeAndName();
    }
}

// クラス：メニューエリア制御
class MenuAreaControl extends AreaControl {

    viewControl;
    tableConfig;
    tableState;
    partsPolicyArray;

    menuConfigDisplayFlg;
    menuDisplayChangeDisplayFlg;

    constructor(viewControl, tableConfig, tableState) {
        super(viewControl, tableConfig, tableState);
        this.viewControl = viewControl;
        this.tableConfig = tableConfig;
        this.tableState = tableState;

        this.menuConfigDisplayFlg = true;
        this.menuDisplayChangeDisplayFlg = true;

        this.partsPolicyArray =[

            // テキスト：「設定エリア」の表示
            new PartsPolicy(tableConfig, tableState,
                "menuConfig",
                Const.PARTS_HTML, null, null, null,
                [1], this.displayArea),

            // テキスト：「表示変更エリア」の表示
            new PartsPolicy(tableConfig, tableState,
                "menuDisplayChange",
                Const.PARTS_HTML, null, null, null,
                [2], this.displayArea),
        ];
    }

    displayArea(e) {
        let element,display;
        if (this.option[0] == 1) {
            if (this.viewControl.menuAreaControl.menuConfigDisplayFlg) {
                this.viewControl.menuAreaControl.menuConfigDisplayFlg = false;
                display = "none";
            } else {
                this.viewControl.menuAreaControl.menuConfigDisplayFlg = true;
                display = "";
            }
            element = document.getElementById("configArea");
        } else if (this.option[0] == 2) {
            if (this.viewControl.menuAreaControl.menuDisplayChangeDisplayFlg) {
                this.viewControl.menuAreaControl.menuDisplayChangeDisplayFlg = false;
                display = "none";
            } else {
                this.viewControl.menuAreaControl.menuDisplayChangeDisplayFlg = true;
                display = "";
            }
            element = document.getElementById("displayChangeArea");
        } 
        element.style.display = display;
    }
}

// クラス：設定エリア制御
class ConfigAreaControl extends AreaControl {

    viewControl;
    tableConfig;
    tableState;
    partsPolicyArray;

    constructor(viewControl, tableConfig, tableState) {
        super(viewControl, tableConfig, tableState);
        this.viewControl = viewControl;
        this.tableConfig = tableConfig;
        this.tableState = tableState;
        this.partsPolicyArray =[

            // チェックボックス：表データの書式エラーを表示
            new PartsPolicy(tableConfig, tableState,
                "configParseErrorDisplay",
                Const.PARTS_CHECK,
                null, null,
                function() {return this.tableConfig.parseErrorDisplay},
                null, this.setParseErrorDisplay),

            // テキスト：1ページの表示数
            new PartsPolicy(tableConfig, tableState,
                "configPageRecordCount",
                Const.PARTS_TEXT,
                null, null,
                function() {return this.tableConfig.pageRecordCount},
                null, this.setPageRecordCount),

            // テキスト：長文を省略
            new PartsPolicy(tableConfig, tableState,
                "configOmitLength",
                Const.PARTS_TEXT,
                null, null,
                function() {return this.tableConfig.omitLength},
                null, this.setOmitLength),
        ];
    }

    setParseErrorDisplay(e) {
        this.tableConfig.parseErrorDisplay = e.target.checked;
        this.tableConfig.save();
    }

    setPageRecordCount(e) {
        if (!NumberUtil.isNumberPositiveInteger(e.target.value)) {
            document.getElementById("configPageRecordCount").value = this.tableConfig.pageRecordCount;
            return;
        }
        this.tableConfig.pageRecordCount = parseInt(e.target.value);
        this.tableConfig.save();
        this.tableState.initPage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }

    setOmitLength(e) {
        if (!NumberUtil.isNumberPositiveInteger(e.target.value)) {
            document.getElementById("configOmitLength").value = this.tableConfig.omitLength;
            return;
        }
        this.tableConfig.omitLength = parseInt(e.target.value);
        this.tableConfig.save();
    }
}

// クラス：表示変更エリア制御
class DisplayChangeAreaControl extends AreaControl {

    viewControl;
    tableConfig;
    tableState;
    partsPolicyArray;

    constructor(viewControl, tableConfig, tableState) {
        super(viewControl, tableConfig, tableState);
        this.viewControl = viewControl;
        this.tableConfig = tableConfig;
        this.tableState = tableState;
        this.partsPolicyArray =[

            // ボタン：ソート初期化
            new PartsPolicy(tableConfig, tableState,
                "dspchgInitSort",
                Const.PARTS_BUTTON, null, null, null,
                null, this.initSort),

            // チェックボックス：チェックしたカラムを表示
            new PartsPolicy(tableConfig, tableState,
                "dspchgColumnDisplay",
                Const.PARTS_CHECK, null, null,
                function() {return this.tableConfig.columnDisplayFlg},
                null, this.changeColumnDisplay),

            // チェックボックス：チェックしたレコードを表示
            new PartsPolicy(tableConfig, tableState,
                "dspchgRecordDisplay",
                Const.PARTS_CHECK, null, null,
                function() {return this.tableConfig.recordDisplayFlg},
                null, this.changeRecordDisplay),

            // ボタン：検索
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchWord",
                Const.PARTS_BUTTON, null, null, null,
                [Const.TYPE_TEXT, "dspchgSearchSelectWord", "dspchgSearchInputWord"],
                this.search),

            // ボタン：数値絞込
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchNumber",
                Const.PARTS_BUTTON, null, null, null,
                [Const.TYPE_NUMBER, "dspchgSearchSelectNum", "dspchgSearchInputNumFrom", "dspchgSearchInputNumTo"],
                this.search),

            // ボタン：日付絞込
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchDate",
                Const.PARTS_BUTTON, null, null, null,
                [Const.TYPE_DATE, "dspchgSearchSelectDate", "dspchgSearchInputDateFrom", "dspchgSearchInputDateTo"],
                this.search),

            // セレクト：検索対象カラム
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchSelectWord",
                Const.PARTS_SELECT, null,
                [this.viewControl.tableControl.tableData, ""],
                this.getSelectOption,
                null, null),

            // セレクト：数値絞込対象カラム
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchSelectNum",
                Const.PARTS_SELECT, null,
                [this.viewControl.tableControl.tableData, Const.TYPE_NUMBER],
                this.getSelectOption,
                null, null),

            // セレクト：日付絞込象カラム
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchSelectDate",
                Const.PARTS_SELECT, null,
                [this.viewControl.tableControl.tableData, Const.TYPE_DATE],
                this.getSelectOption,
                null, null),

            // テキスト：検索条件
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchInputWord",
                Const.PARTS_TEXT, null, null, null, null, null),

            // テキスト：数値絞込条件FROM
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchInputNumFrom",
                Const.PARTS_TEXT, null, null, null, null, this.checkNumFrom),

            // テキスト：数値絞込条件TO
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchInputNumTo",
                Const.PARTS_TEXT, null, null, null, null, this.checkNumTo),

            // テキスト：日付絞込条件FROM
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchInputDateFrom",
                Const.PARTS_TEXT, null, null, null, null, null),

            // テキスト：日付絞込条件TO
            new PartsPolicy(tableConfig, tableState,
                "dspchgSearchInputDateTo",
                Const.PARTS_TEXT, null, null, null, null, null),
        ];
    }

    display() {
        super.display();

        // 数値型、日付型が存在しない場合は検索入力を非表示
        let isExistsNumber = false;
        let isExistsDate = false;
        this.viewControl.tableControl.tableData.tableColumnArray.forEach((value, index) => {
            if (value.type == Const.TYPE_NUMBER) {
                isExistsNumber = true;
            } else if (value.type == Const.TYPE_DATE) {
                isExistsDate = true;
            }
        });
        if (!isExistsNumber) {
            document.getElementById("dspchgSearchNumber").style.display = "none";
            document.getElementById("dspchgSearchSelectNum").style.display = "none";
            document.getElementById("dspchgSearchInputNumFrom").style.display = "none";
            document.getElementById("dspchgSearchInputNumTo").style.display = "none";
            document.getElementById("dspchgSearchInputLabelNum").style.display = "none";
        }
        if (!isExistsDate) {
            document.getElementById("dspchgSearchDate").style.display = "none";
            document.getElementById("dspchgSearchSelectDate").style.display = "none";
            document.getElementById("dspchgSearchInputDateFrom").style.display = "none";
            document.getElementById("dspchgSearchInputDateTo").style.display = "none";
            document.getElementById("dspchgSearchInputLabelDate").style.display = "none";
        }
    }

    checkNumFrom(e) {
        if (!NumberUtil.isNumber(e.target.value)) {
            document.getElementById("dspchgSearchInputNumFrom").value = "";
        }
    }

    checkNumTo(e) {
        if (!NumberUtil.isNumber(e.target.value)) {
            document.getElementById("dspchgSearchInputNumTo").value = "";
        }
    }

    getSelectOption(option) {
        let tableData = option[0];
        let columnType = option[1];
        let selectOptionArray = new Array();
        tableData.tableColumnArray.forEach((value, index) => {
            if (columnType == "" || columnType == value.type) {
                selectOptionArray[index] = [value.index, value.name];
            }
        });
        return selectOptionArray;
    }

    initSort(e) {
        this.tableState.initColumnSort(this.viewControl.tableControl.tableData.tableColumnArray.length);
        this.viewControl.tableControl.sortColumnInit();
        this.tableState.initPage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }

    changeColumnDisplay(e) {
        this.tableConfig.columnDisplayFlg = e.target.checked;
        this.tableConfig.save();
        this.viewControl.tableControl.changeColumnDisplay();
    }

    changeRecordDisplay(e) {
        this.tableConfig.recordDisplayFlg = e.target.checked;
        this.tableConfig.save();
        this.tableState.initPage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }

    search(e) {
        // 検索条件の取得
        let type = this.option[0];
        let columnIndex, word1, word2;
        let wordArray;
        if (type == Const.TYPE_TEXT) {
            columnIndex = document.getElementById(this.option[1]).value;
            word1 = document.getElementById(this.option[2]).value;
            word2 = "";
            // 検索語句を分割（空白区切りのときにAND条件とする）
            wordArray = word1.split(" ");
        } else if (type == Const.TYPE_NUMBER) {
            columnIndex = document.getElementById(this.option[1]).value;
            word1 = document.getElementById(this.option[2]).value;
            word2 = document.getElementById(this.option[3]).value;
            // 検索語句はFROMとTO
            wordArray = [word1, word2];
        } else if (type == Const.TYPE_DATE) {
            columnIndex = document.getElementById(this.option[1]).value;
            word1 = document.getElementById(this.option[2]).value;
            word2 = document.getElementById(this.option[3]).value;
            // 検索語句はFROMとTO
            wordArray = [word1, word2];
        }

        // 検索状態のクリア
        this.tableState.recordSearchSet.clear();

        if (word1 == "" && word2 == "") {
            // 空文字の場合は検索条件クリア
            this.tableState.recordSearchSet.clear();
        } else {
            this.viewControl.tableControl.tableData.tableRecordMap.forEach((value, key) => {
                // 表値と検索語句のマッチ判定
                let isMatch = this.viewControl.displayChangeAreaControl
                    ._searchSub(type, value.valueArray[columnIndex], wordArray);
                // 検索語句に合致しないレコード(非表示にするレコード)をtableStateに登録
                if (!isMatch) {
                    this.tableState.recordSearchSet.add(value.id);
                }
            });
        }
        this.tableState.initPage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }

    _searchSub(type, record, wordArray) {
        let isMatch = false;
        switch(type) {
            // 語句検索
            case Const.TYPE_TEXT:
                for (let i=0; i<wordArray.length; i++) {
                    isMatch = true;
                    if (record.indexOf(wordArray[i]) == -1) {
                        // AND検索なので、1語句でも不一致があればfalse
                        isMatch = false;
                        break;
                    }
                }
                break;
            case Const.TYPE_NUMBER:
                let recordInt = Number(record);
                let minInt = wordArray[0] == "" ? recordInt : Number(wordArray[0]);
                let maxInt = wordArray[1] == "" ? recordInt : Number(wordArray[1]);
                if (record != "" && minInt <= recordInt && recordInt <= maxInt) {
                    isMatch = true;
                }
                break;
            case Const.TYPE_DATE:
                let minDate = wordArray[0] == "" ? record : wordArray[0];
                let maxDate = wordArray[1] == "" ? record : wordArray[1];
                if (record != "" && minDate <= record && record <= maxDate) {
                    isMatch = true;
                }
                break;
            default:
                break;
        }
        return isMatch;
    }
}

// クラス：ページングエリア制御
class PagingAreaControl extends AreaControl {

    viewControl;
    tableConfig;
    tableState;
    partsPolicyArray;

    constructor(viewControl, tableConfig, tableState) {
        super(viewControl, tableConfig, tableState);
        this.viewControl = viewControl;
        this.tableConfig = tableConfig;
        this.tableState = tableState;
        this.partsPolicyArray =[

            // HTML：ページラベル
            new PartsPolicy(tableConfig, tableState,
                "page",
                Const.PARTS_HTML,
                null, null,
                function() {return this.tableState.page},
                null, null),

            // HTML：「前のページ」ラベル
            new PartsPolicy(tableConfig, tableState,
                "pagePrev",
                Const.PARTS_HTML,
                null, null,
                function() {return this.tableState.page <= 1 ? "" : "&lt;"},
                [-1], this.changePage),

            // HTML：「次のページ」ラベル
            new PartsPolicy(tableConfig, tableState,
                "pageNext",
                Const.PARTS_HTML,
                null, null,
                function() {return this.tableState.page < this.tableState.totalPage ? "&gt;" : ""},
                [1], this.changePage),
        ];
    }

    changePage(e) {
        this.tableState.page = this.tableState.page + this.option[0];
        this.tableState.changePage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }
}

// クラス：表制御
class TableControl {

    viewControl;
    tableConfig;
    tableState;
    tableDataSource;
    tableColumnOptionArray;
    tableData;

    constructor(viewControl, tableConfig, tableState, tableDataSource, tableColumnOptionArray) {
        this.viewControl = viewControl;
        this.tableDataSource = tableDataSource;
        this.tableColumnOptionArray = tableColumnOptionArray;
        this.tableConfig = tableConfig;
        this.tableState = tableState;
    }

    // 表コード、表名
    parseTableDataCodeAndName() {
        this.tableData = new TableData();

        let tableCode = this.tableDataSource[0][0];
        if (tableCode == undefined || tableCode == "") {
            this.tableData.errorElementArray.push("表コードが空です。");
            tableCode = "T0001";
        }
        this.tableData.tableCode = tableCode.trim();

        let tableName = this.tableDataSource[0][1];
        if (tableName == undefined || tableName == "") {
            this.tableData.errorElementArray.push("表名が空です。");
            tableName = "デフォルト表";
        }
        this.tableData.tableName = tableName.trim();
    }

    parseTableData() {
        let tableColumnNames = new Array();
        let tableColumnTypes = new Array();
        let tableColumnTypesDateFormat = new Array();
        let tableColumnOptions = new Array();

        this.tableDataSource.forEach((value, index) => {

            if (index == 1) {
                // カラム名
                value.forEach((valueIn, indexIn) => {
                    let tableColumnName = valueIn.trim();
                    if (tableColumnName == "") {
                        this.tableData.errorElementArray.push("カラム名が空です。[" + (indexIn + 1) + "要素目]");
                        tableColumnName = "カラム" + (indexIn + 1);
                    }
                    tableColumnNames[indexIn] = tableColumnName;
                });

            } else if (index == 2) {
                // カラム型
                value.forEach((valueIn, indexIn) => {
                    let tableColumnType = valueIn.trim();
                    if (tableColumnType != Const.TYPE_TEXT &&
                        tableColumnType != Const.TYPE_NUMBER &&
                        !tableColumnType.startsWith(Const.TYPE_DATE)) {
                        this.tableData.errorElementArray.push("カラム型が不正です。[" + tableColumnType + "]");
                        tableColumnType = Const.TYPE_TEXT;
                    }

                    // 日付型の場合は、"."以降の日付書式を抽出
                    let dateFormat = null;
                    if (tableColumnType.startsWith(Const.TYPE_DATE)) {
                        if (tableColumnType == Const.TYPE_DATE) {
                            dateFormat = "YYYY/MM/DD HH:mm:ss";
                        } else if (tableColumnType.startsWith(Const.TYPE_DATE + ".")) {
                            dateFormat = tableColumnType.substring(Const.TYPE_DATE.length + 1, tableColumnType.length);
                            if (!DateUtil.validateFormat(dateFormat)) {
                                this.tableData.errorElementArray.push("カラム型(日付)が不正です。[" + tableColumnType + "]");
                                tableColumnType = Const.TYPE_TEXT;
                            } else {
                                tableColumnType = Const.TYPE_DATE;
                            }
                        } else {
                            this.tableData.errorElementArray.push("カラム型(日付)が不正です。[" + tableColumnType + "]");
                            tableColumnType = Const.TYPE_TEXT;
                        }
                    }

                    tableColumnTypes[indexIn] = tableColumnType;
                    tableColumnTypesDateFormat[indexIn] = dateFormat;
                });

            } else if (index == 3) {
                // カラムオプション
                value.forEach((valueIn, indexIn) => {
                    let tableColumnOption = valueIn;
                    if (tableColumnOption == undefined || tableColumnOption == null) {
                        tableColumnOption = ["", ""];
                    } else if (tableColumnOption == "") {
                        tableColumnOption = ["", ""];
                    } else if (this.tableColumnOptionArray[tableColumnOption.trim()] == undefined) {
                        this.tableData.errorElementArray.push("カラムオプションが不正です。[" + tableColumnOption + "]");
                        tableColumnOption = ["", ""];
                    } else {
                        tableColumnOption = this.tableColumnOptionArray[tableColumnOption.trim()];
                        if (tableColumnOption[0] == null || tableColumnOption[0] == undefined) {
                            tableColumnOption[0] = "";
                        }
                        if (tableColumnOption[1] == null || tableColumnOption[1] == undefined) {
                            tableColumnOption[1] = "";
                        }
                    }
                    tableColumnOptions[indexIn] = tableColumnOption;
                });

                // カラム名、カラム型、日付書式、カラムオプション取得完了後に、これら要素をtableDataオブジェクトに格納
                tableColumnNames.forEach((valueIn, indexIn) => {
                    let tableColumn = new TableColumn();
                    tableColumn.createId(indexIn);
                    tableColumn.name = valueIn;
                    if (tableColumnTypes[indexIn] == undefined) {
                        this.tableData.errorElementArray.push("カラム型が不足しています。[" + (indexIn + 1) + "要素目]");
                        tableColumn.type = Const.TYPE_TEXT;
                    } else {
                        tableColumn.type = tableColumnTypes[indexIn];
                    }
                    if (tableColumnTypesDateFormat[indexIn] == undefined) {
                        tableColumn.dateFormat = null;
                    } else {
                        tableColumn.dateFormat = tableColumnTypesDateFormat[indexIn];
                    }
                    if (tableColumnOptions[indexIn] == undefined) {
                        this.tableData.errorElementArray.push("カラムオプションが不足しています。[" + (indexIn + 1) + "要素目]");
                        tableColumn.option = ["", ""];
                    } else {
                        tableColumn.option = tableColumnOptions[indexIn];
                    }

                    // tableDataオブジェクトに格納
                    this.tableData.tableColumnArray[indexIn] = tableColumn;
                });

            } else if (index != 0) {
                // レコード
                let recordIndex = index - 4 + 1;
                let tableRecord = new TableRecord();
                tableRecord.createId(recordIndex);
                tableRecord.valueArray = value;
                tableRecord.displayArray = value.slice(0, this.tableData.tableColumnArray.length);

                this.tableData.tableColumnArray.forEach((valueIn, indexIn) => {
                    let recordValue = tableRecord.displayArray[indexIn];

                    // 不足要素の補填
                    let defaultValue = null;
                    if (recordValue == undefined) {
                        switch(this.tableData.tableColumnArray[indexIn].type) {
                            case Const.TYPE_TEXT:
                                defaultValue = "";
                                break;
                            case Const.TYPE_NUMBER:
                                defaultValue = "";
                                break;
                            case Const.TYPE_DATE:
                                defaultValue = "";
                                break;
                            default:
                                break;
                        }
                        this.tableData.errorElementArray.push("レコードを補填(値="
                            + defaultValue + ")。[" + recordIndex + "レコード," + (indexIn + 1) + "要素目]");
                    }

                    // 型チェック
                    let isError = false;
                    switch(this.tableData.tableColumnArray[indexIn].type) {
                        case Const.TYPE_TEXT:
                            break;
                        case Const.TYPE_NUMBER:
                            if (recordValue != "" &&
                                !NumberUtil.isNumber(recordValue)) {
                                isError = true;
                                defaultValue = "";
                            }
                            break;
                        case Const.TYPE_DATE:
                            if (recordValue != "" &&
                                !DateUtil.validate(recordValue, this.tableData.tableColumnArray[indexIn].dateFormat)) {
                                isError = true;
                                defaultValue = "";
                            }
                            break;
                        default:
                            break;
                    }

                    if (isError) {
                        this.tableData.errorElementArray.push("型エラー(値="
                            + recordValue + ")。[" + recordIndex + "レコード," + (indexIn + 1) + "要素目]");
                    }

                    // エラー時はデフォルト値を採用
                    if (defaultValue != null) {
                        recordValue = defaultValue;
                    }

                    // 長文を省略
                    if (this.tableData.tableColumnArray[indexIn].type == Const.TYPE_TEXT) {
                        if (this.tableConfig.omitLength < recordValue.length) {
                            recordValue = "<span title='" + tableRecord.valueArray[indexIn] + "'>"
                                + recordValue.slice(0, this.tableConfig.omitLength) + "...</span>";
                        }
                    }

                    // カラムオプションの付与
                    recordValue = this.tableData.tableColumnArray[indexIn].option[0]
                        + recordValue + this.tableData.tableColumnArray[indexIn].option[1];

                    // 最終的な表示値をtableRecordオブジェクトに格納
                    tableRecord.displayArray[indexIn] = recordValue;
                });

                // レコードをtableDataオブジェクトに格納
                this.tableData.tableRecordMap.set(tableRecord.id, tableRecord);
            }
        });
        
        Log.debug(this.tableData.toString());
    }

    createTable() {
        // 表名
        document.getElementById("tableTitle").innerHTML = this.tableData.tableName;

        // 表ヘッダ
        let tableHtml = "<table>";
        tableHtml = tableHtml + "<thead class='tableHead'>";
        tableHtml = tableHtml + "<tr>";
        tableHtml = tableHtml + "<th>-</th>";
        this.tableData.tableColumnArray.forEach((value, index) => {
            let tableColumnSortMarker = "－";
            if (this.tableState.columnSortArray[index] == 1) {
                tableColumnSortMarker = "▲";
            } else if (this.tableState.columnSortArray[index] == 2) {
                tableColumnSortMarker = "▼";
            }
            tableHtml = tableHtml
                + "<th id='" + value.id + "'>"
                + "<input type='checkbox' class='tableHeadCheck' id='" + value.eventDisplayId + "'>"
                + "<span class='tableColumnSortMarker'>" + tableColumnSortMarker + "</span>"
                + "<div class='tableColumn'>" + value.name + "</div></th>";
        });
        tableHtml = tableHtml + "</tr>";
        tableHtml = tableHtml + "</thead>";

        // 表ボディ
        tableHtml = tableHtml + "<tbody class='tableBody'>";
        this.tableData.tableRecordMap.forEach((value, key) => {
            tableHtml = tableHtml + "<tr id='" + value.id + "'>";
            tableHtml = tableHtml + "<td><input type='checkbox' class='tableBodyCheck' id='" + value.eventDisplayId + "'></td>";
            value.displayArray.forEach((valueIn, indexIn) => {
                let id = value.id + "_" + indexIn;
//                tableHtml = tableHtml + "<td class='tableValue' id='" + id + "'><span style='pointer-events: none;'>" + valueIn + "</span></td>";
                tableHtml = tableHtml + "<td class='tableValue' id='" + id + "'>" + valueIn + "</td>";
            });
            tableHtml = tableHtml + "</tr>";
        });
        tableHtml = tableHtml + "</tbody>";
        tableHtml = tableHtml + "</table>";

        // 生成したtable要素を描画する
        document.getElementById("generalTable").innerHTML = tableHtml;
    }

    display() {
        this.tableData.tableColumnArray.forEach((value, index) => {
            // カラムのチェックボックス
            if (this.tableConfig.columnIndexDisplaySet.has(index)) {
                document.getElementById(value.eventDisplayId).checked = true;
            }
        });

        this.tableData.tableRecordMap.forEach((value, key) => {
            // レコードのチェックボックス
            let id = value.id;
            if (this.tableState.recordCheckSet.has(id)) {
                document.getElementById(value.eventDisplayId).checked = true;
            }

            let displayJudge;
            if (this.tableConfig.recordDisplayFlg) {
                // チェックありの場合、全て表示
                displayJudge = !this.tableState.recordSearchSet.has(id) &&
                    !this.tableState.recordPageSet.has(id);
            } else {
                // チェックなしの場合、tableStateのSetに登録されている要素を非表示
                displayJudge = !this.tableState.recordCheckSet.has(id) &&
                    !this.tableState.recordSearchSet.has(id) &&
                    !this.tableState.recordPageSet.has(id);
            }

            if (displayJudge) {
                document.getElementById(id).style.display = "";
            } else {
                document.getElementById(id).style.display = "none";
            }
        });
    }

    changeColumnDisplay() {
        // <thead>要素
        let theadNode = document.getElementById("generalTable").childNodes[0].childNodes[0];
        // <thead>配下の<tr>配下の<th>要素でループ
        theadNode.childNodes[0].childNodes.forEach((value, index) => {
            if (this.tableConfig.columnDisplayFlg == true) {
                // チェックありの場合、全て表示
                value.style.display = "";
            } else {
                // チェックなしの場合、tableConfig.columnIndexDisplaySetに登録されている要素を非表示
                // 最初の<th>要素はチェックボックスであり、それを除外するためインデックスを-1する
                if (this.tableConfig.columnIndexDisplaySet.has(index - 1)) {
                    value.style.display = "none";
                } else {
                    value.style.display = "";
                }
            }
        });

        // <tbody>要素
        let tbodyNode = document.getElementById("generalTable").childNodes[0].childNodes[1];
        // <tbody>配下の<tr>要素でループ
        tbodyNode.childNodes.forEach((value, index) => {
            // <tr>配下の<td>要素でループ
            value.childNodes.forEach((valueIn, indexIn) => {
                if (this.tableConfig.columnDisplayFlg == true) {
                    // チェックありの場合、全て表示
                    valueIn.style.display = "";
                } else {
                    // チェックなしの場合、tableConfig.columnIndexDisplaySetに登録されている要素を非表示
                    // 最初の<td>要素はチェックボックスであり、それを除外するためインデックスを-1する
                    if (this.tableConfig.columnIndexDisplaySet.has(indexIn - 1)) {
                        valueIn.style.display = "none";
                    } else {
                        valueIn.style.display = "";
                    }
                }
            });
        });
    }

    registEvent() {
        // div：表ヘッダクリック時のソート
        var triggerColumn = document.querySelectorAll(".tableColumn");
        triggerColumn.forEach(target => {
            target.addEventListener("click", {
                viewControl: this.viewControl,
                tableConfig: this.tableConfig,
                tableState: this.tableState,
                handleEvent: this.sortColumn
            });
        });

        // テーブル上のチェックボックス：カラムの表示/非表示
        this.tableData.tableColumnArray.forEach((value, index) => {
            document.getElementById(value.eventDisplayId).addEventListener("change", {
                viewControl: this.viewControl,
                tableConfig: this.tableConfig,
                tableState: this.tableState,
                handleEvent: this.saveColumnDisplay
            });
        });

        // テーブル上のチェックボックス：レコードの表示/非表示
        this.tableData.tableRecordMap.forEach((value, key) => {
            document.getElementById(value.eventDisplayId).addEventListener("change", {
                viewControl: this.viewControl,
                tableConfig: this.tableConfig,
                tableState: this.tableState,
                handleEvent: this.saveRecordDisplay
            });
        });

/*
        // セルに色付けるイベントは今後の拡張とする
        var trigger = document.querySelectorAll(".tableValue");
        trigger.forEach((target) => {
            target.addEventListener("click", {
                viewControl: this.viewControl,
                tableConfig: this.tableConfig,
                tableState: this.tableState,
                handleEvent: this.changeRecordValueOption
            });
        });
*/
    }

/*
    // セルに色付けるイベントは今後の拡張とする
    changeRecordValueOption(e) {
        let element = document.getElementById(e.target.id);
        this.tableState.changeRecordValueOption(e.target.id);
        element.style.backgroundColor ="red";
    }
*/

    sortColumn(e) {
        // 選択したカラムのindexを導出
        let columnIndex;
        let columnType;
        for (let i=0; i<this.viewControl.tableControl.tableData.tableColumnArray.length; i++) {
            if (e.target.parentNode.id == this.viewControl.tableControl.tableData.tableColumnArray[i].id) {
                columnIndex = i;
                columnType = this.viewControl.tableControl.tableData.tableColumnArray[i].type;
                break;
            }
        }

        this.tableState.reverseColumnSort(columnIndex);
        this.viewControl.tableControl._sortColumnSub(columnType);
        this.tableState.initPage(this.tableConfig, this.viewControl.tableControl.tableData);
        this.viewControl.redisplay();
    }

    // ソートの初期化
    sortColumnInit() {
        // レコードのIDでソート
        let sortedMap = this.tableData.tableRecordMap;
        sortedMap = new Map([...sortedMap.entries()].sort((a, b) => {
            let value1 = b[1].id;
            let value2 = a[1].id;
            if (value1 == value2) {
                return 0;
            } else if (value1 < value2) {
                return 1;
            } else {
                return -1;
            }
        }));
        this.tableData.tableRecordMap = sortedMap;
    }

    saveColumnDisplay(e) {
        // <tr><th id="xxx"><input checkbox></th></tr> の構造なので
        // カラムのIDはチェックボックスの親要素にある
        let id = e.target.parentNode.id;

        // そのIDより配列のインデックスを導出
        // インデックスをcolumnIndexDisplaySetに登録/削除してチェック状態を記憶
        this.viewControl.tableControl.tableData.tableColumnArray.forEach((value, index) => {
            if (id == value.id) {
                if (e.target.checked == true) {
                    this.tableConfig.columnIndexDisplaySet.add(value.index);
                } else {
                    this.tableConfig.columnIndexDisplaySet.delete(value.index);
                }
            }
        });
        this.tableConfig.save();
    }

    saveRecordDisplay(e) {
        // <tr id="xxx"><td><input checkbox></td></tr> の構造なので
        // レコードのIDはチェックボックスの親の親要素にある
        // そのIDをtableConfig、tableControlに登録/削除してチェック状態を記憶
        let id = e.target.parentNode.parentNode.id;

        if (e.target.checked == true) {
            this.tableConfig.recordDisplaySet.add(id);
            this.tableState.recordCheckSet.add(id);
        } else {
            this.tableConfig.recordDisplaySet.delete(id);
            this.tableState.recordCheckSet.delete(id);
        }
        this.tableConfig.save();
    }

    _sortColumnSub(columnType) {
        let sortedMap = this.tableData.tableRecordMap;
        this.tableState.columnSortArray.forEach((value, index) => {
            if (value == 0) {
                return;
            }

            sortedMap = new Map([...sortedMap.entries()].sort((a, b) => {
                let value1 = b[1].valueArray[index];
                let value2 = a[1].valueArray[index];
                if (columnType == Const.TYPE_NUMBER) {
                    if (value1 == "") {
                        value1 = Number.MIN_SAFE_INTEGER;
                    }
                    if (value2 == "") {
                        value2 = Number.MIN_SAFE_INTEGER;
                    }
                    value1 = Number(value1);
                    value2 = Number(value2);
                }
                if (value1 == value2) {
                    return 0;
                } else if (value1 < value2) {
                    if (value == 1) {
                        return 1;
                    } else if (value == 2) {
                        return -1;
                    }
                } else {
                    if (value == 1) {
                        return -1;
                    } else if (value == 2) {
                        return 1;
                    }
                }
            }));
        });
        this.tableData.tableRecordMap = sortedMap;
    }
}


/**********
 * 状態クラス
 **********/

class TableState {
    recordCheckSet;
    recordSearchSet;
    recordPageSet;
    recordValueOptionMap;
    columnSortArray;
    columnLength;
    page;
    totalPage;

    constructor() {
        this.recordCheckSet = new Set();
        this.recordSearchSet = new Set();
        this.recordPageSet = new Set();
        this.recordValueOptionMap = new Map();
        this.page = 1;
        this.columnSortArray = new Array();
    }

    init(tableConfig, tableData) {
        this.initColumnSort(tableData.tableColumnArray.length);
        tableConfig.recordDisplaySet.forEach((value) => {
            this.recordCheckSet.add(value);
        });
        this.initPage(tableConfig, tableData);
    }

    initColumnSort(length) {
        this.columnLength = length;
        for (let i=0; i<length; i++) {
            this.columnSortArray[i] = 0;
        }
    }

    initPage(tableConfig, tableData) {
        this.page = 1;
        this.changePage(tableConfig, tableData);
    }

    reverseColumnSort(index) {
        let sortValue;
        if (this.columnSortArray[index] == 0) {
            sortValue = 1;
        } else if (this.columnSortArray[index] == 1) {
            sortValue = 2;
        } else if (this.columnSortArray[index] == 2) {
            sortValue = 1;
        }
        this.columnSortArray = new Array();
        this.initColumnSort(this.columnLength);
        this.columnSortArray[index] = sortValue;
    }

    changeRecordValueOption(id) {
        if (!this.recordValueOptionMap.has(id)) {
            this.recordValueOptionMap.set(id, 0);
        } else {
            let value = this.recordValueOptionMap.get(id);
            value ++;
            this.recordValueOptionMap.set(id, value);
        }
        console.log(id + ":"+this.recordValueOptionMap.get(id));
        return this.recordValueOptionMap.get(id);
    }

    changePage(tableConfig, tableData) {
        let pageRecordCount = tableConfig.pageRecordCount;

        let startIndex = (this.page - 1) * pageRecordCount;
        let endIndex = startIndex + pageRecordCount - 1;

        let recordCount = 0;
        this.recordPageSet.clear();
        tableData.tableRecordMap.forEach((value, key) => {
            // ページングの範囲内か
            if (recordCount < startIndex || endIndex < recordCount) {
                this.recordPageSet.add(value.id);
            }

            // 有効行（表示するレコード）のカウント
            let id = value.id;
            if (tableConfig.recordDisplayFlg) {
                // チェックありの場合、全て表示
                if (!this.recordSearchSet.has(id)) {
                    recordCount ++;
                }
            } else {
                // チェックなしの場合、tableStateのSetに登録されている要素を非表示
                if (!this.recordCheckSet.has(id) &&
                    !this.recordSearchSet.has(id)) {
                    recordCount ++;
                }
            }
        });

        // 総ページ数の導出
        this.totalPage = Math.floor(recordCount / pageRecordCount);
        if (recordCount % pageRecordCount != 0) {
            this.totalPage ++;
        }
    }

    getRecordCount(tableConfig, tableData) {
        let count = 0;
        tableData.tableRecordMap.forEach((value, key) => {
            let id = value.id;
            if (tableConfig.recordDisplayFlg) {
                // チェックありの場合、全て表示
                if (!this.recordSearchSet.has(id)) {
                    count ++;
                }
            } else {
                // チェックなしの場合、tableStateのSetに登録されている要素を非表示
                if (!this.recordCheckSet.has(id) &&
                    !this.recordSearchSet.has(id)) {
                    count ++;
                }
            }
        });
        return count;
    }
}


/**********
 * 設定クラス
 **********/

class TableConfig {
    // 保存時のキー、表コードとする
    key;

    // 表データの書式エラーを表示
    parseErrorDisplay;
    // 1ページの表示数（レコード）
    pageRecordCount;
    // 長文を省略する文字数
    omitLength;
    // チェックしたカラムを表示
    columnDisplayFlg;
    // チェックしたレコードを表示
    recordDisplayFlg;
    // カラムの表示/非表示選択を保持するセット
    columnIndexDisplaySet;
    columnIndexDisplaySetArray;
    // レコードの表示/非表示選択を保持するセット
    recordDisplaySet;
    recordDisplaySetArray;

    constructor() {
        this.parseErrorDisplay = true;
        this.pageRecordCount = 100;
        this.omitLength = 20;
        this.columnDisplayFlg = true;
        this.recordDisplayFlg = true;
        this.columnIndexDisplaySet = new Set();
        this.recordDisplaySet = new Set();
    }

    save() {
        this.columnIndexDisplaySetArray = Array.from(this.columnIndexDisplaySet);
        this.recordDisplaySetArray = Array.from(this.recordDisplaySet);

        // ローカルストレージにJSON形式で保存
        let saveString = JSON.stringify(this);
        localStorage.setItem(this.key, saveString);
    }

    load() {
        // JSON形式の保存情報をローカルストレージから取得
        let loadString = localStorage.getItem(this.key);
        if (loadString == null) {
            return;
        }
        let loadObject = JSON.parse(loadString);

        // 保存情報をオブジェクトに戻す
        this.key = loadObject.key;
        this.parseErrorDisplay = loadObject.parseErrorDisplay;
        this.pageRecordCount = loadObject.pageRecordCount;
        this.omitLength = loadObject.omitLength;
        this.columnDisplayFlg = loadObject.columnDisplayFlg;
        this.recordDisplayFlg = loadObject.recordDisplayFlg;

        loadObject.columnIndexDisplaySetArray.forEach((value) => {
            this.columnIndexDisplaySet.add(value);
        });
        loadObject.recordDisplaySetArray.forEach((value) => {
            this.recordDisplaySet.add(value);
        });
    }
}

