const con = document.getElementById("console");

let currentLine;
let isTyping = false;
let isCommand = true;
let isLoggedIn = false;

//game data
let username = "unnamed"
let systemname = "BITA"
let day = 0
let hour = 0
let firstEmailShown = false

let emails = []

class Email{
    constructor(subject, from, body){
        this.subject = subject;
        this.from = from;
        this.body = body;
    }
}

const typeText = (target, text) => {
    let it = 0;
    text.split("").forEach((e,i) => {
        it = i;
        setTimeout(() => {
            target.innerHTML += e
        },(i+1) * 50)
    })
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        },(it+2) * 50)
    })
}

async function starting(){
    isTyping = true;
    document.title = `${username} - ${systemname}`
    await typeText(con, `Hello, welcome to ${systemname} you can start with the help command`);
    isTyping = false;
    createNewCommandLine(`<span class="console_prompt">${username}@ ${systemname}$</span>`);
}


const createNewCommandLine = (preText) => {
    if(isTyping) return;

    if(currentLine){
        currentLine.setAttribute("contenteditable", false);
        currentLine.classList.remove("current_cursor");
        currentLine.blur();
    }

    con.innerHTML += `
    <div class="console_line">
        ${preText}
        <span contenteditable="true" class="current_cursor"></span>
    </div>
    `

    currentLine = document.querySelector(".current_cursor");
    currentLine.focus();
    currentLine.addEventListener("blur", e => {
        currentLine.focus();
    })
}

const printInstantly = (html) => {
    const newElement = document.createElement('div');
    newElement.innerHTML = `${html}`
    con.appendChild(newElement);
}

window.addEventListener("keydown", async(e) => {
    if(e.key == "Enter" && isCommand){
        e.preventDefault();    
        await commandHandler();
        createNewCommandLine(`<span class="console_prompt">${username}@ ${systemname}$</span>`);
    }
});

const getInput = () => new Promise((resolve) => {
    const keydownhandler = (e) => {
        if(e.key == "Enter"){
            e.preventDefault(); 
            document.removeEventListener("keydown", keydownhandler);   
            input = currentLine.innerText;
            resolve(input);
        }
    }
    window.addEventListener("keydown", keydownhandler)
})

const getChoice = (choices) => new Promise((resolve) => {

    const choiceHolder = document.createElement('div');
    let currentChoice;
    let selectedChoice = 0;

    choices.forEach((e,i) => {  
        const newElement = document.createElement('div');
        newElement.innerText = e
        newElement.classList.add("choice");
        if(i == 0){
            newElement.classList.add("selected_choice");
            currentChoice = newElement;
        }
        choiceHolder.appendChild(newElement)
    })

    con.appendChild(choiceHolder);

    const keydownhandler = (e) => {

        if(e.key == "ArrowDown"){
            e.preventDefault(); 
            currentChoice.classList.remove("selected_choice");
            selectedChoice = (selectedChoice + 1) % choices.length;
            currentChoice = choiceHolder.children.item(selectedChoice);
            currentChoice.classList.add("selected_choice");
        }

        if(e.key == "ArrowUp"){
            e.preventDefault(); 
            currentChoice.classList.remove("selected_choice");
            selectedChoice = (selectedChoice - 1) < 0 ?  choices.length - 1 : selectedChoice - 1;
            currentChoice = choiceHolder.children.item(selectedChoice);
            currentChoice.classList.add("selected_choice");
        }

        if(e.key == "Enter"){
            e.preventDefault(); 
            document.removeEventListener("keydown", keydownhandler);   
            opt = choices[selectedChoice];
            resolve(opt);
        }
    }
    window.addEventListener("keydown", keydownhandler)
})

const helpCommandHandler = () => {
    printInstantly(`
                    <p class="normalLiner">List of all the available commands</p>
                    <p class="normalLiner"><b>clear</b> clears the console</p>
                    <p class="normalLiner"><b>fs</b> toggles fullscreen mode</p>
                    <p class="normalLiner"><b>load &lt;filename(optional argument)&gt;</b> loads your save file</p>
                    <p class="normalLiner"><b>start</b> start a new session</p>
    `)

    if(isLoggedIn){
        printInstantly(`
            <p class="normalLiner"><b>about</b> tells about you</p> 
            <p class="normalLiner"><b>quit</b> quit your session</p> 
        `)

    }
}

const saveData = () => {
    const data = {
        username,
        systemname,
        day,
        hour,
        emails
    }
    localStorage.setItem(username, JSON.stringify(data));
}

const loadCommandHandler = async(args) => {
    if(isLoggedIn){
        printInstantly("<p>Please logout before loading a new session</p>")
        return;
    }

    let savedFile = ""
    if(args.length == 0){
        isCommand = false;    
        createNewCommandLine("What is the name of the saved file: ")
        savedFile = await getInput();
        isCommand = true;
    }
    else{
        savedFile = args.join(" ")
    }
    if(!localStorage.getItem(savedFile)){
        printInstantly(`<p class="normalLiner">No savefile found with the name "${savedFile}", you may use <b>start</b> command to get started</p>`)
    }
    else{
        let x = JSON.parse(localStorage.getItem(savedFile));
        username = x.username;
        systemname = x.systemname;
        day = x.day;
        hour = x.hour;
        emails = x.emails;
        document.title = `${username} - ${systemname}`
        isLoggedIn = true;
        printInstantly(`<p class="normalLiner">Data load succesful, welcome ${username}</p>`)
        showTopbar();
    }
}

