


class SvgUtils {
    static NS = 'http://www.w3.org/2000/svg';
    static setPoint(element, point, fire = true){
        element.setAttribute('x', point.x)
        element.setAttribute('y', point.y)
        if(fire){
            SvgUtils.dispatchEventHandler(element);
        }
    }
    static dispatchEventHandler(element){
        while(!(element instanceof SVGSVGElement)){
            element = element.parentNode;
        }
        Handler.getInstance().dispatchHandler(element);
    }
    static setRect(element, x,y,width,height){
        SvgUtils.setRectViaRectangle(element, Rectangle.fromXY(x,y,width,height));
    }
    static setRectViaRectangle(element, rect){
        SvgUtils.setPoint(element, rect.point, false);
        element.setAttribute('width', rect.width);
        element.setAttribute('height', rect.height);
        SvgUtils.dispatchEventHandler(element);
    }
    static getRectOfElement(element){
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        var x = element.getAttribute('x');
        x = x ? parseFloat(x) : 0;
        var y = element.getAttribute('y');
        y = y ? parseFloat(y) : 0;
        var width = element.getAttribute('width');
        width = width ? parseFloat(width) : 0;
        var height = element.getAttribute('height');
        height = height ? parseFloat(height) : 0;
        var change = false;
        if(width == 0 ){
            width = 400;
            element.setAttribute('width',width);
            change = true;
        }
        if(height == 0){
            height = 400;
            element.setAttribute('height',height);
            change = true;
        }
        if(change){
            SvgUtils.dispatchEventHandler(element)
        }
        return Rectangle.fromXY(x,y,width, height);
    }

    static getMousePosition(event) {
        var CTM = Artboard.getInstance().artboard.getScreenCTM();
        event = event instanceof TouchEvent ? event.touches[0] : event;
        return {
          x: (event.clientX - CTM.e) / CTM.a,
          y: (event.clientY - CTM.f) / CTM.d
        };
    }
    static insertAtIndex(element, index){
        const artboard = Artboard.getInstance().artboard;
        if(index < 0){
            throw 'Negative Index';
        }else if(index >= artboard.childElementCount){
            artboard.appendChild(element);
        }else{
            artboard.insertBefore(element, artboard.children[index]);
        }
    }
    static saveIntoPng(){
        var svg = Artboard.getInstance().artboard;
        var svgData = new XMLSerializer().serializeToString( svg );

        var canvas = document.createElement( "canvas" );
        var svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        var ctx = canvas.getContext( "2d" );

        var img = document.createElement( "img" );
        img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );
        img.onload = function() {
            ctx.drawImage( img, 0, 0 );
            var a = document.createElement("a");
            var href = canvas.toDataURL( "image/png" );
            console.log(href);
            a.setAttribute("href", href);
            a.setAttribute("download", "badge.png");
            a.click();
        };
    }
    static copyIntoClipboard(){
        var svg = Artboard.getInstance().artboard;
        var svgData = new XMLSerializer().serializeToString( svg );

        var canvas = document.createElement( "canvas" );
        var svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        var ctx = canvas.getContext( "2d" );

        var img = document.createElement( "img" );
        img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );
        img.onload = function() {
            ctx.drawImage( img, 0, 0 );
            canvas.toBlob(async blob => {
                var res = null;
                if (navigator.userAgent.indexOf("Firefox") > -1) {
                    res = browser.clipboard.setImageData(await blob.arrayBuffer(), "png");
                }else{
                    res = navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
                }
                await res.then(_ => console.log("COPIED"));
            });
        };
    }
}

window.SvgUtils = SvgUtils;

class StackControl {

