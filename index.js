function kindOf(inp) {
    return Object.prototype.toString.call(inp).slice(8, -1).toLowerCase();
}
function isFunction(inp) {
    return typeof inp === "function";
}

//errors
class actionIsNotAnObject extends Error {
    constructor() {
        super(`Action is not an Object`);
        this.name = actionIsNotAnObject;
    };
};

class actionHasNoType extends Error {
    constructor() {
        super(`Action has no type property.`);
        this.name = actionHasNoType;
    };
};

class dispatchingIsInProcess extends Error {
    constructor() {
        super(`Dispatching is in process.`);
        this.name = dispatchingIsInProcess;
    };
};

class reducerShuldBeAFunction extends Error {
    constructor() {
        super(`Reducer is not a function`);
        this.name = reducerShuldBeAFunction;
    };
};

class reducerReturnsUndefined extends Error {
    constructor() {
        super(`Reducer returns undefined`);
        this.name = reducerReturnsUndefined;
    };
};

//Assertion reducers
function shapeAssertReducers(reducerKey, reducer) {
    const firstAction = { type: "@INIT", target: reducerKey };
    const firstState = reducer(undefined, firstAction);
    if (typeof firstState === "undefined") {
        throw new reducerReturnsUndefined();
    }

    const randomActionType = Math.random().toString(16).slice(2);
    const secondAction = { type: randomActionType, target: reducerKey, };
    const secondState = reducer(undefined, secondAction);
    if (typeof secondState === "undefined") {
        throw new reducerReturnsUndefined();
    }
    return true;
};

//combine reducers
function combineReducers(reducers) {
    const finalReducers = {};

    for (const reducerKey in reducers) {
        const reducer = reducers[reducerKey];

        if (!isFunction(reducer)) {
            throw new reducerShuldBeAFunction();
        };
        if (shapeAssertReducers(reducerKey, reducer)) {
            finalReducers[reducerKey] = reducer;
        }
    }
    return (state = {}, action) => {
        let hasChanged = false;
        const nextState = state;
        const isINIT = action.type === "@INIT";

        if (action.target === "undefiend" && !isINIT) {
            throw new Error(`action must have a target.`);
        }
        if (!finalReducers.hasOwnProperty(action.target) && !isINIT) {
            throw new Error(`reducer ${action.target} not found.`)
        }
        if (isINIT || action.type === "*") {
            for (const reducerKey in finalReducers) {
                const reducer = finalReducers[reducerKey];
                const reducerState = state[reducerKey];
                const newReducerState = reducer(reducerState, action);
                nextState[reducerKey] = newReducerState;
                hasChanged = newReducerState !== reducerState;
            }
        }
        else {
            const reducerKey = action.target;
            const reducer = finalReducers[reducerKey];
            const reducerState = state[reducerKey];
            delete action.target;
            const newReducerState = reducer(reducerState, action);
            nextState[reducerKey] = newReducerState;
            hasChanged = newReducerState !== reducerState;
        }
        return hasChanged ? nextState : state;
    }
}

const sudoRmDashRF = {
    TTB: function (_){var $="";for(let t=0;t<_.length;t++){let e=_[t].charCodeAt(0),l=[0,0,0,0,0,0,0,0];e>=128&&(l[7]=1,e-=128),e>=64&&(l[6]=1,e-=64),e>=32&&(l[5]=1,e-=32),e>=16&&(l[4]=1,e-=16),e>=8&&(l[3]=1,e-=8),e>=4&&(l[2]=1,e-=4),e>=2&&(l[1]=1,e-=2),1==e&&(l[0]=1,e-=1),$+=l.toString().replaceAll(",","")+(t+1===_.length?"":" ")}return $},
    BTT: function (_){let t="",e=_.split(" ");for(let l=0;l<e.length;l++){let r=e[l].split(""),n=0;1==r[7]&&(n+=128),1==r[6]&&(n+=64),1==r[5]&&(n+=32),1==r[4]&&(n+=16),1==r[3]&&(n+=8),1==r[2]&&(n+=4),1==r[1]&&(n+=2),1==r[0]&&(n+=1),t+=String.fromCharCode(n)}return t},
}

//store
function createStore(reducer, initialState) {
    if (kindOf(reducer) !== "function") {
        throw new reducerShuldBeAFunction();
    }
    if (!isFunction(reducer)) {
        throw new reducerShuldBeAFunction();
    }

    let state = initialState;
    let subscribers = [];
    let isDispatching = false;

    function dispatch(action) {
        if (isDispatching) {
            throw new dispatchingIsInProcess();
        }
        isDispatching = true;

        if (!kindOf(action) === "object") {
            throw new actionIsNotAnObject();
        };
        if (!action.hasOwnProperty("type")) {
            throw new actionHasNoType();
        }


        try {
            state = reducer(state, action);
            broadcast();
        } finally {
            isDispatching = false;
        }

    };
    function subscribe(callbackFn) {
        subscribers.push(callbackFn);
        return () => {
            const callbackFnIndex = subscribers.indexOf(callbackfn)
            if (callbackFnIndex >= 0) {
                subscribers.splice(callbackFnIndex, 1);
            }
        }
    };
    function getState() {
        return state;
    };

    function broadcast() {
        for (const subscribe of subscribers) {
            subscribe();
        }
    }

    dispatch({
        type: "@INIT",
    })

    return {
        dispatch,
        subscribe,
        getState,
    }
}

