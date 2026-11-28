// Maker Quest: Creating Apps with Devices (micro:bit), as 17 worlds.
// Shared by the student app, the teacher dashboard and the Cloudflare Worker (which checks saves and awards XP).
// Mission ids: "<world>-<Code.org level>" for core missions and side quests, "<world>-h" for board trials.
export const XP={v:25,p:50,t:100,s:75,j:150,b:250,c:25,h:100};
export const TAG={v:["tv","Video"],p:["tp","Predict"],t:["tt","Skill"],b:["tb","Boss"],j:["tj","Build"],c:["tc","Check-in"],s:["ts","Side quests"],h:["th","Board trial"]};
export const RANKS=[[0,"Rookie Tinkerer"],[800,"Circuit Scout"],[2000,"Signal Wrangler"],[3800,"Sensor Sage"],[6000,"Prototype Pro"],[8500,"Maker Legend"]];
const PRED=["Read the starter code before you press Run.","Predict what the app and micro:bit will do, and write your prediction in the box.","Run the code and compare what happened with your prediction."];
const BUILD=w=>({design:["Design Your App","Open Design Mode and add every screen element from the sketch in your Project Guide. No code yet.",["Add buttons, labels, images and screens from your sketch","Give each element a meaningful id","Press Run, then Finish"],"Your screens look like your sketch."],
events:["Add Events","Add "+w+" events with `onEvent()` or `onBoardEvent()`. Put a test block in each one (change the screen, light some LEDs) so you can tell it fires. Skip variables and if-statements for now.",["Add an event for every input in your plan","Add a quick test output inside each event","Press Run, try every input, then Finish"],"Every event does something you can see."],
logic:["Add Logic","Add the core logic with variables and if-statements, using your Project Guide. Test several times.",["Add the variables your plan needs","Add if-statements that make the decisions","Test the app several times and fix surprises","Press Run, then Finish"],"The app behaves the way your plan says."],
phys:["Add Logic and Physical Materials","Add the core logic for how your device uses inputs and outputs, and start attaching the board to the physical materials you made. Make small adjustments so everything fits.",["Code how inputs lead to outputs","Attach the micro:bit to your physical materials","Adjust so the board, wires and materials fit together","Test several times, then press Run and Finish"],"Board and materials work as one device."],
review:["Review and Submit","Check your work against every rubric requirement and make any last changes.",["Open the rubric and check each requirement","Make any changes you think are needed","Press Run, then the purple Submit button (you cannot edit after submitting)"],"Project submitted."]});
const B=BUILD("onEvent");
export const W=[
{n:0,g:"Boot Camp",o:"Intro to App Lab",q:"How do I build my first app in App Lab?",s:"Every maker starts somewhere. Learn the App Lab cockpit: change how elements look, respond to clicks, add sound and images, then build screens of your own.",i:"11111 10001 10001 10001 11111",bd:"App Cadet",m:[
["v","Briefing: Getting Started",1,"Watch the App Lab tour. Your app is on the left, code on the right, blocks come from the toolbox.",["Watch the video","Spot the `setProperty()` block and its three dropdowns: element id, property, value","Learn the trick: click the goal picture if you get stuck"]],
["t","Paint It Green",2,"Make the screen green.",["Drag in a `setProperty()` block","Set the screen's `background-color` to `green`","Press Run"],"The whole screen turns green."],
["t","Big Blue Words",3,"Make the text bigger and blue. You need two lines of code.",["Give `label1` a `font-size` of `80`","Give `label1` a `text-color` of `blue`"],"The label is huge and blue."],
["t","Button Makeover",4,"Make the buttons red and blue, then change the text in the large orange label.",["Hover over elements to find each one's id","Set the `background-color` of the buttons to `red` and `blue`","Set the label's `text` to anything you like, e.g. `Welcome to my app!`"]],
["v","Briefing: Make It Interactive",5,"Events are user actions like clicks. `onEvent()` runs code when one happens.",["Watch the video","Remember: blocks outside an `onEvent()` run right away","Never put one `onEvent()` inside another"]],
["t","Green-ify Switch",6,"The screen starts blue. Make it turn green when you click the Green-ify button.",["Add code inside the `onEvent()` that sets the screen's `background-color` to `green`"],"Click the button and the screen goes green."],
["t","Flashlight App",7,"The On button already turns the screen white. Make the Off button turn it black again.",["Run the app and try the On button","Inside the empty `onEvent()`, set the screen's `background-color` to `black`","Also set the label's `text-color` to `white`"]],
["v","Briefing: Images and Sounds",8,"`playSound()` plays a sound from the library; `setProperty()` with `image` adds pictures and icons.",["Watch the video","Find the sound library and the icon library"]],
["t","Sound Board",9,"Finish the sound board: give the last button an image, text and a sound.",["Add an `onEvent()` for `button4` and put a `playSound()` inside it with a sound from the library","Outside the event, add a `setProperty()` that changes the button's `image`","Add one more `setProperty()` that changes the button's `text`"]],
["v","Briefing: Design Mode",10,"Design Mode lets you drag in elements, resize them, set properties and add screens. `setScreen()` switches screens.",["Watch the video","Remember to rename ids to something meaningful, like `rightButton`"]],
["t","Add the Right Button",11,"Add a second button that says Right! with an id of `rightButton`.",["In Design Mode drag in a new button, then position and resize it","Set its `id`, `text`, `background color` and `font size`"]],
["t","A Whole New Screen",12,"Create a new screen called `rightScreen` with a label that says You went right!",["In Design Mode drag in a new screen element and set its id to `rightScreen`","Drag a label onto it and change the text to You went right!"]],
["t","Screen Jumper",13,"Make the screen switch to `rightScreen` when the user clicks `rightButton`.",["In Code Mode add a new `onEvent()` for the Right! button","Put a `setScreen()` inside it that switches to `rightScreen`"],"Clicking Right! takes you to the new screen."],
["v","Briefing: Share Your App",14,"Your skills already cover quizzes, greeting cards and choose-your-own-adventure games. Share your app when it's done.",["Watch the video"]],
["b","Boss: Build and Share Your Own App",15,"Extend this project into an app of your own, then Share it with someone.",["Pick a type: Choose Your Own Adventure, Greeting Card, or Personality Quiz (try the example app first)","Add more screens, buttons, text, sounds and interactions","Try a few of the extra blocks in the toolbox","Click Share and send it to yourself or a friend"],"Someone else can open and play your app."]]},
{n:1,g:"Designer's Workshop",o:"Physical Designs",q:"How can we design apps with devices based on the needs of a user?",s:"Before you build, think like a product designer. Match real devices to the people they help, then sketch one for a user you choose.",i:"01110 10001 10001 01110 00100",bd:"User Champion",m:[
["j","Physical Design Prototypes",1,"Investigate different physical devices and their apps, then prototype one for a user.",["Look at the physical designs and match each one with a potential user","Choose one user","Prototype a physical design for them on paper or in the digital template","Reflect: what does it mean to be a physical designer? Create a resource for other users"]],
["c","Check-In Survey",2,"A short survey about you and computer science. No right answers.",["Answer each question honestly","Submit the survey"]]]},
{n:2,g:"Wake the micro:bit",o:"Introducing the micro:bit",q:"How can I control the main output on the BBC micro:bit?",s:"Plug in your board and take control of its 5x5 LED screen: eyes, blinks, a mouth, your name and a dice roll.",i:"01010 01010 00000 10001 01110",bd:"LED Whisperer",m:[
["t","Test Your Board",1,"Make sure your board is working before the adventure starts.",["Plug the board into your computer with a USB cable","Click Run and wait a few seconds for Success or Error","If it fails: open Help and Tips → Maker Setup and connect the device","Still failing? Refresh, try another USB port, a data-capable cable, or another board"],"You see the Success screen."],
["p","Prediction: Board Outputs",2,"Look at the code that talks to the LED screen.",PRED],
["t","Open the Right Eye",3,"The left-eye button works. Program the right eye.",["Drag out an `ledScreen.on()` block","Change the values to `(3, 1)`"],"Both buttons light an eye on the micro:bit."],
["t","Blink!",4,"`ledScreen.toggle()` flips an LED on or off with each click. The left eye already blinks.",["Drag out an `ledScreen.toggle()` block","Change the values to `(3, 1)`"],"Each button press blinks an eye on and off."],
["t","Give It a Smile",5,"Add a mouth so the face is complete.",["Drag out 5 `ledScreen.on()` blocks","Change their values to light up the mouth on the bottom row (use Show Me How if stuck)"],"A full face appears on the micro:bit."],
["p","Prediction: Scrolling Text",6,"Look at the code before running it.",PRED],
["t","Name Badge",7,"Make a digital name badge with `ledScreen.scrollString()`.",["Drag out an `ledScreen.scrollString()` block","Type your name into it"],"Press the button and your name scrolls across."],
["t","Roll the Dice",8,"Combine `ledScreen.scrollNumber()` with `randomNumber()` to simulate a dice roll. `randomNumber(1, 4)` can give 1, 2, 3 or 4.",["Drag out an `ledScreen.scrollNumber()` block","Drop a `randomNumber` block inside it","Type `1` and `6` as the low and high values"],"Each press scrolls a random number from 1 to 6."],
["s","Practice",9,["Random LED","Fix the bug so a random LED lights up, not the same one"],["Debugging!","The off button doesn't turn the LED off; fix it"],["Smile Face Debugging!","The mouth is flat; fix it so the face smiles"],["Accessible App","Pick 1, 2 or 3: scroll the number and play a matching sound"],["New Language Translator","Click items to scroll their names in another language"]],
["b","Boss: Virtual Monster Pet",10,"Eva's monster pet app only has the Happy button coded. Finish the other three.",["Sad button: show a sad face on the `ledScreen`","Name button: scroll the pet's name (you choose it)","Age button: scroll the pet's age (you choose it)"],"All four buttons make the pet react."],
["s","Challenge",11,["Ratings App","Rate something with a sound and an LED picture: happy, meh, sad"],["Yes / No Responder","Answer yes or no with sound and an LED image"],["LED Grid","Continue the pattern so screen buttons light up a grid of LEDs"],["Educational App","Prototype a quiz app that scrolls answers on the LEDs"],["Medical App","Prototype an app that helps someone decide if they need care"]]]},
{n:3,g:"Screen Shapeshifter",o:"Updating Screen Elements",q:"How can you update design elements of an app?",s:"Use code to change colors, text and position. Then make things move when clicked, and teleport to random spots.",i:"11111 10001 10101 10001 11111",bd:"Shapeshifter",m:[
["p","Prediction: Screen Outputs",1,"Read the code that changes the screen.",PRED],
["t","Restyle the Title",2,"`setProperty()` changes how design elements look. One block already updates the title's font. (Design Mode is hidden for now.)",["Look at the existing `setProperty()` block","Add a `setProperty()`: element `title`, property `background-color`, a color in quotes","Optional: add more `setProperty()` blocks to restyle the app"]],
["t","Say My Name",3,"Use `setText()` to put your name in the app.",["Drag out a `setText()` block","Choose `nameLabel` as the first parameter","Type your name in quotes as the second","Optional: change the greeting too, like Howdy, Hola or 你好"]],
["t","Corner Move",4,"Every element (except the screen) has `x` and `y`. The screen is 320 pixels wide and 450 tall.",["Look at the target picture","Study the code that moves `greenButton` to the upper-right corner","Use two `setProperty()` blocks to set `x` and `y` of `redButton` so it sits in the upper-left corner"],"Your app matches the picture."],
["t","Click to Center",5,"Combine `onEvent()` with `setProperty()` to do things Design Mode can't.",["Inside the `onEvent()`, add two `setProperty()` blocks","Change the smiley icon's `x` and `y` so it moves to the center of the screen"],"Click the smiley and it jumps to the center."],
["t","Teleporting Smiley",6,"Make the smiley jump somewhere new every click.",["Put `randomNumber` inside the `setProperty()` blocks for `x` and `y`","Set the ranges so it can land anywhere on the 320 × 450 screen"],"Every click sends the smiley to a random spot."],
["s","Practice",7,["Change the Background","Buttons change the screen to their color"],["Changing Icons","Buttons point the arrow up, down, left or right"],["Debugging","Fix Erika's text-mode typos so the app matches the picture"],["Create a Rainbow","Color seven labels red through violet"]],
["b","Boss: Emotion Machine",8,"Build an app where emoji buttons change the big icon, its color and the text.",["Happy button: icon `icon://fa-smile-o`, icon color yellow, text Happy","Sad button: icon `icon://fa-frown-o`, icon color blue, text Sad","Meh button: icon `icon://fa-meh-o`, icon color gray, text Meh"],"Each button shows the right emoji, color and word."],
["s","Challenge",9,["Hidden Property","Finish an alarm app with `hideElement()` and `showElement()`"],["Recreate an App","Rebuild a Hedy Lamarr app using only code"],["Theme Designer","Code your own theme for screen, label and button"],["playSpeech","Make an About Me app that reads your favorites aloud"],["Marketing App","Prototype a social media campaign app"],["Local Business App","Prototype an app that promotes a local business"]]]},
{n:4,g:"Button Masters",o:"Board Events",q:"How can the user interact with the micro:bit for input?",s:"The micro:bit's A and B buttons become controllers. `onBoardEvent()` works just like `onEvent()`, but listens to the board.",i:"01110 10001 11111 10001 10001",bd:"Button Master",m:[
["p","Prediction: Board Inputs",1,"Look at the code that listens for the board's buttons.",PRED],
["t","B Turns It Off",2,"The LED turns on when A is pressed down. Make it turn off when B is pressed down.",["Add another `onBoardEvent()` for `buttonB` with the `down` event","Inside it, turn the LED off"]],
["t","Up Events",3,"Instead of B, make the LED turn off when A comes back up.",["Use an `onBoardEvent()` with an `up` event for the A button","Inside it, turn the LED off"],"Hold A for light; let go for dark."],
["t","Arrow Steering",4,"Use the board buttons to update the screen.",["Add an `onBoardEvent()` for A `down`; use `setProperty()` to make `arrowImg`'s `image` a right arrow","Add an `onBoardEvent()` for B `down`; set `arrowImg`'s `image` to a left arrow"]],
["s","Practice",5,["Debugging","The wrong text shows for each event; fix it"],["LED Blinker","A lights the left side, B the right, release clears"],["Yes-Or-No Communicator","Use LEDs and buttons to answer a partner's questions"]],
["b","Boss: Mood Descriptor",6,"Angel's door screen shows their mood when they press micro:bit buttons from inside the room.",["When A is pressed, show a happy face","When B is pressed, show a sad face","When A is released, show a neutral face","When B is released, show a neutral face"],"Hold a button for happy or sad; let go for neutral."],
["s","Challenge",7,["Random Movement","A moves the smiley to a random x, B to a random y"],["Day and Night","Switch between two scenes with the buttons"],["Correct or Incorrect","A plays correct, B plays incorrect; run a trivia quiz"],["Controller App","Prototype the micro:bit as a game controller"],["Lock/Unlock App","Prototype locking and unlocking a device"]]]},
{n:5,g:"Memory and Decisions",o:"Variables and If Statements",q:"How can I create more complex programs that keep track of information and make decisions?",s:"Give your apps a memory with variables, count with the counter pattern, and make choices with if-statements.",i:"00100 01100 00100 00100 01110",bd:"Logic Keeper",m:[
["p","Prediction: Variables",1,"Look at how the code uses a variable.",PRED],
["t","Checkerboard",2,"A `var` stores a value you can reuse. Change the variables to make a checkerboard.",["Look at the `var` blocks at the top of the code","Edit only the colors and numbers on the right side so the app matches the picture (no new blocks)"]],
["t","Shadow Name Bug",3,"Amy uses a variable for a shadow-text effect, but one label is wrong.",["Run the code and spot the label that doesn't update","Fix that label so it uses the `myName` variable","Replace Amy's name with yours"]],
["t","Line 'Em Up",4,"Create a variable for the rectangles' y-position.",["Drag out a `var` block and give it a name","Set it to a number between 0 and 450","Use the variable in the last slot of each `setProperty()`"],"All the blocks snap onto one horizontal line."],
["t","Counter Pattern",5,"A adds 1 to the number on screen. Make B subtract 1.",["Find the Add your code here section","Drag out an `x = ;` block and change `x` to `value`","Use a `-` block: `value` on the left, `1` on the right"],"A counts up, B counts down."],
["t","Flappy Controls",6,"Use the counter pattern to move a bird. Remember: up means subtract y, down means add y.",["In the `buttonA` event, subtract one from `yPosition` and test","In the `buttonB` event, add one to `yPosition` and test","Optional: change the amount to make the bird faster"]],
["p","Prediction: If Statements",7,"Look at the if-statement before running.",PRED],
["t","Whisper... SURPRISE!",8,"The text grows with the counter pattern. Once it passes 30, surprise the user.",["Add an `if` statement checking `textSize > 30`","Inside it, use `setText()` so `textLabel` says SURPRISE!","Also inside it, add a `playSound()`"]],
["t","Perfect Toast",9,"Warn the user before the toast burns.",["In the `buttonA` event, add an `if` that checks if the toast is too far left, then `playSound()`","In the `buttonB` event, add an `if` that checks if it's too far right, then `playSound()`"],"Too close to a wall and the device buzzes."],
["b","Boss: Positivity App",10,"Hawa's heart grows with every good deed. Add the variables and if-statement.",["First line: a variable `size` set to `30`","In the event, increase `size` by 20 each press","Add an if-statement checking when `size` is at least 300","Inside it, play a sound to celebrate"],"The heart fills the box and a sound plays."],
["s","Challenge",11,["Text Message Design","Use color variables to style a text conversation"],["Water Level App","Raise and lower water; warn with LEDs near overflow"],["Emoji Race","Two players race emojis down the screen"],["Age Recommender","Recommend something based on age using + and -"],["Debugging!","Fix an arrow that should scroll forever"]]]},
{n:6,g:"Field Mission",o:"Mini-Project: Field Collector App",q:"How can I use events and variables to create an app that collects and analyzes data?",s:"Become a citizen scientist. Collect data in the field with the micro:bit, then use App Lab to analyze it and make a recommendation.",i:"00100 01110 11111 00100 00100",bd:"Field Scientist",m:[
["j","Design Your App",1,B.design[1],B.design[2],B.design[3]],
["j","Add Events",2,B.events[1],B.events[2],B.events[3]],
["j","Add Logic",3,B.logic[1],B.logic[2],B.logic[3]],
["b","Boss: Review and Submit",4,B.review[1],B.review[2],B.review[3]]]},
{n:7,g:"Control Panel",o:"Getting Screen Inputs",q:"How can we use the app screen for user input?",s:"Text boxes, dropdowns and sliders let users talk to your app. `getText()` and `getProperty()` read what they chose.",i:"00000 11111 00100 11111 00000",bd:"Input Engineer",m:[
["p","Prediction: Screen Inputs",1,"Look at how the app reads a text box.",PRED],
["t","Room Sensor Welcome",2,"The second input box isn't set up yet.",["Add a `var` with `getText()` to read the `roomInput` element","Add a `setText()` to update `roomLabel`"],"Type your name and a room, press the button, see the welcome."],
["t","Dropdown Colors",3,"`getProperty()` reads a dropdown's `value`.",["Add a `var` with `getProperty()` to get the `value` of `colorDropdown`","Add a `setProperty()` that sets the screen's background to that value"]],
["t","Custom Options",4,"Change the dropdown's choices in Design Mode. No code changes.",["Select the dropdown and edit the colors in `options` (your outfit, sports teams…)"]],
["t","Height Slider",5,"Only width works. Make the height slider work too.",["Add a `var` with `getProperty()` to get `heightSlider`'s `value`","Add a `setProperty()` that updates the image's `height`"]],
["t","Bigger Range",6,"Change slider limits in Design Mode.",["Set `widthSlider`'s maximum value from 50 to 300","Set `heightSlider`'s maximum value from 50 to 300"],"The image can grow much bigger."],
["t","Live Sliders",7,"The `input` event fires as the slider moves.",["Add an `onEvent()` for `widthSlider` with the `input` event","Copy the code from the `updateButton` event into it (text mode helps)","Test, then repeat for `heightSlider`"]],
["s","Practice",8,["Pet Scene Creator","Mix backgrounds and pets with two dropdowns"],["Digital Menu","Customize a cafe menu from text inputs"],["Where You're From","Move a cursor on a map with sliders"],["Debugging","Fix three secret-question screens"]],
["b","Boss: Custom Profile",9,"Isaac's app previews a custom profile theme.",["Design Mode: give the dropdown at least 4 colors","Design Mode: set the slider minimum to 12 and maximum to 30","Code: store the text input, dropdown and slider values in three variables","Code: use `setText()` and `setProperty()` to update `previewLabel`"],"Press Preview and the bottom half shows your theme."],
["s","Challenge",10,["Excitement Meter","A 1–5 slider changes the image with five ifs"],["Background Sliders","Mix red, green and blue with `rgb()`"],["Pet Adoption","Browse at least 4 pets from a dropdown"],["Story Generator","Build a 3-part Mad-Libs story"],["Order Form App","Prototype a store order form"],["Survey App","Prototype a survey that learns about a person"]]]},
{n:8,g:"Crossover",o:"Combining Inputs and Outputs",q:"How can I use inputs and outputs from both the micro:bit and the app screen?",s:"No new blocks here. Combine everything: screen controls drive the LEDs, and the board drives the screen.",i:"00100 01000 11111 00010 00100",bd:"Crossover Captain",m:[
["p","Prediction: Combine Inputs",1,"Look at how a dropdown controls the LEDs.",PRED],
["t","Light the Corners",2,"A second dropdown should control the top and bottom LEDs.",["Find Add your code here","Add a `var` with `getProperty()` to read `LED2Dropdown`","Add two `if` statements using `==` to check for `top row` and `bottom row`","Use `ledScreen.on()` to light the chosen row"],"Corners light up based on the rows and columns picked."],
["t","Slider Bug Hunt",3,"Sliders pick a column from 0 to 4, but something's wrong.",["Read the code and find the bug that stops the LEDs lighting correctly","Hover over the yellow triangles for clues"]],
["t","Row Slider",4,"Add row control.",["Using `column` as a model, create a `row` variable with `getProperty()` from the row slider","Change the row-lighting code to use `row` instead of 0"],"Sliders draw different crosses."],
["t","Clear the Trail",5,"Josh and Jessie's LEDs never turn off.",["Run the code and watch the screen fill up","Add `ledScreen.clear()` blocks, one in each event"],"Only one row and one column are lit at a time."],
["t","X Marks the Spot",6,"The circle choice already works with `ledScreen.display()`.",["Find Add your code here","Add an `if` that checks the dropdown `==` `X`","Inside it, use `ledScreen.display()` with 1s that form an X"]],
["s","Practice",7,["Smiley Faces","A dropdown chooses smiley or frowny LEDs"],["Quiz Question","A dropdown quiz scrolls Correct or Incorrect"],["Temperature Warning","A slider warns Too cold! under 40 or Too hot! over 90"]],
["b","Boss: Traffic Control",8,"Control a construction-zone sign that tells drivers which way to merge.",["Store the direction dropdown's value in a variable","Add an `if` for `left`; inside, `ledScreen.display()` a left arrow","Add an `if` for `right`; inside, `ledScreen.display()` a right arrow"],"The micro:bit points the way you choose."],
["s","Challenge",9,["LED Mood Ring","Pick a mood; LEDs show its design (4 moods)"],["Motorcycle Movement","Program B to drive the motorcycle right"],["Trivia Game","Type an answer; the micro:bit celebrates if right"]]]},
{n:9,g:"Human + Device",o:"Project: Human Device Interaction",q:"How can I design a device that people interact with?",s:"Your first big build. Design an app and a physical device that work together for a real user.",i:"00100 01110 00100 01010 10001",bd:"Interaction Designer",m:[
["j","Design Your App",1,B.design[1],B.design[2],B.design[3]],
["j","Add Events",2,"Add events with `onEvent()` or `onBoardEvent()`. Put a test block in each (change the screen, light the `ledScreen`). Skip variables and if-statements for now.",B.events[2],B.events[3]],
["j",B.phys[0],3,B.phys[1],B.phys[2],B.phys[3]],
["b","Boss: Review and Submit",4,B.review[1],B.review[2],B.review[3]],
["c","Rapid Survey",5,"Five quick questions about how class is going.",["Answer each question","Submit"]]]},
{n:10,g:"Sensor Scouts",o:"Board Sensors",q:"How can I use sensors to detect changes in the environment?",s:"Your device senses light and temperature on its own. Users don't even need to touch it.",i:"10101 01110 11111 01110 10101",bd:"Sensor Scout",m:[
["t","Sensor Experiment",1,"Run the program and experiment with the board to figure out each sensor.",["Interact with the board in many ways","With a neighbor: what does each sensor measure?","Find its maximum and minimum values"]],
["t","Light Check",2,"Show the light level whenever `updateButton` is clicked.",["Inside the `onEvent()`, update `lightValue` with `lightSensor.value`"],"Cover the board, update; shine a light, update."],
["p","Prediction: Sensor Events",3,"Look at how the code reads a sensor.",PRED],
["t","Live Data",4,"Sensors fire a `data` event every time new data comes in.",["Add an `onBoardEvent()` for `lightSensor` with `data`","Inside it, use `setText()` with `lightSensor.value`"],"The screen updates in real time. How low and high can you go?"],
["t","Set the Scale",5,"The light sensor runs 0–255. `setScale()` changes that range.",["At the top of the code, add `lightSensor.setScale()`","Set the parameters to `0` and `100`"],"Values stay between 0 and 100."],
["t","Change Event",6,"The `change` event only fires when the value changes, which is more efficient.",["Add an `onBoardEvent()` for `tempSensor` with `change`","Inside it, update the screen with the new temperature"],"Warm the sensor with your thumb and watch it react."],
["s","Practice",7,["Thermometer App","Show the temperature in F and C"],["Interactive Birthday Card","Detect when someone blows out the candles"],["Light Meter","Build an interactive light meter"]],
["b","Boss: Room Monitor",8,"A micro:bit in a secure room reports to command. Build the display.",["Show the current temperature","Show the light level on a scale from 0 to 10","Make both update automatically while the program runs"]],
["s","Challenge",9,["Threshold","Use the threshold block with the sound sensor"],["Colors and Sensors","Background reacts to room light"],["Automatic Windows","Prototype blinds that follow sunlight"],["Environmental App","Prototype monitoring plants or animals"],["Safety App","Prototype a warning for unsafe environments"]]]},
{n:11,g:"Tilt Zone",o:"Accelerometer",q:"How can I use the accelerometer to create apps?",s:"Pitch, roll and shake. Turn tilting the board into game controls and assistive tech.",i:"00001 00010 00100 01000 10000",bd:"Tilt Pilot",m:[
["p","Prediction: Accelerometer",1,"Look at how the code reads the board's tilt.",PRED],
["t","Pitch and Roll Targets",2,"The app shows pitch and roll and changes color at targets.",["Hit Pitch 0 / Roll −20","Hit Pitch 30 / Roll 0","Hit Pitch −15 / Roll 10","Hit Pitch 5 / Roll −25","Hit Pitch 10 / Roll 30","Answer: which way gives positive pitch? Which way gives negative roll?"]],
["t","Pitch Rows",3,"Tilting forward lights the top row. Finish the other direction.",["When tilted forward, turn off the bottom row (Show me where)","When tilted backward, turn on the row the callout points to"],"Tilt forward and back to light the rows."],
["t","Left or Right?",4,"Show Left or Right depending on roll.",["Store roll in a variable with `accelerometer.getOrientation()`","Add an `if` for tilted left, then `setText()` Left","Add an `if` for tilted right, then `setText()` Right"]],
["t","Goalie Tilt",5,"The ball moves by itself; tilt to move the goalie.",["Find Add your code here","Use `getProperty()` to get the `player`'s `y`","Use `accelerometer.getOrientation()` to get `pitch`","Add them together to set the player's new y"]],
["t","Step Counter",6,"Count a jogger's steps when the board is shaken.",["Change the event to `shake`","Inside it, increase `steps` with the counter pattern"]],
["s","Practice",7,["Movement Meter","Measure the wobble as you pass the board"],["Confetti Shaker","Shake for confetti"],["Number Tilting Game","Tilt to hit a target number"],["Four Corners","Tilt to pick one of four animals"]],
["b","Boss: Assistive Mouse",8,"Help someone who can't use a regular mouse: tilt moves the cursor, a button clicks.",["Create an event that continuously checks the accelerometer","Store `pitch` and `roll` in two variables","Update the cursor's `x` and `y` from them","Too fast? Divide pitch and roll by 10"]],
["s","Challenge",9,["Orange and Purple Bugs","Move each bug with buttons and tilt"],["Safety Settings","Simulate a construction-equipment safety sensor"],["Car Wheel Alignment","Detect misaligned wheels and flat tires"],["Accessibility App","Prototype tech that's easier to use with a disability"]]]},
{n:12,g:"Function Forge",o:"Functions",q:"How can I use functions to organize and simplify my code?",s:"Aliens have landed. Define functions once, call them anywhere, and use parameters to make them flexible.",i:"00110 01000 11100 01000 01000",bd:"Function Smith",m:[
["p","Prediction: Functions",1,"Look at the function definitions before running.",PRED],
["t","Call the Moods",2,"`mehImage` and `surprisedImage` are already defined. Two aliens work.",["Look at the two finished examples","In each remaining `onEvent()`, drag out a `myFunction()` block","Rename it `mehImage` (yellow) or `surpriseImage` (green) to match the alien"]],
["t","Define sadImage",3,"Red aliens are happy (done). Blue aliens are sad.",["At the bottom, add a `function myFunction() {}` block named `sadImage`","Inside it, use `ledScreen.display()` to draw a sad face (copy happyImage's style)","In both blue-alien `onEvent()` blocks, call `sadImage`"]],
["t","moveAliens",4,"Both `onBoardEvent()` blocks repeat the same code.",["At the bottom, define a function called `moveAliens`","Move the repeated code into it","Replace the original code with calls to `moveAliens`"],"Shorter code, same behavior."],
["t","Shake to Scatter",5,"Functions make new features easy.",["Add an `onBoardEvent()` for `accelerometer` `shake`","Call `moveAliens` inside it"]],
["p","Prediction: Parameters",6,"Look at a function that takes a parameter.",PRED],
["t","Alien Messages",7,"`alienMessage(text)` shows a message on screen and the micro:bit.",["In each `onEvent()`, add a `myFunction(n)` block","Rename it `alienMessage`","Set the parameter to the alien's message, like We come in peace!"]],
["t","Feed the Aliens",8,"Clicking a food fills all three plates.",["Define `function setFoods(food)` at the bottom","Inside: three `setProperty()` blocks set the `image` of `food1`, `food2`, `food3` to `food`","In each food button's event call `setFoods` with: `image://BirthdayCake.png`, `image://PizzaSlice.png`, `image://Ramen.png`, `image://Taco.png`"]],
["t","Points Parameter",9,"Make each alien worth different points.",["In `updateScore`, add a parameter called `points` and use `+ points` instead of `+ 1`","Green alien: 10 points","Red alien: 8 points","Yellow alien: 6 points","Blue alien: 4 points"]],
["s","Practice",10,["Clouds","Blow on the sensor to move the clouds"],["Color Picker","Use functions to choose screen colors"]],
["b","Boss: Digital Snowglobe",11,"Eric coded 5 snowflakes and it got too repetitive. Use a function for all 10.",["Create `moveSnow` with two parameters: element name and amount to move","Copy the repeated snow code into it","Swap the names and values for your parameters","Replace the code in `onBoardEvent()` with `moveSnow()` calls for all 10 snow elements"],"Shake the micro:bit and all 10 flakes fall."]]},
{n:13,g:"Pet Lab",o:"Mini-Project: Interactive Pet",q:"How can sensors bring a device to life?",s:"Build a device that reacts to the world through sensors, merged with physical materials.",i:"01010 11111 11111 01110 00100",bd:"Pet Creator",m:[
["j","Add Sensors and Debugging",1,"Add your events and sensors. Labels showing sensor values help debugging, but the final device doesn't need screen elements.",["Add events for your sensors","Optional: add labels to display sensor values","Test that the sensors give the right data","Press Run, then Finish"]],
["j","Add Logic and Physical Materials",2,"Code how the device reacts to sensor data and attach the board to your materials. Adjust so things fit.",["Code how the device reacts to sensor data","Attach the micro:bit to your physical materials","Adjust so the board and materials fit together","Test several times, then press Run and Finish"],B.phys[3]],
["b","Boss: Review and Submit",3,"Check your device against the rubric.",B.review[2],"Project submitted."]]},
{n:14,g:"Light Forge",o:"Physical Outputs and LEDs",q:"How can I use external LEDs to create physical prototypes?",s:"Wire real LEDs to the micro:bit's pins. Safety rule: always unplug before changing wires.",i:"00100 01110 01110 00000 01010",bd:"LED Smith",m:[
["t","Connect an LED",1,"You need an LED and two wires. The long leg is positive, the short leg is negative.",["Unplug the micro:bit from the computer","Wire pin `0` to the LED's positive (long) leg","Wire `GND` to the LED's negative (short) leg","Plug in, check the connection, press Run"],"The LED lights. Always unplug before changing wires."],
["t","pinMode and digitalWrite",2,"`pinMode()` sets a pin for input or output; `digitalWrite()` sends power (1 on, 0 off). The code uses pin 2.",["Unplug the micro:bit","Move the wire from pin `0` to pin `2`","Plug back in and Run (didn't light? Reset and re-wire)"]],
["t","Second LED",3,"Add an LED on pin 1. Share the single GND with foil, copper tape, a paper clip or by clipping onto the GND wire.",["Unplug and prepare your shared GND","Wire GND to the new LED's negative leg and pin `1` to its positive leg","Plug in; add `pinMode()` with pin `1` and `output`","Add `digitalWrite()` with pin `1` and value 1"],"Both LEDs light. If not, flip the LED around."],
["t","Name Your LEDs",4,"`createLed()` stores an LED in a variable like `rightLED`.",["Keep the wiring the same","Drag out `createLed()`; name it `rightLED` on pin `1`","Add a `___.on()` block and type `rightLED`"]],
["t","Blink Speeds",5,"Use `blink` instead of `on`.",["Replace `leftLED.on()` with `leftLED.blink()` at `500`","Replace `rightLED.on()` with `rightLED.blink()` at `1000`"],"One LED blinks fast, the other pulses slowly."],
["s","Practice",6,["Buttons and LEDs","Screen buttons control an external LED"],["Left and Right Arrows","Point arrows at LEDs with A and B"],["LEDs and Sensors","Make a night light with the light sensor"]],
["b","Boss: Little Alien Friend",7,"Rosie's alien toy has two LED eyes controlled by an app.",["Wire LEDs to pins `0` and `2`","Create two LED variables on those pins","Wake Up: `___.on()`","Listen: `___.blink()`","Sleep: `___.off()`"]],
["s","Challenge",8,["LED Candle","Prototype a candle that turns on and off"],["LED Drawing","Put LEDs in a drawing, like eyes or headlights"],["Do Not Disturb Sign","Light an LED when you can't be disturbed"]]]},
{n:15,g:"Wire Wizards",o:"Physical Inputs and Buttons",q:"How can I use external buttons to create physical prototypes?",s:"Two wires touching make a button. Build your own controls out of wires and conductive stuff.",i:"00000 01110 01010 01110 00000",bd:"Wire Wizard",m:[
["t","Wire a Button",1,"Wires apart = up, wires touching = down.",["Unplug the micro:bit","Connect one wire to pin `0` and one to `GND`","Plug in and Run","Touch the free ends together"],"The micro:bit says hello."],
["t","Release to Clear",2,"`createButton()` names the button; `onBoardEvent()` listens to it.",["Add an `onBoardEvent()`; type `scrollButton` in the first parameter","Choose `up` as the event","Inside, add `ledScreen.clear()`"],"Touch for Hello, release to clear."],
["t","Bonjour Button",3,"Add a second button on pin 2 that shares the GND wire.",["Unplug, add a wire on pin `2`, plug back in","`createButton()` named `bonjourButton` on pin `2`","`onBoardEvent()` for `bonjourButton` `down`: scroll Bonjour","`onBoardEvent()` for `bonjourButton` `up`: `ledScreen.clear()`"]],
["s","Practice",4,["Color Changer","Three external buttons change the background"],["Whack-A-Mole","Press three buttons to earn points"],["Conductive Materials","Make buttons from paper clips or foil"]],
["b","Boss: Escape Room",5,"Find 3 hidden buttons to reveal a 3-digit code and escape.",["Wire buttons on pins `0`, `1`, `2` with one shared ground","Create three button variables","Add three `onBoardEvent()` blocks for `down`","In each, `hideElement()` a `blueSquare` (e.g. `hideElement(\"blueSquare1\")`)","Test more than once; the digits change every time"],"Reveal the code, type it in, see the win screen."],
["s","Challenge",6,["Physical Reactions","Touching two objects triggers a reaction"],["Alarm System Prototype","Detect when someone opens a box"],["Create Your Own Button","Build switches from conductive materials"]]]},
{n:16,g:"Final Invention",o:"Project: Prototype an Innovation",q:"How can I prototype an innovation that solves a problem?",s:"The final challenge. Invent a device that combines everything you've learned.",i:"00100 01110 01110 11111 01010",bd:"Maker Legend",m:[
["j","Design Your App",1,B.design[1],B.design[2],B.design[3]],
["j","Add Events",2,"Add events with `onEvent()` or `onBoardEvent()`. Put a test block in each so you can see it fire. Skip variables and if-statements for now.",B.events[2],B.events[3]],
["j",B.phys[0],3,B.phys[1],B.phys[2],B.phys[3]],
["b","Boss: Review and Submit",4,B.review[1],B.review[2],B.review[3]],
["c","End of Unit Survey",5,"Tell Code.org how the unit went.",["Answer all three pages","Submit"]]]}];
W.forEach(w=>w.m=w.m.map((a,k)=>a[0]==="s"?{t:"s",title:a[0]==="s"?a[1]+" side quests":"",lv:a[2],q:a.slice(3),id:w.n+"-"+a[2]}:{t:a[0],title:a[1],lv:a[2],goal:a[3],steps:a[4],win:a[5],id:w.n+"-"+a[2]}));
export const TR={2:["First Contact","Link your real micro:bit to the game.",[["Connect your micro:bit with the Connect button","conn"],["See this world's icon light up on your board's LEDs",""],["Press button A on the board","a"],["Press button B on the board","b"]]],
4:["Button Drill","Prove you can read every button event.",[["Press A down","a"],["Press B down","b"],["Hold A and B down together","ab"]]],
5:["Counter Trial","Be the counter pattern: every press adds 1.",[["Press A 10 times","a10"],["Press B 5 times","b5"]]],
8:["Crossover Trial","Screen input in, board output out.",[["Type a message in Board link and press Send","msg"],["Watch it scroll across your LEDs",""],["Press A to confirm you saw it","a"]]],
10:["Sensor Trial","Make the sensors react to the world.",[["Cover the board until light drops below 15","dark"],["Shine a light until light goes above 150","bright"],["Warm the board with your thumb by 1 °C","warm"]]],
11:["Tilt Trial","Pitch, roll and shake for real.",[["Tilt the board left","tl"],["Tilt the board right","tr"],["Tilt the board forward","tf"],["Shake the board 3 times","sh3"]]],
14:["LED Trial","Light an external LED from the game. Unplug before you wire!",[["Wire an LED: long leg to pin 0, short leg to GND, then plug back in",""],["Press Blink pin 0 LED in Board link","led"],["Confirm your LED blinked",""]]],
15:["Wire Button Trial","Two wires touching make a button.",[["Touch a pin 0 wire to the GND wire","p0"],["Touch a pin 1 wire to the GND wire","p1"],["Touch a pin 2 wire to the GND wire","p2"]]]};
W.forEach(w=>{const t=TR[w.n];if(t)w.m.push({t:"h",title:t[0],goal:t[1],steps:t[2].map(x=>x[0]),keys:t[2].map(x=>x[1]),id:w.n+"-h"})});