    constructor(){
        const btnUndo = document.querySelector("#btn-undo");
        const btnRedo = document.querySelector("#btn-redo");
        btnUndo.addEventListener('click', (event) => {
            this.back();
        });
        btnRedo.addEventListener('click', (event) => {
            this.forward();
        });
    }
    commands = [];
    deletedCommands = [];
    do(command){
        this.deletedCommands = [];
        this.commands.push(command);
        command.execute();
        this.checkAndDisableBtn();
    }
    forward(){
        if(this.canForward()){
            const lastCommand = this.deletedCommands.pop();
            this.commands.push(lastCommand);
            lastCommand.execute();
            this.checkAndDisableBtn();
        }
    }
    back(){
        if(this.canBack()){
            const lastCommand = this.commands.pop();
            this.deletedCommands.push(lastCommand);
            lastCommand.revert();
            this.checkAndDisableBtn();
        }
    }
    canForward(){
        return this.deletedCommands.length > 0;
    }
    canBack(){
        return this.commands.length > 0;
    }
    checkAndDisableBtn(){
        const btnUndo = document.querySelector("#btn-undo");
        const btnRedo = document.querySelector("#btn-redo");
        if(!this.canBack()){
            btnUndo.setAttribute('disabled', "true");
        }else{
            btnUndo.removeAttribute('disabled');
        }
        if(!this.canForward()){
            btnRedo.setAttribute('disabled', "true");
        }else{
            btnRedo.removeAttribute('disabled');
        }
    }
}

window.StackControl = StackControl;

class Point{
    constructor(x,y){
        this._x = x;
        this._y = y;
    }
    _x = 0;
    _y = 0;
    get x (){ return this._x;}
    get y (){ return this._y;}
    set x (_x){ this._x = _x;}
    set y (_y){ this._y = _y;}
}

class Rectangle{
    _point;
    _width;
    _height;
    static fromPoint(point, width, height){
        var rect = new Rectangle();
        rect.point = point;
        rect.width = width > 0 ? width : 1;
        rect.height = height > 0 ? height : 1;
        return rect;
    }
    static fromXY(x,y,width, height){
        return Rectangle.fromPoint(new Point(x,y), width, height);
    }

    get point (){ return this._point;}
    set point (_point){ this._point = _point;}

    get width (){ return this._width;}
    set width (_width){ this._width = _width;}

    get height (){ return this._height;}
    set height (_height){ this._height = _height;}
    toObject(){
        return {x: this.point.x, y: this.point.y, width: this.width, height: this.height};
    }
}

window.Point = Point;

class Command {
    execute(){}
    revert(){}
}

window.Command = Command;

class DragCommand extends Command {
    _start = null;
    _target = null;
    _element = null;
    constructor(element,start, target){
        super();
        this._start = start;
        this._target = target;
        this._element = element;
        if(element.getAttribute('is-text') == 'true'){
            this._element = element.querySelector('foreignObject');
        }
    }
    execute(){
        if(this._element && this._element instanceof SVGElement && this._target){
            SvgUtils.setPoint(this._element, this._target);
        }
    }
    revert(){
        if(this._element && this._element instanceof SVGElement && this._start){
            SvgUtils.setPoint(this._element, this._start);
        }
    }
    static attachDragEvent(element){
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        element.removeEventListener("mousedown", DragCommand.dragStart);
        element.removeEventListener("touchstart", DragCommand.dragStart);
        element.removeEventListener("mouseup", DragCommand.dragEnd);
        element.removeEventListener("touchend", DragCommand.dragEnd);
        element.addEventListener("mousedown", DragCommand.dragStart);
        element.addEventListener("touchstart", DragCommand.dragStart);
        element.addEventListener("mouseup", DragCommand.dragEnd);
        element.addEventListener("touchend", DragCommand.dragEnd);
    }
    static dragStart(event) {
        if(event.touches && event.touches.length > 1) return;
        event.preventDefault();
        event.stopPropagation();
        var target = event.currentTarget;
        CurrentElement.selectedElement = target;
        var x = target.getAttribute('x');
        x = x ? parseFloat(x) : 0;
        var y = target.getAttribute('y');
        y = y ? parseFloat(y) : 0;

        startDragPoint = new Point(x,y);

        CurrentElement.offset = SvgUtils.getMousePosition(event);
        CurrentElement.offset.x -= x;
        CurrentElement.offset.y -= y;
        document.addEventListener("mouseup", DragCommand.dragEnd);
        document.addEventListener("touchend", DragCommand.dragEnd);
        document.addEventListener("mousemove", DragCommand.drag);
        document.addEventListener("touchmove", DragCommand.drag);
    }
    
