// animation functions -----------------------------------------

var offset = 0;
var position = 0;

var ready = 0;

var frontSwordSprite = 0
var subMenuQueue = [];
var queueList = [];
var magicMenu = 0;

var masterCheck = 0;

var spellBox = 0;

var cancelArea = 0;

var cursor = 0;

var finisherDuration = 0;
var castAnimation= {"black": "castBlackMagic 0.5s 1",
					"white": "castWhiteMagic 0.5s 1"
};

var weaponTypeAnimation = {"slash": {"animation": function(target){normalSlashAnimation(target);}, "delayBeforeDamage": 350},
						               "strike": {"animation": function(target){normalStrikeAnimation(target);}, "delayBeforeDamage": 600}
}

var textBox = 0;
var textBoxTxt = 0;

var globalTarget = " ";
var globalSkill = " ";

var winState = 0; // 0 for not won yet
var loseState = 0; // 0 for not defeated yet
var windowState = 0; // 0 for not choosing target, 1 for choosing target
var gameState = 1; // 1 for active, 0 for wait

var background = 0;

var attackDuration = 1000; //ms

var functionToQueue = 0;

var cancelButton = 0;

var units = {}; // dictionary of properties for each character and enemy

var slash = {"normalSword": 0};
var hitFrames = 0;

var queue = [] // list of actions; this is the flow of the battle
var queueTurn = 0;

var characterList = ["terra", "celes"];
var enemyList = ["enemy0", "enemy1", "enemy2"];
var skillMap = 0;

function flushQueue(){
	while (queue.length > 0){
		queue.shift();
	}
}

function animate({duration, draw, timing}) {

  let start = performance.now();

  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start)/duration;
    if (timeFraction > 1) 
    	timeFraction = 1;

    let progress = timing(timeFraction)

    draw(progress);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
}

function timing(timeFraction) {
	return timeFraction;
}

// NON-CHARACTER ATTACK ANIMATIONS

// slash animation
function normalSlashAnimation(target){
	let spellBox = document.querySelector("." + target + " > .spellBox")

	spellBox.style.width = "180%";
	spellBox.style.height = "180%";
	spellBox.style.top = "-40%";
	spellBox.style.left = "-40%";

	spellBox.style.animation = "normalSlashAnimation 0.2s linear 1";

	setTimeout(function(){
		spellBox.style.animation = "none";
	}, 800);	
}

// strike animation
function normalStrikeAnimation(target){
  let spellBox = document.querySelector("." + target + " > .spellBox")

	spellBox.style.width = "220%";
	spellBox.style.height = "220%";
	spellBox.style.top = "-40%";
	spellBox.style.left = "-40%";

	spellBox.style.animation = "normalStrikeAnimation 0.5s linear 1";

	setTimeout(function(){
		spellBox.style.animation = "none";
	}, 800);		
}

// SECONDARY WEAPON ANIMATIONS

// the animation that says swish-swoosh in front of a sword wielder
function frontSlashAnimation(character, forwardTime){
	animate({
		duration: attackDuration,
		timing(timeFraction) {
			return timeFraction;
		},
		draw(progress) {
			if (progress > forwardTime && progress <= forwardTime + 0.06){
				frontSwordSprite.style.top = parseInt(units[character]["position"].style.top) - 4 + "%";
				frontSwordSprite.style.left = parseInt(units[character]["position"].style.left) - 2.5 + "%";

				frontSwordFrames["frame1"].style.zIndex = 1;
			}
			// mid slashing font
			else if (progress > forwardTime + 0.06 && progress <= forwardTime + 0.11){
				frontSwordFrames["frame1"].style.zIndex = -1;
				frontSwordFrames["frame2"].style.zIndex = 3;
			}
			else if (progress > forwardTime + 0.11 && progress <= forwardTime + 0.16){
				frontSwordFrames["frame2"].style.zIndex = -1;
				frontSwordFrames["frame3"].style.zIndex = 3;
			}
			else if (progress > forwardTime + 0.21){
				frontSwordFrames["frame3"].style.zIndex = -1;
			}
		}
	})
}

// MENU & SUBMENU FUNCTIONS 

// function to hide fight sub menu (end turn) and start another
function popDown(character){
	units[character]["subMenu"].style.zIndex = -1;
	units[character]["active"] = false;

	subMenuQueue.shift() // REVISAR (al morir un personaje random, la submenuqueue podría no shiftear sino que hay que remover a ese personaje de su posición)

	let index = subMenuQueue.indexOf(character);

	if (index > -1) {
	  subMenuQueue.splice(index, 1);
	}

	
	setTimeout(function() {
		if (subMenuQueue.length > 0)
			popUp(subMenuQueue[0]);
	}, 100);
	
}

