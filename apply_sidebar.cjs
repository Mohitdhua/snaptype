const fs = require('fs');
const file = 'i:/snaptype/components/SnapTypeApp.tsx';
let code = fs.readFileSync(file, 'utf8');

const searchStr = '  return (\n    <div className={`font-sans relative transition-colors duration-200 ${';
const startIdx = code.indexOf(searchStr);
const endIdx = code.indexOf('      <main', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newHeader = `  return (
    <div className={\`font-sans relative transition-colors duration-200 flex \${
      gameState === GameState.PLAYING ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
    } \${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c1017] text-slate-100'
    }\`}>
      <div className="mesh-bg" />

      {/* Desktop Sidebar */}
      {gameState !== GameState.PLAYING && (
        <aside className={\`hidden md:flex flex-col w-[240px] fixed top-0 left-0 bottom-0 z-50 border-r py-6 px-4 transition-all \${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c1017] border-white/10'}\`}>
          <button className="flex items-center gap-2.5 hover:opacity-85 transition-opacity text-left mb-8 w-full" onClick={goHomeCreate}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-xl leading-none keep-white">S</span>
            </div>
            <div>
              <div className={\`text-base font-extrabold tracking-tight leading-tight \${theme === 'light' ? 'text-slate-900' : 'text-white'}\`}>SnapType</div>
              <div className="text-[10px] font-mono text-indigo-500 font-semibold leading-none">Blind Typing Pro</div>
            </div>
          </button>

          {userStats && (
            <div className={\`mb-6 p-3 rounded-xl border flex flex-col gap-2 \${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}\`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="opacity-60 uppercase font-bold tracking-wider text-[10px]">Streak</span>
                <span className="text-amber-500 font-bold">{userStats.currentStreak}d 🔥</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="opacity-60 uppercase font-bold tracking-wider text-[10px]">XP</span>
                <span className="font-bold">{userStats.xp} ⭐</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {HOME_TABS.map(tab => {
              const isActive = homeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateToTab(tab.id)}
                  className={\`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 w-full text-left \${
                    isActive
                      ? (theme === 'light' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'bg-indigo-500/20 text-indigo-300 shadow-sm')
                      : (theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5 hover:text-white')
                  }\`}
                >
                  <span className="text-base opacity-90">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={\`flex flex-col gap-2 mt-4 pt-4 border-t \${theme === 'light' ? 'border-slate-200' : 'border-white/10'}\`}>
            <button onClick={onSwitchToSpellingApp} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all w-full text-left">
              <span className="text-sm">🗣️</span> SnapSpell
            </button>
            <button onClick={onToggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-all w-full text-left">
              <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span> Theme
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Top Bar */}
      {gameState !== GameState.PLAYING && (
        <header className={\`md:hidden flex items-center justify-between p-3 border-b fixed top-0 left-0 right-0 z-50 \${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c1017] border-white/10'}\`}>
          <button className="flex items-center gap-2 text-left" onClick={goHomeCreate}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-base leading-none keep-white">S</span>
            </div>
            <div className={\`text-sm font-extrabold tracking-tight leading-tight \${theme === 'light' ? 'text-slate-900' : 'text-white'}\`}>SnapType</div>
          </button>
          <div className="flex gap-2">
            <button onClick={onSwitchToSpellingApp} className="p-2 rounded-xl bg-violet-500/10 text-violet-500">🗣️</button>
            <button onClick={onToggleTheme} className="p-2 rounded-xl bg-slate-500/10">{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
        </header>
      )}

      {/* Mobile Bottom Nav */}
      {gameState !== GameState.PLAYING && (
        <nav className={\`md:hidden fixed bottom-0 left-0 right-0 p-2 border-t flex items-center gap-2 overflow-x-auto z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] scrollbar-none \${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c1017] border-white/10'}\`}>
          {HOME_TABS.map(tab => (
            <button key={tab.id} onClick={() => navigateToTab(tab.id)} className={\`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl min-w-[70px] \${homeTab === tab.id ? (theme === 'light' ? 'text-indigo-600 bg-indigo-50' : 'text-indigo-400 bg-indigo-500/20') : 'text-slate-500'}\`}>
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

`;
  const newCode = code.slice(0, startIdx) + newHeader + code.slice(endIdx);
  fs.writeFileSync(file, newCode);
  console.log('Replaced header with sidebar layout');
} else {
  console.log('Could not find boundaries');
}