    static dragEnd(event) {
        if(event.touches && event.touches.length > 1) return;
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener("mouseup", DragCommand.dragEnd);
        document.removeEventListener("touchend", DragCommand.dragEnd);
        document.removeEventListener("mousemove", DragCommand.drag);
        document.removeEventListener("touchmove", DragCommand.drag);
        if(CurrentElement.isDragging){
            CurrentElement.isDragging = false;
            var element = CurrentElement.selectedElement;
            if(element.getAttribute('is-text') == 'true'){
                element = element.querySelector('foreignObject');
            }
            const {x,y} = SvgUtils.getRectOfElement(element).toObject();
            Artboard.getInstance().stackControl.do(new DragCommand(element, startDragPoint, new Point(x,y)));
            console.log("DRAGEND");
        }
    }
    static drag(event){
        if(event.touches && event.touches.length > 1) return;
        if(!CurrentElement.isDragging){
            console.log("DRAGSTART");
            CurrentElement.isDragging = true;
        }
        if(CurrentElement.isDragging){
            var element = CurrentElement.selectedElement;
            if(element.getAttribute('is-text') == 'true'){
                element = element.querySelector('foreignObject');
            }
            var coord = SvgUtils.getMousePosition(event);
            SvgUtils.setPoint(element, new Point(coord.x - CurrentElement.offset.x, coord.y - CurrentElement.offset.y));
        }
    }
}
window.DragCommand = DragCommand;

class DuplicateCommand extends Command{
    _element;
    _duplicatedElement;
    constructor(element){
        super();
        this._element = element;
        this._duplicatedElement = element.cloneNode(true);
    }
    execute(){
        var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
        if(index != Artboard.getInstance().artboard.childElementCount - 1){
            Artboard.getInstance().artboard.insertBefore(this._duplicatedElement, Artboard.getInstance().artboard.children[index + 1]);
        }else{
            Artboard.getInstance().artboard.appendChild(this._duplicatedElement);
        }
        var {x,y} = SvgUtils.getRectOfElement(this._element).toObject();
        x += 20;
        y += 20;
        SvgUtils.setPoint(this._duplicatedElement,new Point(x,y),false);
        CurrentElement.selectedElement = this._duplicatedElement;
    }
    revert(){
        Artboard.getInstance().artboard.removeChild(this._duplicatedElement);
        if(CurrentElement.selectedElement == this._duplicatedElement){
            CurrentElement.selectedElement = null;
        }
    }
}
window.DuplicateCommand = DuplicateCommand;

class DeleteCommand extends Command{
    _element;
    _position = 0;
    constructor(element){
        super();
        this._element = element;
    }
    execute(){
        this._position = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
        if(this._position >= 0){
            Artboard.getInstance().artboard.removeChild(this._element);
            CurrentElement.selectedElement = null;
        }
    }
    revert(){
        SvgUtils.insertAtIndex(this._element, this._position);
    }

}

window.DeleteCommand = DeleteCommand;

class LayerCommand extends Command{
    _possibleRequest = ['down', 'up'];
    _element;
    _request;
    constructor(element, request){
        super();
        if(!this._possibleRequest.includes(request)){
            throw 'Command ' + request + ' impossible';
        }
        this._element = element;
        this._request = request;
    }
    execute(){
        switch (this._request) {
            case 'up':
                this.putUp();
                break;
            case 'down':
                this.putDown();
                break;
            default:
                break;
        }
    }
    revert(){
        switch (this._request) {
            case 'down':
                this.putUp();
                break;
            case 'up':
                this.putDown();
                break;
            default:
                break;
        }
    }
    putDown(){
        if(this._element){
            if(this.isActiveDown()){
                var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
                Artboard.getInstance().artboard.insertBefore(Artboard.getInstance().artboard.children[index], Artboard.getInstance().artboard.children[index - 1])
            }
        }
    }
    putUp(){
        if(this._element){
            if(this.isActiveUp()){
                var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
                Artboard.getInstance().artboard.insertBefore(Artboard.getInstance().artboard.children[index + 1], Artboard.getInstance().artboard.children[index])
            }
        }
    }