export const missionById = {};
for (const w of W) for (const m of w.m) { m.world = w.n; missionById[m.id] = m; }
// Core missions count toward a world's badge. Side quests and board trials are bonus.
export const isCore = (m) => m.t !== "s" && m.t !== "h";
export const coreOf = (w) => w.m.filter(isCore);
// Steps a mission has (side quests: one per option).
export const stepCount = (m) => (m.t === "s" ? m.q.length : m.steps.length);
// A mission is done when every step is ticked; a side quest when at least one option is.
export const doneFor = (m, steps) => (m.t === "s" ? steps.length > 0 : steps.length === stepCount(m));
// XP a mission is worth with these steps ticked (side quests pay per option).
export const xpFor = (m, steps) => (m.t === "s" ? steps.length * XP.s : doneFor(m, steps) ? XP[m.t] : 0);
export const rankFor = (xp) => { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } return { name: r[1], at: r[0], next }; };
export const WORLD_IDS = W.map((w) => "w" + w.n);
// Concepts for the Mastery tab and gradebook export, with the worlds that teach them.
export const CONCEPTS = [
  { id: "ui", name: "Events and screen design", worlds: [0, 3, 7] },
  { id: "out", name: "Board outputs (LEDs)", worlds: [2, 14] },
  { id: "in", name: "Board inputs (buttons, pins)", worlds: [4, 15] },
  { id: "logic", name: "Variables and if-statements", csta: "2-AP-11, 2-AP-12", worlds: [5, 8] },
  { id: "sense", name: "Sensors and accelerometer", worlds: [10, 11] },
  { id: "func", name: "Functions and parameters", csta: "2-AP-14", worlds: [12] },
  { id: "design", name: "User-centered design and projects", csta: "2-AP-15, 2-CS-02", worlds: [1, 6, 9, 13, 16] },
];
// beginning: nothing done yet; developing: some core missions done; mastered: every core mission done (skips don't count).
export function mastery(progress) {
  const out = {};
  for (const c of CONCEPTS) {
    const ms = c.worlds.flatMap((n) => coreOf(W.find((w) => w.n === n)));
    const done = ms.filter((m) => progress[m.id]?.status === "done").length;
    out[c.id] = done === ms.length ? "mastered" : done > 0 ? "developing" : "beginning";
  }
  return out;
}