// function to show fight sub menu (start turn)
function popUp(character){
	if (subMenuQueue.length > 0 && subMenuQueue[0].includes(character)){
		units[character]["subMenu"].style.zIndex = 5 - subMenuQueue.length; // max z index of 4

		// if character is the first one in submenuqueue, make them the active character
		units[character]["active"] = true;
		cursor.style.top = parseInt(units[character]["position"].style.top) - 4.5 + "%";
		cursor.style.left = parseInt(units[character]["position"].style.left) + 3 + "%";
		cursor.style.zIndex = 1;

		// menu popUp animation
		animate({
			duration: 50,
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress){
				units[character]["subMenu"].style.opacity = progress;
			}
		});
	}
}

// SPRITES & SPRITE ANIMATIONS

// function to switch character sprite to newSprite
function switchSprites(character, newSprite){
	units[character]["activeSprite"].style.backgroundImage = units[character]["sprites"][newSprite];
	units[character]["activeSpriteName"] = newSprite;
}

// function to change background lighting
function backgroundLighting(start, factor, progress){
	background.style.filter = "brightness(" + String(start + factor*progress) + "%)";
}

// function to make characters pulse to indicate selectability
function spritesPulseHarder(skill){
	unitList = Object.keys(units)
	let animation = "";
	let unit = "";

	for (let i = 0; i < unitList.length; i++){
		unit = unitList[i]
		if (checkValidTarget(unit, skill)){
			if (units[unit]["activeSprite"].style.animation.includes("Cast"))
				animation = units[unit]["castAnimation"] + ", pulseHarder 1s infinite";
			else
				animation = "pulseHarder 1s infinite";

			switchAnimation(unit, animation);
			units[unit]["frontSprite"].classList.add("selectable");
		}
	}
}

// function to make characters stop pulsing
function spritesStopPulseHarder(){
	unitList = Object.keys(units)
	let animation = "";
	let unit = "";

	for (let i = 0; i < unitList.length; i++){
		unit = unitList[i]
		animation = units[unit]["activeSprite"].style.animation

		if (animation.includes("pulseHarder")){
			if(animation.includes(", pulseHarder 1s infinite"))
				animation = animation.replace(", pulseHarder 1s infinite", "")

			if(animation.includes("pulseHarder 1s infinite"))
				animation = animation.replace("pulseHarder 1s infinite", "");

			if(animation.includes("pulseHarder"))
				animation = animation.replace("pulseHarder", "");

			switchAnimation(unit, animation);
			units[unit]["frontSprite"].classList.remove("selectable")
		}
	}
}

// function to switch character active animation to animation
function switchAnimation(character, animation){
	units[character]["activeSprite"].style.animation = animation;
}

// function that determines which sprite and animation to go back to after selecting an action
function prepareForbattle(character){
	if (!lowHP(character)){
		if (units[character]["action"].includes("fight")){
			switchSprites(character, "fight");
			switchAnimation(character, "none");
			units[character]["oldAnimation"] = "none";
		}

		else if (units[character]["action"].includes("cast1")){
			switchSprites(character, "cast1");
			switchAnimation(character, units[character]["castAnimation"]);
			units[character]["oldAnimation"] = units[character]["castAnimation"];
		}

		else if (units[character]["action"].includes("idle")){
			switchSprites(character, "idle");
			switchAnimation(character, "none");
			units[character]["oldAnimation"] = "none";
		}
	}
}

// GAME ASSESSMENT

// function to display damages and evaluate win/lose conditions
function showDamage(character, target, damage){
	let unitDamage = units[target]["damage"];
	let initialTop = parseInt(unitDamage.style.top);

	units[target]["HP"] = units[target]["HP"] - damage; // deal damage to target 

	if (characterList.includes(target))
		units[target]["outerHP"].innerHTML = units[target]["HP"];

	animate({
		duration: 1000,
		timing(timeFraction) {
			return timeFraction;
		},
		draw(progress) {
			displayDamage(progress, unitDamage, damage, initialTop);
			if (gameState == 0 && progress == 1){
	   			gameState = 1;
	   			if (checkIfAlive(character)){
	   				if (character.includes("enemy"))
	   					restartEnemyBar(character);
	   				else
	   					restartAllyBar(character);
	   			}
			}
		}
	})

	// see if any side has won
	assessGame(target);
};

function displayDamage(progress, unitDamage, damage, initialTop){
	/*
	inputs: progress is the stage of a given attack animation
	*/

	if (damage < 0){
		unitDamage.style.color = "#bbd7ab";
		damage = -damage;
	}

	unitDamage.innerHTML = damage;
	unitDamage.style.zIndex = 10;

	if (progress <= 0.25){
		offset = -50.286*progress*progress + 14.286*progress + 1.7;
	}
  	else if(progress <= 0.5){
  		offset = -35.2*progress*progress + 26*progress - 4.3 + 1.7;
  	}
  	else if(progress > 0.5){
  		offset = -0.1 + 1.7
  	}

    unitDamage.style.top =  initialTop - 30*offset + "%";

	if (progress == 1){
    	unitDamage.style.zIndex = -1;
    	unitDamage.innerHTML = "";
    	unitDamage.style.top = initialTop + "%";
	}
}