    isActiveUp(){
        if(this._element){
            var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
            return index + 1 < Artboard.getInstance().artboard.childElementCount;
        }
    }

    isActiveDown(){
        if(this._element){
            var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
            return index > 0 && index < Artboard.getInstance().artboard.childElementCount;
        }
    }
}
window.LayerCommand = LayerCommand;

class ResizeCommand extends Command{
    _startRect = null;
    _targetRect = null;
    _element;
    constructor(element, startRect, targetRect){
        super();
        this._element = element;
        if(element.getAttribute('is-text') == 'true'){
            this._element = element.querySelector('foreignObject');
        }
        this._startRect = startRect;
        this._targetRect = targetRect;
    }
    execute(){
        SvgUtils.setRectViaRectangle(this._element, this._targetRect);
    }
    revert(){
        SvgUtils.setRectViaRectangle(this._element, this._startRect);
    }
}
window.ResizeCommand = ResizeCommand;

class ImportationCommand extends Command {
    _element = null;
    constructor(element, clone = true){
        super();
        this._element = clone ? element.cloneNode(true) : element;
        this._element.setAttribute("class", "element");
    }
    execute(){
        Artboard.getInstance().artboard.appendChild(this._element);
        CustomElement.init(this._element);
    }
    revert(){
        Artboard.getInstance().artboard.removeChild(this._element);
    }

}
window.ImportationCommand = ImportationCommand;

class InsertTextCommand extends ImportationCommand{
    constructor(){
        super(InsertTextCommand.createTextElement(), false);
    }
    static createTextElement(){
        const svg = document.createElementNS(SvgUtils.NS, 'svg');
        svg.setAttribute('is-text', 'true');
        svg.setAttribute('viewBox', '0 0 400 400');
        const foreign = document.createElementNS(SvgUtils.NS, 'foreignObject');
        foreign.setAttribute('height', 50);
        foreign.setAttribute('width', 300);
        foreign.setAttribute('fill', 'black');
        
        svg.appendChild(foreign);
        const div = document.createElement('div');
        div.style.height = '100%';
        div.style.width = '100%';
        div.style["display"] = "table";
        div.style["text-align"] = "center";

        foreign.appendChild(div);

        const divChild = document.createElement('div');
        divChild.style.height = '100%';
        divChild.style.width = '100%';
        divChild.style["display"] = "table-cell";
        divChild.style["vertical-align"] = " middle";
        divChild.innerHTML = "Changer ce texte";
        
        div.appendChild(divChild);


        foreign.addEventListener('dblclick', (e) => {
            div.addEventListener('mousedown', InsertTextCommand.stopPropagation);
            divChild.setAttribute('contenteditable', true)
            divChild.focus();
        });
        divChild.addEventListener('blur', () => {
            div.removeEventListener('mousedown', InsertTextCommand.stopPropagation);
            divChild.removeAttribute('contenteditable');
        })

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type == "attributes") {
                    if(mutation.attributeName == "fill"){
                        divChild.style.color = foreign.getAttribute("fill");
                    }
                }
            });
            });
        observer.observe(foreign, {
            attributes: true
        });
        return svg;
    }
    static stopPropagation(e){
        e.stopPropagation();
    }

}
window.InsertTextCommand = InsertTextCommand;