async function showMails () {
    if(emails.length == 0){
        printInstantly("<p class='normalLiner'>no emails to show</p>");
        return;
    }
    else{
        isCommand = false
        printInstantly("<p class='normalLiner'>Here is a list of your mails</p>")
        let titles = []
        emails.forEach(email => {
            titles.push(`${email.subject} - ${email.from}`)
        })
        let selected = await getChoice(titles);
        let email = emails.filter(email => `${email.subject} - ${email.from}` == selected)[0]
        printInstantly(email.body);
        isCommand = true
    }
}

async function commandHandler() {
    if(!currentLine || !currentLine.innerText) return
    const splt = currentLine.innerText.split(" ")
    const commanded = splt[0];
    const args = splt.slice(1, splt.length);
    switch(commanded){
        case 'clear': con.innerHTML = "";
                      break;
        case 'help': helpCommandHandler(args)
                     break;
        case 'fs':  if(document.fullscreenElement){
                        document.exitFullscreen().then(() => {}).catch(err => console.log(err));
                    }
                    else
                        con.requestFullscreen().then(() => {}).catch(err => console.log(err));
                    break;
        case 'load': 
            await loadCommandHandler(args);
            break;
        case 'start': 
            if(isLoggedIn){
                printInstantly("Please quit this session to start a new one")
                return
            }
            isCommand = false
            createNewCommandLine('Hello user! may I know your name(this is going to be the name of your save file, please do not use space): ');
            let inp = (await getInput()).trim();
            if(localStorage.getItem(inp)){
                printInstantly("Looks like you already have a session with the same name, what to do?")
                let choice = await getChoice(["overwrite the previous data", "load the previous data"])
                if(choice != "overwrite the previous data"){
                    await loadCommandHandler([inp])
                    isCommand = true;
                    return;
                }
                else{
                    username = inp
                }
            }else{
                username = inp
            }
            
            printInstantly(`Do you want to change the name of the system from ${systemname} to something else?`)
            let choice = await getChoice(["Yes", "No"]);
            
            if(choice == "Yes"){
                do{
                    createNewCommandLine('Please enter a new system nanme: ');
                    systemname = (await getInput()).trim();
                }while((systemname == " " ||  systemname == ""))
            }


            saveData();

            isLoggedIn = true;

            showTopbar();

            document.title = `${username} - ${systemname}`
            isCommand = true;
            break;

        case 'about':
            if(isLoggedIn){
                printInstantly(`<p class="normalLiner">
                                    Username: ${username}
                                </p>
                                <p class="normalLiner">
                                    Systemname: ${systemname}
                                </p>
                                <p class="normalLiner">
                                    Day: ${day}
                                </p>
                                <p class="normalLiner">
                                    Hour: ${hour}
                                </p>`)
            } else {
                printInstantly(`<p class="normalLiner">
                                    Please login to use this command
                                </p>`)
            }
            break;

        case 'quit':
            isLoggedIn = false
            username = "unnamed"
            systemname = 'BITA'
            emails = []
            day = 0
            hour = 0
            document.title = `${username} - ${systemname}`
            printInstantly(`<p class="normalLiner">You are logged out!</p>`);
            topbar.style.display = "none"
            break;

        case 'mails':
            if(isLoggedIn){
                await showMails();
            } else {
                printInstantly(`<p class="normalLiner">
                                    Please login to use this command
                                </p>`)
            }
            break;
            
        default: printInstantly('<p class="normalLiner">Sorry, there is no such command</p>');
    }
}

//time related stuff 
const topbar = document.getElementById("topbar");
const showTopbar = () => {
    topbar.style.display = "flex"
    topbar.innerHTML = `
        <h3>Day : ${day}</h3>
        <h3>Hour : ${hour}</h3>
        <p> | </p>
        <h3>${emails.length} email(s)</h3>
    `
}
const timingAction = () => {
    {
        if(isLoggedIn){
            hour += 1
            if(hour == 24){
                day += 1
                hour = 0
            }
            showTopbar();
            saveData();
        } else {
            topbar.style.display = "none"
        }
    }
}
setInterval(() => timingAction(), 10000)

setInterval(async () => {
    if(isLoggedIn && hour == 1 && day == 0 && !firstEmailShown){
        firstEmailShown = true;
        const currentmail = new Email(
            `Welcome onboard`,
            "AYBT Corporation",
            `<p>Respected Sir/Madam,</p>
            <p>Thank you for choosing ${systemname} OS. As a part of our partner program you will be receiving mails with some tasks. Completing those tasks helps us to keep our OS free to use. Once again thank you for choosing ${systemname} OS</p>`    
        )
        emails = [currentmail, ...emails];
        printInstantly("Received new email!");
        saveData();
        isCommand = false;
        const selectedOption = await getChoice(["View", "View Later"]);
        if(selectedOption == "View"){
            printInstantly(currentmail.body);
        }
        else {
            printInstantly("<p class='normalLiner'>Use the <b>mails</b> command to view your mails</p>")
        }
        isCommand = true;
        createNewCommandLine(`${username}@ ${systemname}$ `);
    }
}, 1000)

starting();
timingAction();