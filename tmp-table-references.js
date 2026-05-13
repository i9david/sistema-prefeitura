const fs = require('fs');
const path = require('path');
const targets = new Set(['avatars','bucket','countries','games','instruments','issues','messages','profiles','quotes','reservations','users','mytable','very_big_table']);
const exts = new Set(['.ts','.tsx','.js','.jsx']);
function walk(dir){
  for(const dirent of fs.readdirSync(dir,{withFileTypes:true})){
    const p = path.join(dir, dirent.name);
    if(dirent.name==='node_modules' || dirent.name==='.git' || dirent.name==='supabase') continue;
    if(dirent.isDirectory()) walk(p);
    else if(exts.has(path.extname(dirent.name))){
      const text = fs.readFileSync(p,'utf8');
      for(const table of targets){
        const re = new RegExp("\\.from\\(\\s*['\" ]"+table+"['\" ]\\s*\\)", 'g');
        if(re.test(text)) console.log(table + ' in ' + p);
      }
    }
  }
}
walk(process.cwd());