// check if enemies or allies have been defeated and update the screen accordingy
function assessGame(target){
	if (!checkIfAlive(target)){
		units[target]["HP"] = 0;
		finisherDuration = attackDuration + 2000;

		if (target.includes("enemy")){ // if attacked an enemy
			switchAnimation(target, "enemyDown 0.25s 1");
			setTimeout(function(){
				units[target]["activeSprite"].style.zIndex = -1;
				units[target]["frontSprite"].style.zIndex = -1;
			}, 250)
		}
		
		else{ // if attacked an ally
		 	switchSprites(target, "down");
		 	switchAnimation(target, "none");
		 	units[target]["action"] = "down";
				
	    	units[target]["atb"].style.width = "0%";
	    	units[target]["HP"].innerHTML = 0;
	    	units[target]["outerHP"].innerHTML = 0;
	    	
	    	if(units[target]["active"]){
		 		cursor.style.zIndex = -1;
		 		cancelButton.style.zIndex = -1;
		 		maskCancelButton.style.zIndex = -1;
		 		magicMenu.style.zIndex = -1;
		 		popDown(target);
		 	}
	    	
	    	units[target]["active"] = false;
	    }
		winLose();
	}
}

function spriteAfterBattle(target, oldSprite){
	// if ally is alive
	if (checkIfAlive(target)){

		switchSprites(target, oldSprite);
		if (units[target]["action"].includes("cast1")){
			switchSprites(target, "cast1");
			switchAnimation(target, units[target]["castAnimation"]);
		}
		else
			switchAnimation(target, units[target]["oldAnimation"]);
	}
}

// function to determine if either side has won
function winLose(){
	let sumEnemyHP = 0;
	let sumCharacterHP = 0;

	// checking win conditions
	for (let i = 0; i < enemyList.length; i++){
		sumEnemyHP += units[enemyList[i]]["HP"];
	}

	if (sumEnemyHP <= 0){
		gameState = 2;
		winState = 1;
	}

	// checking defeat conditions
	for (let i = 0; i < characterList.length; i++){
		sumCharacterHP += units[characterList[i]]["HP"];
	}
	if (sumCharacterHP <= 0){
		gameState = -1;
		loseState = 1;
	}


	// if the game has ended, hide every submenu
	if (gameState == -1 || gameState == 2){
		flushQueue();
		for (let i = 0; i < characterList.length; i++){
			setTimeout(function(){
				popDown(characterList[i]);
				cancelButton.style.zIndex = -1;
				cancelArea.style.zIndex = -1;
			}, finisherDuration)	
		}
		cursor.style.zIndex = -1;
		spritesStopPulseHarder();
	}
}

// display victory screen and texts
function popTextBox(duration, text, alignment, marginLeft, paddingLeft, width){
	textBoxText.innerHTML = text;
	textBoxText.style.textAlign = alignment;
	textBoxText.style.left = paddingLeft;

	textBox.style.left = marginLeft;
	textBox.style.width = width;

	textBox.style.opacity = 0;
	textBox.style.zIndex = 1;

	animate({
		duration: duration,
		timing(timeFraction){
			return timeFraction;
		},
		draw(progress){
			if (progress < 0.05)
				textBox.style.opacity = progress/0.05
			else if (progress < 0.1)
				textBox.style.opacity = 1;
			else if(progress == 1)
				textBox.style.zIndex = -1;
		}
	})
}

function popEndBox(text, alignment, marginLeft, paddingLeft, width){
	textBoxText.innerHTML = text;
	textBoxText.style.textAlign = alignment;
	textBoxText.style.left = paddingLeft;

	textBox.style.left = marginLeft;
	textBox.style.width = width;

	textBox.style.opacity = 0;
	textBox.style.zIndex = 1;

	animate({
		duration: 50,
		timing(timeFraction){
			return timeFraction;
		},
		draw(progress){
			textBox.style.opacity = progress/0.05
			if (progress == 1)
				textBox.style.opacity = 1;
		}
	})
}

// check if a character is alive
function checkIfAlive(target){
	return (units[target]["HP"] > 0)//
}

// check if character is low on hp
function lowHP(character){
	let hp = units[character]["HP"]/units[character]["maxHP"];
	return (hp > 0 && hp <= 0.25);
}

// check if a selected target is a valid target
function checkValidTarget(target, skill){
	return ((characterList.includes(target) && (checkIfAlive(target) || skill.includes("revive"))) || (target.includes("enemy") && checkIfAlive(target)))
}

// ATB FUNCTIONS

// make animation look not so smooth (to appear more retro)
function discreteBar(progress){
	return Math.floor(40*progress)/40;
}

// ally ATB flow
function restartAllyBar(character){
	let atb = units[character]["atb"];
	let subMenu = units[character]["subMenu"];
	let turnDuration = units[character]["atbDuration"];

	atb.style.top = "35%";
	atb.style.height = "73%"; 
	atb.style.filter = "none";

	animate({
		duration: turnDuration,
		timing(timeFraction) {
			return timeFraction;
		},
		draw(progress) {
			if (!units[character]["activeSpriteName"].includes("down")){ //if character is alive
				atb.style.width = 86*discreteBar(progress) + '%';

				if (progress == 1 && winState == 0){
					subMenuQueue.push(character);

				   	popUp(character);

				   	atb.style.height = "28%";
				   	atb.style.top = "40%";
				   	atb.style.filter = "hue-rotate(160deg) saturate(2)";
				}
			}
		}
	});
}

