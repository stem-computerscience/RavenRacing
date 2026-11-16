// Runs Python in a separate browser worker.
let pyodide;
self.onmessage = async event => {
 const {code,taskIndex}=event.data;
 try {
  if(!pyodide){importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');pyodide=await loadPyodide();}
  const actions=[];const output=[];
  pyodide.setStdout({batched:s=>output.push(s)});
  pyodide.setStderr({batched:s=>output.push(s)});
  pyodide.globals.set('game_action',action=>{if(actions.length>=100)throw Error('Too many game actions');actions.push(String(action));});
  const prefix=`def move_forward():\n    game_action('forward')\ndef turn_left():\n    game_action('left')\ndef turn_right():\n    game_action('right')\ndef attack():\n    game_action('attack')\ndef collect():\n    game_action('collect')\ndef use_item():\n    game_action('use_item')\n`;
  await pyodide.runPythonAsync(prefix+'\n'+code);
  let assessment=null;
  if(Number.isInteger(taskIndex)&&taskIndex>=0&&taskIndex<6){
   const checks=[
    "isinstance(globals().get('message'), str) and globals()['message'] == 'Hello, Python!'",
    "isinstance(globals().get('explorer'), str) and globals()['explorer'] == 'Ada'",
    "isinstance(globals().get('energy'), (int, float)) and not isinstance(globals()['energy'], bool) and globals()['energy'] == 20",
    "isinstance(globals().get('access_level'), int) and globals()['access_level'] >= 2",
    "True",
    "isinstance(globals().get('inventory'), list) and globals()['inventory'] == ['key', 'map']"
   ];
   const concept=[
    "any(isinstance(n, ast.Assign) for n in ast.walk(tree))",
    "any(isinstance(n, ast.Assign) for n in ast.walk(tree))",
    "any(isinstance(n, ast.BinOp) and isinstance(n.op, ast.Add) for n in ast.walk(tree))",
    "any(isinstance(n, ast.If) and isinstance(n.test, ast.Compare) for n in ast.walk(tree))",
    "any(isinstance(n, ast.For) and isinstance(n.iter, ast.Call) and isinstance(n.iter.func, ast.Name) and n.iter.func.id == 'range' for n in ast.walk(tree))",
    "any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == 'len' for n in ast.walk(tree))"
   ];
   pyodide.globals.set('_pq_source',code);
   pyodide.globals.set('_pq_value_check',checks[taskIndex]);
   pyodide.globals.set('_pq_concept_check',concept[taskIndex]);
   const passed=await pyodide.runPythonAsync("import ast\ntree = ast.parse(_pq_source)\nvalue_ok = bool(eval(_pq_value_check))\nconcept_ok = bool(eval(_pq_concept_check))\n(value_ok, concept_ok)");
   const flags=passed.toJs?passed.toJs():passed;
   assessment={valueOk:Boolean(flags[0]),conceptOk:Boolean(flags[1])};
   if(passed.destroy)passed.destroy();
  }
  self.postMessage({ok:true,actions,output:output.join('\n'),assessment});
 }catch(err){self.postMessage({ok:false,error:String(err),actions:[],output:''});}
};