class ChangeAttributesCommand extends Command{
    _oldValue;
    _newValue;
    _attribute;
    _elements;
    _isStyle;
    _revertCallback;
    _executeCallback;
    constructor(selector, attribute, oldValue, newValue, isStyle = false){
        super();
        if(!selector){
            this._elements = [CurrentElement.selectedElement];
        }else{
            this._elements = CurrentElement.selectedElement.querySelectorAll(selector);
        }
        this._attribute = attribute;
        this._newValue = newValue;
        this._isStyle = isStyle;
        this._oldValue = oldValue;
    }
    execute(){
        console.log(this._oldValue, this._newValue);
        if(!this._isStyle){
            for(const toChange of this._elements){
                toChange.setAttribute(this._attribute, this._newValue);
            }
        }else{
            for(const toChange of this._elements){
                toChange.style[this._attribute] = this._newValue;
            }
        }
        if(this._executeCallback && typeof this._executeCallback == "function"){
            this._executeCallback();
        }
    }
    revert(){
        if(!this._isStyle){
            for(const toChange of this._elements){
                toChange.setAttribute(this._attribute, this._oldValue);
            }
        }else{
            for(const toChange of this._elements){
                toChange.style[this._attribute] = this._oldValue;
            }
        }
        if(this._revertCallback && typeof this._revertCallback == "function"){
            this._revertCallback();
        }
    }
    setRevertCallback(callback){
        this._revertCallback = callback;
    }
    setExecuteCallback(callback){
        this._executeCallback = callback;
    }
}

window.ChangeAttributesCommand = ChangeAttributesCommand;

class CurrentElement{
    static _selectedElement;
    static _isDragging;
    static _offset;
    static get selectedElement() {
        return this._selectedElement;
    }
    static set selectedElement(_selectedElement) {
        const attributes = document.querySelector("#attributes");
        attributes.innerHTML = "";
        if(this._selectedElement){
            this._selectedElement.removeEventListener('handler', Handler.getInstance().put);
            this._selectedElement.classList.remove("selected");
        }
        this._selectedElement = _selectedElement;
        if(this._selectedElement){
            while(!(this._selectedElement instanceof SVGSVGElement)){
                this._selectedElement = this._selectedElement.parentNode;
            }
            CustomElement.init(this._selectedElement, true);
            this._selectedElement.classList.add("selected");
            new OpacityController("#attributes");
            var count = this._selectedElement.getAttribute("data-colors-count");
            count = Number(count);
            for(var i = 0; i < count; i++){
                new ColorController("#attributes", i, this._selectedElement.querySelector(`*[fill-id="${i}"`).getAttribute("fill"));
            }
        }else{
            Handler.getInstance().hide();
        }
    }
    static get isDragging () {
        return this._isDragging;
    }
    static set isDragging (_isDragging) {
        this._isDragging = _isDragging;
    }
    static get offset () {
        return this._offset;
    }
    static set offset (_offset) {
        this._offset = _offset;
    }
}

window.CurrentElement = CurrentElement;

class CustomElement{
    static init(element, selectioned = false){
        element.addEventListener('handler', Handler.getInstance().put);
        DragCommand.attachDragEvent(element);
        CustomElement._addFillAttributes(element);
        if(selectioned){
            Handler.getInstance().dispatchHandler(element);
        }
    }
    static _addFillAttributes(element){
        var existingColors = new Set();
        const fillables = element.querySelectorAll("*[fill]");
        for(const fillable of fillables){
            const color = fillable.getAttribute("fill");
            existingColors.add(color);
        }
        const tabExistingColors = Array.from(existingColors);
        element.setAttribute("data-colors-count", tabExistingColors.length);
        for(var i = 0; i < tabExistingColors.length; i++){
            const color = tabExistingColors[i];
            const currentColored = element.querySelectorAll("*[fill='" + color + "']");
            for(const current of currentColored){
                current.setAttribute("fill-id", "" + i);
            }
        }
    }
}