function selectRandomTarget(){

}

// enemy ATB flow
function restartEnemyBar(enemy){
	let action = 0;
	let damage =  3;
	let target = characterList[Math.floor(Math.random() * characterList.length)];

	if (checkIfAlive(enemy)){
		animate({
			duration: units[enemy]["atbDuration"],
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress) {
				if (progress == 1 && winState == 0){
					if (enemy.includes("enemy0")){
						action = {"enemy0": function(){
							fightAnimation(enemy, target, damage, "strike");
						}};
					}
					else if (enemy.includes("enemy1")){
						action = {"enemy1": function(){
							fightAnimation(enemy, target, damage, "strike");
						}};
					}
					else if (enemy.includes("enemy2")){
						action = {"enemy2": function(){
							fightAnimation(enemy, target, damage, "strike");
						}};
					}
					
					let check = setInterval(function(){
						if (checkIfAlive(enemy)){
							clearInterval(check);
							queue.push(action);
						}
					}, 100);	
				}
			}
		});
	}
}


// CHARACTER PRE-ATTACK/SKILL/ITEM ANIMATIONS

// function to jump forward with a weapon 
function jumpForward(target, character, forwardTime){
	weapon = weapons[units[character]["weapon"]];
	
	position = units[character]["position"];

	switchSprites(character, "attack1");

	weapon.style.zIndex = 1;

	let initialLeft = parseInt(position.style.left);
	let endLeft = initialLeft - 10;

	let initialTop = parseInt(position.style.top);
	let endTop = initialTop - 5;

	let unitDamage =  units[target]["damage"];

	let upTime = 0.12;
	let downTime = forwardTime - upTime;

	animate({
		duration: attackDuration,
		timing(timeFraction) {
			return timeFraction;
		},
		draw(progress) {
			if (progress <= forwardTime){
				// move forward

				position.style.left = (initialLeft - 10*progress/forwardTime) + "%";
				weapon.style.left = parseInt(position.style.left) + 4 + "%";
				
				// jump
				if (progress <= upTime){
					position.style.top = (initialTop - 5*progress/upTime) + "%";
					weapon.style.top = parseInt(position.style.top) - 4 + "%";
					switchSprites(character, "attack1");

				}

				// fall
				else{
					switchSprites(character, "attack2");
					weapon.style.zIndex = -1;
					position.style.top = (endTop + 5*(progress - upTime)/downTime) + "%";
				}
			}

			// making sure that we are where we started
			else if (progress <= forwardTime + 0.05){
				position.style.top = initialTop + "%";
			}

			// character doesnt' move but other animation occurs until progress = 0.86
			else{
				// if character dies, it won't move at all nor change its sprite
				if (checkIfAlive(character)){
					if (progress > 0.97 - forwardTime && progress <= 1.01 - forwardTime)
						switchSprites(character, "return");
					else if (progress > 1.01 - forwardTime && progress <= 1.05 - forwardTime)
						switchSprites(character, "flipWalk");
					else if (progress > 1.05 - forwardTime && progress < 1)
						switchSprites(character, "walk");
					else if (progress == 1){
						if (lowHP(character)){
							switchSprites(character, "sit");
							units[character]["action"] = "sit";
						}						
						else{
							switchSprites(character, "idle");
							units[character]["action"] = "idle";
						}
					}
					if (progress > 1.01 - forwardTime)
						position.style.left = (endLeft + 10*(progress + forwardTime - 1)/forwardTime) + '%';
				}
			}
		}
	});
}


function skillAnimation(character, target, damage, skill){
	let textBoxDuration = 1500;
	let delay = 0;

	gameState = 0;

	target = correctTarget(target, skill);

	setTimeout(function(){
		// display skill text block
		popTextBox(textBoxDuration, skill, "center", "30%", "0", "40%");

		// pre-attack animation block (enemies and allies move)
		setTimeout(function(){
			if (character.includes("enemy")){
				delay = 540;
				switchAnimation(character, "enemyBlink 0.24s 1");

				setTimeout(function(){
					switchAnimation(character, "none");
				}, delay)
			}
			else{
				delay = 1000
				castMagicAnimation(character, skillMap[skill]["duration"]);
			}

			// attack animation block
			setTimeout(function(){
				skillMap[skill]["animation"](target, character);

				setTimeout(function(){
					showDamage(character, target, damage);

					if (lowHP(target)){
						switchSprites(target, "sit");
						switchAnimation(target, "none");
						units[target]["action"] = "sit";
					}

				}, skillMap[skill]["duration"]);
			}, delay)
			
			
		}, textBoxDuration)
	}, 1000)
}

