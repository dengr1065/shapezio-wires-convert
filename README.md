# shapez.io wires update converter
this thing makes your old savegames run (but most likely not work) on shapez.io 1.2.x

@tobspr may write a migration script later but why

## how do i use that
make sure you have internet connection

if you built shapez.io earlier, you know what to do (use *sh or powershell):
```
git clone https://github.com/dengr1065/shapezio-wires-convert.git
cd shapezio-wires-convert
yarn
node .
```
else, do this:
 - download repo as zip (green button on top of this page)
 - unpack it to some folder
 - get node.js: https://nodejs.org/en/download/current/
 - open shell in unpacked folder
   - if on windows, open folder that contains `package.json`, hold shift and right-click folder background, then open powershell
   - if on linux/macos you should know how to do that
 - run `npm i`, then `node .`; it should work


**open `http://localhost:11241/` in your browser, pick savegame and click "convert".**

disclaimer: i, dengr1065, am not responsible for any damage you do towards your head or brain while using above mentioned program, neither i am for still broken savegames and bug exploits.
