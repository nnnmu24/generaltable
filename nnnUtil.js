
class Log {
    static DEBUG = 1;
    static INFO = 2;
    static WARN = 3;
    static ERROR = 4;
    static level = Log.ERROR;

    static debug(value) {
        this.log(Log.DEBUG, value);
    }

    static info(value) {
        this.log(Log.INFO, value);
    }

    static warn(value) {
        this.log(Log.WARN, value);
    }

    static error(value) {
        this.log(Log.ERROR, value);
    }

    static log(level, value) {
        if (Log.level <= level) {
            console.log(value);
        }
    }
}

class StringUtil {
    // 2桁のゼロパディング
    static paddingZero2(value) {
        return ("00" + String(value)).slice(-2);
    }

    // 3桁のゼロパディング
    static paddingZero3(value) {
        return ("000" + String(value)).slice(-3);
    }

    // 6桁のゼロパディング
    static paddingZero6(value) {
        return ("000000" + String(value)).slice(-6);
    }
}

class NumberUtil {
    // 数値チェック
    static isNumber(value) {
        return value != null && isFinite(value);
    }

    // 0以上の正の整数チェック
    static isNumberNaturalInteger(value) {
        if (!NumberUtil.isNumber(value)) {
            return false;
        }
        let valueNum = value - 0;
        if (!Number.isInteger(valueNum)) {
            return false;
        }
        if (valueNum < 0) {
            return false;
        }
        return true;
    }

    // 1以上の正の整数チェック
    static isNumberPositiveInteger(value) {
        if (!NumberUtil.isNumber(value)) {
            return false;
        }
        let valueNum = value - 0;
        if (!Number.isInteger(valueNum)) {
            return false;
        }
        if (valueNum < 1) {
            return false;
        }
        return true;
    }
}

class DateUtil {
    static yearPattern = [
        ["YYYYMMDD",       "[0-9]{8}",                        0, 4, 6],
        ["YYYY/MM/DD",     "[0-9]{4}\\/[0-9]{2}\\/[0-9]{2}",  0, 5, 8],
        ["YYYY-MM-DD",     "[0-9]{4}-[0-9]{2}-[0-9]{2}",      0, 5, 8],
        ["YYYY年MM月DD日", "[0-9]{4}年[0-9]{2}月[0-9]{2}日",  0, 5, 8],
        ["MMDD",           "[0-9]{4}",                       -1, 0, 2],
        ["MM/DD",          "[0-9]{2}\\/[0-9]{2}",            -1, 0, 3],
        ["MM-DD",          "[0-9]{2}-[0-9]{2}",              -1, 0, 3],
        ["MM月DD日",       "[0-9]{2}月[0-9]{2}日",           -1, 0, 3],
    ];
    static hourPattern = [
        ["HHmmss",         "[0-9]{6}",                        0, 2,  4],
        ["HH:mm:ss",       "[0-9]{2}:[0-9]{2}:[0-9]{2}",      0, 3,  6],
        ["HH時mm分ss秒",   "[0-9]{2}時[0-9]{2}分[0-9]{2}秒",  0, 3,  6],
        ["HHmm",           "[0-9]{4}",                        0, 2, -1],
        ["HH:mm",          "[0-9]{2}:[0-9]{2}",               0, 3, -1],
        ["HH時mm分",       "[0-9]{2}時[0-9]{2}分",            0, 3, -1],
    ];
    static patternMatrix = DateUtil.createPatternMatrix();

    static createPatternMatrix() {
        let yearPattern = DateUtil.yearPattern;
        let hourPattern = DateUtil.hourPattern;
        let matrix = new Array();

        for (let i=0; i<yearPattern.length; i++) {
            matrix.push(yearPattern[i][0]);
        }

        for (let j=0; j<hourPattern.length; j++) {
            matrix.push(hourPattern[j][0]);
        }

        for (let i=0; i<yearPattern.length; i++) {
            for (let j=0; j<hourPattern.length; j++) {
                matrix.push(yearPattern[i][0] + " " + hourPattern[j][0]);
            }
        }
        return matrix;
    }

    static validateFormat(format) {
        for (let i=0; i<DateUtil.patternMatrix.length; i++) {
            if (DateUtil.patternMatrix[i] == format) {
                return true;
            }
        }
        return false;
    }

