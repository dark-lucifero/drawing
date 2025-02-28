let canvas = new fabric.Canvas('canvas', {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "white",
});


let state;

let undo = [];
let redo = [];
let currentColor = '#000000';
let brushWidth = 5;

const deleteBtn = document.querySelector('.deleteBtn');
const drawingModeBtn = document.querySelector('.drawingMode');

const textBtn = document.querySelector('.textBtn');

save();

const copyBtn = document.querySelector('.copy');
const pasteBtn = document.querySelector('.paste');

const undoBtn = document.querySelector('.undoBtn')
const rodoBtn = document.querySelector('.rodoBtn')

const saveBtn = document.querySelector('.saveBtn');

document.querySelectorAll('.objects li').forEach((li) => {
    
    li.addEventListener('click', ()=> {
        const data = li.dataset.name;
        
        const obj = new fabric[data]({
            fill: null,
            stroke: currentColor,
            strokeWidth: 2,
            radius: 50,
            width:100,
            height: 100,
            left: getCenter().x - 50,
            top: getCenter().y - 50,
            borderColor: '#2884c6',
            transparentCorners: false,
            cornerStrokeColor: '#2884c6',
            cornerStrokeSize:90,
            cornerColor: 'rgba(255, 255, 255, 50)',
            cornerSize: 8,
            padding: 10,
            rx: 15, 
            ry: 15,
            shadow: new fabric.Shadow({
                color: 'rgba(0, 0, 0, 0.4)',
                blur: 10, 
                offsetX: 5, 
                offsetY: 5,
            })
        });
        
        setMustDraw(false)
        canvas.add(obj);
        canvas.renderAll();
        save();
        
    });
    
});


canvas.on('object:modified', function() {
    save();
});


const pickr = Pickr.create({
    el: '.color-picker',
    default: '#000000',
    closeWithKey: 'Escape',
    theme: 'nano',
    comparison: false,
    padding: 8,
    swatches: [],
    
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            hex: true,
            rgba: true,
            hsla: false,
            hsva: false,
            cmyk: false,
            input: true,
            clear: false,
            save: false
        }
    }
});

pickr.on("changestop", (a, instance) => {
    
    const colorInHex = instance._color.toHEXA().toString();
    currentColor = colorInHex;
    
    const selectedObjects = canvas.getActiveObjects();
    
    setMustDraw(canvas.isDrawingMode)

    if(selectedObjects.length == 0) return;
    
    selectedObjects.forEach((selectedObject) => {
        
        selectedObject.set({
            "fill": fillCheckbox.checked ? colorInHex : null,
            'stroke' : strockCheckbox.checked ? colorInHex : null
        });
        
    });
    
    canvas.renderAll();
    save();
    
});


deleteBtn.addEventListener("click", () => {
    const selectedObjects = canvas.getActiveObjects();
    
    selectedObjects.forEach((selectedObject) => {
        canvas.remove(selectedObject)
    });
    
    canvas.discardActiveObject();
    canvas.renderAll();
    save()
    
});

drawingModeBtn.addEventListener('click' , () => {
    setMustDraw(!canvas.isDrawingMode)
})

copyBtn.addEventListener('click', () => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length <= 0) return;
    
    const svgStrings = activeObjects.map(obj => obj.toSVG()).join('\n');
    
    const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg">\n${svgStrings}\n</svg>`;
    
    copyToClipboard(svgOutput)
});

pasteBtn.addEventListener('click', () => {
    navigator.clipboard.readText()
    .then(text => {
        const isTextASvg = text.trim().startsWith('<svg');
        
        if(!isTextASvg) {
            console.log("coming soon");
            const textObj = new fabric.Text(text, {
                left: 100,   
                top: 100, 
                fontSize: 24,  
                fill: currentColor,
            });
            canvas.add(textObj);
            canvas.renderAll();
            save()
            return 
        }

        fabric.loadSVGFromString(text, (objects, options) => {
            
            objects.forEach((obj) => canvas.add(obj));
            canvas.renderAll();
            save();
            
        });
        
    })
    .catch(err => {
        console.error('Failed to read clipboard contents: ', err);
    });
    
});