window.CustomElement = CustomElement;
class Handler{
    _instance = null;
    _handler = null;
    _handleTL;
    _handleTR;
    _handleBR;
    _handleBL;
    _startRect = null;
    constructor(){
        this._handler = document.querySelector("#handler");
        this._handleTL = document.querySelector("#handle-tl");
        this._handleTR = document.querySelector("#handle-tr");
        this._handleBR = document.querySelector("#handle-br");
        this._handleBL = document.querySelector("#handle-bl");
    }
    static getInstance(){
        if(!this._instance){
            this._instance = new Handler();
            this._instance._init();
        }
        return this._instance;
    }
    _init(){
        const mouseupEventHandleTL = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); if(event instanceof MouseEvent) document.removeEventListener('mouseup', mouseupEventHandleTL); if(event instanceof TouchEvent) document.removeEventListener('touchend', mouseupEventHandleTL); if(event instanceof MouseEvent) Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTL); if(event instanceof TouchEvent) Artboard.getInstance().artboard.removeEventListener('touchmove', Handler.getInstance().scaleTL);}
        const mouseupEventHandleTR = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); if(event instanceof MouseEvent) document.removeEventListener('mouseup', mouseupEventHandleTR); if(event instanceof TouchEvent) document.removeEventListener('touchend', mouseupEventHandleTR); if(event instanceof MouseEvent) Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTR); if(event instanceof TouchEvent) Artboard.getInstance().artboard.removeEventListener('touchmove', Handler.getInstance().scaleTR);}
        const mouseupEventHandleBR = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); if(event instanceof MouseEvent) document.removeEventListener('mouseup', mouseupEventHandleBR); if(event instanceof TouchEvent) document.removeEventListener('touchend', mouseupEventHandleBR); if(event instanceof MouseEvent) Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBR); if(event instanceof TouchEvent) Artboard.getInstance().artboard.removeEventListener('touchmove', Handler.getInstance().scaleBR);}
        const mouseupEventHandleBL = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); if(event instanceof MouseEvent) document.removeEventListener('mouseup', mouseupEventHandleBL); if(event instanceof TouchEvent) document.removeEventListener('touchend', mouseupEventHandleBL); if(event instanceof MouseEvent) Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBL); if(event instanceof TouchEvent) Artboard.getInstance().artboard.removeEventListener('touchmove', Handler.getInstance().scaleBL);}
        const mousedownEventHandleTL = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); if(event instanceof MouseEvent) document.addEventListener('mouseup', mouseupEventHandleTL); if(event instanceof TouchEvent) document.addEventListener('touchend', mouseupEventHandleTL); if(event instanceof MouseEvent) Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTL); if(event instanceof TouchEvent) Artboard.getInstance().artboard.addEventListener('touchmove', Handler.getInstance().scaleTL);}
        const mousedownEventHandleTR = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); if(event instanceof MouseEvent) document.addEventListener('mouseup', mouseupEventHandleTR); if(event instanceof TouchEvent) document.addEventListener('touchend', mouseupEventHandleTR); if(event instanceof MouseEvent) Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTR); if(event instanceof TouchEvent) Artboard.getInstance().artboard.addEventListener('touchmove', Handler.getInstance().scaleTR);}
        const mousedownEventHandleBR = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); if(event instanceof MouseEvent) document.addEventListener('mouseup', mouseupEventHandleBR); if(event instanceof TouchEvent) document.addEventListener('touchend', mouseupEventHandleBR); if(event instanceof MouseEvent) Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBR); if(event instanceof TouchEvent) Artboard.getInstance().artboard.addEventListener('touchmove', Handler.getInstance().scaleBR);}
        const mousedownEventHandleBL = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); if(event instanceof MouseEvent) document.addEventListener('mouseup', mouseupEventHandleBL); if(event instanceof TouchEvent) document.addEventListener('touchend', mouseupEventHandleBL); if(event instanceof MouseEvent) Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBL); if(event instanceof TouchEvent) Artboard.getInstance().artboard.addEventListener('touchmove', Handler.getInstance().scaleBL);}
        this._handleTL.addEventListener('mousedown', mousedownEventHandleTL);
        this._handleTR.addEventListener('mousedown', mousedownEventHandleTR);
        this._handleBR.addEventListener('mousedown', mousedownEventHandleBR);
        this._handleBL.addEventListener('mousedown', mousedownEventHandleBL);
        this._handleTL.addEventListener('touchstart', mousedownEventHandleTL);
        this._handleTR.addEventListener('touchstart', mousedownEventHandleTR);
        this._handleBR.addEventListener('touchstart', mousedownEventHandleBR);
        this._handleBL.addEventListener('touchstart', mousedownEventHandleBL);
        document.querySelector("#btn-up").addEventListener('click',  (event) => {
            Artboard.getInstance().stackControl.do(new LayerCommand(CurrentElement.selectedElement, 'up'));
        })
        document.querySelector("#btn-down").addEventListener('click',  (event) => {
            Artboard.getInstance().stackControl.do(new LayerCommand(CurrentElement.selectedElement, 'down'));
        })
        document.querySelector("#btn-clone").addEventListener('click', (event) => {
            Artboard.getInstance().stackControl.do(new DuplicateCommand(CurrentElement.selectedElement));
        })
        document.querySelector("#btn-trash").addEventListener('click', (event) => {
            Artboard.getInstance().stackControl.do(new DeleteCommand(CurrentElement.selectedElement));
        } )
    }
    
    dispatchHandler(element){
        element.dispatchEvent(new CustomEvent('handler', {detail : {rectangle : SvgUtils.getRectOfElement(element)}}));
    }
    put(event){
        var {x,y,width, height} = event.detail.rectangle.toObject();
        const handler = document.querySelector("#handler");
        handler.style.left = x + "px";
        handler.style.top = y + "px";
        handler.style.width = width + "px";
        handler.style.height = height + "px";
        handler.style.display = "block";
    }
    hide(){
        this._handler.style.display = "none";
    }

    scaleBR(event){
        var element = CurrentElement.selectedElement;
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        if(element){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(element).toObject();
            var positionMouse = SvgUtils.getMousePosition(event);
            width = positionMouse.x - Number(x);
            height = positionMouse.y - Number(y);
            if(width > 0 && height > 0)
                SvgUtils.setRect(element, x,y,width,height);
        }
    }
    scaleTL(event){
        var element = CurrentElement.selectedElement;
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        if(element){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(element).toObject();
            var oldX = x;
            var oldY = y;
            var positionMouse = SvgUtils.getMousePosition(event);
            x = positionMouse.x;
            y = positionMouse.y;
            width += oldX - x;
            height += oldY - y;
            if(width > 0 && height > 0)
                SvgUtils.setRect(element, x,y,width,height);
        }
    }
    scaleTR(event){
        var element = CurrentElement.selectedElement;
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        if(element){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(element).toObject();
            var oldY = y;
            var positionMouse = SvgUtils.getMousePosition(event);
            y = positionMouse.y;
            width = positionMouse.x - Number(x);
            height += oldY - y;
            if(width > 0 && height > 0)
                SvgUtils.setRect(element, x,y,width,height);
        }
    }
    scaleBL(event){
        var element = CurrentElement.selectedElement;
        if(element.getAttribute('is-text') == 'true'){
            element = element.querySelector('foreignObject');
        }
        if(element){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(element).toObject();
            var oldX = x;
            var positionMouse = SvgUtils.getMousePosition(event);
            x = positionMouse.x;
            height = positionMouse.y - Number(y);
            width += oldX - x;
            if(height > 0 && width > 0)
                SvgUtils.setRect(element, x,y,width,height);
        }
    }

}