// ---------- 9-week pacing ----------
// Class meets every school day. Weeks 1-8 = 40 content days for the 17 lessons, week 9 = 5 buffer days.
// PACE_DAYS[n] = class days planned for World n (Code.org Lesson n). Projects get the most.
export const PACE_DAYS = [2, 2, 2, 2, 2, 3, 2, 2, 2, 4, 2, 2, 3, 2, 2, 2, 4];
export const CONTENT_DAYS = PACE_DAYS.reduce((a, b) => a + b, 0); // 40
export const BUFFER_DAYS = 5;
export const TOTAL_DAYS = CONTENT_DAYS + BUFFER_DAYS; // 45 = 9 weeks
// First and last class day (1-based) of each world.
export const SPANS = PACE_DAYS.reduce((acc, d, n) => { const first = n ? acc[n - 1].last + 1 : 1; acc.push({ n, first, last: first + d - 1 }); return acc; }, []);
export const weekOfDay = (day) => Math.ceil(day / 5);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const validIso = (s) => typeof s === "string" && ISO.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
// The calendar date of every class day: weekdays from the start date, skipping days off. dates[0] = day 1.
export function classDates(pacing) {
  if (!pacing || !validIso(pacing.start)) return null;
  const off = new Set((pacing.off || []).filter(validIso));
  const out = [];
  let t = Date.parse(pacing.start + "T00:00:00Z");
  for (let guard = 0; out.length < TOTAL_DAYS && guard < 400; guard++, t += 864e5) {
    const d = new Date(t), iso = d.toISOString().slice(0, 10), wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6 && !off.has(iso)) out.push(iso);
  }
  return out;
}
// Where the class is today: day 0 = not started, 1..45 = that class day (or the last one before a day off), 46 = term over.
export function classDayOn(dates, today) {
  if (!dates) return null;
  let day = 0;
  for (const d of dates) if (d <= today) day++;
  return day;
}
// Worlds whose last planned day is before today: they should be cleared by now.
export const dueWorlds = (dates, today) => (dates ? SPANS.filter((s) => dates[s.last - 1] < today).map((s) => s.n) : []);
// A world counts as cleared for pacing when every core mission is done or skipped by the teacher.
export const clearedForPace = (progress, n) => coreOf(W.find((w) => w.n === n)).every((m) => ["done", "skipped"].includes(progress[m.id]?.status));
export function paceOf(progress, dates, today) {
  if (!dates) return null;
  const due = dueWorlds(dates, today);
  const behind = due.filter((n) => !clearedForPace(progress, n));
  const cleared = W.filter((w) => clearedForPace(progress, w.n)).length;
  return { due: due.length, behind, ahead: !behind.length && cleared > due.length };
}
// Pretty date: "Mon Dec 7".
export const niceDate = (iso) => { const d = new Date(iso + "T00:00:00Z"); return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); };
export const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