function castMagicAnimation(character, duration){
	walkToCastMagic(character);

	setTimeout(function(){
		units[character]["skillSprite"].style.animation = castAnimation["black"];
		setTimeout(function(){
			if (checkIfAlive(character))
				walkBack(character);
			units[character]["skillSprite"].style.opacity = 1;
		}, 500 + duration + 700);
	}, 250);
}

function walkBack(character){
	let position = units[character]["position"];
	let initialLeft = parseInt(position.style.left);

	units[character]["skillSprite"].style.animation = "none";
	units[character]["oldAnimation"] = "none";
	
	switchSprites(character, "flipWalk");
	switchAnimation(character, "none");

	animate({
		duration: 150, // 500 son de la bolita
		timing(timeFraction) {
			return timeFraction;
		},
		draw(progress) {
			position.style.left = (initialLeft + 10*progress) + "%";
			if (progress > 0.5 && progress < 1)
				switchSprites(character, "return");
			else if (progress == 1){
				position.style.left = initialLeft + 10 + "%";
				if (lowHP(character)){
					switchSprites(character, "sit");
					units[character]["action"] = "sit";
				}
				else{
					units[character]["action"] = "idle";
					switchSprites(character, units[character]["action"]);
					switchAnimation(character, units[character]["oldAnimation"]);
				}
			}
		}
	});
}

function walkToCastMagic(character){
	let position = units[character]["position"];
	let initialLeft = parseInt(position.style.left);

	if (!lowHP(character)){
		switchSprites(character, "idle");
		switchAnimation(character, "none"); // CAMBIAR ESTO PARA QUE LA ANIMACIÓN DE PULSE PERMANEZCA¿
	}

	units[character]["action"] = units[character]["activeSpriteName"];
	units[character]["oldAnimation"] = units[character]["activeSprite"].style.animation;	

	animate({
			duration: 750, // 500 son de la bolita
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress) {
				if (progress <= 0.2){
					position.style.left = (initialLeft - 10*progress/0.2) + "%";
				}
				else if (progress > 0.2 && progress < 0.3){
					position.style.left = initialLeft - 10 + "%";
					switchSprites(character, "walk");
				}
				else if (progress > 0.33 && progress < 0.5){
					switchSprites(character, "cast3");
				}
				else if (progress == 1){
					if (lowHP(character)){
						switchSprites(character, "sit");
						switchAnimation(character, "none");
					}
					else{
						switchSprites(character, "cast1");
						switchAnimation(character, units[character]["castAnimation"])
					}
				}
			}
	});
}

function correctTarget(target, skill){
	let i = 0;

	if (!skill.includes("revive")){
		if (target.includes("enemy")){
			while (!checkIfAlive(target)){
				target = enemyList[i];
				i++;
			}
		}
		else{
			while (!checkIfAlive(target)){
				target = characterList[i];
				i++;
			}
		}
	}

	return target;
}

// ATTACK/SKILL/ITEM ANIMATIONS

// normal fight animation for enemies and allies
function fightAnimation(character, target, damage, weaponType){
	let forwardTime = 150;
	let downTime = 10;
	let delay = 0;
	let i = 0;

	gameState = 0; // stop everything else from happening

	target = correctTarget(target, "fight");

	setTimeout(function(){
		// pre-attack animation block (enemies and allies move)
		if (character.includes("enemy")){
			switchAnimation(character, "enemyBlink 0.24s 1");
			setTimeout(function(){
				switchAnimation(character, "none");
			}, 240)
			delay = 740;
		}
		else{
			jumpForward(target, character, forwardTime/1000);
			frontSlashAnimation(character, forwardTime/1000);
			delay = forwardTime;
		}

		// attack animation block
		setTimeout(function(){
			weaponTypeAnimation[weaponType]["animation"](target);

			let oldSprite = units[target]["activeSpriteName"];

			if (damage > 0){
				switchSprites(target, "hurt");
		    	switchAnimation(target, "none");
			}

			setTimeout(function(){
				showDamage(character, target, damage);

				if (lowHP(target)){
					oldSprite = "sit";
					units[target]["action"] = "sit";
				}

				setTimeout(function(){
					spriteAfterBattle(target, oldSprite);
				}, 50)
			}, weaponTypeAnimation[weaponType]["delayBeforeDamage"]);
		}, delay)

		// trigger win or lose event if any enemy or ally dies
		if (!checkIfAlive(target)){
			units[target]["HP"] = 0;
			finisherDuration = attackDuration + 2000;
			winLose();
		}
	}, 500);
}


// spells

// fire 1 animation
function spellAnimation(target, character, duration, spellName){
	let spellBox = document.querySelector("." + target + " > .spellBox")

	spellBox.style.width = skillMap[spellName]["width"];
	spellBox.style.height = skillMap[spellName]["height"];
	spellBox.style.top = skillMap[spellName]["top"];
	spellBox.style.left = skillMap[spellName]["left"];

	spellBox.style.animation = spellName + " " + duration/1000 + "s linear 1";

	setTimeout(function(){
		spellBox.style.animation = "none";
	}, duration);
}