window.Handler = Handler;

class Artboard{
    _instance = null;
    _artboard = null;
    _stackControl = null;
    static getInstance(){
        if(!this._instance){
            this._instance = new Artboard();
            this._instance._init();
        }
        return this._instance;
    }
    
    _init(){
        this._stackControl = new StackControl();
        this._artboard = document.querySelector("svg#artboard");
        this._artboard.addEventListener('click', function(event) {
            if(!ColorController.isShown){
                if(!CurrentElement.isDragging && event.currentTarget == event.target){
                    CurrentElement.selectedElement = null;
                }
            }
        })
        this._attachKeyboardEvents();
        this._attachElementEvents();
        this._attachDownloadEvents();
    }
    _attachKeyboardEvents(){
        document.addEventListener('keyup', (event) => {
            if(CurrentElement.selectedElement){
                if(event.which == 46){
                    this._stackControl.do(new DeleteCommand(CurrentElement.selectedElement));
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if(event.ctrlKey && event.key == 'z'){
                Artboard.getInstance().stackControl.back();
            }
            if(event.ctrlKey && event.key == 'y'){
                Artboard.getInstance().stackControl.forward();
            }
        })
    }
    _attachElementEvents(){
        const elements = this._artboard.querySelectorAll("svg.element");
        for(const element of elements){
            CustomElement.init(element);
        }
    }
    _attachDownloadEvents(){
        const png = document.querySelector("#btn-download-png");
        png.addEventListener('click', SvgUtils.saveIntoPng);
    }

    get artboard () {
        return this._artboard;
    }
    get stackControl () {
        return this._stackControl;
    }
}
window.Artboard = Artboard;

class OpacityController {
    _inputElement;
    _valueElement;
    _lastOpacity;
    constructor(containerSelector){
        const div = document.createElement("div");
        div.innerHTML = 
        `
            <div id="btn-group-opacity" class="btn-group">
              <button id="btn-opacity" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fa fa-adjust" style="font-size: 20px;"></i>
              </button>
              <ul class="dropdown-menu">
                <li id="opacity-container">
                    <div>
                        <div>Opacity </div>
                        <div><input id="opacity-input" type="range" value="100"></div>
                        <div id="opacity-value">100%</div>
                    </div>
                </li>
              </ul>
            </div>
        `;
        document.querySelector(containerSelector).appendChild(div);
        this._inputElement = document.querySelector("#opacity-input");
        this._valueElement = document.querySelector("#opacity-value");
        this._inputElement.addEventListener('change', (event) => {
            Artboard.getInstance().stackControl.do(new ChangeAttributesCommand(null, "opacity", this._lastOpacity, Number(event.currentTarget.value) / 100, true));
        })
        this._inputElement.addEventListener('input', (event) => {
            this._valueElement.innerHTML = event.currentTarget.value +"%";
            CurrentElement.selectedElement.style.opacity = Number(event.currentTarget.value) / 100;
        })
            
        $('#btn-group-opacity').on('show.bs.dropdown', () => {
            this._lastOpacity = CurrentElement.selectedElement.style["opacity"] ? CurrentElement.selectedElement.style["opacity"] : 1;
            var currentOpacity = Math.round(this._lastOpacity * 100);
            this._valueElement.innerHTML = currentOpacity +"%";
            this._inputElement.value = currentOpacity;
        })
    }
}
window.OpacityController = OpacityController;

class ColorController{
    _isChanged = false;
    _lastColor = null;
    static _isShown = false;
    static set isShown (value){
        this._isShown = value;
    }
    static get isShown (){
        return this._isShown;
    }
    constructor(containerSelector, num, color){
        const div = document.createElement("div");
        div.innerHTML = 
        `
        <input type="text" id="color-${num}" class="form-control color-input">
        `;
        document.querySelector(containerSelector).appendChild(div);
        const itemToColor = CurrentElement.selectedElement.querySelectorAll(`*[fill-id="${num}"]`);
        $(`#color-${num}`).spectrum({
            type: "color",
            color: color,
            show: (color) => {
                this._lastColor = color;
                ColorController.isShown = true;
            },
            change: (color) => {
                this._isChanged = true;
                var colorChanger = new ChangeAttributesCommand(`*[fill-id="${num}"]`, "fill", this._lastColor.toRgbString(), color.toRgbString());
                colorChanger.setRevertCallback(() => {
                    $(`#color-${num}`).spectrum("set", this._lastColor.toRgbString());
                })
                colorChanger.setExecuteCallback(() => {
                    $(`#color-${num}`).spectrum("set", color.toRgbString());
                })
                Artboard.getInstance().stackControl.do(colorChanger);
            },
            move: (color) => {
                for(const toChange of itemToColor){
                    toChange.setAttribute("fill", color.toRgbString());
                }
            },
            hide: (color) => {
                ColorController.isShown = false;
                if(this._isChanged){
                    this._isChanged = false;
                }else{
                    for(const toChange of itemToColor){
                        toChange.setAttribute("fill", this._lastColor.toRgbString());
                    }
                }
            }

        })
    }
}

window.ColorController = ColorController;

class TextController{ 
    
}
window.TextController = TextController;