    static validate(value, format) {
        let yearPattern = DateUtil.yearPattern;
        let hourPattern = DateUtil.hourPattern;

        // 引数が指定した年月日フォーマットを抽出
        let yearFormat = null;
        let yearFormatIndexArray = null;
        let yearValue = null;
        let hourFormatTmp = null;
        let hourValueTmp = null;
        for (let i=0; i<yearPattern.length; i++) {
            if (format.startsWith(yearPattern[i][0])) {
                yearFormat = yearPattern[i][0];
                yearFormatIndexArray = yearPattern[i];
                // 値の形式を正規表現でチェック
                // 後続に時分秒フォーマットがある可能性あるため、正規表現に".*"を付与
                // 末尾に不正な値があるかと、年月日の妥当性は後続で実施する
                if (!new RegExp("^" + yearPattern[i][1] + ".*$").test(value)) {
                    return false;
                }
                yearValue = value.substring(0, yearFormat.length);
                if (format.length != yearFormat.length) {
                    // 後続に時分秒フォーマット有の場合、時分秒要素を切り出す
                    hourFormatTmp = format.substring(yearFormat.length, format.length).trim();
                    hourValueTmp = value.substring(yearFormat.length, value.length).trim();
                } else {
                    // 後続に時分秒フォーマット無の場合、データ長チェック
                    // 先の正規表現でチェックできない分
                    if (value.length != yearFormat.length) {
                        return false;
                    }
                }
                break;
            }
        }

        // 年月日フォーマット未指定の場合、引数は時分秒のみを指定していると仮定する
        if (yearFormatIndexArray == null) {
            hourFormatTmp = format;
            hourValueTmp = value;
        }

        // 引数が指定した時分秒フォーマットを抽出
        let hourFormat = null;
        let hourFormatIndexArray = null;
        let hourValue = null;
        if (hourFormatTmp != null) {
            for (let i=0; i<hourPattern.length; i++) {
                if (hourFormatTmp == hourPattern[i][0]) {
                    hourFormat = hourFormatTmp;
                    hourFormatIndexArray = hourPattern[i];
                    hourValue = hourValueTmp;
                    // 値の形式を正規表現でチェック
                    // 時分秒の妥当性は後続で実施する
                    if (!new RegExp("^" + hourPattern[i][1] + "$").test(hourValue)) {
                        return false;
                    }
                    break;
                }
            }
        }

        // 時分秒フォーマットがあるにもかかわらず、マッチしなかった場合は不正
        // 年月日フォーマット、時分秒フォーマットに共にマッチしないフォーマットの場合が該当
        if (hourFormatTmp != null && hourFormatIndexArray == null) {
            return false;
        }

        // 年月日フォーマットの妥当性チェック
        if (yearFormatIndexArray != null) {
            // 年月日要素の抽出
            // 年省略時は補填
            let year = yearFormatIndexArray[2] == -1 ?
                "2000" : yearValue.substr(yearFormatIndexArray[2], 4);
            let month = yearValue.substr(yearFormatIndexArray[3], 2);
            let day = yearValue.substr(yearFormatIndexArray[4], 2);
Log.debug("Y-value[" + yearValue + "]format[" + yearFormat + "]index[" + yearFormatIndexArray[0] + "]parse[" + year + "/" + month + "/" + day + "]");

            // 年月日の妥当性チェック
            // 正規表現チェック済のため、ここでは各値が数値であることが保証されている
            const date = new Date(year, month - 1, day);
            if (year !== String(date.getFullYear()) ||
                month !== StringUtil.paddingZero2(date.getMonth() + 1) ||
                day !== StringUtil.paddingZero2(date.getDate())) {
                return false;
            }
        }

        // 時分秒フォーマットの妥当性チェック
        if (hourFormatIndexArray != null) {
            // 時分秒要素の抽出
            // 秒省略時は補填
            let hour = hourValue.substr(hourFormatIndexArray[2], 2);
            let minute = hourValue.substr(hourFormatIndexArray[3], 2);
            let second = hourFormatIndexArray[4] == -1 ?
                "00" : hourValue.substr(hourFormatIndexArray[4], 2);
Log.debug("H-value[" + hourValue + "]format[" + hourFormat + "]index[" + hourFormatIndexArray[0] + "]parse[" + hour + ":" + minute + ":" + second + "]");

            // 年月日の妥当性チェック
            // 正規表現チェック済のため、ここでは各値が数値であることが保証されている
            if (hour < 0 || 23 < hour) {
                return false;
            }
            if (minute < 0 || 59 < minute) {
                return false;
            }
            if (second < 0 || 59 < second) {
                return false;
            }
        }

        return true;
    }
}