// gameplay functions ---------------------------------------
function fight(target, character, option, skill){
	/*
	inputs: target is the name of the target: "terra", "enemy0", etc)
	*/

	if(option.includes("fight")){
		fightAnimation(character, target, 17, "slash");
	}
	else if(option.includes("magic")){
		damage = skillMap[skill]["power"]
		skillAnimation(character, target, skillMap[skill]["power"], skill);
	}
}

// GAME INITIALIZATION FUNCTIONS 

function initializeCharacters(c, char){
	try{
		units[c] = {"sprites":     {"idle": "url("+c+"Idle.png)",
									 "fight": "url("+c+"Fight.png)",
									 "attack1": "url("+c+"Attack1.png)",
									 "attack2": "url("+c+"Attack2.png)",
									 "return": "url("+c+"Return.png)",
									 "flipWalk": "url("+c+"FlipWalk.png)",
									 "walk": "url("+c+"Walk.png)",
									 "hurt": "url("+c+"Hurt.png)",
									 "sit": "url("+c+"Sit.png)",
									 "down": "url("+c+"Down.png)",
									 "cast1": "url("+c+"Cast1.png)",
									 "cast2": "url("+c+"Cast2.png)",
									 "cast3": "url("+c+"Cast3.png)"
									},
					"activeSprite": document.querySelector(char + " > .backgroundSprite"),
					"frontSprite": document.querySelector(char + " > .frontSprite"),
					"activeSpriteName": "idle",
					"oldAnimation": "none",
					"upperSprites": {"status": "ok"},
					"atb": document.querySelector(char + " > .atb > .barBit"), 
				    "atbDuration":  Math.floor(Math.random() * (4000 + 1 - 3000)) + 3000,
				    "subMenu": 0,
					"position": document.querySelector(char + ".allySprite"),
					"skillSprite": document.querySelector(char + "> .skillSprite"),
					"HP": parseInt(document.querySelector(char + " > .allyHP").innerHTML),
					"maxHP": 80,
					"MP": parseInt(document.querySelector(char + " > .allyMP").innerHTML),
					"outerHP": document.querySelector(char + " > .allyHP"),
					"damage" : document.querySelector(char + " > .allyDamage"),
					"active" : false,
					"action" : "idle",
					"weapon" : "sword",
					"castAnimation": c + "Cast 0.25s infinite",
					"options": {"fight": document.querySelector(char + " > .optionsList > .fightOption"),
								"magic": document.querySelector(char + " > .optionsList > .magicOption")
					}
				}
		units[c]["activeSprite"].style.backgroundImage = units[c]["sprites"]["idle"];
		units[c]["activeSprite"].style.animation = "none";
		}catch(e){}
}

function initializeEnemies(c, char){
	let min = 8000; 
  let max = 8500;

	try{
		units[c] =  {"sprites":     
													 {"idle": "url(leafer.png)",
									 					"hurt": "url(leafer.png)"
								},
								"activeSprite": document.querySelector(char + " > .enemySprite"),
								"frontSprite": document.querySelector(char + " > .frontSprite"),
								"activeSpriteName": "idle",
								"action": "idle",
								"subMenu": 0,
								"position": document.querySelector(char),
								"HP": parseInt(document.querySelector(char + " > .enemyHP").innerHTML),
								"MP": parseInt(document.querySelector(char + " > .enemyMP").innerHTML),
								"damage": document.querySelector(char + " > .enemyDamage"),
								"atbDuration":  Math.floor(Math.random() * (max + 1 - min)) + min,
								"fightDuration": 1000
		};
		
		units[c]["activeSprite"].style.backgroundImage = units[c]["sprites"]["idle"];
		units[c]["activeSprite"].style.animation = "none";
	}catch(e){}
}

function initializeSkills(){
	skillMap = {"Fire": { "html": document.querySelector(".spellFire1"),
						  "animation": function(target, character){
						  	spellAnimation(target, character, 800, "Fire");
						  },
						  "type": "black",
						  "element": "fire",
						  "duration": 800,
						  "height": "140%",
						  "width": "250%",
						  "top": "-20%",
						  "left": "-75%",
						  "power": 50, //21
						  "mpCost": 4
				},
				"Ice": { "html": document.querySelector(".spellIce1"),
						 "animation": function(target, character){
						  	spellAnimation(target, character, 500, "Ice");
						  },
						  "type": "black",
						  "element": "ice",
						  "duration": 500,
						  "height": "760%",
						  "width": "300%",
						  "top": "-630%",
						  "left": "-70%",
						  "power": 50, //21
						  "mpCost": 4
				},
				"Cure": {"html": document.querySelector(".spellCure1"),
						  "animation": function(target, character){
						  	spellAnimation(target, character, 800, "Fire");
						  },
						  "type": "black",
						  "element": "healing",
						  "duration": 800,
						  "height": "120%",
						  "width": "200%",
						  "top": "-10%",
						  "left": "-50",
						  "power": -100, //-10
						  "mpCost": 5
				},
	}

	skillMap["Fire"]["html"].addEventListener("click", function(target, character){
		fightQueue(target, "magic", "Fire");
	})

	skillMap["Ice"]["html"].addEventListener("click", function(target, character){
		fightQueue(target, "magic", "Ice");
	})

	skillMap["Cure"]["html"].addEventListener("click", function(target, character){
		fightQueue(target, "magic", "Cure");
	})
}