textBtn.addEventListener('click', () => {
    const textbox = new fabric.Textbox('Hello, Fabric.js!', {
        left: getCenter().x - 50,
        top: getCenter().y - 50,
        width: 200,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: 'black',
        textAlign: 'center',
        editable: true,
    });

    canvas.add(textbox);
})


document.addEventListener('keydown', (event) => {
    // undo
    if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        replay(undo, redo);
    }
    
    // redo
    else if (event.ctrlKey && event.key.toLowerCase()=== 'z' && event.shiftKey) {
       replay(redo, undo);
    }
    
    // redo
    if(event.ctrlKey && event.key.toLowerCase() === 'y' && !event.shiftKey) {
        replay(redo, undo);
    }
    
    //copy
    if (event.ctrlKey && event.key.toLowerCase() === 'c' && !event.shiftKey) {
        event.preventDefault();

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length <= 0) return;
         
        const svgStrings = activeObjects.map(obj => obj.toSVG()).join('\n');
        
        const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg">\n${svgStrings}\n</svg>`;
        
        copyToClipboard(svgOutput)
    }
    
    // paste
    if (event.ctrlKey && event.key.toLowerCase() === 'v' && !event.shiftKey) {
        event.preventDefault();
        
        navigator.clipboard.readText()
        .then(text => {
            const isTextASvg = text.trim().startsWith('<svg');
            
            if(!isTextASvg) {
                console.log("coming soon");
                const textObj = new fabric.Text(text, {
                    left: 100,   
                    top: 100, 
                    fontSize: 24,  
                    fill: currentColor,
                });
                canvas.add(textObj);
                canvas.renderAll();
                save()
                return 
            }
            
            fabric.loadSVGFromString(text, (objects, options) => {
                
                objects.forEach((obj) => canvas.add(obj));
                canvas.renderAll();
                save();
                
            });
            
        })
        .catch(err => {
            console.error('Failed to read clipboard contents: ', err);
        });
        
    }
    
    // pen mode
    if (event.ctrlKey && event.key.toLowerCase() === 'p' && !event.shiftKey) {
        setMustDraw(!canvas.isDrawingMode)
    }

});


undoBtn.addEventListener("click", () => {
    replay(undo, redo);
})

rodoBtn.addEventListener("click", () => {
    replay(redo, undo);
})

saveBtn.addEventListener('click', () => {
    // const svgData = canvas.toSVG();
    // // Convert canvas to SVG
    // const blob = new Blob([svgData], { type: "image/svg+xml" });
    // const link = document.createElement("a");
    
    // link.href = URL.createObjectURL(blob);
    // link.download = "canvas.svg";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    
    
    
    const dataURL = canvas.toDataURL('image/png'); 
    window.ReactNativeWebView.postMessage(dataURL);


})


function save() {
    redo = [];

    if (state) {
        undo.push(state);
    }
    
    state = JSON.stringify(canvas);
}

function replay(playStack, saveStack) {
    saveStack.push(state);
    
    state = playStack.pop();

    canvas.clear();
    canvas.setBackgroundColor("white");
    
    canvas.loadFromJSON(state, function() {
        canvas.renderAll();
    });
}


function getCenter() {
    return {
        x: window.innerWidth/ 2,
        y: window.innerHeight /2
    }
}

function setMustDraw(bool = true) {
    canvas.isDrawingMode = bool;
    
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = brushWidth; 
    
    canvas.freeDrawingBrush.shadow = new fabric.Shadow({
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 10, 
        offsetX: 5, 
        offsetY: 5
    });
    
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    .then(() => {
        console.log('Text copied to clipboard:', text);
    })
    .catch(err => {
        console.error('Failed to copy text: ', err);
    });
}




canvas.on('object:modified', function(e) {
    const obj = e.target;
    
    if (obj.type == "circle") return;
    
    if(e.action == 'scale' || e.action == "scaleY" || e.action == 'scaleX') {
        
        if(obj.type == "textbox") {
            obj.set({
                fontSize: obj.fontSize * obj.scaleY,
                scaleX: 1,
                scaleY: 1,
            });
            canvas.renderAll();
        }
        
        
        obj.set({
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            scaleX: 1,
            scaleY: 1,
        });
        
        canvas.renderAll();
        
    }
    
});
