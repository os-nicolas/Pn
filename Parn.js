// TODO some way to programatically swap pn-on and call the event

// TODO gen css classes
// pn-error
// pn-if
// pn-id

// pn-hiding  -- added with a timeout - i think we are just going to get rid of this less is more sometimes
// pn-showing  -- added with a timeout - i think we are just going to get rid of this less is more sometimes
// pn-hidden
// pn-shown
// check for invalid ids 

// data-pn-id 
// data-pn-on
// data-pn-on-text
// data-pn-off-text
// data-pn-on-class
// data-pn-off-class
// data-pn-if
// data-pn-if-class
// data-pn-else-class


$(document).ready(function () {
    var dataIds = {};
    var HIDE_TIME = 1000;
    var DEBUG = true;

    // this is our logger
    var lumberJack = function (str, obj) {
        if (DEBUG) {
            if (obj === undefined) {
                console.log(str);

            } else {
                console.log(str, obj);
            }
        }
    }

    var classes = {
        HIDDEN: "pn-hidden",
        SHOWN: "pn-shown"
    }

    var uiHasStatusClass = function (uie) {
        for (var key in classes) {
            if (uie.hasClass(classes[key])) {
                return true;
            }
        }
        return false;
    }

    var ops = { OR: "or", AND: "and", XOR: "xor" };
    var START = "start";
    var NONE = "none";

    var isOp = function (value) {
        for (var key in ops) {
            if (ops[key] === value) {
                return true;
            }
        }
        return false;
    }

    var evaulateExpression = function (list) {
        // flipNext is used by not
        var flipNext = false;
        var currentValue = undefined;
        var currentOperation = START;

        var operate = function (boolean) {
            if (currentOperation === NONE) {
                throw { message: "operation expected" };
            }
            lumberJack("start operate: flipnext=" + flipNext + " currentOperation=" + currentOperation + " boolean=" + boolean + " currentValue=" + currentValue);
            if (flipNext) {
                flipNext = false;
                boolean = !boolean;
            }
            if (currentOperation === ops.AND) {
                currentValue = currentValue && boolean;
            } else if (currentOperation === ops.OR) {
                currentValue = currentValue || boolean;
            } else if (currentOperation === ops.XOR) {
                currentValue = currentValue != boolean;
            } else if (currentOperation === START) {
                currentValue = boolean;
            } else {
                throw { message: "unexpected operation:" + currentOperation };
            }
            currentOperation = NONE;
            lumberJack("end operate: flipnext=" + flipNext + " currentOperation=" + currentOperation + " boolean=" + boolean + " currentValue=" + currentValue);
        }

        // I want to get ride of this and have the 
        // UI pn-on be the single source of truth
        var evaluateName = function (name) {
            if (!(name) in dataIds) {
                throw { message: "pn-id: " + name + " not found" };
            }
            // look it up
            // if it does not exist throw an exception
            return dataIds[name];
        }

        var observeNot = function () {
            flipNext = !flipNext;
        }

        var setOperation = function (newOp) {
            lumberJack("setOp: " + newOp);
            if (currentOperation !== NONE) {
                throw { message: "can not set operation to:" + newOp + " it is already set to: " + currentOperation };
            }
            currentOperation = newOp;
        }

        // the plan is walk left to right
        while (list.length !== 0) {
            // if we hit a ( find it's matching hommie and evaulate that substring
            if (list[0] === "(") {
                var inner = []
                list.splice(0, 1);
                var depth = 1;
                while (depth !== 0 && 0 !== list.length) {
                    if (list[0] === "(") {
                        depth++;
                    } else if (list[0] === ")") {
                        depth--;
                    }
                    if (depth !== 0) {
                        inner.push(list[0])
                    }
                    list.splice(0, 1);
                }
                if (depth === 0) {
                    lumberJack("inner: ", inner);
                    operate(evaulateExpression(inner));
                } else {
                    throw { message: "unclosed open parenthesis" };
                }
            } else if (list[0] === ")") {
                throw { message: "unexpected close parenthesis" };
            } else if (list[0] === "!") {
                observeNot();
                list.splice(0, 1);
            } else if (isOp(list[0])) {
                // if we hit a operation change current operation and keep going
                setOperation(list[0]);
                list.splice(0, 1);
            } else {
                operate(evaluateName(list[0]));
                list.splice(0, 1);
            }
        }

        if (currentOperation === "") {

        }

        lumberJack("returning " + currentValue);
        return currentValue;
    }

    var showString = function (expression) {
        lumberJack(expression);
        expression = expression.split("(").join(" ( ")
        expression = expression.split(")").join(" ) ")
        expression = expression.split("!").join(" ! ")
        var bits = expression.split(" ");
        //lumberJack("bits", bits);
        var realBits = []
        for (var i = 0; i < bits.length; i++) {
            var trimmed = bits[i].trim();
            if (trimmed !== "") {
                realBits.push(trimmed);
            }
        }
        lumberJack("realBits", realBits);
        try {
            return evaulateExpression(realBits);
        } catch (err) {
            console.error("Error evaulating expression: " + expression, err);
            return false;
        }
    }

    var clearStateClasses = function (uie) {
        for (var key in classes) {
            uie.removeClass(classes[key]);
        }
    }

    var growText = function (uie) {
        var currentLength = uie.text().length;
        var targetString = uie.data("pn-text");
        if (targetString === undefined) {
            console.error("pn-text is not defined", uie)
        }
        if (currentLength !== targetString.length) {
            var currentText = targetString.slice(0, currentLength + 1);
            uie.text(currentText);
            setTimeout(function () { growText(uie) }, 10);
        }
    }


    var showPnIf = function (uie) {
        // TODO special case  for first pass
        var applyPublicClasses = function (uie) {
            if (uie.data("pn-if-class")) {
                lumberJack("adding class: " + uie.data("pn-if-class"));
                uie.addClass(uie.data("pn-if-class"));
            }
            if (uie.data("pn-else-class")) {
                lumberJack("removing class: " + uie.data("pn-else-class"));
                uie.removeClass(uie.data("pn-else-class"));
            }
        }

        if (!uiHasStatusClass(uie)) {
            if (uie.css("display") === "inline") {
                var currentText = uie.text();
                uie.data("pn-text", currentText);
                uie.text("");
            } else {
                // we assume we are already showing
            }

            applyPublicClasses(uie);
            uie.addClass(classes.SHOWN);
        } else if (!uie.hasClass(classes.SHOWN)) {//(!uie.hasClass(classes.SHOWING)) && (
            if (uie.css("display") === "inline") {
                growText(uie);
            } else {
                uie.animate({
                    width: "show",
                    height: "show"
                }, HIDE_TIME / 2);
                uie.animate({
                    opacity: "1"
                }, HIDE_TIME / 2);
            }
            applyPublicClasses(uie);

            clearStateClasses(uie);
            uie.addClass(classes.SHOWN);
        } else {
            // we are already shown
        }
    }

    var removeText = function (uie) {
        // TODO special case  for first pass

        var currentText = uie.text();
        if (uie.data("pn-text") === undefined) {
            uie.data("pn-text", currentText);
        }
        if (currentText.length !== 0) {
            currentText = currentText.slice(0, -1);
            uie.text(currentText);
            setTimeout(function () { removeText(uie) }, 10);
        }
    }

    var hidePnIf = function (uie) {
        var applyPublicClasses = function (uie) {
            if (uie.data("pn-if-class")) {
                lumberJack("removing class: " + uie.data("pn-if-class"));
                uie.removeClass(uie.data("pn-if-class"));
            }
            if (uie.data("pn-else-class")) {
                lumberJack("adding class: " + uie.data("pn-else-class"));
                uie.addClass(uie.data("pn-else-class"));
            }
        }

        if (!uiHasStatusClass(uie)) {
            if (uie.css("display") === "inline") {
                var currentText = uie.text();
                uie.data("pn-text", currentText);
                uie.text("");
            } else {
                uie.hide();
            }

            applyPublicClasses(uie);
            uie.addClass(classes.HIDDEN);
        } else if (!uie.hasClass(classes.HIDDEN)) {//(!uie.hasClass(classes.HIDING)) && (
            // we need to think about how to hide you nicely.
            // this means we need to select on display type
            // man should we do this automatically?
            if (uie.css("display") === "inline") {
                removeText(uie);
            } else {
                uie.animate({
                    opacity: "0"
                }, HIDE_TIME / 2);
                uie.animate({
                    width: "hide",
                    height: "hide"
                }, HIDE_TIME / 2);
            }

            applyPublicClasses(uie);

            clearStateClasses(uie);
            uie.addClass(classes.HIDDEN);
        } else {
            // we are already hiding do nothing
        }
    }

    var updatePnIfs = function () {
        var contents = $("[data-pn-if]");
        for (var i = 0; i < contents.length; i++) {
            var content = $(contents[i]);
            lumberJack(content.data("pn-if"))
            var toShow = showString(content.data("pn-if"));
            if (toShow) {
                lumberJack("show");
                showPnIf(content);
            } else {
                lumberJack("hide");
                hidePnIf(content);
            }
        }
    }

    var updatePnIds = function () {
        var pnIds = $("[data-pn-id]");
        for (var i = 0; i < pnIds.length; i++) {
            var pnId = $(pnIds[i]);
            var val = dataIds[pnId.data("pn-id")];

            if (val) {
                if (pnId.data("pn-on-text")) {
                    lumberJack("set text to " + pnId.data("pn-on-text"));
                    pnId.text(pnId.data("pn-on-text"));
                }
                if (pnId.data("pn-on-class")) {
                    pnId.addClass(pnId.data("pn-on-class"));
                }
                if (pnId.data("pn-off-class")) {
                    pnId.removeClass(pnId.data("pn-off-class"));
                }
            } else {
                if (pnId.data("pn-off-text")) {
                    lumberJack("set text to " + pnId.data("pn-off-text"));
                    pnId.text(pnId.data("pn-off-text"));
                }
                if (pnId.data("pn-on-class")) {
                    pnId.removeClass(pnId.data("pn-on-class"));
                }
                if (pnId.data("pn-off-class")) {
                    pnId.addClass(pnId.data("pn-off-class"));
                }
            }
        }
    }

    // we need to populate dataIds
    var buttons = $("button[data-pn-id]");
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        dataIds[$(button).data("pn-id")] = ($(button).data("pn-on") == "true" ? true : false);
    }

    var updateClasses = function () {
        // we clear out the classes 
        var oldPnIds = $(".pn-id");
        for (var i = 0; i < oldPnIds.length; i++) {
            var oldPnId = $(oldPnIds[i])
            oldPnId.removeClass("pn-id");
        }
        var oldPnIfs = $(".pn-if");
        for (var i = 0; i < oldPnIfs.length; i++) {
            var oldPnIf = $(oldPnIfs[i])
            oldPnIf.removeClass("pn-if");
        }

        // and then add them back
        var pnIds = $("[data-pn-id]");
        for (var i = 0; i < pnIds.length; i++) {
            var pnId = $(pnIds[i])
            pnId.addClass("pn-id");
        }
        var pnIfs = $("[data-pn-if]");
        for (var i = 0; i < pnIfs.length; i++) {
            var pnIf = $(pnIfs[i])
            pnIf.addClass("pn-if");
        }
    }

    var updateAll = function () {
        updateClasses();
        updatePnIfs();
        updatePnIds();
    }

    updateAll();

    // when any of our buttons are clicked
    // we need to update all the .parn-content
    $("button[data-pn-id]").click(function () {
        // update our dataId
        var val = !dataIds[$(this).data("pn-id")];
        dataIds[$(this).data("pn-id")] = val;
        $(this).data("pn-on", val);

        lumberJack(dataIds)
        // update all the content
        updateAll();
    });
});