function initializeMiscFrames(){
	textBox = document.querySelector(".textBox");
	textBoxText = document.querySelector(".textBox > .text");

	frontSwordSprite = document.querySelector(".frontSwordFrames");

	hitFrames = document.querySelector(".hitFrames");

	hitFrames.style.top = "0%";
	hitFrames.style.left = "0%";

	slash["normalStrike"] = {"frame1": document.querySelector(".normalStrike.frame1"),
							 "frame2": document.querySelector(".normalStrike.frame2"),
							 "frame3": document.querySelector(".normalStrike.frame3"),
							 "frame4": document.querySelector(".normalStrike.frame4")
	}

	frontSwordFrames = {"frame1": document.querySelector(".frontSwordFrames > .sword.frame1"),
						"frame2": document.querySelector(".frontSwordFrames > .sword.frame2"),
						"frame3": document.querySelector(".frontSwordFrames > .sword.frame3")
	}

	magicMenu = document.querySelector(".magicMenu");
	maskCancelButton = document.querySelector(".maskCancelButton");
	skillCancelButton = document.querySelector(".skillCancelButton");

	weapons = {"sword": document.querySelector(".weaponSprites > .sword")}

	cursor = document.querySelector(".pointerFlow");

	background = document.querySelector(".background");

	cancelArea = document.querySelector("#cancel");
	cancelButton = document.querySelector(".cancelButton");
	cancelButton.style.filter = "hue-rotate(90deg)";

	cancelButton.addEventListener("click", function(){
		cancelButton.style.zIndex = -1;
		cancelArea.style.zIndex = -1;
		windowState = 0;

		animate({
			duration: 100,
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress){
				backgroundLighting(60, 40, progress);
				//spritesStopPulseHarder(); //REVISAR
			}
		});
	})

	maskCancelButton.addEventListener("click", function(){
		magicMenu.style.zIndex = -1;
		maskCancelButton.style.zIndex = -1;
		cancelButton.style.zIndex = -1;
		cancelArea.style.zIndex = -1;
	});

	skillCancelButton.addEventListener("click", function(){
		skillCancelButton.style.zIndex = -1;
		windowState = 0;

		animate({
			duration: 100,
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress){
				backgroundLighting(60, 40, progress);
				spritesStopPulseHarder();
			}
		});
	})
}

function initializeSubMenus(c, char){
	try{
		units[c]["subMenu"] = document.querySelector(char + ".subMenu");
	}catch(e){}
}

function addAllyEventListeners(character){
	/*
	inputs: character is the name of the character (not the object)
	*/
	let options = units[character]["options"];
	let action = 0;
	let target = 0;

	// this is what happens if FIGHT is selected
	options["fight"].addEventListener("click", function(){
		fightQueue(target, "fight", "slash")
	});
	options["magic"].addEventListener("click", function(){
		cancelButton.style.zIndex = parseInt(units[character]["subMenu"].style.zIndex) + 1;
		cancelArea.style.zIndex = parseInt(cancelButton.style.zIndex);
		magicMenu.style.zIndex = parseInt(cancelButton.style.zIndex);
		maskCancelButton.style.zIndex = parseInt(cancelButton.style.zIndex) + 1;
	});
}

function addTargetability(unit){
	units[unit]["frontSprite"].addEventListener("click", function(){
		globalTarget = "." + unit;
	})
}

function initialization(){
	try{
		// initializing misc stuff
		initializeMiscFrames();	

		// initialize skills & items
		initializeSkills();

		// initializing characters
		for (let i = 0; i < characterList.length; i++){
			let character = characterList[i];
			let characterClass = "." + character;

			// initializing characters' stats and sprites
			initializeCharacters(character, characterClass);

			// initializing submenus for characters
			initializeSubMenus(character, characterClass);

			// adding event listeners for submenus and options
			addAllyEventListeners(character);

			// starting allies' atb bars
			restartAllyBar(character);

			// can become a target when clicked
			addTargetability(character);
		}

		units["terra"]["position"].style.top = "46%";
		units["terra"]["position"].style.left = "66%";
		units["terra"]["damage"].style.top = "100%";

		units["celes"]["position"].style.top = "56%";
		units["celes"]["position"].style.left = "72%";
		units["celes"]["damage"].style.top = "100%";

		// initializing enemies
		for (let i = 0; i < enemyList.length; i++){
			let enemy = enemyList[i];
			let enemyClass = "." + enemy;

			// initializing enemies' stats and sprites
			initializeEnemies(enemy, enemyClass);

			// starting enemies' atb bars
			restartEnemyBar(enemy, enemyClass);

			// can become a target when clicked
			addTargetability(enemy);
		}

		units["enemy0"]["position"].style.top = "67%";
		units["enemy0"]["position"].style.left = "16%";
		units["enemy0"]["damage"].style.top = "100%";

		units["enemy1"]["position"].style.top = "50%";
		units["enemy1"]["position"].style.left = "35%";
		units["enemy1"]["damage"].style.top = "100%";

		units["enemy2"]["position"].style.top = "73%";
		units["enemy2"]["position"].style.left = "46%";
		units["enemy2"]["damage"].style.top = "100%";

		document.getElementById("loadArea").style.animation = "5s loadAll 1"

	} catch(e){setTimeout(initialization, 100);}
}



