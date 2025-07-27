export class GameWon extends HTMLElement {
    constructor(score, difficulty) {
        super()
        this.gameScore = score;
		switch (difficulty) {
			case "easy":
			    this.gameDifficulty =  0;
                break;
            case "medium":
                this.gameDifficulty =  1;
                break;
            case "hard":
                this.gameDifficulty =  2;
                break;
            default:
                console.error("Something went wrong.");
        }
    }
    connectedCallback() {
        const header = document.createElement("h2");
        header.textContent = "CONGRATS! You Won!"
        this.appendChild(header)
        const scoreDisplay = document.createElement("p");
        scoreDisplay.textContent = `Your time: ${this.gameScore} seconds`;
        this.appendChild(scoreDisplay);
        const statusMessage = document.createElement("p");
        statusMessage.textContent = "Checking high scores...";
        this.appendChild(statusMessage);
        this.statusMessage = statusMessage;
        checkHighScores(this);
    }
    async sendScore(payload) {
        const resource = "/scores/new";
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }
        try {
            const response = await fetch(resource, options);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const json = await response.json();
            this.updateDisplay(payload, json);
        }
        catch (error) {
            console.error(`Fetch problem: ${error.message}`);
        }
    }
}
customElements.define("game-won", GameWon);


async function checkHighScores(gameWon) {
	const url = `/scores/?game=minesweeper&difficulty=${gameWon.gameDifficulty}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const scores = await response.json();
        scores.sort((a, b) => a.value - b.value);
        const longest = scores.at(-1).score;
        if (gameWon.gameScore < longest) {
            gameWon.statusMessage.textContent = "NEW HIGH SCORE";
            newHighScore(gameWon);
        } else {
            gameOver(gameWon);
        }
    } catch (error) {
        console.error(error.message);
    }
}


function newHighScore(gameWon) {
    const form = document.createElement("form");
    gameWon.highScoreForm = form;
    const label = document.createElement("label");
    label.textContent = "Enter a 3-letter name:";
    label.setAttribute("for", "name");
    form.appendChild(label);
    const input = document.createElement("input");
    input.type = "text";
    input.id = "name";
    input.name = "name";
    form.appendChild(input);
    const captcha = document.createElement("div");
    captcha.classList.add("h-captcha");
    captcha.setAttribute("data-sitekey", "ce7c55e8-26d2-4b54-a2d6-17acaf588408"); 
    form.appendChild(captcha);
    const submit = document.createElement("input");
    submit.type = "submit";
    submit.value = "submit";
    form.appendChild(submit);
    gameWon.appendChild(form);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        new FormData(form);
    });
    form.addEventListener("formdata", (event) => {
        const payload = new Object();
        payload["game"] = gameWon.game;
        payload["difficulty"] = gameWon.gameDifficulty;
        payload["score"] = gameWon.gameScore;
        payload["name"] = event.formData.entries()[0][1];
        validName = validateName(payload["name"]) 
        if (validName) {
            gameWon.sendScore(payload);
        }
        else {
            gameWon.statusMessage.textContent = "Name must be three letters."
        }
    });
}



export class GameOver extends HTMLElement {
    constructor() {
        super()
    }
    connectedCallback() {
        this.textContent = "game over";
    }
}
customElements.define("game-over", GameOver);