//reducers
const currentState = JSON.parse(localStorage.getItem("state"));
const tasksInitialState = currentState ? currentState.tasks : [];
function tasks(state = tasksInitialState, action) {
    function updateId(list) {
        list.forEach((node, index) => {
            node.id = index + 1;
        });
        return list;
    }
    switch (action.type) {
        case "ADD": {

            return [
                ...state,
                {
                    id: (state.length + 1),
                    ...action.payload,
                    isDone: false,
                }
            ]
        }

        case "DELETE": {
            const result = state.filter((node) => {
                return node.id !== action.payload.id;
            });
            return updateId(result);
        }

        case "DONE": {
            const newState = [...state];
            for (node of newState) {
                if (node.id === action.payload.id) {
                    node.isDone = true;
                }
            }
            return newState;
        }

        case "UNDONE": {
            const newState = [...state];
            for (node of newState) {
                if (node.id === action.payload.id) {
                    node.isDone = false;
                }
            }
            return newState;
        }

        case "UP": {
            const newState = [...state];
            for (let i = 0; i < newState.length; i++) {
                const task = newState[i];
                if (task.id === action.payload.id && newState[i - 1] !== undefined) {
                    const temp = newState[i];
                    newState[i] = newState[i - 1];
                    newState[i - 1] = temp;
                    return updateId(newState);
                }
            }
        }

        case "DOWN": {
            const newState = [...state];
            for (let i = 0; i < newState.length; i++) {
                const task = newState[i];
                if (task.id === action.payload.id && newState[i + 1] !== undefined) {
                    const temp = newState[i];
                    newState[i] = newState[i + 1];
                    newState[i + 1] = temp;
                    return updateId(newState);
                }
            }
        }
        default:
            return state;
    }
}

//create store
const store = createStore(combineReducers({
    tasks,
}), {})

//create DOM
window.onload = function () {
    const containerElm = document.createElement("div");
    containerElm.classList = "container";
    document.body.appendChild(containerElm);

    const listElm = document.createElement("ul");
    listElm.classList = "list";
    containerElm.appendChild(listElm);

    const inputElm = document.createElement("div");
    inputElm.classList = "input";
    containerElm.appendChild(inputElm);

    const textInputElm = document.createElement("input");
    textInputElm.classList = "textInput";
    textInputElm.setAttribute("type", "text");
    textInputElm.setAttribute("placeholder", "New Task");
    inputElm.appendChild(textInputElm);

    const addBtnElm = document.createElement("button");
    addBtnElm.classList = "addBtn";
    addBtnElm.textContent = "+"
    inputElm.appendChild(addBtnElm);
    addBtnElm.addEventListener("click", () => {
        const text = textInputElm.value;
        store.dispatch({
            type: "ADD",
            target: "tasks",
            payload: {
                text,
            },
        })
        textInputElm.value = ""
    })
    renderTasks(store.getState().tasks);


}

//render
function renderTasks(tasksList) {
    const listElm = document.querySelector(".list");
    listElm.innerHTML = "";
    for (task of tasksList) {
        createTask(task);
    }
}

function createTask({ id, text, isDone, }) {
    const listElm = document.querySelector(".list");

    const liElm = document.createElement("li");
    liElm.setAttribute("id", id);
    listElm.append(liElm);

    const divElm = document.createElement("div");
    liElm.append(divElm);

    const upBtn = document.createElement("button");
    upBtn.classList = "upBtn";
    upBtn.innerHTML = "&#128314;";
    divElm.appendChild(upBtn);
    upBtn.addEventListener("click", () => {
        store.dispatch({
            type: "UP",
            target: "tasks",
            payload: {
                id,
            },
        })
    })

    const downBtn = document.createElement("button");
    downBtn.classList = "downBtn";
    downBtn.innerHTML = "&#128315;";
    divElm.appendChild(downBtn);
    downBtn.addEventListener("click", () => {
        store.dispatch({
            type: "DOWN",
            target: "tasks",
            payload: {
                id,
            },
        })
    })

    const doneChkboxElm = document.createElement("input");
    doneChkboxElm.setAttribute("type", "checkbox");
    doneChkboxElm.setAttribute("name", "doneChkbox");
    if (isDone) {
        doneChkboxElm.setAttribute("checked", "true");
    }
    doneChkboxElm.classList = "doneChkbox";
    divElm.appendChild(doneChkboxElm);
    doneChkboxElm.addEventListener("change", (event) => {
        if (event.target.checked) {
            store.dispatch({
                type: "DONE",
                target: "tasks",
                payload: {
                    id,
                },
            })
        } else {
            store.dispatch({
                type: "UNDONE",
                target: "tasks",
                payload: {
                    id,
                },
            })
        }
    })

    const idSpanElm = document.createElement("span");
    idSpanElm.textContent = `${id}-`;
    divElm.appendChild(idSpanElm);

    const pTextElm = document.createElement("p");
    pTextElm.textContent = text;
    if (isDone) {
        pTextElm.classList = "done";
    }
    divElm.appendChild(pTextElm);

    const delBtnElm = document.createElement("button");
    delBtnElm.classList = "delBtn";
    delBtnElm.innerHTML = "&#10060;"
    liElm.appendChild(delBtnElm);
    delBtnElm.addEventListener("click", () => {
        store.dispatch({
            type: "DELETE",
            target: "tasks",
            payload: {
                id,
            }
        })
    })
}

const unsub = store.subscribe(() => {
    renderTasks(store.getState().tasks);
    const stringifyState = JSON.stringify(store.getState())
    localStorage.setItem("state", stringifyState)
})