// flow of the game ----------------------------------------

// function to queue ally actions into the main queue
function fightQueue(target, option, selectedOption){
	let character = subMenuQueue[0];
	let bufferedFunction = 0;

	if (windowState == 0){
		windowState = 1
		globalTarget = " ";

		animate({
			duration: 100,
			timing(timeFraction) {
				return timeFraction;
			},
			draw(progress){
				backgroundLighting(100, -40, progress);
				spritesPulseHarder(selectedOption);

				cancelButton.style.zIndex = parseInt(units[character]["subMenu"].style.zIndex) + 1;
				cancelArea.style.zIndex = parseInt(cancelButton.style.zIndex) - 1;

				if (option.includes("magic"))
					skillCancelButton.style.zIndex = parseInt(units[character]["subMenu"].style.zIndex) + 2;

				let check = setInterval(function(){
							
					if (windowState == 0){
						clearInterval(check);
						spritesStopPulseHarder();
					}
					else{
						try{
							target = globalTarget.slice(1);
						} catch(e){}

						if (checkValidTarget(target, selectedOption)){//
							clearInterval(check);
							spritesStopPulseHarder();
							popDown(character);
								
							cancelButton.style.zIndex = -1;
							cancelArea.style.zIndex = -1;
							units[character]["active"] = false;
							cursor.style.zIndex = -1;

							if (option.includes("fight")){
								units[character]["action"] = "fight";
							}
							else if (option.includes("magic")){
								cancelArea.style.zIndex = -1;
								magicMenu.style.zIndex = -1;
								maskCancelButton.style.zIndex = -1;
								skillCancelButton.style.zIndex = -1;
								units[character]["action"] = "cast1";
							}

							if (checkValidTarget(target, selectedOption)){
								
								bufferedFunction = function(){fight(target, character, option, selectedOption);}
								// get function in front of queue
								if(character.includes("terra"))
									action = {"terra" : bufferedFunction};
								else if (character.includes("celes"))
									action = {"celes" : bufferedFunction};
							}					

							
							windowState = 0;

							// insert character in queueList
							queueList.push(character);
							queue.push(action);

							// return screen to original brightness
							animate({
								duration: 100,
								timing(timeFraction) {
									return timeFraction;
								},
								draw(progress){
									backgroundLighting(60, 40, progress);
									spritesStopPulseHarder();
								}
							});
						}
					}
				}, 200);
			}
		})
	}
}

// function to advance the game
function advanceQueue(){
	// if win or defeat conditions are met, end the game
	if (gameState != 1 && (winState == 1 || loseState == 1)){
		flushQueue();
		clearInterval(masterCheck);
		setTimeout(function(){
			if(gameState == 2){
				popEndBox("Got 41 Exp. point(s)", "left", "inherit", "3%", "100%")
			}
			if(gameState == -1){
				popEndBox("Defeated", "left", "inherit", "3%", "100%")
			}
		}, finisherDuration);
	}

	// if not, then continue the game
	else if (queue.length > 0){
		try{
			for (let i = 0; i < queueList.length; i++){
				character = queueList[queueList.length - 1 - i];

				if (character.includes("terra")){
					ready = {"terra" : function(){prepareForbattle("terra")}};
					queueList.shift();
				}
				else if (character.includes("celes")){
					ready = {"celes" : function(){prepareForbattle("celes")}};
					queueList.shift();
				}
								
				if (Object.keys(queue[0])[0].includes(character)){
					queue.unshift(ready)
				}
				else{
					queue.splice(1, 0, ready);
				}
			}
		
			//setTimeout(function(){
				if (gameState == 1 && winState == 0 && loseState == 0 && windowState == 0){
					try{	
						setTimeout(function(){
							queuedCharacter = Object.keys(queue[0])[0];
							if (checkIfAlive(queuedCharacter)){
								queue[0][queuedCharacter]();
							}
							queue.shift();
							}, 10)
					}catch(TypeError){console.log("type error");}
				}
		
			//}, 500)
		}catch(e){}
	}
}

// initialize until every component is loaded correctly
setTimeout(initialization, 100);

/* start the game after 1000 miliseconds, then check queue every
   500 miliseconds */
setTimeout(function(){
	masterCheck = setInterval(advanceQueue, 500);
}, 1000)
